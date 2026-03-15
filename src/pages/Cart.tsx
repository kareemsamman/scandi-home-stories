import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Trash2, ChevronDown } from "lucide-react";
import { Layout } from "@/components/Layout";
import { QuantitySelector } from "@/components/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { getLocaleText } from "@/data/products";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── Lock icon for checkout button ── */
const LockIcon = () => (
  <svg role="presentation" fill="none" focusable="false" strokeWidth="2" width="18" height="18" viewBox="0 0 24 24">
    <path d="M3.236 18.182a5.071 5.071 0 0 0 4.831 4.465 114.098 114.098 0 0 0 7.865-.001 5.07 5.07 0 0 0 4.831-4.464 23.03 23.03 0 0 0 .165-2.611c0-.881-.067-1.752-.165-2.61a5.07 5.07 0 0 0-4.83-4.465c-1.311-.046-2.622-.07-3.933-.069a109.9 109.9 0 0 0-3.933.069 5.07 5.07 0 0 0-4.83 4.466 23.158 23.158 0 0 0-.165 2.609c0 .883.067 1.754.164 2.61Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" />
    <path d="M17 8.43V6.285A5 5 0 0 0 7 6.286V8.43" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 17.714a2.143 2.143 0 1 0 0-4.286 2.143 2.143 0 0 0 0 4.286Z" stroke="currentColor" />
  </svg>
);

/* ── Payment icons ── */
const PaymentIcons = () => (
  <div className="flex items-center justify-center gap-3 pt-4">
    {/* Visa */}
    <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="Visa">
      <rect width="38" height="24" rx="3" fill="#F6F6F6" stroke="#E6E6E6" />
      <path d="M15.764 16.23h-2.39l1.496-9.22h2.39l-1.496 9.22Zm10.06-8.996a5.88 5.88 0 0 0-2.132-.386c-2.348 0-4.003 1.25-4.016 3.04-.013 1.323 1.183 2.062 2.088 2.503.928.45 1.24.739 1.236 1.142-.006.616-.74.898-1.426.898-1.126 0-1.726-.183-2.65-.57l-.363-.173-.396 2.444c.658.305 1.875.57 3.14.584 2.496 0 4.117-1.232 4.136-3.147.01-1.049-.626-1.847-2-2.504-.832-.426-1.342-.71-1.336-1.142 0-.383.431-.793 1.364-.793a4.1 4.1 0 0 1 1.78.353l.213.106.322-1.999-.16-.356Zm6.12-.224h-1.837c-.57 0-.996.164-1.247.762l-3.536 8.458h2.496l.5-1.38h3.05l.29 1.38h2.202l-1.918-9.22Zm-2.928 5.952c.197-.531 .948-2.578.948-2.578-.014.024.195-.533.315-.879l.161.795s.455 2.2.55 2.662h-1.974Zm-14.46-5.952-2.33 6.286-.249-1.274c-.432-1.47-1.783-3.063-3.293-3.862l2.13 8.06h2.514l3.74-9.21h-2.513Z" fill="#171E6C" />
      <path d="M8.86 7.01H5.052l-.03.183c2.98.762 4.953 2.6 5.77 4.81l-.832-4.228c-.144-.58-.56-.75-1.1-.765Z" fill="#E79800" />
    </svg>
    {/* Mastercard */}
    <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="Mastercard">
      <rect width="38" height="24" rx="3" fill="#F6F6F6" stroke="#E6E6E6" />
      <circle cx="15" cy="12" r="7" fill="#EB001B" />
      <circle cx="23" cy="12" r="7" fill="#F79E1B" />
      <path d="M19 7.32a7 7 0 0 1 2.6 4.68A7 7 0 0 1 19 16.68a7 7 0 0 1-2.6-4.68A7 7 0 0 1 19 7.32Z" fill="#FF5F00" />
    </svg>
    {/* Apple Pay */}
    <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="Apple Pay">
      <rect width="38" height="24" rx="3" fill="#F6F6F6" stroke="#E6E6E6" />
      <text x="19" y="15" textAnchor="middle" fontSize="7" fontFamily="system-ui" fontWeight="600" fill="#000"> Pay</text>
    </svg>
    {/* Google Pay */}
    <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="Google Pay">
      <rect width="38" height="24" rx="3" fill="#F6F6F6" stroke="#E6E6E6" />
      <text x="19" y="15" textAnchor="middle" fontSize="6" fontFamily="system-ui" fontWeight="500" fill="#5F6368">GPay</text>
    </svg>
  </div>
);

const Cart = () => {
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const getSubtotal = useCart((s) => s.getSubtotal);
  const getItemKey = useCart((s) => s.getItemKey);
  const { t, locale, localePath } = useLocale();
  const subtotal = getSubtotal();
  const shipping = subtotal > 5000 ? 0 : 250;
  const total = subtotal + shipping;
  const freeShipping = subtotal >= 5000;
  const [shippingOpen, setShippingOpen] = useState(false);

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <Layout>
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
      <section className="py-4 md:py-12 mt-14 md:mt-20">
        <div className="section-container">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("cart.title")}</h1>

          {/* Free shipping banner */}
          {freeShipping && (
            <div className="mb-6 py-2.5 px-4 rounded-lg bg-accent/10 border border-accent/20 text-sm text-foreground">
              ✓ {t("cart.freeShippingEligible")}
            </div>
          )}
          {!freeShipping && (
            <p className="text-sm text-muted-foreground mb-6">{t("cart.freeShippingNote")}</p>
          )}

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
                const lineTotal = item.product.price * item.quantity;
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
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        </Link>
                        <div className="space-y-1 min-w-0">
                          <Link to={localePath(`/product/${item.product.slug}`)} className="text-sm font-semibold hover:text-accent-strong transition-colors block truncate">
                            {item.product.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{t("common.currency")}{item.product.price.toLocaleString()}</p>
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
                      <div className="w-28">
                        <QuantitySelector
                          quantity={item.quantity}
                          onQuantityChange={(q) => updateQuantity(key, q)}
                          max={item.product.type === "contractor" ? 9999 : 10}
                          className="h-9 scale-[0.85] origin-center"
                        />
                      </div>
                      <div className="w-24 text-end">
                        <span className="text-sm font-semibold">{t("common.currency")}{lineTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Mobile row */}
                    <div className="md:hidden flex gap-4">
                      <Link to={localePath(`/product/${item.product.slug}`)} className="w-20 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0 space-y-1">
                        <Link to={localePath(`/product/${item.product.slug}`)} className="text-sm font-semibold hover:text-accent-strong transition-colors block truncate">
                          {item.product.name}
                        </Link>
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
                            onQuantityChange={(q) => updateQuantity(key, q)}
                            max={item.product.type === "contractor" ? 9999 : 10}
                            className="h-8 scale-[0.8] origin-start"
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

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                    <span className="font-medium">{t("common.currency")}{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("cart.shipping")}</span>
                    <span className="font-medium">{shipping === 0 ? t("cart.complimentary") : `${t("common.currency")}${shipping}`}</span>
                  </div>
                </div>

                {/* Mobile: collapsible shipping estimate */}
                <div className="lg:hidden">
                  <button
                    onClick={() => setShippingOpen(!shippingOpen)}
                    className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    <span>{t("cart.estimateShipping")}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", shippingOpen && "rotate-180")} />
                  </button>
                  {shippingOpen && (
                    <div className="pt-2 pb-3 text-xs text-muted-foreground">
                      {t("cart.freeShippingNote")}
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-base font-bold">
                    <span>{t("cart.total")}</span>
                    <span>{t("common.currency")}{total.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{t("cart.taxNote")}</p>
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

export default Cart;
