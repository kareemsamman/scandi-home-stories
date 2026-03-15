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
  return (
    <div className={cn("flex items-center gap-0 border border-border rounded-lg overflow-hidden", className)}>
      <Button variant="ghost" size="icon" onClick={() => quantity > min && onQuantityChange(quantity - 1)} disabled={quantity <= min} className="h-10 w-10 rounded-none">
        <Minus className="w-4 h-4" />
      </Button>
      <span className="w-10 text-center text-sm font-medium tabular-nums">{quantity}</span>
      <Button variant="ghost" size="icon" onClick={() => quantity < max && onQuantityChange(quantity + 1)} disabled={quantity >= max} className="h-10 w-10 rounded-none">
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
};