import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, Ban, MapPin, ShieldAlert, LogOut } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const OrderDetail = () => {
  const { t, localePath, locale } = useLocale();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: orders = [], isLoading } = useOrders();
  const orderFromList = orders.find((o) => o.id === orderId);
  const [directOrder, setDirectOrder] = useState<any>(null);
  const [directLoading, setDirectLoading] = useState(false);
  const order = orderFromList || directOrder;

  const [ownershipStatus, setOwnershipStatus] = useState<"loading" | "owner" | "wrong_user" | "not_found">("loading");
  const [maskedEmail, setMaskedEmail] = useState<string>("");

  useEffect(() => {
    if (isLoading) return;
    if (orderFromList) {
      setOwnershipStatus("owner");
      return;
    }
    if (!orderId) { setOwnershipStatus("not_found"); return; }

    // Try fetching the order directly by ID (covers stale cache after fresh order)
    setDirectLoading(true);
    (supabase as any)
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .maybeSingle()
      .then(({ data: o }: { data: any }) => {
        setDirectLoading(false);
        if (o && (o.user_id === user?.id || !o.user_id)) {
          const mapped = {
            id: o.id,
            orderNumber: o.order_number,
            date: new Date(o.created_at).toLocaleDateString("he-IL"),
            total: Number(o.total),
            discountAmount: Number(o.discount_amount || 0),
            shippingCost: Number(o.shipping_cost || 0),
            status: o.status,
            notes: o.notes || undefined,
            receiptUrl: o.receipt_url || undefined,
            locale: o.locale || "he",
            city: o.city || undefined,
            address: o.address || undefined,
            houseNumber: o.house_number || undefined,
            apartment: o.apartment || undefined,
            firstName: o.first_name || undefined,
            lastName: o.last_name || undefined,
            phone: o.phone || undefined,
            items: (o.order_items || []).map((item: any) => ({
              name: item.product_name,
              image: item.product_image,
              price: Number(item.price),
              quantity: item.quantity,
              size: item.size || undefined,
              color: item.color_name || undefined,
            })),
          };
          setDirectOrder(mapped);
          setOwnershipStatus("owner");
        } else if (o && o.user_id && o.user_id !== user?.id && user) {
          // Belongs to someone else
          supabase.rpc("get_order_owner_hint", { p_order_id: orderId }).then(({ data }) => {
            if (data && typeof data === "object" && "status" in (data as any)) {
              const result = data as { status: string; masked_email?: string };
              if (result.status === "wrong_user") {
                setOwnershipStatus("wrong_user");
                setMaskedEmail(result.masked_email || "");
              } else {
                setOwnershipStatus("not_found");
              }
            } else {
              setOwnershipStatus("not_found");
            }
          });
        } else {
          setOwnershipStatus("not_found");
        }
      });
  }, [isLoading, orderFromList, orderId, user]);

  const ArrowIcon = locale === "he" || locale === "ar" ? ArrowRight : ArrowLeft;

  if (isLoading || directLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (ownershipStatus === "loading") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (ownershipStatus === "wrong_user") {
    const handleSwitchAccount = async () => {
      await signOut();
      navigate(localePath(`/login?redirect=${encodeURIComponent(localePath(`/account/order/${orderId}`))}`));
    };
    return (
      <Layout>
        <section className="mt-4 py-16">
          <div className="w-full max-w-[400px] mx-auto px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-lg font-bold mb-2">
              {locale === "ar" ? "هذا الطلب لا يخصك" : "ההזמנה הזו לא שייכת לחשבון שלך"}
            </h2>
            <p className="text-sm text-muted-foreground mb-1">
              {locale === "ar" ? "الطلب مرتبط بالحساب:" : "ההזמנה שייכת לחשבון:"}
            </p>
            <p className="text-sm font-semibold text-foreground mb-6 direction-ltr" dir="ltr">
              {maskedEmail}
            </p>
            <Button onClick={handleSwitchAccount} variant="default" className="w-full gap-2">
              <LogOut className="w-4 h-4" />
              {locale === "ar" ? "تسجيل دخول بحساب آخر" : "התחבר עם חשבון אחר"}
            </Button>
            <button
              onClick={() => navigate(localePath("/"))}
              className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground underline"
            >
              {locale === "ar" ? "العودة للصفحة الرئيسية" : "חזרה לדף הבית"}
            </button>
          </div>
        </section>
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
      case "pending":   return t("account.statusWaitingApproval");
      case "confirmed": return t("account.statusInProcess");
      case "shipped":   return t("account.statusInDelivery");
      case "delivered": return t("account.statusInDelivery");
      default: return status;
    }
  };

  const statusStyle = (status: string): { bg: string; text: string; border: string; icon: React.ReactNode } => {
    switch (status) {
      case "waiting_approval":
      case "pending":
        return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: <Clock className="w-3.5 h-3.5" /> };
      case "in_process":
      case "confirmed":
        return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: <Package className="w-3.5 h-3.5" /> };
      case "in_delivery":
      case "shipped":
        return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: <Truck className="w-3.5 h-3.5" /> };
      case "delivered":
        return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
      case "not_approved":
        return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: <XCircle className="w-3.5 h-3.5" /> };
      case "cancelled":
        return { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200", icon: <Ban className="w-3.5 h-3.5" /> };
      default:
        return { bg: "bg-muted/20", text: "text-muted-foreground", border: "border-border", icon: null };
    }
  };

  const steps = ["waiting_approval", "in_process", "in_delivery"];
  const normalStatus = order.status === "pending" ? "waiting_approval"
    : order.status === "confirmed" ? "in_process"
    : order.status === "shipped" || order.status === "delivered" ? "in_delivery"
    : order.status;
  const isFailed = ["not_approved", "cancelled"].includes(normalStatus);
  const currentStep = isFailed ? -1 : steps.indexOf(normalStatus);

  const stepIcons = [
    <Clock className="w-3.5 h-3.5" />,
    <Package className="w-3.5 h-3.5" />,
    <Truck className="w-3.5 h-3.5" />,
  ];

  // Compute financials
  const itemsSubtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost = order.shippingCost ?? Math.max(0, order.total - itemsSubtotal + order.discountAmount);
  const st = statusStyle(order.status);

  return (
    <Layout>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-muted/30 min-h-screen pb-12"
      >
        <div className="w-full max-w-[680px] mx-auto px-4 md:px-6 pt-6">
          {/* Back */}
          <button
            onClick={() => navigate(localePath("/account"))}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowIcon className="w-4 h-4" />
            {t("account.orders")}
          </button>

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">{t("account.orderNumber")} {order.orderNumber}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{order.date}</p>
            </div>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
              {st.icon}
              {statusLabel(order.status)}
            </span>
          </div>

          {/* Progress stepper */}
          {!isFailed ? (
            <div className="bg-white rounded-2xl border border-border p-5 mb-3 shadow-sm">
              <div className="flex items-start justify-between relative">
                {/* Track line */}
                <div className="absolute top-4 inset-x-8 h-[2px] bg-border" />
                <div
                  className="absolute top-4 h-[2px] bg-foreground transition-all duration-500"
                  style={{
                    insetInlineStart: 32,
                    width: currentStep <= 0 ? 0 : `calc(${(currentStep / (steps.length - 1)) * 100}% - 64px)`,
                  }}
                />
                {steps.map((step, idx) => {
                  const done = idx < currentStep;
                  const active = idx === currentStep;
                  return (
                    <div key={step} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        done
                          ? "bg-foreground border-foreground text-background"
                          : active
                          ? "bg-foreground border-foreground text-background ring-4 ring-foreground/10"
                          : "bg-background border-border text-muted-foreground"
                      }`}>
                        {done ? <CheckCircle2 className="w-4 h-4" /> : stepIcons[idx]}
                      </div>
                      <span className={`text-[10px] font-medium text-center leading-tight max-w-[64px] ${active ? "text-foreground" : "text-muted-foreground"}`}>
                        {statusLabel(step)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={`rounded-2xl border p-4 mb-3 flex items-center gap-3 ${st.bg} ${st.border}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${st.bg} ${st.text} border ${st.border}`}>
                {st.icon}
              </div>
              <p className={`text-sm font-semibold ${st.text}`}>{statusLabel(order.status)}</p>
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-2xl border border-border shadow-sm mb-3 overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/20">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("cart.product")}</h2>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className={`px-5 py-4 flex gap-4 items-start ${idx > 0 ? "border-t border-border" : ""}`}>
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0 bg-muted/20">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-foreground leading-snug mb-2">{item.name}</p>
                  {item.color && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">{t("contractor.color")}:</span>
                      <span className="text-[11px] font-bold text-foreground">{item.color}</span>
                    </div>
                  )}
                  {item.size && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[11px] font-semibold text-muted-foreground">{locale === "ar" ? "الطول" : "אורך"}:</span>
                      <span className="text-[11px] font-bold text-foreground">{item.size}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">×{item.quantity}</span>
                    <span className="text-sm font-bold text-foreground">
                      {t("common.currency")}{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shipping address */}
          {(order.city || order.address) && (
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-3">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{locale === "ar" ? "عنوان الشحن" : "כתובת למשלוח"}</h3>
              </div>
              <div className="text-sm space-y-0.5">
                {(order.firstName || order.lastName) && (
                  <p className="font-semibold text-foreground">{order.firstName} {order.lastName}</p>
                )}
                {order.city && <p className="text-muted-foreground">{order.city}</p>}
                {order.address && (
                  <p className="text-muted-foreground">{order.address}{order.houseNumber ? ` ${order.houseNumber}` : ""}{order.apartment ? `, ${order.apartment}` : ""}</p>
                )}
                {order.phone && <p className="text-muted-foreground">{order.phone}</p>}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{t("cart.orderSummary")}</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                <span className="font-medium">{t("common.currency")}{itemsSubtotal.toLocaleString()}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">{t("checkout.discountAppliedLabel")}</span>
                  <span className="font-semibold text-green-700">-{t("common.currency")}{order.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("cart.shipping")}</span>
                {shippingCost === 0
                  ? <span className="font-medium text-green-600">{t("cart.complimentary")}</span>
                  : <span className="font-medium">{t("common.currency")}{shippingCost.toLocaleString()}</span>
                }
              </div>
              <div className="flex justify-between text-sm font-bold pt-3 border-t border-border">
                <span>{t("cart.total")}</span>
                <span className="text-base">{t("common.currency")}{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </Layout>
  );
};

export default OrderDetail;
