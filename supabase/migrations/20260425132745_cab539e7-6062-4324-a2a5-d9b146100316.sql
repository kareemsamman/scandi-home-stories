ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS auto_apply boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_coupons_auto_apply ON public.coupons (auto_apply) WHERE auto_apply = true;

CREATE OR REPLACE FUNCTION public.get_auto_apply_coupon()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT row_to_json(t) FROM (
    SELECT id, code, description, type, value, min_order_amount,
           max_discount_amount, max_uses, max_uses_per_user, uses,
           valid_from, valid_until, product_ids, category_ids,
           is_active, admin_only, created_at
    FROM public.coupons
    WHERE auto_apply = true
      AND is_active = true
      AND admin_only = false
      AND (allowed_phones IS NULL OR array_length(allowed_phones, 1) IS NULL)
      AND (valid_from IS NULL OR valid_from <= now())
      AND (valid_until IS NULL OR valid_until >= now())
      AND (max_uses IS NULL OR uses < max_uses)
    ORDER BY value DESC
    LIMIT 1
  ) t
$$;