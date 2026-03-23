
-- 1. Create a secure RPC to look up shared cart by token (replaces public SELECT)
CREATE OR REPLACE FUNCTION public.get_shared_cart_by_token(p_token text)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT row_to_json(t) FROM (
    SELECT cart_items, coupon_code
    FROM public.shared_carts
    WHERE token = p_token
    LIMIT 1
  ) t
$$;

-- 2. Drop the overly permissive public_read policy on shared_carts
DROP POLICY IF EXISTS "public_read" ON public.shared_carts;

-- 3. Add a restricted SELECT policy: only admins and creators can list carts
CREATE POLICY "admins_select_shared_carts" ON public.shared_carts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'worker')
    )
    OR created_by = auth.uid()
  );
