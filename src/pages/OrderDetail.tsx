import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Package } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useOrders } from "@/hooks/useOrders";
import { Loader2 } from "lucide-react";

const OrderDetail = () => {
  const { t, localePath, locale } = useLocale();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useOrders();
  const order = orders.find((o) => o.id === orderId);

  const ArrowIcon = locale === "he" || locale === "ar" ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <section className="mt-4 py-16">
          <div className="w-full max-w-[800px] mx-auto px-6 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold">{t("product.notFound")}</p>
            <Link to={localePath("/account")} className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground underline">
              {t("account.orders")}
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "waiting_approval": return t("account.statusWaitingApproval");
      case "in_process":       return t("account.statusInProcess");
      case "in_delivery":      return t("account.statusInDelivery");
      case "not_approved":     return t("account.statusNotApproved");
      case "cancelled":        return t("account.statusCancelled");
      case "pending":   return t("account.statusPending");
      case "confirmed": return t("account.statusConfirmed");
      case "shipped":   return t("account.statusShipped");
      case "delivered": return t("account.statusDelivered");
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "waiting_approval":
      case "pending":   return "text-amber-700 bg-amber-50 border-amber-200";
      case "in_process":
      case "confirmed": return "text-blue-700 bg-blue-50 border-blue-200";
      case "in_delivery":
      case "shipped":   return "text-purple-700 bg-purple-50 border-purple-200";
      case "delivered": return "text-green-700 bg-green-50 border-green-200";
      case "not_approved": return "text-red-700 bg-red-50 border-red-200";
      case "cancelled": return "text-gray-500 bg-gray-100 border-gray-200";
      default: return "text-muted-foreground bg-muted/20";
    }
  };

  const steps = ["waiting_approval", "in_process", "in_delivery"];
  const normalStatus = order.status === "pending" ? "waiting_approval"
    : order.status === "confirmed" ? "in_process"
    : order.status === "shipped" ? "in_delivery"
    : order.status;
  const currentStep = ["not_approved", "cancelled"].includes(normalStatus) ? -1 : steps.indexOf(normalStatus);

  return (
    <Layout>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 pb-8 md:pb-12"
      >
        <div className="w-full max-w-[800px] mx-auto px-4 md:px-6">
          {/* Back */}
          <button
            onClick={() => navigate(localePath("/account"))}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowIcon className="w-4 h-4" />
            {t("account.orders")}
          </button>

          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-lg font-bold">{t("account.orderNumber")} {order.orderNumber}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{order.date}</p>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColor(order.status)}`}>
              {statusLabel(order.status)}
            </span>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-xl border border-border p-4 mb-3">
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute top-3 inset-x-2 h-[2px] bg-border" />
              <div
                className="absolute top-3 h-[2px] bg-foreground transition-all"
                style={{
                  insetInlineStart: 8,
                  width: `calc(${(currentStep / (steps.length - 1)) * 100}% - 16px)`,
                }}
              />
              {steps.map((step, idx) => (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                    idx <= currentStep
                      ? "bg-foreground border-foreground text-background"
                      : "bg-background border-border text-muted-foreground"
                  }`}>
                    {idx <= currentStep ? "✓" : idx + 1}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 whitespace-nowrap text-center max-w-[60px] leading-tight">
                    {statusLabel(step)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-border mb-3">
            <div className="px-4 py-2.5 border-b border-border">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("cart.product")}</h2>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className={`px-4 py-3.5 flex gap-3 items-start ${idx > 0 ? "border-t border-border" : ""}`}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 rounded-lg object-cover border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">{item.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {item.color && (
                      <span className="text-[11px] text-muted-foreground">
                        {t("contractor.color")}: <span className="font-medium text-foreground">{item.color}</span>
                      </span>
                    )}
                    {item.size && (
                      <span className="text-[11px] text-muted-foreground">
                        {t("contractor.size")}: <span className="font-medium text-foreground">{item.size}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-muted-foreground">x{item.quantity}</span>
                    <span className="text-sm font-bold">
                      {t("common.currency")}{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="bg-white rounded-xl border border-border p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{t("cart.orderSummary")}</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t("cart.subtotal")}</span>
                  <span>{t("common.currency")}{order.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t("cart.shipping")}</span>
                  <span className="text-green-600 font-medium">{t("cart.complimentary")}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                  <span>{t("cart.total")}</span>
                  <span>{t("common.currency")}{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </Layout>
  );
};

export default OrderDetail;
