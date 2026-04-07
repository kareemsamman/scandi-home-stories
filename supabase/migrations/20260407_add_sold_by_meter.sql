-- Add sold_by_meter flag for products priced per meter (e.g. סנטפים)
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_by_meter boolean DEFAULT false;

-- Add meter_length to order_items so we can record the length ordered
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS meter_length numeric DEFAULT null;
