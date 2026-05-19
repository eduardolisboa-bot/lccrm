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