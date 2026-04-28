
-- 1. Fix app_settings: restrict anon read to safe keys only
DROP POLICY IF EXISTS "public_read_settings" ON public.app_settings;

CREATE POLICY "public_read_safe_settings" ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (key IN (
    'bank', 'vat', 'sms_messages', 'welcome_popup',
    'whatsapp', 'profile_color_picker', 'catalog', 'admin_orders'
  ));

-- 2. Public RPC exposing only non-sensitive Tranzila fields the client needs
CREATE OR REPLACE FUNCTION public.get_tranzila_public_settings()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'enabled', COALESCE((value->>'enabled')::boolean, false),
    'terminal_name', COALESCE(value->>'terminal_name', '')
  )
  FROM public.app_settings WHERE key = 'tranzila'
$$;

REVOKE ALL ON FUNCTION public.get_tranzila_public_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tranzila_public_settings() TO anon, authenticated;

-- 3. Allow anonymous marketing subscriptions
CREATE POLICY "anon_insert_marketing"
  ON public.marketing_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 4. Harden invoice RPC: require token in addition to order id
CREATE OR REPLACE FUNCTION public.get_invoice_order(order_id text, p_token text DEFAULT NULL)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
  v_is_privileged boolean := false;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin','worker')
    ) INTO v_is_privileged;
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
    FROM public.orders o
    WHERE o.id = order_id::uuid
      AND (
        v_is_privileged
        OR o.user_id = auth.uid()
        OR (p_token IS NOT NULL AND p_token <> '' AND o.payment_token = p_token)
      )
  ) t;
  RETURN v_result;
END;
$function$;

-- 5. Fix mutable search path on existing trigger function
CREATE OR REPLACE FUNCTION public.update_pergola_requests_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
