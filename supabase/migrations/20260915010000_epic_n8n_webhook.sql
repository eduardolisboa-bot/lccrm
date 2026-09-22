-- Integração idempotente entre o fluxo de agendamento EPIC (n8n) e o CRM.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS external_lead_id text,
  ADD COLUMN IF NOT EXISTS integration_source text,
  ADD COLUMN IF NOT EXISTS integration_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS external_lead_id text,
  ADD COLUMN IF NOT EXISTS integration_source text,
  ADD COLUMN IF NOT EXISTS integration_stage text,
  ADD COLUMN IF NOT EXISTS integration_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS integration_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS clients_tenant_integration_lead_uidx
  ON public.clients (tenant, integration_source, external_lead_id);

CREATE UNIQUE INDEX IF NOT EXISTS opportunities_tenant_integration_lead_uidx
  ON public.opportunities (tenant, integration_source, external_lead_id);

-- PostgreSQL permite vários NULLs neste índice; eventos reais continuam únicos por tenant.
CREATE UNIQUE INDEX IF NOT EXISTS activities_tenant_google_event_uidx
  ON public.activities (tenant, google_event_id);

COMMENT ON COLUMN public.clients.external_lead_id IS
  'Identificador estável do lead no sistema de origem.';
COMMENT ON COLUMN public.opportunities.integration_stage IS
  'Última chave de etapa recebida pela integração (ex.: scheduled).';

-- Garante as etapas usadas pelo workflow no primeiro funil ativo da EPIC.
-- O webhook também aceita IDs/nomes customizados por variáveis de ambiente.
DO $$
DECLARE
  target_funnel uuid;
  next_order integer;
  stage_record record;
BEGIN
  SELECT id
    INTO target_funnel
    FROM public.funnels
   WHERE tenant = 'epic' AND ativo = true
   ORDER BY ordem, created_at
   LIMIT 1;

  IF target_funnel IS NULL THEN
    INSERT INTO public.funnels (nome, descricao, cor, ordem, ativo, tenant)
    VALUES (
      'Funil de Agendamento',
      'Leads qualificados e agendados pelo fluxo EPIC no n8n.',
      '#2563EB',
      0,
      true,
      'epic'
    )
    RETURNING id INTO target_funnel;
  END IF;

  SELECT COALESCE(MAX(ordem), -1) + 1
    INTO next_order
    FROM public.pipeline_stages
   WHERE funnel_id = target_funnel AND tenant = 'epic';

  FOR stage_record IN
    SELECT * FROM (VALUES
      ('Nutrição',             '#64748B', 10, 10),
      ('Qualificado 30 min',   '#0EA5E9', 35, 45),
      ('Qualificado 45 min',   '#2563EB', 45, 60),
      ('Estratégico',          '#7C3AED', 60, 75),
      ('Reunião agendada',     '#16A34A', 75, 85)
    ) AS configured(nome, cor, progresso, probabilidade)
  LOOP
    IF NOT EXISTS (
      SELECT 1
        FROM public.pipeline_stages
       WHERE funnel_id = target_funnel
         AND tenant = 'epic'
         AND lower(trim(nome)) = lower(trim(stage_record.nome))
    ) THEN
      INSERT INTO public.pipeline_stages (
        nome, ordem, cor, tipo, ativa, funnel_id,
        percentual_progresso, probabilidade_fechamento, sla_dias, tenant
      ) VALUES (
        stage_record.nome, next_order, stage_record.cor, 'aberta', true, target_funnel,
        stage_record.progresso, stage_record.probabilidade, 7, 'epic'
      );
      next_order := next_order + 1;
    END IF;
  END LOOP;
END $$;
