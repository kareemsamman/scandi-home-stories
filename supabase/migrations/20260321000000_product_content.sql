-- Add content_html to product_translations (per-locale visual content)
ALTER TABLE public.product_translations
  ADD COLUMN IF NOT EXISTS content_html TEXT;

-- Add product_details to products (multilingual key-value pairs)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_details JSONB DEFAULT '[]'::jsonb;
