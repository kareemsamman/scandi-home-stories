import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

/* ── Types ── */
export interface SmsSettings {
  user: string;
  token: string;
  source: string;
  admin_phone: string;
  enabled: boolean;
}

export interface WhatsappSettings {
  phone: string;
  enabled: boolean;
}

export interface BankSettings {
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_number: string;
  bank_code: string;
}

export interface SmsMessages {
  order_received: { he: string; ar: string };
  admin_new_order: string;
  waiting_approval: { he: string; ar: string };
  in_process: { he: string; ar: string };
  in_delivery: { he: string; ar: string };
  not_approved: { he: string; ar: string };
  cancelled: { he: string; ar: string };
  share_cart: string;
}

const DEFAULT_BANK: BankSettings = {
  bank_name: "בנק הפועלים",
  account_name: "AMG Pergola LTD",
  account_number: "12345678",
  branch_number: "123",
  bank_code: "12",
};

export const DEFAULT_SMS_MESSAGES: SmsMessages = {
  order_received: {
    he: "שלום {name} 👋\n✅ הזמנה #{order_number} התקבלה!\n\n📦 המוצרים שלך:\n{items}\n\n💰 סכום ביניים: ₪{total}\n🚚 משלוח: {shipping}\n\nנבדוק את אישור ההעברה ונחזור אליך בקרוב 🔄\n\n🔗 פרטי ההזמנה: {order_link}\n\n🏗 AMG PERGOLA",
    ar: "مرحباً {name} 👋\n✅ تم استلام الطلب #{order_number}!\n\n📦 منتجاتك:\n{items}\n\n💰 المبلغ: ₪{total}\n🚚 الشحن: {shipping}\n\nسنراجع إيصال التحويل ونتواصل معك قريباً 🔄\n\n🔗 تفاصيل الطلب: {order_link}\n\n🏗 AMG PERGOLA",
  },
  admin_new_order: "🛎 AMG PERGOLA - הזמנה חדשה!\n\n📋 הזמנה #{order_number}\n👤 {name}\n📞 {phone}\n💰 סה\"כ: ₪{total}\n🚚 משלוח: {shipping}\n\n📦 מוצרים:\n{items}",
  waiting_approval: {
    he: "שלום {name} 👋\n⏳ הזמנה #{order_number} ממתינה לאישור\n💰 סה\"כ: ₪{total} | 🚚 משלוח: {shipping}\n\nנבדוק את הקבלה ונחזור אליך בקרוב ✅\n\n🏗 AMG PERGOLA",
    ar: "مرحباً {name} 👋\n⏳ الطلب #{order_number} في انتظار الموافقة\n💰 الإجمالي: ₪{total} | 🚚 الشحن: {shipping}\n\nسنراجع الإيصال ونتواصل معك قريباً ✅\n\n🏗 AMG PERGOLA",
  },
  in_process: {
    he: "שלום {name} 👋\n🔄 הזמנה #{order_number} בטיפול\n💰 סה\"כ: ₪{total} | 🚚 משלוח: {shipping}\n\nמתכוננים לשלוח את ההזמנה שלך 📦\n\n🧾 חשבונית: {invoice_link}\n\n🏗 AMG PERGOLA",
    ar: "مرحباً {name} 👋\n🔄 الطلب #{order_number} قيد المعالجة\n💰 الإجمالي: ₪{total} | 🚚 الشحن: {shipping}\n\nنجهز طلبك للشحن 📦\n\n🧾 الفاتورة: {invoice_link}\n\n🏗 AMG PERGOLA",
  },
  in_delivery: {
    he: "שלום {name} 🎉\n🚚 הזמנה #{order_number} יצאה לדרך!\n💰 סה\"כ: ₪{total} | משלוח: {shipping}\n\nההזמנה שלך בדרך אליך ✨\n\n🏗 AMG PERGOLA",
    ar: "مرحباً {name} 🎉\n🚚 الطلب #{order_number} في الطريق إليك!\n💰 الإجمالي: ₪{total} | الشحن: {shipping}\n\nطلبك على الطريق ✨\n\n🏗 AMG PERGOLA",
  },
  not_approved: {
    he: "שלום {name}\n❌ הזמנה #{order_number} לא אושרה\n\nאנא צור קשר איתנו לפרטים נוספים 📞\n\n🏗 AMG PERGOLA",
    ar: "مرحباً {name}\n❌ الطلب #{order_number} لم تتم الموافقة عليه\n\nيرجى التواصل معنا للمزيد من التفاصيل 📞\n\n🏗 AMG PERGOLA",
  },
  cancelled: {
    he: "שלום {name}\n🚫 הזמנה #{order_number} בוטלה\n\nבכל שאלה אנחנו כאן 😊\n\n🏗 AMG PERGOLA",
    ar: "مرحباً {name}\n🚫 تم إلغاء الطلب #{order_number}\n\nنحن هنا لأي استفسار 😊\n\n🏗 AMG PERGOLA",
  },
  share_cart: "שלום! 🛒\nAMG פרגולה הכינו עבורך עגלת קנייה מוכנה.\n\nלחץ כאן להשלמת הרכישה:\n{link}\n\n🏗 AMG PERGOLA",
};

/* ── Fetcher ── */
const fetchSetting = async (key: string) => {
  const { data } = await db.from("app_settings").select("value").eq("key", key).single();
  return data?.value ?? null;
};

/* ── Hooks ── */
export const useBankSettings = () =>
  useQuery<BankSettings>({
    queryKey: ["app_settings", "bank"],
    queryFn: async () => (await fetchSetting("bank")) ?? DEFAULT_BANK,
    staleTime: 1000 * 60 * 5,
  });

export const useSmsSettings = () =>
  useQuery<SmsSettings>({
    queryKey: ["app_settings", "sms"],
    queryFn: () => fetchSetting("sms"),
  });

export const useSmsMessages = () =>
  useQuery<SmsMessages>({
    queryKey: ["app_settings", "sms_messages"],
    queryFn: async () => (await fetchSetting("sms_messages")) ?? DEFAULT_SMS_MESSAGES,
    staleTime: 1000 * 60 * 5,
  });

export interface AdminOrderSettings {
  enabled: boolean;
}

export const useAdminOrderSettings = () =>
  useQuery<AdminOrderSettings>({
    queryKey: ["app_settings", "admin_orders"],
    queryFn: async () => (await fetchSetting("admin_orders")) ?? { enabled: false },
    staleTime: 1000 * 60 * 5,
  });

export const useWhatsappSettings = () =>
  useQuery<WhatsappSettings>({
    queryKey: ["app_settings", "whatsapp"],
    queryFn: async () => (await fetchSetting("whatsapp")) ?? { phone: "", enabled: false },
    staleTime: 1000 * 60 * 5,
  });

export const useSaveSetting = (key: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: object) => {
      const { error } = await db
        .from("app_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["app_settings", key] }),
  });
};

/* ── SMS sending via edge function ── */
export const sendSms = async (phone: string, message: string): Promise<boolean> => {
  try {
    // Normalize Israeli phone to international format
    const normalized = phone.replace(/[\s\-]/g, "");
    const intlPhone = normalized.startsWith("0") ? "972" + normalized.slice(1) : normalized;

    const { error } = await supabase.functions.invoke("send-sms", {
      body: { phone: intlPhone, message },
    });
    return !error;
  } catch {
    return false;
  }
};

/* ── Template formatter ── */
export const formatSms = (template: string, vars: Record<string, string>): string =>
  Object.entries(vars).reduce(
    (msg, [k, v]) => msg.replace(new RegExp(`\\{${k}\\}`, "g"), v),
    template
  );
