-- Returns a single order with its items for the invoice page.
-- SECURITY DEFINER bypasses RLS so no login is required.
-- The UUID (128-bit) acts as the unguessable access token.
CREATE OR REPLACE FUNCTION public.get_invoice_order(order_id uuid)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT row_to_json(t)
  FROM (
    SELECT
      o.id, o.order_number, o.status, o.total,
      o.first_name, o.last_name, o.email, o.phone,
      o.city, o.address, o.apartment, o.notes,
      o.locale, o.discount_code, o.discount_amount,
      o.created_at,
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id',            i.id,
            'product_id',    i.product_id,
            'product_name',  i.product_name,
            'product_image', i.product_image,
            'price',         i.price,
            'quantity',      i.quantity,
            'size',          i.size,
            'color_name',    i.color_name,
            'color_hex',     i.color_hex
          ) ORDER BY i.id
        ) FROM public.order_items i WHERE i.order_id = o.id),
        '[]'::json
      ) AS order_items
    FROM public.orders o
    WHERE o.id = order_id
  ) t
$$;

GRANT EXECUTE ON FUNCTION public.get_invoice_order(uuid) TO anon, authenticated;
