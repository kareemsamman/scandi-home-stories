
-- Fix 1: Restrict public read of app_settings to exclude sensitive keys
DROP POLICY IF EXISTS "public_read_settings" ON public.app_settings;
CREATE POLICY "public_read_settings" ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (key NOT IN ('sms'));
