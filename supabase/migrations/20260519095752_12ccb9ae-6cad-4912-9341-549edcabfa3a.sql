DROP POLICY IF EXISTS "partners write master" ON public.partners;
CREATE POLICY "partners write internal" ON public.partners
FOR ALL TO authenticated
USING (get_user_tipo(auth.uid()) = ANY (ARRAY['master'::user_tipo, 'interno'::user_tipo]))
WITH CHECK (get_user_tipo(auth.uid()) = ANY (ARRAY['master'::user_tipo, 'interno'::user_tipo]));