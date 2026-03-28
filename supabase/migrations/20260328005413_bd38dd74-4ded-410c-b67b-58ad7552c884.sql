
CREATE OR REPLACE FUNCTION public.get_invoice_order(order_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT row_to_json(t) INTO v_result
  FROM (
    SELECT o.id, o.order_number, o.status, o.total,
      o.first_name, o.last_name, o.email, o.phone,
      o.city, o.address, o.apartment, o.notes, o.house_number,
      o.locale, o.discount_code, o.discount_amount, o.created_at,
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', i.id, 'product_id', i.product_id, 'product_name', i.product_name,
          'product_image', i.product_image, 'price', i.price, 'quantity', i.quantity,
          'size', i.size, 'color_name', i.color_name, 'color_hex', i.color_hex
        ) ORDER BY i.id) FROM public.order_items i WHERE i.order_id = o.id),
        '[]'::json
      ) AS order_items
    FROM public.orders o WHERE o.id = order_id::uuid
  ) t;
  RETURN v_result;
END;
$$;
