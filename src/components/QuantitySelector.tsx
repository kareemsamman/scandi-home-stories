import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  className?: string;
  /** "sm" = compact (cart/minicart), "md" = default (modal) */
  size?: "sm" | "md";
}

export const QuantitySelector = ({ quantity, onQuantityChange, min = 1, max = 10, className, size = "md" }: QuantitySelectorProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    onQuantityChange(Math.max(min, Math.min(max, val)));
  };

  const btnCls = size === "sm" ? "h-9 w-9 rounded-none text-foreground flex-shrink-0" : "h-14 w-14 rounded-none text-foreground flex-shrink-0";
  const inputCls = size === "sm"
    ? "flex-1 h-9 text-center text-sm font-semibold tabular-nums bg-transparent border-x border-border outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    : "flex-1 h-14 text-center text-base font-semibold tabular-nums bg-transparent border-x border-border outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const iconCls = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";

  return (
    <div className={cn("flex items-center border border-border rounded-xl overflow-hidden", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => quantity > min && onQuantityChange(quantity - 1)}
        disabled={quantity <= min}
        className={btnCls}
      >
        <Minus className={iconCls} />
      </Button>
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        className={inputCls}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => quantity < max && onQuantityChange(quantity + 1)}
        disabled={quantity >= max}
        className={btnCls}
      >
        <Plus className={iconCls} />
      </Button>
    </div>
  );
};
