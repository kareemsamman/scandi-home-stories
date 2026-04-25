import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, ChevronDown } from "lucide-react";
import { Layout } from "@/components/Layout";
import { QuantitySelector } from "@/components/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { getLocaleText } from "@/data/products";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CouponInput } from "@/components/CouponInput";
import { useCouponStore } from "@/hooks/useCoupons";
import { useCartInventory } from "@/hooks/useCartInventory";
import { SEOHead } from '@/components/SEOHead';
import { useVatSettings } from "@/hooks/useAppSettings";
import { calculateVat } from "@/lib/vat";
import { FreeShippingBar } from "@/components/FreeShippingBar";
import { useShippingSettings } from "@/hooks/useShippingSettings";

/* ── Lock icon for checkout button ── */
const LockIcon = () => (
  <svg role="presentation" fill="none" focusable="false" strokeWidth="2" width="18" height="18" viewBox="0 0 24 24">
    <path d="M3.236 18.182a5.071 5.071 0 0 0 4.831 4.465 114.098 114.098 0 0 0 7.865-.001 5.07 5.07 0 0 0 4.831-4.464 23.03 23.03 0 0 0 .165-2.611c0-.881-.067-1.752-.165-2.61a5.07 5.07 0 0 0-4.83-4.465c-1.311-.046-2.622-.07-3.933-.069a109.9 109.9 0 0 0-3.933.069 5.07 5.07 0 0 0-4.83 4.466 23.158 23.158 0 0 0-.165 2.609c0 .883.067 1.754.164 2.61Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" />
    <path d="M17 8.43V6.285A5 5 0 0 0 7 6.286V8.43" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 17.714a2.143 2.143 0 1 0 0-4.286 2.143 2.143 0 0 0 0 4.286Z" stroke="currentColor" />
  </svg>
);

const Cart = () => {
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const getSubtotal = useCart((s) => s.getSubtotal);
  const getItemKey = useCart((s) => s.getItemKey);
  const { t, locale, localePath } = useLocale();
  const subtotal = getSubtotal();
  const { getStockMax } = useCartInventory(items);
  const { applied: appliedCoupon } = useCouponStore();
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const { data: vatSettings } = useVatSettings();
  const vatConfig = vatSettings ?? { enabled: true, rate: 18 };
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const vatAmount = calculateVat(discountedSubtotal, vatConfig);
  const total = discountedSubtotal + vatAmount;
  const [shippingOpen, setShippingOpen] = useState(false);

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <Layout>
      <SEOHead noIndex={true} title="סל קניות | AMG Pergola" description="" />
        <div className="section-container py-28 text-center mt-16 md:mt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ShoppingBag className="w-14 h-14 mx-auto mb-6 text-muted-foreground/30" />
            <h1 className="text-3xl font-bold mb-4">{t("cart.empty")}</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t("cart.emptyText")}</p>
            <Button asChild size="lg" className="rounded-[1.875rem] px-8 py-6 bg-foreground text-background hover:bg-foreground/90">
              <Link to={localePath("/shop")}>{t("cart.startShopping")}<ArrowRight className="w-4 h-4 ms-2" /></Link>
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="pb-4 md:pb-12">
        <div className="section-container">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold mb-6 pt-20 md:pt-24">{t("cart.title")}</h1>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            {/* ── LEFT: Cart items ── */}
            <div className="lg:col-span-7 xl:col-span-8">
              {/* Header row - desktop */}
              <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-6 pb-3 border-b border-border text-xs text-muted-foreground font-medium">
                <span>{t("cart.product")}</span>
                <span className="w-28 text-center">{t("cart.quantity")}</span>
                <span className="w-24 text-end">{t("cart.totalCol")}</span>
              </div>

              {items.map((item, i) => {
                const key = getItemKey(item);
                const meterLen = item.options?.meterLength || 1;
                const lineTotal = item.product.price * meterLen * item.quantity;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="py-5 border-b border-border"
                  >
                    {/* Desktop row */}
                    <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-6 items-start">
                      <div className="flex gap-4">
                        <Link to={localePath(`/product/${item.product.slug}`)} className="w-20 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <img src={item.product.images[0]} alt={item.product.name[locale]} className="w-full h-full object-cover" />
                        </Link>
                        <div className="space-y-1 min-w-0">
                          <Link to={localePath(`/product/${item.product.slug}`)} className="text-sm font-semibold hover:text-accent-strong transition-colors block truncate">
                            {item.product.name[locale]}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {t("common.currency")}{item.product.price.toLocaleString()}
                            {item.options?.meterLength && <span> / {locale === "ar" ? "متر" : "מטר"}</span>}
                          </p>
                          {item.options?.meterLength && (
                            <p className="text-xs text-muted-foreground">{locale === "ar" ? "الطول" : "אורך"}: {item.options.meterLength} {locale === "ar" ? "متر" : "מטר"}</p>
                          )}
                          {item.options?.size && (
                            <p className="text-xs text-muted-foreground">{t("contractor.length")}: {item.options.size}</p>
                          )}
                          {item.options?.color && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {t("contractor.color")}: {item.options.color.name}
                              <span className="inline-block w-3 h-3 rounded-full border border-border" style={{ backgroundColor: item.options.color.hex }} />
                            </p>
                          )}
                          {"sku" in item.product && (item.product as any).sku && (
                            <p className="text-xs text-muted-foreground">SKU: {(item.product as any).sku}</p>
                          )}
                          <button
                            onClick={() => removeItem(key)}
                            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors mt-1"
                          >
                            {t("cart.remove")}
                          </button>
                        </div>
                      </div>
                      <div>
                        <QuantitySelector
                          quantity={item.quantity}
                          onQuantityChange={(q) => updateQuantity(key, Math.min(q, getStockMax(item)))}
                          max={getStockMax(item)}
                          size="sm"
                        />
                      </div>
                      <div className="w-24 text-end">
                        <span className="text-sm font-semibold">{t("common.currency")}{lineTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Mobile row */}
                    <div className="md:hidden flex gap-4">
                      <Link to={localePath(`/product/${item.product.slug}`)} className="w-20 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <img src={item.product.images[0]} alt={item.product.name[locale]} className="w-full h-full object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0 space-y-1">
                        <Link to={localePath(`/product/${item.product.slug}`)} className="text-sm font-semibold hover:text-accent-strong transition-colors block truncate">
                          {item.product.name[locale]}
                        </Link>
                        {item.options?.meterLength && (
                          <p className="text-[11px] text-muted-foreground">{locale === "ar" ? "الطول" : "אורך"}: {item.options.meterLength} {locale === "ar" ? "متر" : "מטר"}</p>
                        )}
                        {item.options?.size && (
                          <p className="text-[11px] text-muted-foreground">{t("contractor.length")}: {item.options.size}</p>
                        )}
                        {item.options?.color && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            {t("contractor.color")}: {item.options.color.name}
                            <span className="inline-block w-2.5 h-2.5 rounded-full border border-border" style={{ backgroundColor: item.options.color.hex }} />
                          </p>
                        )}
                        <p className="text-sm font-semibold">{t("common.currency")}{lineTotal.toLocaleString()}</p>
                        <div className="flex items-center justify-between pt-1">
                          <QuantitySelector
                            quantity={item.quantity}
                            onQuantityChange={(q) => updateQuantity(key, Math.min(q, getStockMax(item)))}
                            max={getStockMax(item)}
                            size="sm"
                          />
                          <button
                            onClick={() => removeItem(key)}
                            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                          >
                            {t("cart.remove")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

            </div>

            {/* ── RIGHT: Order summary ── */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="rounded-xl border border-border bg-muted/30 p-6 lg:sticky lg:top-28 space-y-5">
                <h2 className="text-lg font-bold">{t("cart.orderSummary")}</h2>

                <CartFreeShippingBar subtotal={discountedSubtotal} />

                <CouponInput />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                    <span className="font-medium">{t("common.currency")}{subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span className="font-medium">{getLocalizedCouponDescription(appliedCoupon?.coupon.description, locale) || t("checkout.discountAppliedLabel")}</span>
                      <span className="font-semibold">-{t("common.currency")}{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {vatConfig.enabled && vatAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("cart.vatLabel")} ({vatConfig.rate}%)</span>
                      <span className="font-medium">{t("common.currency")}{vatAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("cart.shipping")}</span>
                    <span className="font-medium">{t("cart.complimentary")}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-base font-bold">
                    <span>{t("cart.total")}</span>
                    <span>{t("common.currency")}{total.toLocaleString()}</span>
                  </div>
                  {vatConfig.enabled && <p className="text-[11px] text-muted-foreground mt-1">{t("cart.includesVat")}</p>}
                </div>

                <Link
                  to={localePath("/checkout")}
                  className="flex items-center justify-center gap-2 w-full h-12 text-sm font-semibold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors"
                >
                  <LockIcon />
                  {t("cart.checkout")}
                </Link>

                <Link
                  to={localePath("/shop")}
                  className="flex items-center justify-center gap-2 w-full h-12 text-sm font-semibold border border-foreground text-foreground rounded-[1.875rem] hover:bg-foreground hover:text-background transition-colors"
                >
                  {t("cart.continueShopping")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

function CartFreeShippingBar({ subtotal }: { subtotal: number }) {
  const { data: shipping } = useShippingSettings();
  if (!shipping) return null;
  return <FreeShippingBar subtotal={subtotal} threshold={shipping.threshold} />;
}

export default Cart;
