-- Add VAT support to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vat_amount numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vat_rate numeric;

-- Default VAT setting (18%, enabled)
INSERT INTO app_settings (key, value)
VALUES ('vat', '{"enabled": true, "rate": 18}'::jsonb)
ON CONFLICT (key) DO NOTHING;
