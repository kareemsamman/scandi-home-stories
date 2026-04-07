-- Product-level out of stock override
ALTER TABLE products ADD COLUMN IF NOT EXISTS out_of_stock boolean DEFAULT false;
