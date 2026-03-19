import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import logoWhite from "@/assets/logo-white.png";

const CheckoutThankYou = () => {
  const { t, localePath } = useLocale();
  const location = useLocation();
  const state = (location.state as { orderNumber?: string; total?: number; date?: string; orderId?: string }) || {};
  const orderNumber = state.orderNumber || "#00000";
  const orderId = state.orderId;
  const total = state.total ?? 0;
  const date = state.date || new Date().toLocaleDateString();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "rgb(242,242,242)" }}>
      {/* Header */}
      <header className="sticky top-0 z-30" style={{ backgroundColor: "rgb(242,242,242)", borderBottom: "1px solid rgb(210,210,210)" }}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 md:px-10" style={{ height: 76 }}>
          <Link to={localePath("/")} className="flex items-center">
            <img src={logoWhite} alt="AMG Pergola" className="h-12 md:h-14 invert" />
          </Link>
        </div>
      </header>

      <motion.main
        className="flex items-center justify-center px-6 py-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-lg bg-white rounded-xl border border-border shadow-sm p-8 text-center space-y-6">
          {/* Success icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-foreground mb-2">{t("thankYou.title")}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("thankYou.receiptReceived")}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              {t("thankYou.underReview")}
            </p>
          </div>

          {/* Order details */}
          <div className="bg-muted/20 rounded-lg p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("thankYou.orderNumber")}</span>
              <span className="font-bold text-foreground">{orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("cart.total")}</span>
              <span className="font-bold text-foreground">{t("common.currency")}{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("thankYou.orderDate")}</span>
              <span className="font-bold text-foreground">{date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("thankYou.status")}</span>
              <span className="font-semibold text-amber-600">{t("thankYou.pendingVerification")}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              to={localePath("/")}
              className="w-full h-12 flex items-center justify-center text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors"
            >
              {t("thankYou.backToHome")}
            </Link>
            <Link
              to={orderId ? localePath(`/account/order/${orderId}`) : localePath("/account")}
              className="w-full h-12 flex items-center justify-center text-sm font-semibold border border-foreground text-foreground rounded-[1.875rem] hover:bg-foreground hover:text-background transition-colors"
            >
              {t("thankYou.viewOrder")}
            </Link>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default CheckoutThankYou;
