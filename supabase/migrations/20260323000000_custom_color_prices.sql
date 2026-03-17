ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS custom_color_prices JSONB DEFAULT '{}'::jsonb;
