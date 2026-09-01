DROP POLICY IF EXISTS "backups read internal" ON storage.objects;
DROP POLICY IF EXISTS "backups insert internal" ON storage.objects;
DROP POLICY IF EXISTS "backups delete internal" ON storage.objects;

CREATE POLICY "backups read by tenant"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'backups'
  AND public.get_user_tipo(auth.uid()) IN ('master'::public.user_tipo, 'interno'::public.user_tipo)
  AND (storage.foldername(name))[1] = ANY (public.user_tenants(auth.uid()))
);

CREATE POLICY "backups insert by tenant"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'backups'
  AND public.get_user_tipo(auth.uid()) IN ('master'::public.user_tipo, 'interno'::public.user_tipo)
  AND (storage.foldername(name))[1] = ANY (public.user_tenants(auth.uid()))
);

CREATE POLICY "backups delete by tenant"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'backups'
  AND public.get_user_tipo(auth.uid()) IN ('master'::public.user_tipo, 'interno'::public.user_tipo)
  AND (storage.foldername(name))[1] = ANY (public.user_tenants(auth.uid()))
);