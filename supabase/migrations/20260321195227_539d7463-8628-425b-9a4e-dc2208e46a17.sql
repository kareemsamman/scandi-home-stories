
-- Create a secure RPC function for coupon lookup by code (excludes allowed_phones)
CREATE OR REPLACE FUNCTION public.lookup_coupon_by_code(p_code text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT row_to_json(t) FROM (
    SELECT id, code, description, type, value, min_order_amount,
           max_discount_amount, max_uses, max_uses_per_user, uses,
           valid_from, valid_until, product_ids, category_ids,
           is_active, admin_only, created_at
    FROM public.coupons
    WHERE code = upper(trim(p_code))
    LIMIT 1
  ) t
$$;

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "read_active_coupons" ON public.coupons;
