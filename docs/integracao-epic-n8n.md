# Integração EPIC: n8n → CRM

O workflow envia os leads classificados e as reuniões confirmadas para:

```text
POST https://crm.lisboacapital.com.br/api/public/hooks/epic-leads
```

O endpoint opera exclusivamente no tenant `epic`, cria ou atualiza o cliente e a
oportunidade pelo `lead_id` e, quando a reunião é confirmada, também cria a atividade
de agenda. Reenvios são idempotentes e eventos antigos não regridem a oportunidade.

## Segredos no Lovable Cloud

Configure estes secrets no backend do projeto (não use prefixo `VITE_`):

```text
SUPABASE_SERVICE_ROLE_KEY=<service role do projeto Supabase conectado>
EPIC_N8N_WEBHOOK_SECRET=<mesmo valor da credencial X-EPIC-Webhook-Secret no n8n>
```

`SUPABASE_URL` já faz parte da conexão existente do Lovable com o Supabase. O secret
do webhook deve ser aleatório e ter pelo menos 32 bytes.

Opcionalmente, fixe um funil ou nomes de etapas já existentes:

```text
EPIC_N8N_FUNNEL_ID=<uuid do funil EPIC>
EPIC_N8N_STAGE_NUTRITION=Nutrição
EPIC_N8N_STAGE_QUALIFIED_30=Qualificado 30 min
EPIC_N8N_STAGE_QUALIFIED_45=Qualificado 45 min
EPIC_N8N_STAGE_STRATEGIC=Estratégico
EPIC_N8N_STAGE_SCHEDULED=Reunião agendada
```

Sem essas opções, o endpoint usa o primeiro funil ativo da EPIC e os nomes criados
pela migration `20260915010000_epic_n8n_webhook.sql`.

## Credencial no n8n

O JSON atualizado reutiliza a credencial já presente no workflow:

```text
Tipo: Header Auth
Nome: X-EPIC-Webhook-Secret
Header: x-epic-webhook-secret
Valor: o mesmo EPIC_N8N_WEBHOOK_SECRET do Lovable Cloud
```

Depois de importar/atualizar o workflow, confirme que os cinco nós `CRM — EPIC / ...`
mostram essa credencial e publique o workflow. As credenciais Google Sheets e Google
Calendar já permanecem conectadas pelos IDs originais do arquivo.

## Contrato do webhook

Campos mínimos em qualquer envio:

```json
{
  "lead_id": "lead-123",
  "crm_stage_key": "qualified_30"
}
```

`crm_stage_key` aceita `nutrition`, `qualified_30`, `qualified_45`, `strategic` ou
`scheduled`. Para `scheduled`, `calendar_event_id` e `meeting_start` ISO também são
obrigatórios. O workflow anexo já monta esses payloads.

Respostas `200`/`201` confirmam o upsert. Respostas não-2xx devem ficar habilitadas
para retry no n8n; nunca marque o nó como “Continue On Fail”.
