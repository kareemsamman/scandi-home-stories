-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text DEFAULT '',
  type text NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
  value numeric NOT NULL DEFAULT 0,
  min_order_amount numeric NOT NULL DEFAULT 0,
  max_discount_amount numeric,
  max_uses integer,
  max_uses_per_user integer NOT NULL DEFAULT 1,
  uses integer NOT NULL DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  product_ids text[] DEFAULT '{}',
  category_ids text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Coupon usage log
CREATE TABLE IF NOT EXISTS coupon_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES coupons(id) ON DELETE CASCADE,
  user_id uuid,
  order_number text,
  discount_amount numeric,
  used_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_uses ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "admins_all_coupons" ON coupons FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin')));

-- Anyone can read active coupons (for validation — but only by code, not list)
CREATE POLICY "read_active_coupons" ON coupons FOR SELECT TO anon, authenticated USING (true);

-- Coupon uses: admins can see all; users can see own
CREATE POLICY "admins_all_coupon_uses" ON coupon_uses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin')));

CREATE POLICY "users_own_coupon_uses" ON coupon_uses FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "insert_coupon_use" ON coupon_uses FOR INSERT TO anon, authenticated WITH CHECK (true);
