import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useCouponStore } from "@/hooks/useCoupons";
import { useLocale } from "@/i18n/useLocale";
import { supabase } from "@/integrations/supabase/client";
import { saveCompletedTranzilaOrder, loadPendingTranzilaOrder, clearPendingTranzilaOrder } from "@/lib/tranzilaPending";

const TranzilaReturn = () => {
  const navigate = useNavigate();
  const { locale, localePath } = useLocale();
  const clearCart = useCart((s) => s.clearCart);
  const removeCoupon = useCouponStore((s) => s.remove);
  const attemptedRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("");

  const params = useMemo(() => {
    const collected = new URLSearchParams(window.location.search);

    try {
      const fullUrl = window.location.href;
      const encodedIdx = fullUrl.toLowerCase().indexOf("%3f");
      if (encodedIdx !== -1) {
        const decodedTail = decodeURIComponent(fullUrl.substring(encodedIdx + 3));
        new URLSearchParams(decodedTail).forEach((value, key) => {
          if (!collected.has(key)) collected.set(key, value);
        });
      }
    } catch {
      // ignore malformed encoded redirect payloads
    }

    return collected;
  }, []);

  useEffect(() => {
    // If this page is rendered inside the Tranzila iframe, break out to the top window
    // so the whole checkout page is replaced, not just the iframe area.
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = window.location.href;
        return;
      }
    } catch {
      // Cross-origin access blocked — fall through and finalize here as best we can.
    }

    if (attemptedRef.current) return;
    attemptedRef.current = true;

    const finalize = async () => {
      const code = params.get("Response") || params.get("response") || "";
      const transactionId = params.get("ConfirmationCode") || params.get("index") || "";
      const pending = loadPendingTranzilaOrder();

      if (code !== "000") {
        setStatus("failed");
        setMessage(locale === "ar" ? "فشل الدفع أو تم إلغاؤه." : "התשלום נכשל או בוטל.");
        return;
      }

      if (!pending) {
        setStatus("failed");
        setMessage(locale === "ar" ? "لا توجد بيانات طلب لإكمال العملية." : "לא נמצאו פרטי הזמנה להשלמת התהליך.");
        return;
      }

      try {
        const orderDate = new Date().toLocaleDateString(locale === "he" ? "he-IL" : "ar-SA");
        const { data, error } = await supabase.functions.invoke("create-order", {
          body: {
            orderNumber: pending.orderNumber,
            notes: pending.notes,
            firstName: pending.firstName,
            lastName: pending.lastName,
            email: pending.email,
            phone: pending.phone,
            city: pending.city,
            address: pending.address,
            house_number: pending.house_number,
            apartment: pending.apartment,
            locale: pending.locale,
            origin: pending.origin,
            shippingCost: pending.shippingCost,
            discountCode: pending.discountCode,
            adminDiscount: pending.adminDiscount,
            payment_status: "paid",
            transaction_id: transactionId,
            items: pending.items,
          },
        });

        if (error) throw error;

        clearPendingTranzilaOrder();
        clearCart();
        removeCoupon();

        saveCompletedTranzilaOrder({
          orderNumber: pending.orderNumber,
          total: data?.total ?? pending.expectedTotal,
          date: orderDate,
          orderId: data?.orderId,
          phone: pending.phone,
          isGuest: pending.isGuest,
          firstName: pending.firstName,
          lastName: pending.lastName,
          email: pending.email || "",
        });

        setStatus("success");
        navigate(localePath("/checkout/thank-you"), { replace: true });
      } catch (err) {
        console.error("Tranzila return finalize error:", err);
        setStatus("failed");
        setMessage(locale === "ar" ? "تم الدفع لكن تعذر إكمال إنشاء الطلب. حاول مرة أخرى أو تواصل معنا." : "התשלום בוצע אך לא הצלחנו להשלים את יצירת ההזמנה. נסו שוב או צרו קשר.");
      }
    };

    void finalize();
  }, [params, navigate, localePath, locale, clearCart, removeCoupon]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-border bg-card rounded-lg p-8 text-center space-y-4 shadow-sm">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "جارٍ إكمال عملية الدفع..." : "משלים את התשלום..."}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "تم الدفع بنجاح، يتم تحويلك الآن." : "התשלום הצליח, מעבירים אותך עכשיו."}
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="w-10 h-10 mx-auto text-destructive" />
            <p className="text-sm text-muted-foreground">{message}</p>
            <Link
              to={localePath("/checkout")}
              className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-4 transition-colors"
            >
              {locale === "ar" ? "العودة للدفع" : "חזרה לתשלום"}
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default TranzilaReturn;