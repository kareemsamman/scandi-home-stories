import { useLocale } from "@/i18n/useLocale";
import { Truck, Check } from "lucide-react";

interface Props {
  subtotal: number;
  threshold: number;
}

export const FreeShippingBar = ({ subtotal, threshold }: Props) => {
  const { t } = useLocale();

  if (threshold <= 0) return null;

  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, (subtotal / threshold) * 100);
  const isFree = remaining <= 0;

  return (
    <div className={`rounded-xl px-3.5 py-2.5 transition-all ${
      isFree
        ? "bg-green-50 border border-green-200"
        : "bg-gray-50 border border-gray-100"
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {isFree ? (
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          ) : (
            <Truck className="w-4 h-4 text-gray-400" />
          )}
          <span className={`text-xs font-semibold ${isFree ? "text-green-700" : "text-gray-600"}`}>
            {isFree
              ? t("cart.freeShippingUnlocked")
              : t("cart.freeShippingRemaining").replace("{amount}", `₪${remaining.toLocaleString()}`)}
          </span>
        </div>
        {!isFree && (
          <span className="text-[10px] text-gray-400">₪{threshold.toLocaleString()}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFree ? "bg-green-500" : "bg-gray-900"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
