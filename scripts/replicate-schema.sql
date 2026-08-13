-- Schema completo do CRM (gerado a partir das migrations do sistema Lisboa).
-- Rode este arquivo no SQL Editor de um novo projeto Supabase (Epic ou Hope).

-- ===== 20260513183928_cc496dcc-df8d-4fb4-ac72-6ff188ed1e7d.sql =====

-- ENUMS
CREATE TYPE public.user_tipo AS ENUM ('master','interno','parceiro');
CREATE TYPE public.partner_tipo AS ENUM ('assessor','advogado','contador','empresario','influenciador','family_office','outro');
CREATE TYPE public.client_tipo AS ENUM ('direto','parceiro');
CREATE TYPE public.stage_tipo AS ENUM ('aberta','ganha','perdida','pausada');
CREATE TYPE public.temperatura AS ENUM ('frio','morno','quente');
CREATE TYPE public.opp_origem AS ENUM ('direto','parceiro');
CREATE TYPE public.entity_status AS ENUM ('ativo','inativo','em_negociacao');

-- USER PROFILES
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  tipo_usuario public.user_tipo NOT NULL DEFAULT 'interno',
  parceiro_id uuid,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.user_profiles(auth_user_id);

-- PARTNERS
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo public.partner_tipo NOT NULL DEFAULT 'outro',
  email text,
  telefone text,
  empresa text,
  responsavel_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  comissao numeric(5,2),
  status public.entity_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_parceiro_fk FOREIGN KEY (parceiro_id) REFERENCES public.partners(id) ON DELETE SET NULL;

-- CLIENTS
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo_cliente public.client_tipo NOT NULL DEFAULT 'direto',
  parceiro_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  email text,
  telefone text,
  cpf_cnpj text,
  patrimonio_estimado numeric(18,2),
  responsavel_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PIPELINE STAGES
CREATE TABLE public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ordem integer NOT NULL,
  cor text NOT NULL DEFAULT '#C9A84C',
  tipo public.stage_tipo NOT NULL DEFAULT 'aberta',
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- OPPORTUNITIES
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  cliente_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  parceiro_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  responsavel_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  valor_estimado numeric(18,2) DEFAULT 0,
  produto_interesse text,
  etapa_id uuid REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  temperatura public.temperatura NOT NULL DEFAULT 'morno',
  origem public.opp_origem NOT NULL DEFAULT 'direto',
  status_documentacao text NOT NULL DEFAULT 'nao_solicitado',
  proxima_acao text,
  data_proxima_acao date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.opportunities(etapa_id);
CREATE INDEX ON public.opportunities(parceiro_id);

-- ACTIVITIES
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  tipo_atividade text,
  descricao text,
  data_atividade timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SECURITY DEFINER HELPERS
CREATE OR REPLACE FUNCTION public.get_user_tipo(_auth_user uuid)
RETURNS public.user_tipo
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT tipo_usuario FROM public.user_profiles WHERE auth_user_id = _auth_user LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.get_user_parceiro(_auth_user uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT parceiro_id FROM public.user_profiles WHERE auth_user_id = _auth_user LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.get_user_profile_id(_auth_user uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.user_profiles WHERE auth_user_id = _auth_user LIMIT 1 $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER opp_touch BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_first boolean;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.user_profiles) INTO is_first;
  INSERT INTO public.user_profiles (auth_user_id, nome, email, tipo_usuario)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE WHEN is_first THEN 'master'::public.user_tipo ELSE 'interno'::public.user_tipo END
  );
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ENABLE RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- USER PROFILES policies
CREATE POLICY "view own profile" ON public.user_profiles FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR public.get_user_tipo(auth.uid()) = 'master');
CREATE POLICY "master manages profiles" ON public.user_profiles FOR ALL TO authenticated
  USING (public.get_user_tipo(auth.uid()) = 'master')
  WITH CHECK (public.get_user_tipo(auth.uid()) = 'master');
CREATE POLICY "update own profile" ON public.user_profiles FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

-- PARTNERS
CREATE POLICY "partners read" ON public.partners FOR SELECT TO authenticated USING (
  public.get_user_tipo(auth.uid()) IN ('master','interno')
  OR id = public.get_user_parceiro(auth.uid())
);
CREATE POLICY "partners write master" ON public.partners FOR ALL TO authenticated
  USING (public.get_user_tipo(auth.uid()) = 'master')
  WITH CHECK (public.get_user_tipo(auth.uid()) = 'master');

-- CLIENTS
CREATE POLICY "clients read" ON public.clients FOR SELECT TO authenticated USING (
  public.get_user_tipo(auth.uid()) = 'master'
  OR (public.get_user_tipo(auth.uid()) = 'interno')
  OR (public.get_user_tipo(auth.uid()) = 'parceiro' AND parceiro_id = public.get_user_parceiro(auth.uid()))
);
CREATE POLICY "clients write internal" ON public.clients FOR ALL TO authenticated
  USING (public.get_user_tipo(auth.uid()) IN ('master','interno'))
  WITH CHECK (public.get_user_tipo(auth.uid()) IN ('master','interno'));

-- PIPELINE STAGES (read all, write master)
CREATE POLICY "stages read" ON public.pipeline_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "stages write master" ON public.pipeline_stages FOR ALL TO authenticated
  USING (public.get_user_tipo(auth.uid()) = 'master')
  WITH CHECK (public.get_user_tipo(auth.uid()) = 'master');

-- OPPORTUNITIES
CREATE POLICY "opps read" ON public.opportunities FOR SELECT TO authenticated USING (
  public.get_user_tipo(auth.uid()) = 'master'
  OR public.get_user_tipo(auth.uid()) = 'interno'
  OR (public.get_user_tipo(auth.uid()) = 'parceiro' AND parceiro_id = public.get_user_parceiro(auth.uid()))
);
CREATE POLICY "opps write internal" ON public.opportunities FOR ALL TO authenticated
  USING (public.get_user_tipo(auth.uid()) IN ('master','interno'))
  WITH CHECK (public.get_user_tipo(auth.uid()) IN ('master','interno'));

-- ACTIVITIES
CREATE POLICY "activities read" ON public.activities FOR SELECT TO authenticated USING (
  public.get_user_tipo(auth.uid()) IN ('master','interno')
  OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = activities.opportunity_id AND o.parceiro_id = public.get_user_parceiro(auth.uid()))
);
CREATE POLICY "activities write" ON public.activities FOR INSERT TO authenticated
  WITH CHECK (public.get_user_tipo(auth.uid()) IN ('master','interno','parceiro'));

-- ===== 20260513222327_665e5bed-7fd8-46a9-a03d-111b2c369a40.sql =====
-- 1. FUNNELS
CREATE TABLE public.funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text NOT NULL DEFAULT '#C9A84C',
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funnels read" ON public.funnels FOR SELECT TO authenticated USING (true);
CREATE POLICY "funnels write master" ON public.funnels FOR ALL TO authenticated
  USING (get_user_tipo(auth.uid()) = 'master'::user_tipo)
  WITH CHECK (get_user_tipo(auth.uid()) = 'master'::user_tipo);

-- Seed default funnel and migrate existing stages/opps
INSERT INTO public.funnels (nome, descricao, cor, ordem) VALUES ('Geral', 'Funil padrão', '#C9A84C', 0);

-- 2. pipeline_stages.funnel_id
ALTER TABLE public.pipeline_stages ADD COLUMN funnel_id uuid REFERENCES public.funnels(id) ON DELETE CASCADE;
UPDATE public.pipeline_stages SET funnel_id = (SELECT id FROM public.funnels WHERE nome = 'Geral');
ALTER TABLE public.pipeline_stages ALTER COLUMN funnel_id SET NOT NULL;
CREATE INDEX idx_pipeline_stages_funnel ON public.pipeline_stages(funnel_id, ordem);

-- 3. opportunities.funnel_id
ALTER TABLE public.opportunities ADD COLUMN funnel_id uuid REFERENCES public.funnels(id);
UPDATE public.opportunities o SET funnel_id = s.funnel_id
  FROM public.pipeline_stages s WHERE s.id = o.etapa_id;
UPDATE public.opportunities SET funnel_id = (SELECT id FROM public.funnels WHERE nome = 'Geral')
  WHERE funnel_id IS NULL;
ALTER TABLE public.opportunities ALTER COLUMN funnel_id SET NOT NULL;
CREATE INDEX idx_opportunities_funnel ON public.opportunities(funnel_id);

-- 4. user_funnel_access (N:N)
CREATE TABLE public.user_funnel_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  funnel_id uuid NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_profile_id, funnel_id)
);

ALTER TABLE public.user_funnel_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ufa read" ON public.user_funnel_access FOR SELECT TO authenticated
  USING (
    get_user_tipo(auth.uid()) = 'master'::user_tipo
    OR user_profile_id = get_user_profile_id(auth.uid())
  );

CREATE POLICY "ufa write master" ON public.user_funnel_access FOR ALL TO authenticated
  USING (get_user_tipo(auth.uid()) = 'master'::user_tipo)
  WITH CHECK (get_user_tipo(auth.uid()) = 'master'::user_tipo);

-- 5. Helper: user_can_access_funnel
CREATE OR REPLACE FUNCTION public.user_can_access_funnel(_auth_user uuid, _funnel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN get_user_tipo(_auth_user) = 'master'::user_tipo THEN true
      WHEN _funnel_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM public.user_funnel_access ufa
        WHERE ufa.funnel_id = _funnel_id
          AND ufa.user_profile_id = get_user_profile_id(_auth_user)
      )
    END
$$;

-- Grant master access to default funnel automatically (so existing master can see)
INSERT INTO public.user_funnel_access (user_profile_id, funnel_id)
SELECT up.id, f.id
FROM public.user_profiles up
CROSS JOIN public.funnels f
WHERE f.nome = 'Geral'
ON CONFLICT DO NOTHING;

-- 6. Update opportunities RLS to respect funnel access
DROP POLICY IF EXISTS "opps read" ON public.opportunities;
CREATE POLICY "opps read" ON public.opportunities FOR SELECT TO authenticated
  USING (
    user_can_access_funnel(auth.uid(), funnel_id)
    AND (
      get_user_tipo(auth.uid()) = ANY (ARRAY['master'::user_tipo, 'interno'::user_tipo])
      OR (get_user_tipo(auth.uid()) = 'parceiro'::user_tipo AND parceiro_id = get_user_parceiro(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "opps write internal" ON public.opportunities;
CREATE POLICY "opps write internal" ON public.opportunities FOR ALL TO authenticated
  USING (
    get_user_tipo(auth.uid()) = ANY (ARRAY['master'::user_tipo, 'interno'::user_tipo])
    AND user_can_access_funnel(auth.uid(), funnel_id)
  )
  WITH CHECK (
    get_user_tipo(auth.uid()) = ANY (ARRAY['master'::user_tipo, 'interno'::user_tipo])
    AND user_can_access_funnel(auth.uid(), funnel_id)
  );

-- 7. Activities RLS now also respects funnel access via the linked opportunity
DROP POLICY IF EXISTS "activities read" ON public.activities;
CREATE POLICY "activities read" ON public.activities FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = activities.opportunity_id
        AND user_can_access_funnel(auth.uid(), o.funnel_id)
        AND (
          get_user_tipo(auth.uid()) = ANY (ARRAY['master'::user_tipo, 'interno'::user_tipo])
          OR (get_user_tipo(auth.uid()) = 'parceiro'::user_tipo AND o.parceiro_id = get_user_parceiro(auth.uid()))
        )
    )
    OR (activities.opportunity_id IS NULL AND get_user_tipo(auth.uid()) = ANY (ARRAY['master'::user_tipo, 'interno'::user_tipo]))
  );

-- 8. funnel_goals (meta mensal R$ por funil)
CREATE TABLE public.funnel_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  mes date NOT NULL, -- primeiro dia do mês (YYYY-MM-01)
  valor_meta numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(funnel_id, mes)
);

ALTER TABLE public.funnel_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funnel_goals read" ON public.funnel_goals FOR SELECT TO authenticated
  USING (user_can_access_funnel(auth.uid(), funnel_id));

CREATE POLICY "funnel_goals write master" ON public.funnel_goals FOR ALL TO authenticated
  USING (get_user_tipo(auth.uid()) = 'master'::user_tipo)
  WITH CHECK (get_user_tipo(auth.uid()) = 'master'::user_tipo);

CREATE TRIGGER funnel_goals_touch BEFORE UPDATE ON public.funnel_goals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 9. stage_goals (meta mensal R$ por etapa)
CREATE TABLE public.stage_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE CASCADE,
  mes date NOT NULL,
  valor_meta numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(stage_id, mes)
);

ALTER TABLE public.stage_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stage_goals read" ON public.stage_goals FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pipeline_stages s
      WHERE s.id = stage_goals.stage_id
        AND user_can_access_funnel(auth.uid(), s.funnel_id)
    )
  );

CREATE POLICY "stage_goals write master" ON public.stage_goals FOR ALL TO authenticated
  USING (get_user_tipo(auth.uid()) = 'master'::user_tipo)
  WITH CHECK (get_user_tipo(auth.uid()) = 'master'::user_tipo);

CREATE TRIGGER stage_goals_touch BEFORE UPDATE ON public.stage_goals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
-- ===== 20260518192936_4434a6e2-e2dc-4bde-a3e5-9a5cc9795d6c.sql =====

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

-- ===== 20260518195506_6d8d261c-9c0a-44d9-8761-852fb158b9c3.sql =====

-- 1) Prevent privilege escalation via self profile update
DROP POLICY IF EXISTS "update own profile" ON public.user_profiles;
CREATE POLICY "update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (
    auth_user_id = auth.uid()
    AND tipo_usuario = (SELECT tipo_usuario FROM public.user_profiles WHERE auth_user_id = auth.uid())
    AND COALESCE(parceiro_id::text,'') = COALESCE((SELECT parceiro_id::text FROM public.user_profiles WHERE auth_user_id = auth.uid()),'')
    AND status = (SELECT status FROM public.user_profiles WHERE auth_user_id = auth.uid())
  );

-- 2) Tighten activities INSERT for partners
DROP POLICY IF EXISTS "activities write" ON public.activities;
CREATE POLICY "activities write" ON public.activities
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_tipo(auth.uid()) IN ('master','interno')
    OR (
      get_user_tipo(auth.uid()) = 'parceiro'
      AND (
        opportunity_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.opportunities o
          WHERE o.id = opportunity_id
            AND o.parceiro_id = get_user_parceiro(auth.uid())
        )
      )
      AND (
        client_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.clients c
          WHERE c.id = client_id
            AND c.parceiro_id = get_user_parceiro(auth.uid())
        )
      )
    )
  );

-- 3) Deactivated users lose access (helpers return NULL when inactive)
CREATE OR REPLACE FUNCTION public.get_user_tipo(_auth_user uuid)
RETURNS public.user_tipo
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tipo_usuario FROM public.user_profiles
  WHERE auth_user_id = _auth_user AND status = 'ativo'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_parceiro(_auth_user uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT parceiro_id FROM public.user_profiles
  WHERE auth_user_id = _auth_user AND status = 'ativo'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile_id(_auth_user uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.user_profiles
  WHERE auth_user_id = _auth_user AND status = 'ativo'
  LIMIT 1
$$;

-- 4) Pin search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 5) Revoke EXECUTE from anon/public on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.get_user_tipo(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_parceiro(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_profile_id(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_can_access_funnel(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_user_tipo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_parceiro(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_funnel(uuid, uuid) TO authenticated;

-- ===== 20260518195739_d1f39a63-04e6-4112-b788-8c0214c80efb.sql =====

-- UPDATE policy for activities
CREATE POLICY "activities update" ON public.activities
  FOR UPDATE TO authenticated
  USING (
    get_user_tipo(auth.uid()) IN ('master','interno')
    OR (
      get_user_tipo(auth.uid()) = 'parceiro'
      AND (
        (opportunity_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.opportunities o
          WHERE o.id = opportunity_id AND o.parceiro_id = get_user_parceiro(auth.uid())
        ))
        OR (client_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.clients c
          WHERE c.id = client_id AND c.parceiro_id = get_user_parceiro(auth.uid())
        ))
      )
    )
  )
  WITH CHECK (
    get_user_tipo(auth.uid()) IN ('master','interno')
    OR (
      get_user_tipo(auth.uid()) = 'parceiro'
      AND (
        (opportunity_id IS NULL OR EXISTS (
          SELECT 1 FROM public.opportunities o
          WHERE o.id = opportunity_id AND o.parceiro_id = get_user_parceiro(auth.uid())
        ))
        AND (client_id IS NULL OR EXISTS (
          SELECT 1 FROM public.clients c
          WHERE c.id = client_id AND c.parceiro_id = get_user_parceiro(auth.uid())
        ))
      )
    )
  );

-- DELETE policy: only master/interno
CREATE POLICY "activities delete" ON public.activities
  FOR DELETE TO authenticated
  USING (get_user_tipo(auth.uid()) IN ('master','interno'));

-- ===== 20260519003143_cd0f5c41-3be3-427c-af3a-09e1efe4ef74.sql =====

-- 1) Lock down SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.get_user_tipo(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_parceiro(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_profile_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_can_access_funnel(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;

-- 2) Tighten audit_logs INSERT
DROP POLICY IF EXISTS "audit write" ON public.audit_logs;
CREATE POLICY "audit write" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 3) Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  mensagem text,
  tipo text DEFAULT 'info',
  link text,
  lida boolean NOT NULL DEFAULT false,
  entidade text,
  entidade_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notif_user_idx ON public.notifications(user_id, lida, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif own read" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = public.get_user_profile_id(auth.uid()));

CREATE POLICY "notif own update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = public.get_user_profile_id(auth.uid()))
  WITH CHECK (user_id = public.get_user_profile_id(auth.uid()));

CREATE POLICY "notif own delete" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = public.get_user_profile_id(auth.uid()));

CREATE POLICY "notif insert internal" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_tipo(auth.uid()) = ANY (ARRAY['master'::public.user_tipo,'interno'::public.user_tipo])
    OR user_id = public.get_user_profile_id(auth.uid())
  );

-- 4) Commission rules table
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  parceiro_id uuid,
  produto text,
  percentual numeric NOT NULL DEFAULT 0,
  valor_minimo numeric DEFAULT 0,
  valor_maximo numeric,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission read master" ON public.commission_rules
  FOR SELECT TO authenticated
  USING (public.get_user_tipo(auth.uid()) = 'master'::public.user_tipo);

CREATE POLICY "commission write master" ON public.commission_rules
  FOR ALL TO authenticated
  USING (public.get_user_tipo(auth.uid()) = 'master'::public.user_tipo)
  WITH CHECK (public.get_user_tipo(auth.uid()) = 'master'::public.user_tipo);

CREATE TRIGGER touch_commission_rules
BEFORE UPDATE ON public.commission_rules
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== 20260519092113_6da96e48-e217-4e68-864e-21e7e925b49f.sql =====
-- Backup system: bucket + history table + RLS

INSERT INTO storage.buckets (id, name, public) VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.backup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  storage_path text NOT NULL,
  tipo text NOT NULL DEFAULT 'automatico', -- automatico | manual
  status text NOT NULL DEFAULT 'sucesso',  -- sucesso | erro
  tamanho_bytes bigint,
  tabelas jsonb,                            -- { clients: 7, partners: 5, ... }
  erro text,
  iniciado_por uuid
);

ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backup_history read master"
  ON public.backup_history FOR SELECT TO authenticated
  USING (public.get_user_tipo(auth.uid()) = 'master'::public.user_tipo);

CREATE POLICY "backup_history insert master"
  ON public.backup_history FOR INSERT TO authenticated
  WITH CHECK (public.get_user_tipo(auth.uid()) = 'master'::public.user_tipo);

-- Storage RLS: only master can list/download backups
CREATE POLICY "backups read master"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'backups' AND public.get_user_tipo(auth.uid()) = 'master'::public.user_tipo);

CREATE POLICY "backups insert master"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'backups' AND public.get_user_tipo(auth.uid()) = 'master'::public.user_tipo);

CREATE POLICY "backups delete master"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'backups' AND public.get_user_tipo(auth.uid()) = 'master'::public.user_tipo);

CREATE INDEX IF NOT EXISTS idx_backup_history_created ON public.backup_history(created_at DESC);
-- ===== 20260519092536_9a74a7a3-7ded-4405-b356-85f243fb7e27.sql =====
ALTER TABLE public.backup_history
  ADD COLUMN IF NOT EXISTS checksum_sha256 text,
  ADD COLUMN IF NOT EXISTS validacao jsonb;
-- ===== 20260519095752_12ccb9ae-6cad-4912-9341-549edcabfa3a.sql =====
DROP POLICY IF EXISTS "partners write master" ON public.partners;
CREATE POLICY "partners write internal" ON public.partners
FOR ALL TO authenticated
USING (get_user_tipo(auth.uid()) = ANY (ARRAY['master'::user_tipo, 'interno'::user_tipo]))
WITH CHECK (get_user_tipo(auth.uid()) = ANY (ARRAY['master'::user_tipo, 'interno'::user_tipo]));
-- ===== 20260519101746_e1e45d95-fc97-4002-b7cc-899339d0ffc4.sql =====
DROP POLICY IF EXISTS "backup_history read master" ON public.backup_history;
DROP POLICY IF EXISTS "backup_history insert master" ON public.backup_history;
DROP POLICY IF EXISTS "backups read master" ON storage.objects;
DROP POLICY IF EXISTS "backups insert master" ON storage.objects;
DROP POLICY IF EXISTS "backups delete master" ON storage.objects;

CREATE POLICY "backup_history read internal"
  ON public.backup_history
  FOR SELECT TO authenticated
  USING (public.get_user_tipo(auth.uid()) IN ('master'::public.user_tipo, 'interno'::public.user_tipo));

CREATE POLICY "backup_history insert internal"
  ON public.backup_history
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_tipo(auth.uid()) IN ('master'::public.user_tipo, 'interno'::public.user_tipo));

CREATE POLICY "backups read internal"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'backups' AND public.get_user_tipo(auth.uid()) IN ('master'::public.user_tipo, 'interno'::public.user_tipo));

CREATE POLICY "backups insert internal"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'backups' AND public.get_user_tipo(auth.uid()) IN ('master'::public.user_tipo, 'interno'::public.user_tipo));

CREATE POLICY "backups delete internal"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'backups' AND public.get_user_tipo(auth.uid()) IN ('master'::public.user_tipo, 'interno'::public.user_tipo));
-- ===== 20260519102745_5d84704a-179b-4632-aea3-b5a7bce22d40.sql =====
GRANT EXECUTE ON FUNCTION public.get_user_tipo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_parceiro(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_funnel(uuid, uuid) TO authenticated;
-- ===== 20260519102830_88118468-1f07-4d0a-ba27-4523a5600a65.sql =====
CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.get_user_tipo(_auth_user uuid)
RETURNS public.user_tipo
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tipo_usuario
  FROM public.user_profiles
  WHERE auth_user_id = _auth_user AND status = 'ativo'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION app_private.get_user_parceiro(_auth_user uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT parceiro_id
  FROM public.user_profiles
  WHERE auth_user_id = _auth_user AND status = 'ativo'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION app_private.get_user_profile_id(_auth_user uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.user_profiles
  WHERE auth_user_id = _auth_user AND status = 'ativo'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION app_private.user_can_access_funnel(_auth_user uuid, _funnel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, app_private
AS $$
  SELECT
    CASE
      WHEN app_private.get_user_tipo(_auth_user) = 'master'::public.user_tipo THEN true
      WHEN _funnel_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1
        FROM public.user_funnel_access ufa
        WHERE ufa.funnel_id = _funnel_id
          AND ufa.user_profile_id = app_private.get_user_profile_id(_auth_user)
      )
    END
$$;

GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_user_tipo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_user_parceiro(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_user_profile_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.user_can_access_funnel(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_tipo(_auth_user uuid)
RETURNS public.user_tipo
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, app_private
AS $$
  SELECT app_private.get_user_tipo(_auth_user)
$$;

CREATE OR REPLACE FUNCTION public.get_user_parceiro(_auth_user uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, app_private
AS $$
  SELECT app_private.get_user_parceiro(_auth_user)
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile_id(_auth_user uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, app_private
AS $$
  SELECT app_private.get_user_profile_id(_auth_user)
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_funnel(_auth_user uuid, _funnel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, app_private
AS $$
  SELECT app_private.user_can_access_funnel(_auth_user, _funnel_id)
$$;

GRANT EXECUTE ON FUNCTION public.get_user_tipo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_parceiro(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_funnel(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_tipo(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_parceiro(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_profile_id(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_can_access_funnel(uuid, uuid) FROM anon, public;
