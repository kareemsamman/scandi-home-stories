import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, CheckCircle2, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useCouponStore } from "@/hooks/useCoupons";
import { useSmsMessages, sendSms, formatSms } from "@/hooks/useAppSettings";
import { useLocale } from "@/i18n/useLocale";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  open: boolean;
  onClose: () => void;
  adminDiscount?: number;
}

const db = supabase as any;

const PHONE_RX = /^05[0-9]{8}$/;

export const SendCartModal = ({ open, onClose, adminDiscount = 0 }: Props) => {
  const { locale, localePath } = useLocale();
  const { user } = useAuth();
  const items = useCart((s) => s.items);
  const { applied: appliedCoupon } = useCouponStore();
  const { data: smsMessages } = useSmsMessages();

  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isRtl = locale === "he" || locale === "ar";

  const texts = useMemo(
    () => ({
      missingSession: locale === "ar" ? "يجب تسجيل الدخول كمدير لإرسال الرسالة." : "צריך להיות מחובר כאדמין כדי לשלוח SMS.",
      saveCartFailed: locale === "ar" ? "נכשלה שמירת السلة للمشاركة." : "שמירת העגלה לשיתוף נכשלה.",
      smsDisabled: locale === "ar" ? "إرسال الرسائل القصيرة معطّل في الإعدادات." : "שליחת ה-SMS כבויה בהגדרות.",
      unauthorized: locale === "ar" ? "انتهت جلسة المدير أو لا توجد صلاحية للإرسال." : "פג תוקף ההתחברות של האדמין או שאין הרשאה לשלוח.",
      genericSendFailed: locale === "ar" ? "فشل إرسال الرسالة القصيرة." : "שליחת ה-SMS נכשלה.",
    }),
    [locale]
  );

  const normalizePhone = (p: string) => p.replace(/[\s\-]/g, "");
  const isValid = PHONE_RX.test(normalizePhone(phone));

  const handleSend = async () => {
    if (!isValid || status === "sending") return;

    if (!user?.id) {
      setErrorMsg(texts.missingSession);
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      // 1. Save shared cart to DB
      const { data, error } = await db
        .from("shared_carts")
        .insert({
          cart_items: items,
          coupon_code: appliedCoupon?.coupon.code ?? null,
          created_by: user.id,
          admin_discount: adminDiscount > 0 ? adminDiscount : 0,
        })
        .select("token")
        .single();

      if (error) throw new Error(texts.saveCartFailed);

      const token: string = data.token;

      // 2. Build the checkout link
      const origin = window.location.origin;
      const path = localePath(`/checkout?cart=${token}`);
      const link = `${origin}${path}`;

      // 3. Build SMS text from template
      const template = smsMessages?.share_cart ||
        "שלום! 🛒\nAMG פרגולה הכינו עבורך עגלת קנייה מוכנה.\n\nלחץ כאן להשלמת הרכישה:\n{link}\n\n🏗 AMG PERGOLA";

      const message = formatSms(template, { link });

      // 4. Send SMS
      const result = await sendSms(normalizePhone(phone), message);
      if (!result.success) {
        if (result.code === "SMS_DISABLED") throw new Error(texts.smsDisabled);
        if (result.code === "UNAUTHORIZED" || result.code === "FORBIDDEN") throw new Error(texts.unauthorized);
        throw new Error(result.error || texts.genericSendFailed);
      }

      setStatus("done");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || texts.genericSendFailed);
      setStatus("error");
    }
  };

  const handleClose = () => {
    setPhone("");
    setStatus("idle");
    setErrorMsg("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop + centering wrapper */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleClose}
          >
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">שלח עגלה ללקוח</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {items.length} מוצרים
                      {appliedCoupon ? ` · קוד: ${appliedCoupon.coupon.code}` : ""}
                    </p>
                  </div>
                </div>
                <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="px-6 py-6">
                {status === "done" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center gap-3 py-4"
                  >
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                    <div>
                      <p className="font-bold text-gray-900">נשלח בהצלחה!</p>
                      <p className="text-sm text-gray-500 mt-1">
                        הלקוח קיבל SMS עם קישור לעגלה
                      </p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="mt-2 text-sm font-semibold text-gray-900 underline underline-offset-2"
                    >
                      סגור
                    </button>
                  </motion.div>
                ) : (
                  <>
                    {/* Cart preview */}
                    <div className="mb-5 space-y-2 max-h-40 overflow-y-auto">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <img
                            src={item.product.images?.[0]}
                            alt={item.product.name[locale]}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.product.name[locale]}</p>
                            {item.options?.size && <p className="text-xs text-gray-400">{item.options.size}</p>}
                          </div>
                          <span className="text-sm font-semibold text-gray-700 shrink-0">×{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {appliedCoupon && (
                      <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
                        <span className="text-xs font-semibold text-green-700">קוד הנחה: {appliedCoupon.coupon.code}</span>
                        <span className="text-xs text-green-600">יישלח ללקוח אוטומטית</span>
                      </div>
                    )}

                    {/* Phone input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        מספר טלפון לקוח
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={phone}
                          onChange={e => setPhone(e.target.value.replace(/[^0-9\s\-]/g, ""))}
                          placeholder="050-123-4567"
                          dir="ltr"
                          className={`w-full h-12 px-4 rounded-2xl border text-sm font-medium transition-colors focus:outline-none focus:ring-2 ${
                            phone && !isValid
                              ? "border-red-300 focus:ring-red-200"
                              : "border-gray-200 focus:ring-gray-300"
                          }`}
                          onKeyDown={e => e.key === "Enter" && isValid && handleSend()}
                        />
                      </div>
                      {phone && !isValid && (
                        <p className="text-xs text-red-500">
                          מספר לא תקין — פורמט: 05X-XXXXXXX
                        </p>
                      )}
                    </div>

                    {errorMsg && (
                      <p className="text-xs text-red-500 mt-2">{errorMsg}</p>
                    )}

                    <button
                      onClick={handleSend}
                      disabled={!isValid || status === "sending"}
                      className="mt-5 w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {status === "sending" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          שלח ללקוח
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
