
-- Add registration_token to profiles for secure set-password flow
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_token text DEFAULT NULL;

-- Fix receipt storage: drop open UPDATE policies, add admin-only UPDATE
DROP POLICY IF EXISTS "Anyone can update receipts" ON storage.objects;
DROP POLICY IF EXISTS "allow_receipt_update" ON storage.objects;

CREATE POLICY "Admins can update receipts" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'receipts' AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Fix get_invoice_order: require authenticated user who owns the order or is admin/worker
CREATE OR REPLACE FUNCTION public.get_invoice_order(order_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
  v_user_id uuid;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check if admin/worker
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'worker')
  ) THEN
    -- Admin/worker can view any invoice
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
      FROM public.orders o WHERE o.id = order_id
    ) t;
    RETURN v_result;
  END IF;

  -- Regular user: must own the order
  SELECT o.user_id INTO v_user_id FROM public.orders o WHERE o.id = order_id;
  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RETURN NULL;
  END IF;

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
    FROM public.orders o WHERE o.id = order_id
  ) t;
  RETURN v_result;
END;
$function$;

-- Fix function search paths for functions missing it
CREATE OR REPLACE FUNCTION public.get_invoice_order(order_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
  v_user_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'worker')
  ) THEN
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
      FROM public.orders o WHERE o.id = order_id
    ) t;
    RETURN v_result;
  END IF;

  SELECT o.user_id INTO v_user_id FROM public.orders o WHERE o.id = order_id;
  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RETURN NULL;
  END IF;

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
    FROM public.orders o WHERE o.id = order_id
  ) t;
  RETURN v_result;
END;
$function$;
