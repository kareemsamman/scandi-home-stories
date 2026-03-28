-- Fix shared_carts INSERT policy to prevent owner spoofing
ALTER POLICY auth_insert ON public.shared_carts
  WITH CHECK (created_by = auth.uid());