
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
