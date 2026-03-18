-- Fix 1: Remove open INSERT policy on coupon_uses (edge function uses service role key)
DROP POLICY IF EXISTS "insert_coupon_use" ON public.coupon_uses;

-- Fix 2: Remove open INSERT policies on orders and order_items (edge function uses service role key)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Fix 3: Create private receipts bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to receipts bucket (guests can place orders)
CREATE POLICY "Anyone can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts');

-- Allow admins to read receipts
CREATE POLICY "Admins can read receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts' AND EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::public.app_role
));

-- Allow update for upsert on receipts
CREATE POLICY "Anyone can update receipts"
ON storage.objects FOR UPDATE
USING (bucket_id = 'receipts')
WITH CHECK (bucket_id = 'receipts');