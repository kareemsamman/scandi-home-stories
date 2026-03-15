import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { useIsMobile } from "@/hooks/use-mobile";
import { QuantitySelector } from "./QuantitySelector";
import { products } from "@/data/products";
import { cn } from "@/lib/utils";

const CartIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5">
    <path d="M24 16H8.577A2 2 0 0 0 6.64 18.497l4.051 16A2 2 0 0 0 12.63 36H35.37a2 2 0 0 0 1.937-1.503l4.052-16A2 2 0 0 0 39.422 16H24Zm0 0V8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MiniCart = () => {
  const { t, localePath, locale } = useLocale();
  const isMobile = useIsMobile();
  const isOpen = useCart((s) => s.isOpen);
  const closeCart = useCart((s) => s.closeCart);
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const getSubtotal = useCart((s) => s.getSubtotal);
  const getItemCount = useCart((s) => s.getItemCount);
  const getItemKey = useCart((s) => s.getItemKey);

  const overlayRef = useRef<HTMLDivElement>(null);
  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  const cartIds = new Set(items.map((i) => i.product.id));
  const buyWithProducts = products.filter((p) => !cartIds.has(p.id) && p.type === "retail").slice(0, 6);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) closeCart();
  };

  const renderEmpty = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
      <CartIcon />
      <p className="text-lg font-semibold text-foreground">{t("miniCart.empty")}</p>
      <button onClick={closeCart} className="text-sm font-medium underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors">
        {t("miniCart.continueShopping")}
      </button>
    </div>
  );

  const renderItems = () => (
    <>
      <div className="px-6 pb-3">
        <p className="text-xs text-muted-foreground">{t("miniCart.freeShipping")}</p>
        <div className="mt-2 h-px bg-border" />
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        <div className="space-y-4">
          {items.map((item) => {
            const key = getItemKey(item);
            return (
              <div key={key} className="flex gap-4">
                <img src={item.product.images[0]} alt={item.product.name} className="w-16 h-16 rounded object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">AMG Pergola</p>
                  <p className="text-sm font-semibold text-foreground truncate">{item.product.name}</p>
                  {/* Show selected options */}
                  {item.options?.size && (
                    <p className="text-[11px] text-muted-foreground">
                      {t("contractor.length")}: {item.options.size}
                    </p>
                  )}
                  {item.options?.color && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      {t("contractor.color")}: {item.options.color.name}
                      <span className="inline-block w-3 h-3 rounded-full border border-border" style={{ backgroundColor: item.options.color.hex }} />
                    </p>
                  )}
                  <p className="text-sm text-foreground">{t("common.currency")}{item.product.price.toLocaleString()}</p>
                  <div className="flex items-center justify-between mt-2">
                    <QuantitySelector
                      quantity={item.quantity}
                      onQuantityChange={(q) => updateQuantity(key, q)}
                      max={item.product.type === "contractor" ? 9999 : 10}
                      className="h-8 scale-90 origin-start"
                    />
                    <button onClick={() => removeItem(key)} className="text-xs text-muted-foreground underline hover:text-foreground transition-colors">
                      {t("miniCart.remove")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {buyWithProducts.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm font-semibold mb-3">{t("miniCart.buyWith")}</p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
              {buyWithProducts.map((p) => (
                <div key={p.id} className="flex-shrink-0 w-[130px] space-y-2">
                  <div className="aspect-square rounded overflow-hidden bg-muted">
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{t("common.currency")}{p.price.toLocaleString()}</p>
                  <button
                    onClick={() => useCart.getState().addItem(p, 1)}
                    className="text-xs font-semibold text-foreground hover:text-accent-strong transition-colors"
                  >
                    + {t("miniCart.add")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border px-6 pt-4 pb-4 space-y-3 bg-background">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{t("cart.total")}</span>
          <span className="text-sm font-semibold">{t("common.currency")}{subtotal.toLocaleString()}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">{t("miniCart.taxNote")}</p>
        <button className="text-xs underline text-muted-foreground hover:text-foreground transition-colors">
          {t("miniCart.orderNote")}
        </button>
        <div className="flex gap-3 pt-1">
          <Link to={localePath("/cart")} onClick={closeCart} className="flex-1 h-11 flex items-center justify-center text-sm font-semibold border border-foreground rounded-[2px] text-foreground hover:bg-foreground hover:text-background transition-colors">
            {t("miniCart.viewCart")}
          </Link>
          <Link to={localePath("/checkout")} onClick={closeCart} className="flex-1 h-11 flex items-center justify-center text-sm font-semibold bg-foreground text-background rounded-[2px] hover:bg-foreground/90 transition-colors">
            {t("cart.checkout")}
          </Link>
        </div>
      </div>
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/40"
          onClick={handleOverlayClick}
        >
          <motion.div
            initial={{ x: isMobile ? 0 : "100%", opacity: isMobile ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isMobile ? 0 : "100%", opacity: isMobile ? 0 : 1 }}
            transition={{ duration: 0.34, ease: [0.22, 0.61, 0.36, 1] }}
            className={cn(
              "fixed flex flex-col bg-background overflow-hidden",
              isMobile ? "inset-x-0 bottom-0 top-[1vh] rounded-t-[2px]" : "top-6 bottom-6 rounded-[2px] shadow-xl"
            )}
            style={isMobile ? {} : { insetInlineEnd: 24, width: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold">{t("nav.cart")}</span>
                {itemCount > 0 && <span className="text-sm text-muted-foreground">({itemCount})</span>}
              </div>
              <button onClick={closeCart} className="w-8 h-8 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {items.length === 0 ? renderEmpty() : renderItems()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
