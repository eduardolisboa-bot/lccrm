
-- =============================================
-- EXPANSÃO DE TABELAS EXISTENTES
-- =============================================

-- clients: novos campos
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS telefone_whatsapp text,
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS cnae text,
  ADD COLUMN IF NOT EXISTS situacao_cadastral text,
  ADD COLUMN IF NOT EXISTS data_abertura date,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo';

-- Constraint de status estendido
DO $$ BEGIN
  ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_status_check;
  ALTER TABLE public.clients ADD CONSTRAINT clients_status_check
    CHECK (status IN ('ativo','inativo','em_analise','aprovado','perdido','stand_by'));
EXCEPTION WHEN others THEN NULL; END $$;

-- pipeline_stages: novos campos
ALTER TABLE public.pipeline_stages
  ADD COLUMN IF NOT EXISTS percentual_progresso integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS probabilidade_fechamento integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sla_dias integer DEFAULT 30;

-- activities: novos campos
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS titulo text,
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS parceiro_id uuid REFERENCES public.partners(id),
  ADD COLUMN IF NOT EXISTS prioridade text DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta','urgente')),
  ADD COLUMN IF NOT EXISTS status_atividade text DEFAULT 'pendente' CHECK (status_atividade IN ('pendente','em_andamento','concluida','atrasada','cancelada')),
  ADD COLUMN IF NOT EXISTS data_agendada date,
  ADD COLUMN IF NOT EXISTS horario_agendado time,
  ADD COLUMN IF NOT EXISTS duracao_minutos integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS lembrete_minutos integer,
  ADD COLUMN IF NOT EXISTS recorrencia text DEFAULT 'nenhuma' CHECK (recorrencia IN ('nenhuma','diaria','semanal','mensal')),
  ADD COLUMN IF NOT EXISTS google_event_id text;

-- =============================================
-- TAGS
-- =============================================

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cor text NOT NULL DEFAULT '#C9A84C',
  categoria text CHECK (categoria IN ('cliente','parceiro','geral')),
  tipo text CHECK (tipo IN ('manual','automatica')) DEFAULT 'manual',
  ativa boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  aplicada_por uuid REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.partner_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  aplicada_por uuid REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(partner_id, tag_id)
);

-- =============================================
-- DOCUMENTOS
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  parceiro_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  nome text NOT NULL,
  categoria text DEFAULT 'outros' CHECK (categoria IN ('contrato','proposta','documento_pessoal','print','audio','comprovante','outros')),
  tipo_mime text,
  tamanho_bytes bigint,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- AUDITORIA E HISTÓRICO
-- =============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.user_profiles(id),
  acao text NOT NULL,
  entidade text NOT NULL,
  entidade_id uuid,
  dados_anteriores jsonb,
  dados_novos jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status_anterior text,
  status_novo text NOT NULL,
  alterado_por uuid REFERENCES public.user_profiles(id),
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- DUPLICADOS
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_duplicates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_a_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_b_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  motivo text NOT NULL,
  similaridade integer CHECK (similaridade BETWEEN 0 AND 100),
  campos_conflitantes jsonb,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente','ignorado','revisado','fundido')),
  ignorado_por uuid REFERENCES public.user_profiles(id),
  fundido_por uuid REFERENCES public.user_profiles(id),
  log_fusao jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_a_id, client_b_id)
);

-- =============================================
-- CALENDÁRIO
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_calendar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  sync_mode text DEFAULT 'desativado' CHECK (sync_mode IN ('auto','manual','desativado')),
  google_calendar_id text DEFAULT 'primary',
  google_refresh_token text,
  ultima_sincronizacao timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calendar_settings ENABLE ROW LEVEL SECURITY;

-- tags: todos autenticados leem; master+interno escrevem
CREATE POLICY "tags read" ON public.tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "tags write" ON public.tags FOR ALL TO authenticated
  USING (get_user_tipo(auth.uid()) IN ('master','interno'))
  WITH CHECK (get_user_tipo(auth.uid()) IN ('master','interno'));

-- client_tags / partner_tags
CREATE POLICY "client_tags read" ON public.client_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "client_tags write" ON public.client_tags FOR ALL TO authenticated
  USING (get_user_tipo(auth.uid()) IN ('master','interno'))
  WITH CHECK (get_user_tipo(auth.uid()) IN ('master','interno'));

CREATE POLICY "partner_tags read" ON public.partner_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "partner_tags write" ON public.partner_tags FOR ALL TO authenticated
  USING (get_user_tipo(auth.uid()) IN ('master','interno'))
  WITH CHECK (get_user_tipo(auth.uid()) IN ('master','interno'));

-- client_documents
CREATE POLICY "docs read" ON public.client_documents FOR SELECT TO authenticated USING (
  get_user_tipo(auth.uid()) IN ('master','interno')
  OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_documents.client_id
             AND get_user_tipo(auth.uid()) = 'parceiro'
             AND c.parceiro_id = get_user_parceiro(auth.uid()))
);
CREATE POLICY "docs write" ON public.client_documents FOR ALL TO authenticated
  USING (get_user_tipo(auth.uid()) IN ('master','interno'))
  WITH CHECK (get_user_tipo(auth.uid()) IN ('master','interno'));

-- audit_logs: read master+interno, insert qualquer autenticado
CREATE POLICY "audit read" ON public.audit_logs FOR SELECT TO authenticated
  USING (get_user_tipo(auth.uid()) IN ('master','interno'));
CREATE POLICY "audit write" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- client_status_history
CREATE POLICY "csh read" ON public.client_status_history FOR SELECT TO authenticated USING (
  get_user_tipo(auth.uid()) IN ('master','interno')
  OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_status_history.client_id
             AND get_user_tipo(auth.uid()) = 'parceiro'
             AND c.parceiro_id = get_user_parceiro(auth.uid()))
);
CREATE POLICY "csh write" ON public.client_status_history FOR INSERT TO authenticated
  WITH CHECK (get_user_tipo(auth.uid()) IN ('master','interno'));

-- client_duplicates: só master
CREATE POLICY "dup all master" ON public.client_duplicates FOR ALL TO authenticated
  USING (get_user_tipo(auth.uid()) = 'master')
  WITH CHECK (get_user_tipo(auth.uid()) = 'master');

-- user_calendar_settings
CREATE POLICY "cal own" ON public.user_calendar_settings FOR ALL TO authenticated
  USING (user_id = get_user_profile_id(auth.uid()))
  WITH CHECK (user_id = get_user_profile_id(auth.uid()));

-- =============================================
-- STORAGE BUCKET
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "client docs read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-documents');
CREATE POLICY "client docs insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-documents' AND get_user_tipo(auth.uid()) IN ('master','interno'));
CREATE POLICY "client docs update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'client-documents' AND get_user_tipo(auth.uid()) IN ('master','interno'));
CREATE POLICY "client docs delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'client-documents' AND get_user_tipo(auth.uid()) = 'master');

-- =============================================
-- TRIGGER updated_at em client_duplicates
-- =============================================

CREATE TRIGGER trg_dup_updated_at
  BEFORE UPDATE ON public.client_duplicates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============================================
-- SEEDS DE TAGS
-- =============================================

INSERT INTO public.tags (nome, cor, tipo, categoria) VALUES
  ('Lead Quente',           '#EF4444', 'automatica', 'cliente'),
  ('VIP',                   '#C9A84C', 'automatica', 'cliente'),
  ('Estratégico',           '#8B5CF6', 'automatica', 'cliente'),
  ('Sem contato há 30 dias','#6B7280', 'automatica', 'cliente'),
  ('Possível duplicado',    '#F97316', 'automatica', 'cliente'),
  ('Documentação pendente', '#F59E0B', 'automatica', 'cliente'),
  ('Em negociação',         '#3B82F6', 'automatica', 'cliente'),
  ('Cliente parado',        '#991B1B', 'automatica', 'cliente'),
  ('Parceiro VIP',          '#C9A84C', 'automatica', 'parceiro'),
  ('Alto volume',           '#22C55E', 'automatica', 'parceiro'),
  ('Baixa performance',     '#EF4444', 'automatica', 'parceiro'),
  ('Precisa de atenção',    '#F97316', 'automatica', 'parceiro'),
  ('Sem atividade recente', '#6B7280', 'automatica', 'parceiro')
ON CONFLICT DO NOTHING;
