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
    <div className={cn("flex items-center border border-border rounded-xl overflow-hidden w-full", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => quantity > min && onQuantityChange(quantity - 1)}
        disabled={quantity <= min}
        className="h-14 w-14 rounded-none text-foreground flex-shrink-0"
      >
        <Minus className="w-5 h-5" />
      </Button>
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        className="flex-1 h-14 text-center text-base font-semibold tabular-nums bg-transparent border-x border-border outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => quantity < max && onQuantityChange(quantity + 1)}
        disabled={quantity >= max}
        className="h-14 w-14 rounded-none text-foreground flex-shrink-0"
      >
        <Plus className="w-5 h-5" />
      </Button>
    </div>
  );
};
