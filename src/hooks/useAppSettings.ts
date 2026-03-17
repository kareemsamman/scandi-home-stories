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
}

const DEFAULT_BANK: BankSettings = {
  bank_name: "בנק הפועלים",
  account_name: "AMG Pergola LTD",
  account_number: "12345678",
  branch_number: "123",
  bank_code: "12",
};

const DEFAULT_SMS_MESSAGES: SmsMessages = {
  order_received: {
    he: "שלום {name}, הזמנה מספר {order_number} התקבלה בהצלחה. נבדוק את הקבלה ונאשר בקרוב.",
    ar: "مرحباً {name}، تم استلام الطلب رقم {order_number} بنجاح. سنراجع إيصالك ونؤكد قريباً.",
  },
  admin_new_order: "הזמנה חדשה! {order_number} | {name} | {phone} | ₪{total}",
  waiting_approval: {
    he: "שלום {name}, הזמנה מספר {order_number} ממתינה לאישור.",
    ar: "مرحباً {name}، الطلب رقم {order_number} في انتظار الموافقة.",
  },
  in_process: {
    he: "שלום {name}, הזמנה מספר {order_number} בטיפול.",
    ar: "مرحباً {name}، الطلب رقم {order_number} قيد المعالجة.",
  },
  in_delivery: {
    he: "שלום {name}, הזמנה מספר {order_number} יצאה לדרך!",
    ar: "مرحباً {name}، الطلب رقم {order_number} في الطريق إليك!",
  },
  not_approved: {
    he: "שלום {name}, הזמנה מספר {order_number} לא אושרה. אנא צור קשר.",
    ar: "مرحباً {name}، الطلب رقم {order_number} لم تتم الموافقة عليه.",
  },
  cancelled: {
    he: "שלום {name}, הזמנה מספר {order_number} בוטלה.",
    ar: "مرحباً {name}، تم إلغاء الطلب رقم {order_number}.",
  },
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
