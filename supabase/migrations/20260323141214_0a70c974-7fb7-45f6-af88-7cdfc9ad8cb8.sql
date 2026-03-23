
-- Add unique constraint on email for marketing_subscribers upsert
CREATE UNIQUE INDEX IF NOT EXISTS marketing_subscribers_email_unique ON public.marketing_subscribers (email) WHERE email IS NOT NULL;
