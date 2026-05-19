GRANT EXECUTE ON FUNCTION public.get_user_tipo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_parceiro(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_funnel(uuid, uuid) TO authenticated;