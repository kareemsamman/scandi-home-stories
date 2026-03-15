import { useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
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

const LockIcon = () => (
  <svg role="presentation" fill="none" focusable="false" strokeWidth="2" width="18" height="18" viewBox="0 0 24 24">
    <path d="M3.236 18.182a5.071 5.071 0 0 0 4.831 4.465 114.098 114.098 0 0 0 7.865-.001 5.07 5.07 0 0 0 4.831-4.464 23.03 23.03 0 0 0 .165-2.611c0-.881-.067-1.752-.165-2.61a5.07 5.07 0 0 0-4.83-4.465c-1.311-.046-2.622-.07-3.933-.069a109.9 109.9 0 0 0-3.933.069 5.07 5.07 0 0 0-4.83 4.466 23.158 23.158 0 0 0-.165 2.609c0 .883.067 1.754.164 2.61Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" />
    <path d="M17 8.43V6.285A5 5 0 0 0 7 6.286V8.43" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 17.714a2.143 2.143 0 1 0 0-4.286 2.143 2.143 0 0 0 0 4.286Z" stroke="currentColor" />
  </svg>
);

export const MiniCart = () => {
  const { t, localePath } = useLocale();
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  // Build related "buy with" products based on cart contents
  const buyWithProducts = useMemo(() => {
    const cartIds = new Set(items.map((i) => i.product.id));
    const cartCollections = new Set(items.map((i) => i.product.collection));
    
    // First try to find products from the same collections
    const related = products.filter((p) => !cartIds.has(p.id) && cartCollections.has(p.collection));
    
    // If not enough, fill with other products
    if (related.length >= 10) return related.slice(0, 10);
    
    const remaining = products.filter((p) => !cartIds.has(p.id) && !cartCollections.has(p.collection));
    return [...related, ...remaining].slice(0, 10);
  }, [items]);

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
        <div className="h-px bg-border" />
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        <div className="space-y-4">
          {items.map((item) => {
            const key = getItemKey(item);
            return (
              <div key={key} className="flex gap-4">
                <img src={item.product.images[0]} alt={item.product.name} className="w-16 h-20 rounded object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">AMG Pergola</p>
                  <p className="text-sm font-semibold text-foreground truncate">{item.product.name}</p>
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

        {/* Buy With - grid layout like reference */}
        {buyWithProducts.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm font-semibold mb-3">{t("miniCart.buyWith")}</p>
            <div className="grid grid-cols-2 gap-3">
              {buyWithProducts.slice(0, 4).map((p) => (
                <div key={p.id} className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted/30">
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-semibold truncate text-center">{p.name}</p>
                  <p className="text-xs text-muted-foreground text-center">{t("common.currency")}{p.price.toLocaleString()}</p>
                  <div className="flex justify-center">
                    <button
                      onClick={() => useCart.getState().addItem(p, 1)}
                      className="text-xs font-semibold border border-foreground rounded-full px-4 py-1.5 text-foreground hover:bg-foreground hover:text-background transition-colors"
                    >
                      + {t("miniCart.add")}
                    </button>
                  </div>
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
          <Link to={localePath("/cart")} onClick={closeCart} className="flex-1 h-12 flex items-center justify-center text-sm font-semibold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors">
            {t("miniCart.viewCart")}
          </Link>
          <Link to={localePath("/checkout")} onClick={closeCart} className="flex-1 h-12 flex items-center justify-center gap-2 text-sm font-semibold border border-foreground text-foreground rounded-[1.875rem] hover:bg-foreground hover:text-background transition-colors">
            <LockIcon />
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
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          onClick={handleOverlayClick}
        >
          <motion.div
            initial={isMobile ? { opacity: 0, scale: 0.95 } : { x: "100%", opacity: 1 }}
            animate={isMobile ? { opacity: 1, scale: 1 } : { x: 0, opacity: 1 }}
            exit={isMobile ? { opacity: 0, scale: 0.95 } : { x: "100%", opacity: 1 }}
            transition={{ duration: 0.34, ease: [0.22, 0.61, 0.36, 1] }}
            className={cn(
              "flex flex-col bg-background overflow-hidden rounded-[10px]",
              isMobile
                ? "w-[98%] max-w-[480px] h-[98%] rounded-[10px]"
                : "fixed top-6 bottom-6 shadow-xl"
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
