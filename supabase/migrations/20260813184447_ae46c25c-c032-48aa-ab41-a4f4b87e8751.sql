REVOKE ALL ON FUNCTION public.user_tenants(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_tenants(uuid) TO authenticated, service_role;