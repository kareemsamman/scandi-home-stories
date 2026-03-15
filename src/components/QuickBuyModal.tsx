import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ruler } from "lucide-react";
import { Product, RetailProduct, ContractorProduct, getLocaleText } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { useIsMobile } from "@/hooks/use-mobile";
import { QuantitySelector } from "./QuantitySelector";
import { cn } from "@/lib/utils";

interface QuickBuyModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export const QuickBuyModal = ({ product, open, onClose }: QuickBuyModalProps) => {
  const { t, locale } = useLocale();
  const { addItem } = useCart();
  const isMobile = useIsMobile();
  const [selectedColor, setSelectedColor] = useState<{ id: string; name: string; hex: string } | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showCustomColors, setShowCustomColors] = useState(false);

  const isRetail = product?.type === "retail";
  const isContractor = product?.type === "contractor";
  const retail = isRetail ? (product as RetailProduct) : null;
  const contractor = isContractor ? (product as ContractorProduct) : null;

  const standardColors = retail?.colors || contractor?.colorGroups?.[0]?.colors || [];
  const customColorGroups = contractor?.colorGroups?.slice(1) || [];
  const hasCustomColors = customColorGroups.length > 0 && customColorGroups.some(g => g.colors.length > 0);

  // Calculate price based on selected size
  const currentPrice = useMemo(() => {
    if (!product) return 0;
    if (contractor && selectedSize) {
      const sizeOption = contractor.sizes.find(s => s.label === selectedSize);
      if (sizeOption?.price) return sizeOption.price;
    }
    if (contractor && !selectedSize && contractor.sizes[0]?.price) {
      return contractor.sizes[0].price;
    }
    return product.price;
  }, [contractor, selectedSize, product]);

  if (!product) return null;

  const handleAdd = () => {
    const colorOption = selectedColor || (standardColors.length > 0 ? { id: standardColors[0].id, name: standardColors[0].name[locale], hex: standardColors[0].hex } : undefined);
    addItem(product, quantity, {
      color: colorOption,
      size: selectedSize || undefined,
    });
    onClose();
    setSelectedColor(null);
    setSelectedSize(null);
    setQuantity(1);
    setShowCustomColors(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: isMobile ? "100%" : 20, opacity: isMobile ? 1 : 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isMobile ? "100%" : 20, opacity: isMobile ? 1 : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            className={cn(
              "bg-background overflow-hidden",
              isMobile
                ? "w-full rounded-t-2xl max-h-[88vh]"
                : "w-full max-w-md rounded-2xl shadow-2xl max-h-[80vh]"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with product image + info */}
            <div className="flex items-start gap-4 p-5 border-b border-border">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-border"
              />
              <div className="flex-1 min-w-0">
                <button
                  onClick={onClose}
                  className="absolute top-4 end-4 w-8 h-8 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="text-base font-bold text-foreground">{product.name}</h3>
                {contractor && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t("contractor.sku")}: {contractor.sku}
                  </p>
                )}
                <p className="text-base font-bold text-foreground mt-1">
                  {t("common.currency")}{currentPrice.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto" style={{ maxHeight: isMobile ? '58vh' : '50vh' }}>
              {/* Color selection */}
              {standardColors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2.5">
                    {t("contractor.color")}: <span className="text-muted-foreground font-normal">{selectedColor?.name || standardColors[0].name[locale]}</span>
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {standardColors.map((color) => {
                      const isActive = selectedColor?.id === color.id || (!selectedColor && color.id === standardColors[0].id);
                      return (
                        <button
                          key={color.id}
                          onClick={() => { setSelectedColor({ id: color.id, name: color.name[locale], hex: color.hex }); setShowCustomColors(false); }}
                          className={cn(
                            "w-10 h-10 rounded border-2 transition-all",
                            isActive ? "border-foreground scale-110" : "border-border hover:border-muted-foreground"
                          )}
                          style={{ backgroundColor: color.hex }}
                          title={color.name[locale]}
                        />
                      );
                    })}
                  </div>
                  {/* Custom color button */}
                  {hasCustomColors && (
                    <button
                      onClick={() => setShowCustomColors(!showCustomColors)}
                      className="mt-2.5 text-xs font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors"
                    >
                      {t("contractor.customColor")}
                    </button>
                  )}
                </div>
              )}

              {/* Custom color groups (RAL / Wood) */}
              {showCustomColors && customColorGroups.map((group) => (
                <div key={group.id}>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{group.name[locale]}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {group.colors.map((color) => {
                      const isActive = selectedColor?.id === color.id;
                      return (
                        <button
                          key={color.id}
                          onClick={() => setSelectedColor({ id: color.id, name: color.name[locale], hex: color.hex })}
                          className={cn(
                            "w-8 h-8 rounded border-2 transition-all",
                            isActive ? "border-foreground scale-110" : "border-border hover:border-muted-foreground"
                          )}
                          style={{ backgroundColor: color.hex }}
                          title={color.name[locale]}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Size selection */}
              {contractor && contractor.sizes.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2.5">
                    {t("contractor.size")}: <span className="text-muted-foreground font-normal">{selectedSize || contractor.sizes[0].label}</span>
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {contractor.sizes.map((size) => {
                      const isActive = selectedSize === size.label || (!selectedSize && size.id === contractor.sizes[0].id);
                      return (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size.label)}
                          className={cn(
                            "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                            isActive
                              ? "border-foreground bg-foreground text-background"
                              : "border-border hover:border-muted-foreground"
                          )}
                        >
                          {size.label}
                          {size.price && (
                            <span className="text-[10px] opacity-70 ms-1">
                              {t("common.currency")}{size.price}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              {isContractor && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2.5">{t("product.quantity")}</p>
                  <QuantitySelector
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    max={9999}
                  />
                </div>
              )}
            </div>

            {/* Add to cart button */}
            <div className="p-5 border-t border-border">
              <button
                onClick={handleAdd}
                className="w-full h-12 flex items-center justify-center text-sm font-semibold border-2 border-foreground rounded-full text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                {t("product.addToBag")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
