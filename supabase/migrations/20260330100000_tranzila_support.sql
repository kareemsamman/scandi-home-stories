-- Add Tranzila transaction tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id text;

-- Default Tranzila settings (disabled until configured)
INSERT INTO app_settings (key, value)
VALUES ('tranzila', '{"terminal_name": "", "app_key": "", "secret_key": "", "terminal_password": "", "enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;
