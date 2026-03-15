import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Package, MapPin, Phone } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useOrders } from "@/hooks/useOrders";

const OrderDetail = () => {
  const { t, localePath, locale } = useLocale();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const orders = useOrders((s) => s.orders);
  const order = orders.find((o) => o.id === orderId);

  const ArrowIcon = locale === "he" || locale === "ar" ? ArrowRight : ArrowLeft;

  if (!order) {
    return (
      <Layout>
        <section className="mt-14 md:mt-20 py-16">
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
      case "pending": return t("account.statusPending");
      case "confirmed": return t("account.statusConfirmed");
      case "shipped": return t("account.statusShipped");
      case "delivered": return t("account.statusDelivered");
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-amber-700 bg-amber-50 border-amber-200";
      case "confirmed": return "text-blue-700 bg-blue-50 border-blue-200";
      case "shipped": return "text-purple-700 bg-purple-50 border-purple-200";
      case "delivered": return "text-green-700 bg-green-50 border-green-200";
      default: return "text-muted-foreground bg-muted/20";
    }
  };

  // Progress steps
  const steps = ["pending", "confirmed", "shipped", "delivered"];
  const currentStep = steps.indexOf(order.status);

  return (
    <Layout>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 pb-8 md:pb-12"
      >
        <div className="w-full max-w-[800px] mx-auto px-6">
          {/* Back button */}
          <button
            onClick={() => navigate(localePath("/account"))}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowIcon className="w-4 h-4" />
            {t("account.orders")}
          </button>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold">{t("account.orderNumber")} {order.orderNumber}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{order.date}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${statusColor(order.status)}`}>
              {statusLabel(order.status)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-xl border border-border p-5 mb-4">
            <div className="flex items-center justify-between relative">
              {/* Line behind */}
              <div className="absolute top-3 inset-x-0 h-0.5 bg-border" />
              <div
                className="absolute top-3 h-0.5 bg-foreground transition-all"
                style={{
                  insetInlineStart: 0,
                  width: `${(currentStep / (steps.length - 1)) * 100}%`,
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
                  <span className="text-[10px] text-muted-foreground mt-1.5 whitespace-nowrap">
                    {statusLabel(step)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-border divide-y divide-border mb-4">
            <div className="px-5 py-3">
              <h2 className="text-sm font-bold">{t("cart.product")}</h2>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="px-5 py-4 flex gap-4 items-start">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {item.color && (
                      <span className="text-xs text-muted-foreground">
                        {t("contractor.color")}: {item.color}
                      </span>
                    )}
                    {item.size && (
                      <span className="text-xs text-muted-foreground">
                        {t("contractor.size")}: {item.size}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {t("cart.quantity")}: {item.quantity}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-bold shrink-0">
                  {t("common.currency")}{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Shipping address + Total */}
          <div className="grid gap-4 sm:grid-cols-2">
            {order.shippingAddress && (
              <div className="bg-white rounded-xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-bold">{t("checkout.shippingAddress")}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.shippingAddress.city}, {order.shippingAddress.street} {order.shippingAddress.houseNumber}
                  {order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ""}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{order.shippingAddress.phone}</span>
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-bold mb-3">{t("cart.orderSummary")}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t("cart.subtotal")}</span>
                  <span>{t("common.currency")}{order.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t("cart.shipping")}</span>
                  <span>{t("cart.complimentary")}</span>
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
