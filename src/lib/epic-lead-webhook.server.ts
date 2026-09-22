import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database, Json } from "@/integrations/supabase/types";

const TENANT = "epic";
const INTEGRATION_SOURCE = "n8n_epic_agendamento";
const MAX_BODY_BYTES = 256 * 1024;

const stageKeys = ["nutrition", "qualified_30", "qualified_45", "strategic", "scheduled"] as const;

type StageKey = (typeof stageKeys)[number];

const payloadSchema = z
  .object({
    lead_id: z.union([z.string(), z.number()]).transform((value) => String(value).trim()),
    crm_stage_key: z.enum(stageKeys),
    last_event_id: z.union([z.string(), z.number()]).optional(),
    last_event: z.string().optional(),
    updated_at: z.string().optional(),
    nome: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().optional(),
    epic_score: z.coerce.number().min(0).max(100).optional(),
    lead_temperature: z.enum(["frio", "morno", "quente"]).optional(),
    tag: z.string().optional(),
    qualification_reason: z.string().optional(),
    calendar_duration: z.coerce.number().int().positive().optional(),
    calendar_event_id: z.string().optional(),
    meeting_start: z.string().optional(),
    meeting_end: z.string().optional(),
    meet_url: z.string().optional(),
  })
  .passthrough()
  .superRefine((value, context) => {
    if (!value.lead_id) {
      context.addIssue({ code: "custom", path: ["lead_id"], message: "lead_id é obrigatório" });
    }
    if (value.crm_stage_key === "scheduled") {
      if (!value.calendar_event_id?.trim()) {
        context.addIssue({
          code: "custom",
          path: ["calendar_event_id"],
          message: "calendar_event_id é obrigatório para reunião agendada",
        });
      }
      if (!isValidDate(value.meeting_start)) {
        context.addIssue({
          code: "custom",
          path: ["meeting_start"],
          message: "meeting_start deve ser uma data ISO válida",
        });
      }
    }
  });

type EpicPayload = z.infer<typeof payloadSchema>;
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
type OpportunityInsert = Database["public"]["Tables"]["opportunities"]["Insert"];

const stageConfig: Record<StageKey, { name: string; aliases: string[]; environmentKey: string }> = {
  nutrition: {
    name: "Nutrição",
    aliases: ["nutricao", "nutricao score", "nao qualificado"],
    environmentKey: "EPIC_N8N_STAGE_NUTRITION",
  },
  qualified_30: {
    name: "Qualificado 30 min",
    aliases: ["qualificado 30 min", "qualificado 30", "agenda 30", "agendamento 30"],
    environmentKey: "EPIC_N8N_STAGE_QUALIFIED_30",
  },
  qualified_45: {
    name: "Qualificado 45 min",
    aliases: ["qualificado 45 min", "qualificado 45", "agenda 45", "agendamento 45"],
    environmentKey: "EPIC_N8N_STAGE_QUALIFIED_45",
  },
  strategic: {
    name: "Estratégico",
    aliases: ["estrategico", "lead estrategico"],
    environmentKey: "EPIC_N8N_STAGE_STRATEGIC",
  },
  scheduled: {
    name: "Reunião agendada",
    aliases: ["reuniao agendada", "reuniao marcada", "agendado", "agenda confirmada"],
    environmentKey: "EPIC_N8N_STAGE_SCHEDULED",
  },
};

const stageRank: Record<StageKey, number> = {
  nutrition: 10,
  qualified_30: 20,
  qualified_45: 30,
  strategic: 40,
  scheduled: 50,
};

class WebhookError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned || null;
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function sha256(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

async function secretsMatch(provided: string, expected: string): Promise<boolean> {
  const [providedHash, expectedHash] = await Promise.all([sha256(provided), sha256(expected)]);
  let difference = 0;
  for (let index = 0; index < expectedHash.length; index += 1) {
    difference |= providedHash[index]! ^ expectedHash[index]!;
  }
  return difference === 0;
}

async function authenticate(request: Request): Promise<void> {
  const expected = process.env["EPIC_N8N_WEBHOOK_SECRET"];
  if (!expected) {
    throw new WebhookError(503, "webhook_not_configured", "Webhook EPIC não configurado");
  }
  const provided = request.headers.get("x-epic-webhook-secret") ?? "";
  if (!provided || !(await secretsMatch(provided, expected))) {
    throw new WebhookError(401, "unauthorized", "Credencial do webhook inválida");
  }
}

async function parsePayload(request: Request): Promise<EpicPayload> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    throw new WebhookError(413, "payload_too_large", "Payload excede o limite permitido");
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    throw new WebhookError(413, "payload_too_large", "Payload excede o limite permitido");
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(rawBody);
  } catch {
    throw new WebhookError(400, "invalid_json", "Corpo JSON inválido");
  }

  const parsed = payloadSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new WebhookError(
      422,
      "invalid_payload",
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
    );
  }
  return parsed.data;
}

async function resolveFunnelId(): Promise<string> {
  const configuredFunnelId = cleanText(process.env["EPIC_N8N_FUNNEL_ID"]);
  let query = supabaseAdmin.from("funnels").select("id").eq("tenant", TENANT).eq("ativo", true);

  if (configuredFunnelId) query = query.eq("id", configuredFunnelId);
  else query = query.order("ordem").order("created_at").limit(1);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new WebhookError(
      422,
      "funnel_not_found",
      configuredFunnelId
        ? "EPIC_N8N_FUNNEL_ID não aponta para um funil ativo da EPIC"
        : "Nenhum funil ativo foi encontrado para a EPIC",
    );
  }
  return data.id;
}

async function resolveStage(funnelId: string, stageKey: StageKey) {
  const { data, error } = await supabaseAdmin
    .from("pipeline_stages")
    .select("id,nome")
    .eq("tenant", TENANT)
    .eq("funnel_id", funnelId)
    .eq("ativa", true)
    .order("ordem");
  if (error) throw error;

  const config = stageConfig[stageKey];
  const configuredName = cleanText(process.env[config.environmentKey]);
  const accepted = [configuredName, config.name, ...config.aliases]
    .filter((value): value is string => Boolean(value))
    .map(normalizeLabel);
  const stage = data.find((candidate) => accepted.includes(normalizeLabel(candidate.nome)));

  if (!stage) {
    throw new WebhookError(
      422,
      "stage_not_found",
      `Etapa '${configuredName ?? config.name}' não encontrada no funil EPIC`,
    );
  }
  return stage;
}

function payloadAsJson(payload: EpicPayload): Json {
  return JSON.parse(JSON.stringify(payload)) as Json;
}

async function upsertClient(payload: EpicPayload) {
  const externalLeadId = payload.lead_id;
  const { data: current, error: findError } = await supabaseAdmin
    .from("clients")
    .select("id,nome,email,telefone,telefone_whatsapp")
    .eq("tenant", TENANT)
    .eq("integration_source", INTEGRATION_SOURCE)
    .eq("external_lead_id", externalLeadId)
    .maybeSingle();
  if (findError) throw findError;

  const record: ClientInsert = {
    id: current?.id,
    tenant: TENANT,
    external_lead_id: externalLeadId,
    integration_source: INTEGRATION_SOURCE,
    integration_payload: payloadAsJson(payload),
    nome: cleanText(payload.nome) ?? current?.nome ?? `Lead EPIC ${externalLeadId}`,
    email: cleanText(payload.email) ?? current?.email ?? null,
    telefone: cleanText(payload.whatsapp) ?? current?.telefone ?? null,
    telefone_whatsapp: cleanText(payload.whatsapp) ?? current?.telefone_whatsapp ?? null,
    tipo_cliente: "direto",
    status: "ativo",
  };

  const { data, error } = await supabaseAdmin
    .from("clients")
    .upsert(record, { onConflict: "tenant,integration_source,external_lead_id" })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id, created: !current };
}

function opportunityNotes(payload: EpicPayload): string {
  return [
    `Integração: fluxo de agendamento EPIC`,
    `Lead externo: ${payload.lead_id}`,
    payload.epic_score === undefined ? null : `Score: ${payload.epic_score}`,
    cleanText(payload.tag) ? `Tag: ${payload.tag}` : null,
    cleanText(payload.qualification_reason)
      ? `Qualificação: ${payload.qualification_reason}`
      : null,
    cleanText(payload.meet_url) ? `Google Meet: ${payload.meet_url}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function actionForStage(stageKey: StageKey, payload: EpicPayload): string {
  if (stageKey === "nutrition") return "Nutrir lead";
  if (stageKey === "scheduled")
    return `Realizar reunião${payload.meeting_start ? ` em ${payload.meeting_start}` : ""}`;
  return "Agendar reunião";
}

async function upsertOpportunity(
  payload: EpicPayload,
  clientId: string,
  funnelId: string,
  incomingStage: { id: string; nome: string },
) {
  const { data: current, error: findError } = await supabaseAdmin
    .from("opportunities")
    .select("id,integration_stage,integration_updated_at,etapa_id,observacoes")
    .eq("tenant", TENANT)
    .eq("integration_source", INTEGRATION_SOURCE)
    .eq("external_lead_id", payload.lead_id)
    .maybeSingle();
  if (findError) throw findError;

  const incomingUpdatedAt = isValidDate(payload.updated_at)
    ? new Date(payload.updated_at).toISOString()
    : new Date().toISOString();
  const currentUpdatedAt = current?.integration_updated_at
    ? Date.parse(current.integration_updated_at)
    : Number.NEGATIVE_INFINITY;
  const incomingIsCurrent = Date.parse(incomingUpdatedAt) >= currentUpdatedAt;
  const currentKey = stageKeys.find((key) => key === current?.integration_stage);
  const wouldRegress =
    currentKey !== undefined && stageRank[currentKey] > stageRank[payload.crm_stage_key];
  const keepCurrentStage = Boolean(current && (!incomingIsCurrent || wouldRegress));

  const effectiveStageKey = keepCurrentStage ? currentKey! : payload.crm_stage_key;
  const meetingDate =
    effectiveStageKey === "scheduled" && isValidDate(payload.meeting_start)
      ? dateAndTimeInSaoPaulo(payload.meeting_start).date
      : undefined;

  const record: OpportunityInsert = {
    id: current?.id,
    tenant: TENANT,
    external_lead_id: payload.lead_id,
    integration_source: INTEGRATION_SOURCE,
    integration_stage: effectiveStageKey,
    integration_updated_at: keepCurrentStage
      ? (current?.integration_updated_at ?? incomingUpdatedAt)
      : incomingUpdatedAt,
    integration_payload: keepCurrentStage ? undefined : payloadAsJson(payload),
    titulo: `EPIC — ${cleanText(payload.nome) ?? payload.lead_id}`,
    cliente_id: clientId,
    funnel_id: funnelId,
    etapa_id: keepCurrentStage ? (current?.etapa_id ?? incomingStage.id) : incomingStage.id,
    temperatura: payload.lead_temperature ?? "morno",
    origem: "direto",
    produto_interesse: "Agendamento EPIC",
    proxima_acao: actionForStage(effectiveStageKey, payload),
    data_proxima_acao: meetingDate,
    observacoes: keepCurrentStage
      ? (current?.observacoes ?? opportunityNotes(payload))
      : opportunityNotes(payload),
  };

  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .upsert(record, { onConflict: "tenant,integration_source,external_lead_id" })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id, created: !current, stageKey: effectiveStageKey };
}

function dateAndTimeInSaoPaulo(isoDate: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(isoDate));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}:${value("second")}`,
  };
}

async function upsertMeetingActivity(
  payload: EpicPayload,
  clientId: string,
  opportunityId: string,
) {
  if (payload.crm_stage_key !== "scheduled") return null;
  const calendarEventId = payload.calendar_event_id!.trim();
  const meetingStart = new Date(payload.meeting_start!).toISOString();
  const schedule = dateAndTimeInSaoPaulo(meetingStart);
  const duration = payload.calendar_duration ?? 30;

  const { data: current, error: findError } = await supabaseAdmin
    .from("activities")
    .select("id")
    .eq("tenant", TENANT)
    .eq("google_event_id", calendarEventId)
    .maybeSingle();
  if (findError) throw findError;

  const { data, error } = await supabaseAdmin
    .from("activities")
    .upsert(
      {
        id: current?.id,
        tenant: TENANT,
        client_id: clientId,
        opportunity_id: opportunityId,
        tipo_atividade: "reuniao",
        titulo: `Reunião EPIC — ${cleanText(payload.nome) ?? payload.lead_id}`,
        descricao: cleanText(payload.meet_url)
          ? `Reunião criada pelo n8n. Google Meet: ${payload.meet_url}`
          : "Reunião criada pelo fluxo de agendamento EPIC no n8n.",
        data_atividade: meetingStart,
        data_agendada: schedule.date,
        horario_agendado: schedule.time,
        duracao_minutos: duration,
        lembrete_minutos: 60,
        prioridade: payload.crm_stage_key === "scheduled" ? "alta" : "media",
        status_atividade: "pendente",
        recorrencia: "nenhuma",
        google_event_id: calendarEventId,
      },
      { onConflict: "tenant,google_event_id" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id, created: !current };
}

export async function handleEpicLeadWebhook(request: Request): Promise<Response> {
  try {
    await authenticate(request);
    const payload = await parsePayload(request);
    const funnelId = await resolveFunnelId();
    const incomingStage = await resolveStage(funnelId, payload.crm_stage_key);
    const client = await upsertClient(payload);
    const opportunity = await upsertOpportunity(payload, client.id, funnelId, incomingStage);
    const activity = await upsertMeetingActivity(payload, client.id, opportunity.id);

    return Response.json(
      {
        success: true,
        tenant: TENANT,
        lead_id: payload.lead_id,
        client,
        opportunity,
        activity,
      },
      { status: client.created || opportunity.created ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof WebhookError) {
      return Response.json(
        { success: false, error: error.code, message: error.message },
        { status: error.status },
      );
    }
    console.error("[EPIC n8n webhook]", error);
    return Response.json(
      { success: false, error: "internal_error", message: "Falha ao gravar lead no CRM" },
      { status: 500 },
    );
  }
}
