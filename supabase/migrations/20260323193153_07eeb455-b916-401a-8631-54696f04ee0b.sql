-- Fix 1: Replace overly permissive rate_limits policy (ALL for anon) with INSERT-only
DROP POLICY "anon can upsert rate limits" ON public.rate_limits;

CREATE POLICY "anon can insert rate limits"
  ON public.rate_limits FOR INSERT
  TO anon
  WITH CHECK (true);

-- Fix 2: Replace overly permissive contact_submissions SELECT policy with admin/worker only
DROP POLICY "authenticated can read contact submissions" ON public.contact_submissions;

CREATE POLICY "Admins and workers can read contact submissions"
  ON public.contact_submissions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'worker')
  ));