
UPDATE public.app_settings
SET value = value || '{
  "pergola_admin_new": {
    "he": "🏗 בקשת פרגולה חדשה!\n👤 {name}\n📞 {phone}\n📏 {width}×{length} cm\n🔗 {link}\n\n🏗 AMG PERGOLA",
    "ar": "🏗 طلب برجولة جديد!\n👤 {name}\n📞 {phone}\n📏 {width}×{length} cm\n🔗 {link}\n\n🏗 AMG PERGOLA"
  },
  "pergola_customer_response": {
    "he": "שלום {name} 👋\n🏗 קיבלנו תשובה לבקשת הפרגולה שלך!\n💰 מחיר: ₪{price}\n🔗 צפה בפרטים: {link}\n\n🏗 AMG PERGOLA",
    "ar": "مرحباً {name} 👋\n🏗 لدينا رد على طلب البرجولة الخاص بك!\n💰 السعر: ₪{price}\n🔗 عرض التفاصيل: {link}\n\n🏗 AMG PERGOLA"
  }
}'::jsonb
WHERE key = 'sms_messages';
