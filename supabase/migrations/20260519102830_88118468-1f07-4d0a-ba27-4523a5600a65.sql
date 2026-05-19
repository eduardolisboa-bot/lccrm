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