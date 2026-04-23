-- Track whether a Tranzila-paid order has been confirmed by the server-to-server
-- webhook (notify_url_address), not just by client-side postMessage.
-- Client-created orders start with payment_confirmed = false; the tranzila-webhook
-- edge function flips it to true once Tranzila's IPN reports Response=000.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed boolean NOT NULL DEFAULT false;

-- Webhook looks orders up by order_number, so index that for speed.
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON orders (order_number);
