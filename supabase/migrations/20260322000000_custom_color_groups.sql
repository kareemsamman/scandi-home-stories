ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS custom_colors_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_color_groups JSONB DEFAULT '[]'::jsonb;
