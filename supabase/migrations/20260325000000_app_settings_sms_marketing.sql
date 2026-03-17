-- Add columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS locale text DEFAULT 'he';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS marketing_opt_in boolean DEFAULT false;

-- App settings table (key → jsonb value, admin-editable)
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_settings" ON app_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Public read so checkout can load bank details
CREATE POLICY "public_read_settings" ON app_settings FOR SELECT TO anon, authenticated USING (true);

-- Marketing subscribers
CREATE TABLE IF NOT EXISTS marketing_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  phone text,
  first_name text,
  last_name text,
  locale text DEFAULT 'he',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_all_marketing" ON marketing_subscribers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "insert_marketing" ON marketing_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Default SMS settings
INSERT INTO app_settings (key, value) VALUES (
  'sms',
  '{"user":"morshed","token":"eyJ0eXAiOiJqd3QiLCJhbGciOiJIUzI1NiJ9.eyJmaXJzdF9rZXkiOiI3MDkzNCIsInNlY29uZF9rZXkiOiIzNzg2MTg4IiwiaXNzdWVkQXQiOiIwMS0wOC0yMDI1IDAwOjU5OjQ5IiwidHRsIjo2MzA3MjAwMH0.YgiPiKpDBJjjZYCntmPaAFPwQoOYsNZc0DYISaSPY7U","source":"0525143581","admin_phone":"0525143281","enabled":true}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Default bank details
INSERT INTO app_settings (key, value) VALUES (
  'bank',
  '{"bank_name":"בנק הפועלים","account_name":"AMG Pergola LTD","account_number":"12345678","branch_number":"123","bank_code":"12"}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Default SMS message templates
INSERT INTO app_settings (key, value) VALUES (
  'sms_messages',
  '{
    "order_received": {
      "he": "שלום {name}, הזמנה מספר {order_number} התקבלה בהצלחה. נבדוק את הקבלה ונאשר בקרוב.",
      "ar": "مرحباً {name}، تم استلام الطلب رقم {order_number} بنجاح. سنراجع إيصالك ونؤكد قريباً."
    },
    "admin_new_order": "הזמנה חדשה! {order_number} | {name} | {phone} | ₪{total}",
    "waiting_approval": {
      "he": "שלום {name}, הזמנה מספר {order_number} ממתינה לאישור.",
      "ar": "مرحباً {name}، الطلب رقم {order_number} في انتظار الموافقة."
    },
    "in_process": {
      "he": "שלום {name}, הזמנה מספר {order_number} בטיפול.",
      "ar": "مرحباً {name}، الطلب رقم {order_number} قيد المعالجة."
    },
    "in_delivery": {
      "he": "שלום {name}, הזמנה מספר {order_number} יצאה לדרך! נשמח לשמוע שהגיעה.",
      "ar": "مرحباً {name}، الطلب رقم {order_number} في الطريق إليك!"
    },
    "not_approved": {
      "he": "שלום {name}, הזמנה מספר {order_number} לא אושרה. אנא צור קשר.",
      "ar": "مرحباً {name}، الطلب رقم {order_number} لم تتم الموافقة عليه. يرجى التواصل معنا."
    },
    "cancelled": {
      "he": "שלום {name}, הזמנה מספר {order_number} בוטלה.",
      "ar": "مرحباً {name}، تم إلغاء الطلب رقم {order_number}."
    }
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;
