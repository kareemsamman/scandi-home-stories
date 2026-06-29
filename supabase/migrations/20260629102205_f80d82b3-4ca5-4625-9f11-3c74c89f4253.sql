-- Tranzila automatic tax-invoice (חשבונית מס/קבלה) support.

-- 1. Store the issued invoice on the order
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_url        text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_number     text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_issued_at  timestamptz;

-- 2. Extend Tranzila settings with the documents (invoice) module config.
UPDATE public.app_settings
SET value = value
  || jsonb_build_object(
       'auto_invoice',      COALESCE(value->'auto_invoice', 'false'::jsonb),
       'documents_api_url', COALESCE(value->'documents_api_url',
                              '"https://billing5.tranzila.com/api/documents_db/create_document"'::jsonb)
     )
WHERE key = 'tranzila';

-- 3. Add the "invoice ready" SMS template (only if missing)
UPDATE public.app_settings
SET value = jsonb_set(
  value,
  '{invoice_ready}',
  '{
     "he": "שלום {name}, חשבונית מס מספר {invoice_number} עבור הזמנה {order_number} מוכנה. צפייה והורדה: {invoice_link}",
     "ar": "مرحباً {name}، الفاتورة الضريبية رقم {invoice_number} للطلب {order_number} جاهزة. عرض وتحميل: {invoice_link}"
   }'::jsonb,
  true
)
WHERE key = 'sms_messages'
  AND NOT (value ? 'invoice_ready');