CREATE OR REPLACE FUNCTION public.get_shared_cart_by_token(p_token text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT row_to_json(t) FROM (
    SELECT cart_items, coupon_code, admin_discount
    FROM public.shared_carts
    WHERE token = p_token
    LIMIT 1
  ) t
$$;