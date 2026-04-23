import { useState, useRef, useEffect } from "react";
import { useTranzilaSettings } from "@/hooks/useAppSettings";
import { useLocale } from "@/i18n/useLocale";
import { CreditCard, Loader2, AlertCircle, Lock, XCircle } from "lucide-react";

interface Props {
  amount: number;
  orderNumber: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (response: { transactionId: string; confirmationCode: string }) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const TranzilaPayment = ({ amount, orderNumber, customerEmail, customerPhone, onSuccess, onError, disabled }: Props) => {
  const { data: settings } = useTranzilaSettings();
  const { locale } = useLocale();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [failureMessage, setFailureMessage] = useState<string>("");
  const [iframeKey, setIframeKey] = useState(0);

  // Load Tranzila's Apple Pay helper script on the parent page.
  // Apple Pay runs on the parent window (not inside the iframe) because
  // ApplePaySession requires same-origin execution.
  useEffect(() => {
    if (!settings?.enabled) return;
    if (document.querySelector('script[data-tranzila-apple="1"]')) return;

    const jq = document.createElement("script");
    jq.src = "https://direct.tranzila.com/Tranzila_files/jquery.js";
    jq.async = false;
    jq.dataset.tranzilaApple = "1";

    jq.onload = () => {
      const ap = document.createElement("script");
      ap.src = `https://direct.tranzila.com/js/tranzilanapple_v3.js?v=${Date.now()}`;
      ap.async = false;
      ap.dataset.tranzilaApple = "1";
      ap.onload = () => {
        try {
          const w = window as unknown as { jQuery?: { noConflict: (removeAll?: boolean) => unknown }; $n?: unknown };
          if (w.jQuery && typeof w.jQuery.noConflict === "function") {
            w.$n = w.jQuery.noConflict(true);
          }
        } catch { /* ignore */ }
      };
      document.head.appendChild(ap);
    };

    document.head.appendChild(jq);
  }, [settings?.enabled]);

  // Listen for postMessage from Tranzila iframe (direct or via bridge page)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const raw = event.data;
      let data: any = null;
      if (raw && typeof raw === "object") data = raw;
      else if (typeof raw === "string") {
        try { data = JSON.parse(raw); } catch { return; }
      }
      if (!data) return;

      const code = data.Response ?? data.response;
      if (code == null && !data.__tranzilaBridge) return;

      if (code === "000" || code === "succeeded") {
        setStatus("success");
        onSuccess({
          transactionId: data.ConfirmationCode || data.index || data.transaction_id || "",
          confirmationCode: data.ConfirmationCode || data.auth_number || "",
        });
      } else {
        const msg = data.error_msg || data.ErrorMessage || (code ? `Payment failed (code: ${code})` : "Payment failed");
        setStatus("failed");
        setFailureMessage(msg);
        onError(msg);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess, onError]);

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

  const amountValue = Math.round(amount * 100) / 100;
  const bridgeUrl = window.location.origin + "/tranzila-bridge.html";

  const iframeUrl = `https://direct.tranzila.com/${settings.terminal_name}/iframenew.php?` +
    `sum=${amountValue}&` +
    `currency=1&` +
    `lang=${locale === "ar" ? "ar" : "il"}&` +
    `orderid=${orderNumber}&` +
    `contact=${encodeURIComponent(customerEmail || "")}&` +
    `phone=${encodeURIComponent(customerPhone || "")}&` +
    `nologo=1&` +
    `trButtonColor=111111&` +
    `buttonLabel=${encodeURIComponent(locale === "ar" ? "ادفع الآن" : "שלם עכשיו")}` +
    `&bit=1&applepay=1&googlepay=1` +
    `&success_url_address=${encodeURIComponent(bridgeUrl)}` +
    `&fail_url_address=${encodeURIComponent(bridgeUrl)}` +
    `&notify_url_address=${encodeURIComponent(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/tranzila-webhook`)}`;

  const retry = () => {
    setStatus("idle");
    setFailureMessage("");
    setLoading(true);
    setIframeKey(k => k + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock className="w-3.5 h-3.5" />
        <span>{locale === "ar" ? "دفع آمن عبر Tranzila" : "תשלום מאובטח דרך Tranzila"}</span>
      </div>

      <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm" style={{ minHeight: 420 }}>
        {status === "success" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-30">
            <div className="text-center space-y-3 px-6">
              <Loader2 className="w-10 h-10 animate-spin text-gray-700 mx-auto" />
              <p className="text-sm font-medium text-gray-800">
                {locale === "ar" ? "تم الدفع بنجاح، جارٍ إنشاء الطلب..." : "התשלום בוצע בהצלחה, יוצר הזמנה..."}
              </p>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-30">
            <div className="text-center space-y-4 px-6 max-w-sm">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-base font-bold text-gray-900">
                {locale === "ar" ? "فشل الدفع" : "התשלום נכשל"}
              </p>
              {failureMessage && (
                <p className="text-sm text-gray-600">{failureMessage}</p>
              )}
              <button
                onClick={retry}
                className="px-6 h-11 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
              >
                {locale === "ar" ? "إعادة المحاولة" : "נסה שוב"}
              </button>
            </div>
          </div>
        )}

        {status === "idle" && loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
              <p className="text-sm text-gray-500">
                {locale === "ar" ? "جارٍ تحميل نموذج الدفع..." : "טוען טופס תשלום..."}
              </p>
            </div>
          </div>
        )}

        {status === "idle" && (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={iframeUrl}
            className="w-full border-0"
            style={{ height: 420 }}
            onLoad={() => setLoading(false)}
            title="Tranzila Payment"
            allow="payment *; publickey-credentials-get *"
          />
        )}
      </div>

      <div className="text-center space-y-3">
        <p className="text-lg font-bold text-gray-900">
          {locale === "ar" ? "المبلغ المطلوب" : "סכום לתשלום"}: ₪{amount.toLocaleString()}
        </p>
        {status === "idle" && (
          <button
            type="button"
            onClick={retry}
            className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-4 transition-colors"
          >
            {locale === "ar"
              ? "هل فشل الدفع؟ أعد تحميل النموذج"
              : "התשלום נכשל? טען מחדש את הטופס"}
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 opacity-60">
        <CreditCard className="w-5 h-5 text-gray-400" />
        <span className="text-[10px] text-gray-400">
          Visa • Mastercard • Isracard • Amex • Bit • Apple Pay • Google Pay
        </span>
      </div>
    </div>
  );
};
