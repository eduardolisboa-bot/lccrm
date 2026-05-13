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