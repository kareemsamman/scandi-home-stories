import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Product, RetailProduct, ContractorProduct } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { useIsMobile } from "@/hooks/use-mobile";
import { QuantitySelector } from "./QuantitySelector";
import { CustomColorModal } from "./CustomColorModal";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface QuickBuyModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export const QuickBuyModal = ({ product, open, onClose }: QuickBuyModalProps) => {
  const { t, locale } = useLocale();
  const { addItem } = useCart();
  const isMobile = useIsMobile();
  const [selectedColor, setSelectedColor] = useState<{ id: string; name: string; hex: string; price?: number } | null>(null);
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedConfirm, setAddedConfirm] = useState(false);
  const [customColorOpen, setCustomColorOpen] = useState(false);

  const isRetail = product?.type === "retail";
  const isContractor = product?.type === "contractor";
  const contractor = isContractor ? (product as ContractorProduct) : null;

  const standardColors = (isRetail ? (product as RetailProduct)?.colors : contractor?.colorGroups?.[0]?.colors) || [];
  const customColorGroups = contractor?.colorGroups?.slice(1) || [];
  const hasCustomColors = customColorGroups.length > 0 && customColorGroups.some(g => g.colors.length > 0);

  // Inventory loading
  const { data: inventory = [] } = useQuery({
    queryKey: ['product_inventory', product?.id],
    queryFn: async () => {
      if (!product) return [];
      const { data } = await (supabase as any).from('inventory').select('*').eq('product_id', product.id);
      return (data || []) as { variation_key: string; stock_quantity: number }[];
    },
    enabled: !!product && open,
  });

  const invMap = useMemo(() => new Map(inventory.map(i => [i.variation_key, i.stock_quantity])), [inventory]);
  const getColorStock = (colorId: string) => invMap.get(`color:${colorId}`) ?? 9999;
  const getComboStock = (colorId: string, sizeId: string) => invMap.get(`combo:${colorId}|${sizeId}`) ?? 9999;

  // Active color object (contractor uses standardColors which are the flat colors)
  const activeColorObj = standardColors.find(c => c.id === (selectedColor?.id || standardColors[0]?.id));

  // Sizes available for selected color (filtered by per-color lengths)
  const availableSizes = useMemo(() => {
    if (!contractor) return [];
    const colorObj = standardColors.find(c => c.id === (selectedColor?.id || standardColors[0]?.id));
    if ((colorObj as any)?.lengths?.length > 0) {
      return contractor.sizes.filter(s => (colorObj as any).lengths.includes(s.id));
    }
    return contractor.sizes;
  }, [contractor, selectedColor?.id, standardColors]);

  // Reset size when color changes
  useEffect(() => {
    if (!contractor) return;
    const firstInStock = availableSizes.find(s => {
      const cId = selectedColor?.id || standardColors[0]?.id;
      return cId ? getComboStock(cId, s.id) > 0 : true;
    });
    setSelectedSize(firstInStock?.label || availableSizes[0]?.label || null);
  }, [selectedColor?.id, availableSizes.length, inventory.length]);

  // Dynamic price
  const currentPrice = useMemo(() => {
    if (!product) return 0;
    if (isCustomColor && (selectedColor as any)?.price) return (selectedColor as any).price;
    if (contractor && selectedColor) {
      const colorObj = standardColors.find(c => c.id === selectedColor.id);
      const sizeObj = availableSizes.find(s => s.label === selectedSize || (!selectedSize && s.id === availableSizes[0]?.id));
      if (colorObj && sizeObj && (colorObj as any).combo_prices) {
        const cp = (colorObj as any).combo_prices[sizeObj.id];
        if (cp && cp > 0) return cp;
      }
      if (!selectedSize && contractor.sizes[0]?.price) return contractor.sizes[0].price;
      const sizeOption = availableSizes.find(s => s.label === selectedSize);
      if (sizeOption?.price) return sizeOption.price;
    }
    return product.price;
  }, [contractor, selectedColor, selectedSize, availableSizes, product]);

  // Current stock
  const currentStock = useMemo(() => {
    if (isRetail) {
      const cId = selectedColor?.id || standardColors[0]?.id;
      return cId ? getColorStock(cId) : 9999;
    }
    if (isContractor && !isCustomColor) {
      const cId = selectedColor?.id || standardColors[0]?.id;
      const sizeObj = availableSizes.find(s => s.label === selectedSize || (!selectedSize && s.id === availableSizes[0]?.id));
      if (cId && sizeObj) return getComboStock(cId, sizeObj.id);
    }
    return 9999;
  }, [isRetail, isContractor, isCustomColor, selectedColor, selectedSize, availableSizes, invMap]);

  const isOutOfStock = currentStock === 0;
  const maxQty = isOutOfStock ? 0 : currentStock;

  if (!product) return null;

  const handleAdd = () => {
    if (isOutOfStock) return;
    const colorOption = selectedColor || (standardColors.length > 0 ? { id: standardColors[0].id, name: standardColors[0].name[locale], hex: standardColors[0].hex } : undefined);
    const qty = Math.min(quantity, maxQty);

    if (isContractor) {
      const cart = useCart.getState();
      const key = `${product.id}__${selectedSize || ""}__${colorOption?.id || ""}`;
      const existing = cart.items.find(
        (i) => `${i.product.id}__${i.options?.size || ""}__${i.options?.color?.id || ""}` === key
      );
      if (existing) {
        cart.updateQuantity(key, Math.min(existing.quantity + qty, maxQty));
      } else {
        useCart.setState((state) => ({
          items: [...state.items, { product, quantity: qty, options: { color: colorOption, size: selectedSize || undefined } }],
        }));
      }
    } else {
      addItem(product, qty, {
        color: colorOption,
        size: selectedSize || undefined,
      });
    }

    setAddedConfirm(true);
    setTimeout(() => {
      setAddedConfirm(false);
      if (!isContractor) {
        onClose();
        setSelectedColor(null);
        setIsCustomColor(false);
        setSelectedSize(null);
        setQuantity(1);
      }
      setQuantity(1);
    }, 1000);
  };

  return (
    <>
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
                      {t("contractor.color")}:{" "}
                      <span className="text-muted-foreground font-normal">
                        {selectedColor?.name || standardColors[0].name[locale]}
                      </span>
                    </p>

                    {/* Custom color indicator */}
                    {isCustomColor && selectedColor && (
                      <div className="flex items-center gap-2.5 mb-3 p-2.5 rounded-xl border border-foreground bg-muted">
                        <span
                          className="w-8 h-8 rounded-lg border border-foreground flex-shrink-0"
                          style={{ backgroundColor: selectedColor.hex }}
                        />
                        <span className="text-sm font-medium text-foreground flex-1">{selectedColor.name}</span>
                        <button
                          onClick={() => { setIsCustomColor(false); setSelectedColor(null); }}
                          className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                          {t("contractor.cancel")}
                        </button>
                      </div>
                    )}

                    <div className={cn("flex gap-2 flex-wrap", isCustomColor && "opacity-40 pointer-events-none")}>
                      {standardColors.map((color) => {
                        const isActive = !isCustomColor && (selectedColor?.id === color.id || (!selectedColor && color.id === standardColors[0].id));
                        const colorOos = isRetail && getColorStock(color.id) === 0;
                        return (
                          <button
                            key={color.id}
                            onClick={() => {
                              if (!colorOos) {
                                setSelectedColor({ id: color.id, name: color.name[locale], hex: color.hex });
                                setIsCustomColor(false);
                                setQuantity(1);
                              }
                            }}
                            className={cn(
                              "relative w-10 h-10 rounded border-2 transition-all",
                              isActive ? "border-foreground scale-110" : colorOos ? "border-border opacity-50 cursor-not-allowed" : "border-border hover:border-muted-foreground"
                            )}
                            style={{ backgroundColor: color.hex }}
                            title={color.name[locale]}
                          >
                            {colorOos && (
                              <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded">
                                <div className="w-full h-px bg-red-400 rotate-[-45deg]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* Custom color button */}
                    {hasCustomColors && (
                      <button
                        onClick={() => setCustomColorOpen(true)}
                        className={cn(
                          "mt-3 px-5 py-3.5 text-sm font-semibold rounded-2xl w-full transition-colors",
                          isCustomColor
                            ? "bg-foreground text-background"
                            : "bg-foreground text-background hover:opacity-90"
                        )}
                      >
                        {t("contractor.customColor")}
                      </button>
                    )}
                  </div>
                )}

                {/* Length selection (contractor) */}
                {contractor && availableSizes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2.5">
                      {t("contractor.size")}:
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {availableSizes.map((size) => {
                        const cId = selectedColor?.id || standardColors[0]?.id;
                        const sizeStock = cId ? getComboStock(cId, size.id) : 9999;
                        const sizeOos = sizeStock === 0;
                        const isActive = selectedSize === size.label || (!selectedSize && size.id === availableSizes[0].id);
                        const sizePrice = cId ? (activeColorObj as any)?.combo_prices?.[size.id] : undefined;
                        return (
                          <button
                            key={size.id}
                            onClick={() => !sizeOos && setSelectedSize(size.label)}
                            className={cn(
                              "relative px-4 py-2.5 rounded-lg border text-sm font-medium transition-all flex flex-col items-center min-w-[56px] text-center",
                              isActive
                                ? "border-foreground bg-foreground text-background"
                                : sizeOos
                                ? "border-border text-muted-foreground cursor-not-allowed"
                                : "border-border hover:border-muted-foreground"
                            )}
                          >
                            <span className={cn(sizeOos && "opacity-40")}>{size.label}</span>
                            {sizePrice != null && sizePrice > 0 && (
                              <span className={cn("text-[11px]", isActive ? "opacity-80" : "text-muted-foreground", sizeOos && "opacity-30")}>
                                {t("common.currency")}{sizePrice}
                              </span>
                            )}
                            {sizeOos && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-[calc(100%-8px)] h-px bg-red-400 rotate-[-15deg]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                {!isOutOfStock && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-sm font-medium text-foreground">{t("product.quantity")}</p>
                      {maxQty < 9999 && <span className="text-xs text-muted-foreground">{locale === "ar" ? "متوفر" : "במלאי"}: {maxQty}</span>}
                    </div>
                    <QuantitySelector
                      quantity={quantity}
                      onQuantityChange={(q) => setQuantity(Math.min(q, maxQty))}
                      max={maxQty}
                    />
                  </div>
                )}
              </div>

              {/* Add to cart button */}
              <div className="p-5 border-t border-border">
                <AnimatePresence mode="wait">
                  {isOutOfStock ? (
                    <div className="w-full h-12 flex items-center justify-center border-2 border-red-200 rounded-full text-red-500 font-medium text-sm">
                      אזל מהמלאי
                    </div>
                  ) : addedConfirm ? (
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

      {/* Custom color modal */}
      <CustomColorModal
        open={customColorOpen}
        onClose={() => setCustomColorOpen(false)}
        onSelect={(color) => { setSelectedColor(color); setIsCustomColor(true); }}
        colorGroups={customColorGroups}
        selectedColorId={selectedColor?.id}
      />
    </>
  );
};
