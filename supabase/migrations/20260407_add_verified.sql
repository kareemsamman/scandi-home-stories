-- Manual admin verification flag for products
ALTER TABLE products ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
