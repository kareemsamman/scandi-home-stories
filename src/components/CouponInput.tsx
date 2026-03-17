import { useState } from "react";
import { Tag, X, Loader2, CheckCircle2 } from "lucide-react";
import { validateCoupon, useCouponStore } from "@/hooks/useCoupons";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/i18n/useLocale";

export const CouponInput = () => {
  const { t } = useLocale();
  const { items } = useCart();
  const getSubtotal = useCart((s) => s.getSubtotal);
  const { user } = useAuth();
  const { applied, apply, remove } = useCouponStore();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError("");
    const subtotal = getSubtotal();
    const cartItems = items.map(i => ({ product: { id: i.product.id, price: i.product.price, collection: (i.product as any).collection }, quantity: i.quantity }));
    const result = await validateCoupon(code, cartItems, subtotal, user?.id);
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
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleApply()}
            placeholder={t("checkout.discountPlaceholder")}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 placeholder:text-muted-foreground font-mono"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!code.trim() || loading}
          className="px-4 h-10 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("checkout.applyDiscount")}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
};
