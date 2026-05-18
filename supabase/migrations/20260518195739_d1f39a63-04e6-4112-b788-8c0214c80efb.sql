
-- UPDATE policy for activities
CREATE POLICY "activities update" ON public.activities
  FOR UPDATE TO authenticated
  USING (
    get_user_tipo(auth.uid()) IN ('master','interno')
    OR (
      get_user_tipo(auth.uid()) = 'parceiro'
      AND (
        (opportunity_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.opportunities o
          WHERE o.id = opportunity_id AND o.parceiro_id = get_user_parceiro(auth.uid())
        ))
        OR (client_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.clients c
          WHERE c.id = client_id AND c.parceiro_id = get_user_parceiro(auth.uid())
        ))
      )
    )
  )
  WITH CHECK (
    get_user_tipo(auth.uid()) IN ('master','interno')
    OR (
      get_user_tipo(auth.uid()) = 'parceiro'
      AND (
        (opportunity_id IS NULL OR EXISTS (
          SELECT 1 FROM public.opportunities o
          WHERE o.id = opportunity_id AND o.parceiro_id = get_user_parceiro(auth.uid())
        ))
        AND (client_id IS NULL OR EXISTS (
          SELECT 1 FROM public.clients c
          WHERE c.id = client_id AND c.parceiro_id = get_user_parceiro(auth.uid())
        ))
      )
    )
  );

-- DELETE policy: only master/interno
CREATE POLICY "activities delete" ON public.activities
  FOR DELETE TO authenticated
  USING (get_user_tipo(auth.uid()) IN ('master','interno'));
