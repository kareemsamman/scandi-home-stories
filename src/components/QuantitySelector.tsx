import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export const QuantitySelector = ({ quantity, onQuantityChange, min = 1, max = 10, className }: QuantitySelectorProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    onQuantityChange(Math.max(min, Math.min(max, val)));
  };

  return (
    <div className={cn("flex items-center gap-0 border border-border rounded-xl overflow-hidden", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => quantity > min && onQuantityChange(quantity - 1)}
        disabled={quantity <= min}
        className="h-12 w-12 rounded-none text-foreground"
      >
        <Minus className="w-4 h-4" />
      </Button>
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        className="w-14 h-12 text-center text-sm font-semibold tabular-nums bg-transparent border-x border-border outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => quantity < max && onQuantityChange(quantity + 1)}
        disabled={quantity >= max}
        className="h-12 w-12 rounded-none text-foreground"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
};
