
-- 1. Remove the "Users can create orders" INSERT policy (all orders go through create-order edge function)
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

-- 2. Remove open INSERT policy on contact_submissions (inserts go through send-contact-email edge function)
DROP POLICY IF EXISTS "public_insert_contact" ON public.contact_submissions;

-- 3. Remove open INSERT policy on marketing_subscribers (inserts will go through create-order edge function)
DROP POLICY IF EXISTS "insert_marketing" ON public.marketing_subscribers;
