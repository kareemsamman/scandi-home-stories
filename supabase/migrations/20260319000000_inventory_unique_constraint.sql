-- Add unique constraint on inventory (product_id, variation_key) so upsert works
ALTER TABLE public.inventory
  ADD CONSTRAINT IF NOT EXISTS inventory_product_variation_unique
  UNIQUE (product_id, variation_key);
