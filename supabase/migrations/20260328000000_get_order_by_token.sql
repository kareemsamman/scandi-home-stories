-- Secure RPC for payment link page: returns order only if token matches
-- SECURITY DEFINER bypasses RLS so anonymous users can access their specific order
CREATE OR REPLACE FUNCTION public.get_order_by_token(p_order_id uuid, p_token text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result json;
BEGIN
  IF p_order_id IS NULL OR p_token IS NULL OR p_token = '' THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id',             o.id,
    'order_number',   o.order_number,
    'first_name',     o.first_name,
    'last_name',      o.last_name,
    'phone',          o.phone,
    'total',          o.total,
    'payment_status', o.payment_status,
    'payment_token',  o.payment_token,
    'order_items',    (
      SELECT COALESCE(json_agg(json_build_object(
        'product_name', i.product_name,
        'quantity',     i.quantity,
        'price',        i.price
      )), '[]'::json)
      FROM public.order_items i
      WHERE i.order_id = o.id
    )
  )
  INTO v_result
  FROM public.orders o
  WHERE o.id = p_order_id
    AND o.payment_token = p_token;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_by_token(uuid, text) TO anon, authenticated;
