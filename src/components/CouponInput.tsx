import { useState, useEffect } from "react";
import { Tag, X, Loader2, CheckCircle2 } from "lucide-react";
import { validateCoupon, useCouponStore, fetchAutoApplyCoupon } from "@/hooks/useCoupons";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/i18n/useLocale";
import { getLocalizedCouponDescription } from "@/lib/couponDescription";

export const CouponInput = () => {
  const { t, locale } = useLocale();
  const { items } = useCart();
  const getSubtotal = useCart((s) => s.getSubtotal);
  const { user, isAdmin, profile } = useAuth();
  const { applied, apply, remove } = useCouponStore();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-apply: try to fetch and apply a site-wide auto-apply coupon if no coupon is currently applied
  useEffect(() => {
    if (applied || items.length === 0) return;
    let cancelled = false;
    (async () => {
      const auto = await fetchAutoApplyCoupon();
      if (cancelled || !auto || applied) return;
      const subtotal = getSubtotal();
      const cartItems = items.map(i => ({ product: { id: i.product.id, price: i.product.price, collection: (i.product as any).collection }, quantity: i.quantity }));
      const result = await validateCoupon(auto.code, cartItems, subtotal, user?.id, isAdmin, profile?.phone);
      if (!cancelled && !result.error && result.coupon) {
        apply(result.coupon, result.discountAmount!);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, applied]);

  const handleApply = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError("");
    const subtotal = getSubtotal();
    const cartItems = items.map(i => ({ product: { id: i.product.id, price: i.product.price, collection: (i.product as any).collection }, quantity: i.quantity }));
    const result = await validateCoupon(code, cartItems, subtotal, user?.id, isAdmin, profile?.phone);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    apply(result.coupon!, result.discountAmount!);
    setCode("");
  };

  if (applied) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800 font-mono">{applied.coupon.code}</p>
          {applied.coupon.description && <p className="text-xs text-green-600">{applied.coupon.description}</p>}
        </div>
        <span className="text-sm font-bold text-green-700">-₪{applied.discountAmount.toLocaleString()}</span>
        <button onClick={remove} className="text-green-500 hover:text-green-700 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleApply()}
            placeholder={t("checkout.discountPlaceholder")}
            className="w-full h-12 ps-10 pe-3 rounded-xl border-2 border-border bg-white text-sm font-mono tracking-wider focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/60 placeholder:font-sans placeholder:tracking-normal"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!code.trim() || loading}
          className="px-5 h-12 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/85 transition-colors disabled:opacity-40 shrink-0 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("checkout.applyDiscount")}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
};
