ALTER TABLE public.backup_history
  ADD COLUMN IF NOT EXISTS checksum_sha256 text,
  ADD COLUMN IF NOT EXISTS validacao jsonb;