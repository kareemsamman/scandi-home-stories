import { useState, useRef, useEffect } from "react";
import { useTranzilaSettings } from "@/hooks/useAppSettings";
import { useLocale } from "@/i18n/useLocale";
import { CreditCard, Loader2, AlertCircle, Lock } from "lucide-react";

interface Props {
  amount: number; // total in ILS (agorot handled internally)
  orderNumber: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (response: { transactionId: string; confirmationCode: string }) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const TranzilaPayment = ({ amount, orderNumber, customerEmail, customerPhone, onSuccess, onError, disabled }: Props) => {
  const { data: settings } = useTranzilaSettings();
  const { t, locale } = useLocale();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  if (!settings?.enabled || !settings.terminal_name) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-700">
          {locale === "ar" ? "بوابة الدفع غير مفعلة حالياً" : "שער התשלום אינו פעיל כרגע"}
        </p>
      </div>
    );
  }

  // Build iframe URL with parameters
  const amountInAgorot = Math.round(amount * 100) / 100; // Tranzila expects amount in ILS with decimals
  const iframeUrl = `https://direct.tranzila.com/${settings.terminal_name}/iframenew.php?` +
    `sum=${amountInAgorot}&` +
    `currency=1&` + // 1 = ILS
    `lang=${locale === "ar" ? "ar" : "il"}&` +
    `orderid=${orderNumber}&` +
    `contact=${encodeURIComponent(customerEmail || "")}&` +
    `phone=${encodeURIComponent(customerPhone || "")}&` +
    `nologo=1&` +
    `trButtonColor=111111&` +
    `buttonLabel=${encodeURIComponent(locale === "ar" ? "ادفع الآن" : "שלם עכשיו")}&` +
    `fail_url_address=${encodeURIComponent(window.location.origin + "/checkout?payment=failed")}&` +
    `notify_url_address=${encodeURIComponent(window.location.origin + "/api/tranzila-webhook")}`;

  // Listen for postMessage from Tranzila iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Tranzila sends payment result via postMessage
      if (event.data && typeof event.data === "object") {
        const data = event.data;
        if (data.Response === "000" || data.response === "000") {
          // Success
          onSuccess({
            transactionId: data.ConfirmationCode || data.index || data.transaction_id || "",
            confirmationCode: data.ConfirmationCode || data.auth_number || "",
          });
        } else if (data.Response || data.response) {
          // Error
          onError(data.error_msg || data.ErrorMessage || `Payment failed (code: ${data.Response || data.response})`);
        }
        setProcessing(false);
      }
      // Some Tranzila versions send string messages
      if (typeof event.data === "string") {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.Response === "000") {
            onSuccess({ transactionId: parsed.ConfirmationCode || "", confirmationCode: parsed.ConfirmationCode || "" });
          } else if (parsed.Response) {
            onError(parsed.ErrorMessage || `Payment failed`);
          }
          setProcessing(false);
        } catch { /* not JSON, ignore */ }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess, onError]);

  return (
    <div className="space-y-4">
      {/* Secure badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock className="w-3.5 h-3.5" />
        <span>{locale === "ar" ? "دفع آمن عبر Tranzila" : "תשלום מאובטח דרך Tranzila"}</span>
      </div>

      {/* iframe container */}
      <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm" style={{ minHeight: 420 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
              <p className="text-sm text-gray-500">
                {locale === "ar" ? "جارٍ تحميل نموذج الدفع..." : "טוען טופס תשלום..."}
              </p>
            </div>
          </div>
        )}

        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-20">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm text-gray-700 font-medium">
                {locale === "ar" ? "جارٍ معالجة الدفع..." : "מעבד תשלום..."}
              </p>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="w-full border-0"
          style={{ height: 420 }}
          onLoad={() => setLoading(false)}
          title="Tranzila Payment"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>

      {/* Amount display */}
      <div className="text-center">
        <p className="text-lg font-bold text-gray-900">
          {locale === "ar" ? "المبلغ المطلوب" : "סכום לתשלום"}: ₪{amount.toLocaleString()}
        </p>
      </div>

      {/* Payment methods */}
      <div className="flex items-center justify-center gap-4 opacity-60">
        <CreditCard className="w-6 h-6 text-gray-400" />
        <span className="text-[10px] text-gray-400">Visa • Mastercard • Isracard • Amex</span>
      </div>
    </div>
  );
};
