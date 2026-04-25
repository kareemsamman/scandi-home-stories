import { useState, useEffect } from "react";
import { useTranzilaSettings } from "@/hooks/useAppSettings";
import { useLocale } from "@/i18n/useLocale";
import { supabase } from "@/integrations/supabase/client";
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

const TRANZILA_REASONS: Record<string, string> = {
  "001": "Card blocked / refer to issuer",
  "002": "Stolen card",
  "003": "Contact credit company",
  "004": "Refused",
  "005": "Forged card",
  "033": "Card expired",
  "036": "Card restricted",
  "057": "Transaction not allowed for card",
  "200": "Authorization required",
  "461": "Wrong CVV",
  "562": "Invalid card data",
};

const requiresDirectUserTap = () => {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;
  const isAppleDevice = /iPad|iPhone|iPod|Macintosh/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Chromium|Android/i.test(ua);

  return isAppleDevice && isSafari;
};

export const TranzilaPayment = ({
  amount,
  orderNumber,
  customerEmail,
  customerPhone,
  onSuccess,
  onError,
}: Props) => {
  const { data: settings } = useTranzilaSettings();
  const { locale } = useLocale();
  const [status, setStatus] = useState<"idle" | "preparing" | "processing" | "success" | "failed">("preparing");
  const [failureMessage, setFailureMessage] = useState<string>("");
  const [reloadKey, setReloadKey] = useState(0);
  const [thtk, setThtk] = useState<string | null>(null);
  const [handshakeError, setHandshakeError] = useState<string>("");

  useEffect(() => {
    if (!settings?.enabled || !settings?.terminal_name) return;

    let cancelled = false;
    setStatus("preparing");
    setHandshakeError("");
    setThtk(null);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("tranzila-handshake", {
          body: { sum: Math.round(amount * 100) / 100, currency: 1 },
        });

        if (cancelled) return;

        if (error || !data?.thtk) {
          const msg =
            (data && (data.message || data.error)) ||
            error?.message ||
            "Handshake failed";

          console.error("Tranzila handshake error:", msg, data);
          setHandshakeError(String(msg));
          setStatus("failed");
          setFailureMessage(
            locale === "ar"
              ? "تعذّر تحضير صفحة الدفع. حاول مرة أخرى."
              : "אירעה שגיאה בהכנת דף התשלום. נסה שוב."
          );
          return;
        }

        setThtk(String(data.thtk));
        setStatus("idle");
      } catch (e) {
        if (cancelled) return;
        console.error("Tranzila handshake exception:", e);
        setStatus("failed");
        setFailureMessage(
          locale === "ar"
            ? "تعذّر الاتصال بخادم الدفع."
            : "שגיאה בחיבור לשרת התשלומים."
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, amount, settings?.enabled, settings?.terminal_name, locale]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const raw = event.data;
      let data: Record<string, unknown> | null = null;

      if (raw && typeof raw === "object") data = raw as Record<string, unknown>;
      else if (typeof raw === "string") {
        try {
          data = JSON.parse(raw);
        } catch {
          return;
        }
      }

      if (!data) return;

      const looksLikeTranzila =
        data.__tranzilaBridge === true ||
        "Response" in data ||
        "response" in data ||
        "ConfirmationCode" in data;

      if (!looksLikeTranzila) return;

      console.log("Tranzila parent message:", data);

      const code = String((data.Response ?? data.response ?? "") as string);
      const hasAnyTranzilaField =
        "Response" in data ||
        "response" in data ||
        "ConfirmationCode" in data ||
        "ConfirmationCode " in data ||
        "index" in data ||
        "TranzilaTK" in data ||
        "error_msg" in data ||
        "ErrorMessage" in data;

      if (data.__tranzilaBridge === true && !hasAnyTranzilaField) {
        console.warn(
          "Tranzila bridge received empty payload — terminal Return Method is likely set to POST. Switch it to GET in the Tranzila admin panel."
        );
        return;
      }

      const isSuccess = code === "000" || data.Response === "succeeded";

      if (isSuccess) {
        setStatus("success");
        onSuccess({
          transactionId: String(
            data.ConfirmationCode || data.index || data.transaction_id || ""
          ),
          confirmationCode: String(
            data.ConfirmationCode || data.auth_number || ""
          ),
        });
      } else {
        const reason =
          (code && TRANZILA_REASONS[code]) ||
          (data.error_msg as string) ||
          (data.ErrorMessage as string) ||
          (data.errormsg as string) ||
          "";
        const codeLabel = code ? ` (${locale === "ar" ? "رمز" : "קוד"}: ${code})` : "";
        const msg = reason
          ? `${reason}${codeLabel}`
          : (locale === "ar" ? "فشل الدفع" : "התשלום נכשל") + codeLabel;
        setStatus("failed");
        setFailureMessage(msg);
        onError(msg);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess, onError, locale]);

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
  const returnUrl = `${window.location.origin}/${locale}/checkout/tranzila-return`;
  const notifyUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/tranzila-webhook`;
  const actionUrl = `https://direct.tranzila.com/${settings.terminal_name}/iframenew.php`;
  const needsTapToOpen = requiresDirectUserTap();

  const paymentParams = new URLSearchParams({
    sum: String(amountValue),
    currency: "1",
    cred_type: "1",
    tranmode: "AK",
    lang: locale === "ar" ? "ar" : "il",
    orderid: orderNumber,
    contact: customerEmail || "",
    phone: customerPhone || "",
    bit_pay: "1",
    google_pay: "1",
    applepay: "1",
    u71: "1",
    hidesignup: "1",
    new_process: "1",
    thtk: thtk || "",
    buttonLabel: locale === "ar" ? "ادفع الآن" : "שלם עכשיו",
    success_url_address: returnUrl,
    fail_url_address: returnUrl,
    notify_url_address: notifyUrl,
  });

  const paymentUrl = `${actionUrl}?${paymentParams.toString()}`;

  useEffect(() => {
    if (status !== "idle" || !thtk) return;
    if (needsTapToOpen) return;

    setStatus("processing");
    window.location.assign(paymentUrl);
  }, [status, thtk, needsTapToOpen, paymentUrl]);

  const retry = () => {
    setStatus("preparing");
    setFailureMessage("");
    setHandshakeError("");
    setThtk(null);
    setReloadKey((k) => k + 1);
  };

  const openPaymentPage = () => {
    if (disabled || status !== "idle" || !thtk) return;
    setStatus("processing");
    window.location.assign(paymentUrl);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock className="w-3.5 h-3.5" />
        <span>{locale === "ar" ? "دفع آمن عبر Tranzila" : "תשלום מאובטח דרך Tranzila"}</span>
      </div>

      <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm min-h-[280px] flex items-center justify-center">
        {status === "failed" ? (
          <div className="text-center space-y-4 px-6 max-w-sm py-10">
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-base font-bold text-gray-900">
              {locale === "ar" ? "فشل الدفع" : "התשלום נכשל"}
            </p>
            {failureMessage && (
              <p className="text-sm text-gray-600 whitespace-pre-line">{failureMessage}</p>
            )}
            {handshakeError && (
              <p className="text-[11px] text-gray-400 break-words">{handshakeError}</p>
            )}
            <button
              onClick={retry}
              className="px-6 h-11 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
            >
              {locale === "ar" ? "إعادة المحاولة" : "נסה שוב"}
            </button>
          </div>
        ) : status === "idle" && thtk && needsTapToOpen ? (
          <div className="text-center space-y-4 px-6 max-w-sm py-10">
            <p className="text-sm text-gray-500">
              {locale === "ar"
                ? "تابع إلى صفحة الدفع المباشرة"
                : "המשך לדף התשלום הישיר"}
            </p>
            <button
              type="button"
              onClick={openPaymentPage}
              disabled={disabled}
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {locale === "ar" ? "الانتقال לתשלום" : "המשך לתשלום"}
            </button>
          </div>
        ) : (
          <div className="text-center space-y-3 py-10 px-6">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            <p className="text-sm text-gray-500">
              {status === "preparing"
                ? locale === "ar"
                  ? "جارٍ تحضير صفحة الدفع الآمن..."
                  : "מכינים את דף התשלום המאובטח..."
                : locale === "ar"
                  ? "جارٍ تحويلك إلى صفحة الدفع الآمن..."
                  : "מעבירים אותך לדף התשלום המאובטח..."}
            </p>
          </div>
        )}
      </div>

      <div className="text-center space-y-3">
        <p className="text-lg font-bold text-gray-900">
          {locale === "ar" ? "المبلغ المطلوب" : "סכום לתשלום"}: ₪{amount.toLocaleString()}
        </p>
        {(status === "idle" || status === "preparing") && (
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
