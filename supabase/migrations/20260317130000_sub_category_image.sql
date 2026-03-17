-- Add image column to sub_categories
ALTER TABLE public.sub_categories ADD COLUMN IF NOT EXISTS image text DEFAULT '';
