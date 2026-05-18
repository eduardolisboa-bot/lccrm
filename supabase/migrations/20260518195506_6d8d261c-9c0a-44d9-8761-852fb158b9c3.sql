
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
