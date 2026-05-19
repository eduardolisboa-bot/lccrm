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