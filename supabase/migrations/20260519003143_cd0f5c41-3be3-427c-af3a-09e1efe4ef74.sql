
-- 1) Lock down SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.get_user_tipo(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_parceiro(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_profile_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_can_access_funnel(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;

-- 2) Tighten audit_logs INSERT
DROP POLICY IF EXISTS "audit write" ON public.audit_logs;
CREATE POLICY "audit write" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 3) Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  mensagem text,
  tipo text DEFAULT 'info',
  link text,
  lida boolean NOT NULL DEFAULT false,
  entidade text,
  entidade_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notif_user_idx ON public.notifications(user_id, lida, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif own read" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = public.get_user_profile_id(auth.uid()));

CREATE POLICY "notif own update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = public.get_user_profile_id(auth.uid()))
  WITH CHECK (user_id = public.get_user_profile_id(auth.uid()));

CREATE POLICY "notif own delete" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = public.get_user_profile_id(auth.uid()));

CREATE POLICY "notif insert internal" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_tipo(auth.uid()) = ANY (ARRAY['master'::public.user_tipo,'interno'::public.user_tipo])
    OR user_id = public.get_user_profile_id(auth.uid())
  );

-- 4) Commission rules table
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  parceiro_id uuid,
  produto text,
  percentual numeric NOT NULL DEFAULT 0,
  valor_minimo numeric DEFAULT 0,
  valor_maximo numeric,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission read master" ON public.commission_rules
  FOR SELECT TO authenticated
  USING (public.get_user_tipo(auth.uid()) = 'master'::public.user_tipo);

CREATE POLICY "commission write master" ON public.commission_rules
  FOR ALL TO authenticated
  USING (public.get_user_tipo(auth.uid()) = 'master'::public.user_tipo)
  WITH CHECK (public.get_user_tipo(auth.uid()) = 'master'::public.user_tipo);

CREATE TRIGGER touch_commission_rules
BEFORE UPDATE ON public.commission_rules
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
