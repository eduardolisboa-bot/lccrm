-- 1) tenants no perfil
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS tenants text[] NOT NULL DEFAULT ARRAY['lisboa'];

UPDATE public.user_profiles
   SET tenants = ARRAY['lisboa','epic','hope']
 WHERE email = 'eduardo@lisboacapital.com.br';

CREATE OR REPLACE FUNCTION public.user_tenants(_auth_user uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT tenants FROM public.user_profiles WHERE auth_user_id = _auth_user LIMIT 1), ARRAY[]::text[])
$$;

GRANT EXECUTE ON FUNCTION public.user_tenants(uuid) TO authenticated;

-- 2) coluna tenant + isolamento restritivo em todas as tabelas de dados
DO $$
DECLARE t text;
DECLARE tabs text[] := ARRAY[
  'funnels','pipeline_stages','clients','partners','opportunities','activities',
  'tags','client_tags','partner_tags','client_documents','client_duplicates',
  'client_status_history','commission_rules','funnel_goals','stage_goals',
  'notifications','audit_logs','backup_history','user_funnel_access','user_calendar_settings'
];
BEGIN
  FOREACH t IN ARRAY tabs LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant text NOT NULL DEFAULT ''lisboa''', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
         USING (tenant = ANY (public.user_tenants(auth.uid())))
         WITH CHECK (tenant = ANY (public.user_tenants(auth.uid())))', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (tenant)', 'idx_' || t || '_tenant', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS tenant_isolation ON public.user_profiles;
CREATE POLICY tenant_isolation ON public.user_profiles AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenants && public.user_tenants(auth.uid()))
  WITH CHECK (tenants && public.user_tenants(auth.uid()));

-- 3) espelhar estrutura base (funil, etapas e etiquetas) para Epic e Hope
DO $$
DECLARE sys text;
DECLARE src_funnel uuid;
DECLARE new_funnel uuid;
DECLARE s record;
BEGIN
  SELECT id INTO src_funnel FROM public.funnels WHERE tenant = 'lisboa' ORDER BY ordem LIMIT 1;

  FOREACH sys IN ARRAY ARRAY['epic','hope'] LOOP
    IF NOT EXISTS (SELECT 1 FROM public.funnels WHERE tenant = sys) AND src_funnel IS NOT NULL THEN
      INSERT INTO public.funnels (nome, descricao, cor, ordem, ativo, tenant)
      SELECT nome, descricao, cor, ordem, ativo, sys FROM public.funnels WHERE id = src_funnel
      RETURNING id INTO new_funnel;

      FOR s IN SELECT nome, ordem, cor, tipo, ativa, percentual_progresso, probabilidade_fechamento, sla_dias
                 FROM public.pipeline_stages WHERE funnel_id = src_funnel ORDER BY ordem LOOP
        INSERT INTO public.pipeline_stages
          (nome, ordem, cor, tipo, ativa, funnel_id, percentual_progresso, probabilidade_fechamento, sla_dias, tenant)
        VALUES (s.nome, s.ordem, s.cor, s.tipo, s.ativa, new_funnel, s.percentual_progresso, s.probabilidade_fechamento, s.sla_dias, sys);
      END LOOP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.tags WHERE tenant = sys) THEN
      INSERT INTO public.tags (nome, cor, categoria, tipo, ativa, tenant)
      SELECT nome, cor, categoria, tipo, ativa, sys FROM public.tags WHERE tenant = 'lisboa';
    END IF;
  END LOOP;
END $$;