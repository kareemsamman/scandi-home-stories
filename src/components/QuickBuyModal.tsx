import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
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
  const [customColorTab, setCustomColorTab] = useState(0);
  const [addedConfirm, setAddedConfirm] = useState(false);

  const isRetail = product?.type === "retail";
  const isContractor = product?.type === "contractor";
  const contractor = isContractor ? (product as ContractorProduct) : null;

  const standardColors = (isRetail ? (product as RetailProduct)?.colors : contractor?.colorGroups?.[0]?.colors) || [];
  const customColorGroups = contractor?.colorGroups?.slice(1) || [];
  const hasCustomColors = customColorGroups.length > 0 && customColorGroups.some(g => g.colors.length > 0);

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

  // Custom color tab definitions
  const colorTabKeys = ['ral', 'passivation', 'noColorMF', 'woodLook', 'iron', 'metal'] as const;
  const colorTabLabels = colorTabKeys.map(key => t(`contractor.colorTabs.${key}`));

  // Map custom color groups to tabs (fill remaining tabs with empty arrays)
  const getTabColors = useCallback((tabIndex: number) => {
    if (tabIndex < customColorGroups.length) return customColorGroups[tabIndex].colors;
    return [];
  }, [customColorGroups]);

  if (!product) return null;

  const handleAdd = () => {
    const colorOption = selectedColor || (standardColors.length > 0 ? { id: standardColors[0].id, name: standardColors[0].name[locale], hex: standardColors[0].hex } : undefined);

    // For contractor products, add without opening mini cart
    if (isContractor) {
      const cart = useCart.getState();
      const key = `${product.id}__${selectedSize || ""}__${colorOption?.id || ""}`;
      const existing = cart.items.find(
        (i) => `${i.product.id}__${i.options?.size || ""}__${i.options?.color?.id || ""}` === key
      );
      const maxQty = 9999;
      if (existing) {
        cart.updateQuantity(key, Math.min(existing.quantity + quantity, maxQty));
      } else {
        // Directly set items without opening cart
        useCart.setState((state) => ({
          items: [...state.items, { product, quantity, options: { color: colorOption, size: selectedSize || undefined } }],
        }));
      }
    } else {
      addItem(product, quantity, {
        color: colorOption,
        size: selectedSize || undefined,
      });
    }

    // Show confirmation
    setAddedConfirm(true);
    setTimeout(() => {
      setAddedConfirm(false);
      if (!isContractor) {
        onClose();
        setSelectedColor(null);
        setSelectedSize(null);
        setQuantity(1);
        setShowCustomColors(false);
      }
      // For contractor: keep modal open, reset quantity only
      setQuantity(1);
    }, 1000);
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
                      onClick={() => { setShowCustomColors(!showCustomColors); setCustomColorTab(0); }}
                      className={cn(
                        "mt-3 px-4 py-2.5 text-sm font-semibold rounded-lg border-2 transition-all",
                        showCustomColors
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-foreground hover:border-foreground"
                      )}
                    >
                      {t("contractor.customColor")}
                    </button>
                  )}
                </div>
              )}

              {/* Custom color tabs */}
              {showCustomColors && (
                <div>
                  <div className="flex gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                    {colorTabLabels.map((label, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCustomColorTab(idx)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all",
                          customColorTab === idx
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:border-muted-foreground"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {getTabColors(customColorTab).map((color) => {
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
                    {getTabColors(customColorTab).length === 0 && (
                      <p className="text-xs text-muted-foreground py-2">—</p>
                    )}
                  </div>
                </div>
              )}

              {/* Length/size selection */}
              {contractor && contractor.sizes.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2.5">
                    {t("contractor.size")}:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {contractor.sizes.map((size) => {
                      const isActive = selectedSize === size.label || (!selectedSize && size.id === contractor.sizes[0].id);
                      return (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size.label)}
                          className={cn(
                            "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all flex flex-col items-center",
                            isActive
                              ? "border-foreground bg-foreground text-background"
                              : "border-border hover:border-muted-foreground"
                          )}
                        >
                          <span>{size.label}</span>
                          {size.price && (
                            <span className={cn("text-[11px]", isActive ? "opacity-80" : "text-muted-foreground")}>
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
              <div>
                <p className="text-sm font-medium text-foreground mb-2.5">{t("product.quantity")}</p>
                <QuantitySelector
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  max={isContractor ? 9999 : 10}
                />
              </div>
            </div>

            {/* Add to cart button with confirmation state */}
            <div className="p-5 border-t border-border">
              <AnimatePresence mode="wait">
                {addedConfirm ? (
                  <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold rounded-full bg-green-600 text-white"
                  >
                    <Check className="w-4 h-4" />
                    {t("contractor.addedToCart")}
                  </motion.div>
                ) : (
                  <motion.button
                    key="add"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={handleAdd}
                    className="w-full h-12 flex items-center justify-center text-sm font-semibold border-2 border-foreground rounded-full text-foreground hover:bg-foreground hover:text-background transition-colors"
                  >
                    {t("product.addToBag")}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
