import DOMPurify from "dompurify";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ZoomIn, X, Check, Star, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight, Loader2, Pencil, AlertCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { QuantitySelector } from "@/components/QuantitySelector";
import { CustomColorModal } from "@/components/CustomColorModal";
import { useShopData } from "@/hooks/useShopData";
import type { RetailProduct, ContractorProduct, ColorOption } from "@/data/products";
import { getLocaleText } from "@/data/products";
import { useCart, CartItemOptions } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead, getProductSchema, getBreadcrumbSchema, getOrganizationSchema } from "@/components/SEOHead";
import { useProfileColor } from "@/components/ProfileColorPicker";
import { useBrandTaxonomy } from "@/hooks/useProductTaxonomy";

/* ─── Fullscreen Gallery Lightbox ─── */
const ImageLightbox = ({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) => {
  const [idx, setIdx] = useState(startIndex);
  const isFirst = idx === 0;
  const isLast = idx === images.length - 1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && !isLast) setIdx((p) => p + 1);
      if (e.key === "ArrowLeft" && !isFirst) setIdx((p) => p - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFirst, isLast, onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 end-4 w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted z-10"><X className="w-5 h-5" /></button>
      <img src={images[idx]} alt="" className="max-h-[80vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
      {images.length > 1 && (
        <div className="absolute bottom-6 inset-x-0 flex justify-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-4 bg-background border border-border rounded-full px-4 py-2 shadow-sm">
            <button onClick={() => !isFirst && setIdx((p) => p - 1)} disabled={isFirst} className={cn("w-8 h-8 flex items-center justify-center rounded-full transition-colors", isFirst ? "opacity-30 cursor-not-allowed" : "hover:bg-muted")}><ChevronRight className="w-4 h-4" /></button>
            <span className="text-sm font-medium tabular-nums">{idx + 1} / {images.length}</span>
            <button onClick={() => !isLast && setIdx((p) => p + 1)} disabled={isLast} className={cn("w-8 h-8 flex items-center justify-center rounded-full transition-colors", isLast ? "opacity-30 cursor-not-allowed" : "hover:bg-muted")}><ChevronLeft className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

/* ─── Mobile Swipe Gallery ─── */
const MobileGallery = ({ images, onZoom }: { images: string[]; onZoom: (idx: number) => void }) => {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef(0);
  const touchEnd = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEnd.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStart.current - touchEnd.current;
    if (Math.abs(diff) > 50) {
      const isRtl = document.documentElement.dir === 'rtl';
      if (isRtl ? diff < 0 : diff > 0) setCurrent((p) => Math.min(p + 1, images.length - 1));
      else setCurrent((p) => Math.max(p - 1, 0));
    }
  };
  return (
    <div className="relative overflow-hidden rounded-xl bg-muted">
      <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(${document.documentElement.dir === 'rtl' ? current * 100 : -current * 100}%)` }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {images.map((img, i) => (<div key={i} className="w-full flex-shrink-0 aspect-[4/5]"><img src={img} alt="" className="w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} /></div>))}
      </div>
      <button onClick={() => onZoom(current)} className="absolute top-3 start-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center"><ZoomIn className="w-4 h-4" /></button>
      {images.length > 1 && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center">
          <div className="bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 flex gap-1.5">
            {images.map((_, i) => (<button key={i} onClick={() => setCurrent(i)} className={cn("w-2 h-2 rounded-full transition-all", i === current ? "bg-white scale-110" : "bg-white/40")} />))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Desktop Gallery ─── */
const DesktopGallery = ({ images, onZoom, badges }: { images: string[]; onZoom: (idx: number) => void; badges?: React.ReactNode }) => {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef(0);
  const touchEnd = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEnd.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStart.current - touchEnd.current;
    if (Math.abs(diff) > 50) {
      const isRtl = document.documentElement.dir === 'rtl';
      if (isRtl ? diff < 0 : diff > 0) setCurrent((p) => Math.min(p + 1, images.length - 1));
      else setCurrent((p) => Math.max(p - 1, 0));
    }
  };
  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted cursor-zoom-in" onClick={() => onZoom(current)} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <AnimatePresence mode="wait">
          <motion.img key={current} src={images[current]} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="w-full h-full object-cover" />
        </AnimatePresence>
        <button onClick={(e) => { e.stopPropagation(); onZoom(current); }} className="absolute bottom-3 start-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center"><ZoomIn className="w-4 h-4" /></button>
        {badges}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (<button key={i} onClick={() => setCurrent(i)} className={cn("w-20 h-20 rounded-lg overflow-hidden border-2 transition-all", i === current ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100")}><img src={img} alt="" className="w-full h-full object-cover" /></button>))}
        </div>
      )}
    </div>
  );
};

const ProductImagesSection = ({ images }: { images: string[] }) => {
  if (images.length <= 1) return null;
  return (<div className="space-y-4">{images.map((img, i) => (<div key={i} className="rounded-xl overflow-hidden"><img src={img} alt="" className="w-full h-auto object-cover" loading="lazy" /></div>))}</div>);
};

/* ─── Retail Product Page ─── */
const RetailProductPage = ({ product, collections, relatedProducts }: { product: RetailProduct; collections: any[]; relatedProducts: any[] }) => {
  const { t, locale, localePath } = useLocale();
  const { addItem: addToCart, items: cartItems } = useCart();
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(product.colors[0] || null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [meterLength, setMeterLength] = useState<number>(1);
  const isMeterProduct = product.soldByMeter === true;
  const profileColor = useProfileColor((s) => s.selectedColor);
  const retailSizes = (product as any).sizes || [];
  const hasRetailSizes = retailSizes.length > 0;

  // Auto-apply profile color on mount
  useEffect(() => {
    if (!profileColor || !product.colors.length) return;
    const match = product.colors.find(c => c.id === profileColor.id);
    if (match) setSelectedColor(match);
  }, [profileColor?.id]);

  // Auto-select first size for retail products with sizes
  useEffect(() => {
    if (hasRetailSizes && !selectedSize) {
      // Filter sizes by color's lengths if available
      const colorObj = selectedColor as any;
      const available = (colorObj?.lengths?.length > 0)
        ? retailSizes.filter((s: any) => colorObj.lengths.includes(s.id))
        : retailSizes;
      if (available.length > 0) setSelectedSize(available[0].label[locale]);
    }
  }, [selectedColor?.id, hasRetailSizes]);

  const [isAdding, setIsAdding] = useState(false);
  const [addedConfirm, setAddedConfirm] = useState(false);
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const collection = collections.find((c) => c.id === product.collection);
  const { data: brandTaxonomy = [] } = useBrandTaxonomy();
  const productBrands = (product.brands || []).map(id => brandTaxonomy.find(b => b.id === id)).filter(Boolean);

  // Inventory loading
  const { data: inventory = [] } = useQuery({
    queryKey: ['product_inventory', product.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('inventory').select('*').eq('product_id', product.id);
      return (data || []) as { variation_key: string; stock_quantity: number }[];
    },
  });
  const invMap = new Map(inventory.map(i => [i.variation_key, i.stock_quantity]));
  const getColorStock = (colorId: string) => invMap.get(`color:${colorId}`) ?? 9999;

  const currentStock = selectedColor ? getColorStock(selectedColor.id) : (product.colors.length === 0 ? 9999 : 9999);
  const isOutOfStock = currentStock === 0;
  const activeColorId = selectedColor?.id || "";
  const cartQty = cartItems
    .filter(i => i.product.id === product.id && (i.options?.color?.id || "") === activeColorId)
    .reduce((sum, i) => sum + i.quantity, 0);
  const effectiveMax = isOutOfStock ? 0 : Math.max(0, currentStock - cartQty);
  const cartFull = currentStock > 0 && effectiveMax === 0;

  const handleZoom = (idx: number) => { setLightboxStart(idx); setLightboxOpen(true); };

  const handleAdd = async () => {
    if (isOutOfStock || effectiveMax === 0) return;
    setStockWarning(null);
    setIsAdding(true);
    const { data: freshInv } = await (supabase as any).from('inventory').select('variation_key,stock_quantity').eq('product_id', product.id);
    const freshMap = new Map((freshInv || []).map((r: any) => [r.variation_key, r.stock_quantity]));
    const freshStock: number = activeColorId ? Number(freshMap.get(`color:${activeColorId}`) ?? 9999) : 9999;
    const freshEffective = Math.max(0, freshStock - cartQty);
    if (freshEffective === 0 && freshStock !== 9999) {
      qc.invalidateQueries({ queryKey: ['product_inventory', product.id] });
      setStockWarning(locale === "ar" ? "نفد المخزون — تم تحديث الكمية" : "אזל מהמלאי — המלאי עודכן");
      setIsAdding(false);
      return;
    }
    const options: CartItemOptions = {};
    if (selectedColor) options.color = { id: selectedColor.id, name: selectedColor.name[locale], hex: selectedColor.hex };
    if (selectedSize) options.size = selectedSize;
    if (isMeterProduct && meterLength > 0) options.meterLength = meterLength;
    await new Promise((r) => setTimeout(r, 300));
    addToCart(product, Math.min(quantity, freshEffective), options);
    setQuantity(1);
    setIsAdding(false);
    setAddedConfirm(true);
    setTimeout(() => setAddedConfirm(false), 1000);
  };

  const productDesc = getLocaleText(product.description, locale) || product.name[locale];
  const colName = collection ? collection.name[locale] : "";
  const seoJsonLd = [
    getOrganizationSchema(),
    getProductSchema({ name: product.name[locale], description: productDesc, price: product.price, images: product.images, slug: product.slug, collection: colName }),
    getBreadcrumbSchema([
      { name: t("nav.shop"), url: `/${locale}/shop` },
      ...(collection ? [{ name: colName, url: `/${locale}/shop?collection=${collection.slug}` }] : []),
      { name: product.name[locale], url: `/${locale}/product/${product.slug}` },
    ]),
  ];

  return (
    <Layout>
      <SEOHead
        title={`${product.name[locale]} | A.M.G PERGOLA`}
        description={productDesc.slice(0, 155)}
        ogImage={product.images[0]}
        ogType="product"
        jsonLd={seoJsonLd}
      />
      <div className="section-container pt-2 pb-1 md:mt-16">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to={localePath("/shop")} className="hover:text-foreground transition-colors">{t("nav.shop")}</Link>
          <span>/</span>
          {collection && (<><Link to={localePath(`/shop?collection=${collection.slug}`)} className="hover:text-foreground transition-colors">{collection.name[locale]}</Link><span>/</span></>)}
          <span className="text-foreground">{product.name[locale]}</span>
        </div>
      </div>

      <section className="py-4 md:py-8">
        <div className="section-container">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
            <div className="lg:col-span-7">
              {isMobile ? (<MobileGallery images={product.images} onZoom={handleZoom} />) : (
                <DesktopGallery images={product.images} onZoom={handleZoom} badges={
                  <div className="absolute top-4 start-4 flex flex-col gap-2">
                    {product.new && <span className="px-3 py-1 text-[10px] font-semibold bg-primary text-primary-foreground rounded-md">{t("product.newBadge")}</span>}
                    {product.featured && <span className="px-3 py-1 text-[10px] font-semibold bg-foreground text-background rounded-md">{t("product.featuredBadge")}</span>}
                  </div>
                } />
              )}
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {collection && <Link to={localePath(`/shop?collection=${collection.slug}`)} className="text-xs font-semibold text-accent-strong">{collection.name[locale]}</Link>}
                {collection && productBrands.length > 0 && <span className="text-xs text-muted-foreground">·</span>}
                {productBrands.map((b) => (
                  <Link key={b!.id} to={localePath(`/shop?brand=${b!.id}`)} className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">{locale === "ar" ? b!.name_ar : b!.name_he}</Link>
                ))}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name[locale]}</h1>
              <p className="text-2xl font-bold mb-4">
                {t("common.currency")}{product.price.toLocaleString()}
                {isMeterProduct && <span className="text-sm font-normal text-muted-foreground ms-1">/ {locale === "ar" ? "متر" : "מטר"}</span>}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{getLocaleText(product.description, locale)}</p>
              <div className="h-px bg-border mb-5" />
              {product.colors.length > 0 && (
                <div className="mb-5">
                  <span className="text-sm font-medium text-foreground block mb-2">{t("contractor.color")}: <span className="text-muted-foreground font-normal">{selectedColor?.name[locale]}</span></span>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => {
                      const colorStock = getColorStock(color.id);
                      const colorOos = colorStock === 0;
                      const isActive = selectedColor?.id === color.id;
                      return (
                        <div key={color.id} className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => { if (!colorOos) { setSelectedColor(color); setQuantity(1); } }}
                            className={cn("relative w-10 h-10 rounded-xl border-2 transition-all",
                              isActive
                                ? "border-foreground ring-2 ring-foreground/25 ring-offset-1 scale-105 shadow-sm"
                                : colorOos
                                ? "border-border/60 opacity-50 cursor-not-allowed"
                                : "border-border/60 hover:border-foreground/40 hover:scale-105"
                            )}
                            style={{ backgroundColor: color.hex }}
                            title={color.name[locale]}
                          >
                            {colorOos && <div className="absolute inset-0 flex items-center justify-center rounded-xl overflow-hidden"><div className="w-full h-px bg-red-400 rotate-[-45deg]" /></div>}
                          </button>
                          <span className="text-[9px] text-muted-foreground leading-none max-w-[44px] truncate text-center">{color.name[locale]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size/Length selector for retail products with sizes */}
              {hasRetailSizes && (() => {
                const colorObj = selectedColor as any;
                const availRetailSizes = (colorObj?.lengths?.length > 0)
                  ? retailSizes.filter((s: any) => colorObj.lengths.includes(s.id))
                  : retailSizes;
                return availRetailSizes.length > 0 ? (
                  <div className="mb-5">
                    <span className="text-sm font-medium text-foreground block mb-2">
                      {t("contractor.size")}: <span className="text-muted-foreground font-normal">{selectedSize}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {availRetailSizes.map((size: any) => {
                        const isActive = selectedSize === size.label[locale];
                        const sizePrice = (colorObj?.combo_prices as any)?.[size.id];
                        return (
                          <button
                            key={size.id}
                            onClick={() => { setSelectedSize(size.label[locale]); setQuantity(1); }}
                            className={cn(
                              "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all flex flex-col items-center min-w-[56px]",
                              isActive
                                ? "border-foreground bg-foreground text-background"
                                : "border-border hover:border-muted-foreground"
                            )}
                          >
                            <span>{size.label[locale]}</span>
                            {sizePrice != null && sizePrice > 0 && (
                              <span className={cn("text-[11px]", isActive ? "opacity-80" : "text-muted-foreground")}>
                                {t("common.currency")}{sizePrice}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null;
              })()}

              {stockWarning && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{stockWarning}
                </div>
              )}
              {isOutOfStock ? (
                <div className="w-full h-14 flex items-center justify-center border-2 border-red-200 rounded-xl text-red-500 font-medium text-sm mb-5">
                  אזל מהמלאי
                </div>
              ) : cartFull ? (
                <div className="w-full h-14 flex items-center justify-center border-2 border-amber-200 rounded-xl text-amber-700 font-medium text-sm mb-5">
                  כל המלאי כבר בסל
                </div>
              ) : (
                <>
                  {isMeterProduct && (
                    <div className="mb-5">
                      <span className="text-sm font-medium text-foreground block mb-2">{locale === "ar" ? "الطول (متر)" : "אורך (מטר)"}</span>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={meterLength}
                        onChange={(e) => setMeterLength(Math.max(0.1, Number(e.target.value)))}
                        className="w-full h-11 rounded-lg border border-border px-4 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      />
                    </div>
                  )}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{t("product.quantity")}</span>
                      <span className="text-xs text-muted-foreground">
                        {currentStock < 9999 && <>{locale === "ar" ? "متوفر" : "במלאי"}: {effectiveMax}</>}
                        {cartQty > 0 && <> · {cartQty} {locale === "ar" ? "في السلة" : "בסל"}</>}
                      </span>
                    </div>
                    <QuantitySelector quantity={quantity} onQuantityChange={(q) => setQuantity(Math.min(q, effectiveMax))} max={effectiveMax} />
                  </div>
                  {isMeterProduct && meterLength > 0 && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {locale === "ar" ? "المجموع" : "סה״כ"}: {meterLength} × {t("common.currency")}{currentPrice.toLocaleString()} × {quantity} = <span className="font-bold text-foreground">{t("common.currency")}{(currentPrice * meterLength * quantity).toLocaleString()}</span>
                    </p>
                  )}
                  <AnimatePresence mode="wait">
                    {addedConfirm ? (
                      <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full h-14 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl bg-green-600 text-white"><Check className="w-4 h-4" />{t("contractor.addedToCart")}</motion.div>
                    ) : (
                      <motion.div key="add">
                        <Button size="lg" onClick={handleAdd} disabled={isAdding} className="rounded-xl w-full py-6 text-sm font-semibold">
                          {isAdding ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <ShoppingBag className="w-4 h-4 me-2" />}
                          {isAdding ? t("product.adding") : t("product.addToBag")}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
              <div className="mt-6 pt-5 border-t border-border grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center gap-1.5"><Truck className="w-5 h-5 text-muted-foreground" /><p className="text-[10px] font-semibold text-muted-foreground">{t("product.shipping")}</p><p className="text-[10px] text-muted-foreground">{t("product.shippingText")}</p></div>
                <div className="flex flex-col items-center text-center gap-1.5"><RotateCcw className="w-5 h-5 text-muted-foreground" /><p className="text-[10px] font-semibold text-muted-foreground">{t("product.returns")}</p><p className="text-[10px] text-muted-foreground">{t("product.returnsText")}</p></div>
                <div className="flex flex-col items-center text-center gap-1.5"><Shield className="w-5 h-5 text-muted-foreground" /><p className="text-[10px] font-semibold text-muted-foreground">{t("product.warranty")}</p><p className="text-[10px] text-muted-foreground">{t("product.warrantyText")}</p></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="section-container">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("product.about")}</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-5">{product.name[locale]}</h2>
              <p className="text-base text-muted-foreground leading-relaxed">{getLocaleText(product.longDescription, locale)}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">{t("product.productDetails")}</h3>
              {(product as any).productDetails && (product as any).productDetails.length > 0 ? (
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {(product as any).productDetails.map((d: any, i: number) => {
                    const label = locale === "ar" ? d.label_ar : d.label_he;
                    const value = locale === "ar" ? d.value_ar : d.value_he;
                    if (!label && !value) return null;
                    return (
                      <div key={i} className={cn("flex justify-between py-3.5 px-4", i % 2 === 0 ? "bg-muted/50" : "")}>
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  <div className="flex justify-between py-3.5 px-4 bg-muted/50"><span className="text-sm text-muted-foreground">{t("product.materials")}</span><span className="text-sm font-medium">{product.materials}</span></div>
                  {product.dimensions && (<div className="flex justify-between py-3.5 px-4"><span className="text-sm text-muted-foreground">{t("product.dimensions")}</span><span className="text-sm font-medium">{product.dimensions}</span></div>)}
                  <div className="flex justify-between py-3.5 px-4 bg-muted/50"><span className="text-sm text-muted-foreground">{t("product.warranty")}</span><span className="text-sm font-medium">{t("product.warrantyText")}</span></div>
                </div>
              )}
            </div>
          </div>
          {(product as any).contentHtml?.[locale] ? (
            <div className="mt-12 prose prose-sm md:prose-base max-w-none [&_img]:rounded-xl [&_video]:rounded-xl [&_img]:w-full [&_video]:w-full" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((product as any).contentHtml[locale], { ADD_TAGS: ['iframe'], ADD_ATTR: ['allowfullscreen', 'frameborder', 'allow'] }) }} />
          ) : (
            <div className="mt-12"><ProductImagesSection images={product.images} /></div>
          )}
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="py-10 md:py-14 border-t border-border">
          <div className="section-container md:!max-w-[90%]">
            <h2 className="text-xl md:text-2xl font-bold mb-8">{t("product.relatedProducts")}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">{relatedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
          </div>
        </section>
      )}

      <AnimatePresence>{lightboxOpen && (<ImageLightbox images={product.images} startIndex={lightboxStart} onClose={() => setLightboxOpen(false)} />)}</AnimatePresence>
    </Layout>
  );
};

/* ─── Contractor Product Page ─── */
const ContractorProductPage = ({ product, collections, relatedProducts }: { product: ContractorProduct; collections: any[]; relatedProducts: any[] }) => {
  const { t, locale, localePath } = useLocale();
  const { addItem, items: cartItems } = useCart();
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedColor, setSelectedColor] = useState<{ id: string; name: string; hex: string; prices?: Record<string, number> } | null>(null);
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes[0]?.label[locale] || null);
  const [quantity, setQuantity] = useState(1);
  const [meterLength, setMeterLength] = useState<number>(1);
  const isMeterProduct = product.soldByMeter === true;
  const [addedConfirm, setAddedConfirm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);
  const collection = collections.find((c) => c.id === product.collection);
  const { data: brandTaxonomy = [] } = useBrandTaxonomy();
  const productBrands = (product.brands || []).map(id => brandTaxonomy.find(b => b.id === id)).filter(Boolean);

  const standardColors = product.colorGroups[0]?.colors || [];
  const customColorGroups = product.colorGroups.slice(1);
  const hasCustomColors = customColorGroups.length > 0 && customColorGroups.some(g => g.colors.length > 0);

  // Fetch inventory for this product (stock per combo)
  const { data: inventory = [] } = useQuery({
    queryKey: ['product_inventory', product.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('inventory').select('*').eq('product_id', product.id);
      return (data || []) as { variation_key: string; stock_quantity: number }[];
    },
  });
  const invMap = new Map(inventory.map(i => [i.variation_key, i.stock_quantity]));

  // Get stock quantity for a color+size combo
  const getComboStock = (colorId: string, sizeId: string) =>
    invMap.get(`combo:${colorId}|${sizeId}`) ?? 9999;

  // Sizes available for selected color
  const colorObj = standardColors.find(c => c.id === selectedColor?.id);
  const availableSizes = (() => {
    if (isCustomColor && selectedColor?.prices) {
      return product.sizes.filter(s => selectedColor.prices![s.id] != null && selectedColor.prices![s.id] > 0);
    }
    if (colorObj?.lengths && colorObj.lengths.length > 0) {
      return product.sizes.filter(s => colorObj.lengths!.includes(s.id));
    }
    return product.sizes;
  })();

  // Current selected size object
  const selectedSizeObj = availableSizes.find(s => s.label[locale] === selectedSize);

  // Price: custom color uses per-size prices, otherwise combo_prices or base price
  const currentPrice = (() => {
    if (isCustomColor && selectedColor?.prices && selectedSizeObj) {
      return selectedColor.prices[selectedSizeObj.id] || product.price;
    }
    if (colorObj && selectedSizeObj && colorObj.combo_prices) {
      const p = colorObj.combo_prices[selectedSizeObj.id];
      if (p && p > 0) return p;
    }
    return selectedSizeObj?.price || product.price;
  })();

  // Stock for current selection
  const activeColorId = selectedColor?.id || standardColors[0]?.id || "";
  const activeSizeLabel = selectedSize || availableSizes[0]?.label[locale] || "";
  const currentStock = selectedColor && selectedSizeObj
    ? getComboStock(selectedColor.id, selectedSizeObj.id)
    : 9999;
  const isOutOfStock = !isCustomColor && currentStock === 0;
  const cartQty = cartItems
    .filter(i => i.product.id === product.id && (i.options?.size || "") === activeSizeLabel && (i.options?.color?.id || "") === activeColorId)
    .reduce((sum, i) => sum + i.quantity, 0);
  const effectiveMax = isOutOfStock ? 0 : isCustomColor ? 9999 : Math.max(0, currentStock - cartQty);
  const cartFull = !isCustomColor && currentStock > 0 && effectiveMax === 0;

  const profileColor = useProfileColor((s) => s.selectedColor);

  useEffect(() => {
    if (!selectedColor && standardColors.length > 0) {
      // Check if profile color matches a standard color
      if (profileColor) {
        const match = standardColors.find(c => c.id === profileColor.id);
        if (match) {
          setSelectedColor({ id: match.id, name: match.name[locale], hex: match.hex });
          return;
        }
      }
      setSelectedColor({ id: standardColors[0].id, name: standardColors[0].name[locale], hex: standardColors[0].hex });
    }
  }, []);

  // When color changes, reset size to first in-stock size for that color
  useEffect(() => {
    const firstInStock = availableSizes.find(s => {
      if (!selectedColor) return true;
      return getComboStock(selectedColor.id, s.id) > 0;
    });
    if (firstInStock) setSelectedSize(firstInStock.label[locale]);
    else if (availableSizes.length > 0) setSelectedSize(availableSizes[0].label[locale]);
  }, [selectedColor?.id, inventory.length]);

  const handleZoom = (idx: number) => { setLightboxStart(idx); setLightboxOpen(true); };

  const handleAdd = async () => {
    if (isOutOfStock || effectiveMax === 0) return;
    setStockWarning(null);
    setIsAdding(true);
    const colorOption = selectedColor || (standardColors.length > 0 ? { id: standardColors[0].id, name: standardColors[0].name[locale], hex: standardColors[0].hex } : undefined);
    // Fresh DB check (skip for custom colors — no stock tracking)
    if (!isCustomColor) {
      const { data: freshInv } = await (supabase as any).from('inventory').select('variation_key,stock_quantity').eq('product_id', product.id);
      const freshMap = new Map((freshInv || []).map((r: any) => [r.variation_key, r.stock_quantity]));
      const sizeObj = availableSizes.find(s => s.label[locale] === activeSizeLabel);
      const freshStock: number = activeColorId && sizeObj ? Number(freshMap.get(`combo:${activeColorId}|${sizeObj.id}`) ?? 9999) : 9999;
      const freshEffective = Math.max(0, freshStock - cartQty);
      if (freshEffective === 0 && freshStock !== 9999) {
        qc.invalidateQueries({ queryKey: ['product_inventory', product.id] });
        setStockWarning(locale === "ar" ? "نفد المخزون — تم تحديث الكمية" : "אזל מהמלאי — המלאי עודכן");
        setIsAdding(false);
        return;
      }
    }
    await new Promise((r) => setTimeout(r, 300));
    const productToAdd = currentPrice !== product.price ? { ...product, price: currentPrice } : product;
    const meterOpt = isMeterProduct && meterLength > 0 ? meterLength : undefined;
    addItem(productToAdd, Math.min(quantity, isCustomColor ? 9999 : effectiveMax), { color: colorOption, size: selectedSize || undefined, meterLength: meterOpt });
    setIsAdding(false);
    setAddedConfirm(true);
    setTimeout(() => { setAddedConfirm(false); setQuantity(1); }, 1000);
  };

  const productDesc = getLocaleText(product.description, locale) || product.name[locale];
  const colName = collection ? collection.name[locale] : "";
  const seoJsonLd = [
    getOrganizationSchema(),
    getProductSchema({ name: product.name[locale], description: productDesc, price: product.price, images: product.images, sku: product.sku, slug: product.slug, collection: colName }),
    getBreadcrumbSchema([
      { name: t("nav.shop"), url: `/${locale}/shop` },
      ...(collection ? [{ name: colName, url: `/${locale}/shop?collection=${collection.slug}` }] : []),
      { name: product.name[locale], url: `/${locale}/product/${product.slug}` },
    ]),
  ];

  return (
    <Layout>
      <SEOHead
        title={`${product.name[locale]} | A.M.G PERGOLA`}
        description={productDesc.slice(0, 155)}
        ogImage={product.images[0]}
        ogType="product"
        jsonLd={seoJsonLd}
      />
      <div className="section-container pt-2 pb-1 md:mt-16">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to={localePath("/shop")} className="hover:text-foreground transition-colors">{t("nav.shop")}</Link>
          <span>/</span>
          {collection && (<><Link to={localePath(`/shop?collection=${collection.slug}`)} className="hover:text-foreground transition-colors">{collection.name[locale]}</Link><span>/</span></>)}
          <span className="text-foreground">{product.name[locale]}</span>
        </div>
      </div>

      <section className="py-4 md:py-6">
        <div className="section-container">
          <div className="grid lg:grid-cols-12 gap-5 lg:gap-8">
            <div className="lg:col-span-5">
              {isMobile ? (<MobileGallery images={product.images} onZoom={handleZoom} />) : (<div className="sticky top-24"><DesktopGallery images={product.images} onZoom={handleZoom} /></div>)}
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="lg:col-span-7 lg:sticky lg:top-24 lg:self-start">
              {(collection || productBrands.length > 0) && (
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {collection && <Link to={localePath(`/shop?collection=${collection.slug}`)} className="text-xs font-semibold text-accent-strong">{collection.name[locale]}</Link>}
                  {collection && productBrands.length > 0 && <span className="text-xs text-muted-foreground">·</span>}
                  {productBrands.map((b) => (
                    <Link key={b!.id} to={localePath(`/shop?brand=${b!.id}`)} className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">{locale === "ar" ? b!.name_ar : b!.name_he}</Link>
                  ))}
                </div>
              )}
              <h1 className="text-xl md:text-2xl font-bold mb-1">{product.name[locale]}</h1>
              <p className="text-sm text-muted-foreground mb-1">{t("contractor.sku")}: {product.sku}</p>
              <p className="text-2xl font-bold mb-3">
                {t("common.currency")}{currentPrice.toLocaleString()}
                {isMeterProduct && <span className="text-sm font-normal text-muted-foreground ms-1">/ {locale === "ar" ? "متر" : "מטר"}</span>}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{getLocaleText(product.description, locale)}</p>
              <div className="h-px bg-border mb-4" />

              {standardColors.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground mb-2">{t("contractor.color")}: <span className="text-muted-foreground font-normal">{selectedColor?.name || standardColors[0].name[locale]}</span></p>
                  {isCustomColor && selectedColor && (
                    <div className="flex items-center gap-2.5 mb-3 p-2.5 rounded-xl border border-foreground bg-muted">
                      <span className="w-8 h-8 rounded-lg border border-foreground flex-shrink-0" style={{ backgroundColor: selectedColor.hex }} />
                      <span className="text-sm font-medium text-foreground flex-1">{selectedColor.name}</span>
                      <button onClick={() => { setIsCustomColor(false); setSelectedColor(null); }} className="text-xs text-muted-foreground hover:text-foreground underline">{t("contractor.cancel")}</button>
                    </div>
                  )}
                  <div className={cn("flex gap-3 flex-wrap", isCustomColor && "opacity-40 pointer-events-none")}>
                    {standardColors.map((color) => {
                      const isActive = !isCustomColor && (selectedColor?.id === color.id || (!selectedColor && color.id === standardColors[0].id));
                      return (
                        <div key={color.id} className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => { setSelectedColor({ id: color.id, name: color.name[locale], hex: color.hex }); setIsCustomColor(false); }}
                            className={cn("w-10 h-10 rounded-xl border-2 transition-all",
                              isActive
                                ? "border-foreground ring-2 ring-foreground/25 ring-offset-1 scale-105 shadow-sm"
                                : "border-border/60 hover:border-foreground/40 hover:scale-105"
                            )}
                            style={{ backgroundColor: color.hex }}
                            title={color.name[locale]}
                          />
                          <span className="text-[9px] text-muted-foreground leading-none max-w-[44px] truncate text-center">{color.name[locale]}</span>
                        </div>
                      );
                    })}
                  </div>
                  {hasCustomColors && (<button onClick={() => setCustomColorOpen(true)} className="mt-3 px-5 py-3 text-sm font-semibold rounded-xl w-full bg-foreground text-background hover:opacity-90 transition-opacity">{t("contractor.customColor")}</button>)}
                </div>
              )}

              {availableSizes.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground mb-2">{t("contractor.size")}:</p>
                  <div className="flex gap-2 flex-wrap">
                    {availableSizes.map((size) => {
                      const sizeStock = selectedColor ? getComboStock(selectedColor.id, size.id) : 9999;
                      const sizeOutOfStock = sizeStock === 0;
                      const isActive = selectedSize === size.label[locale] || (!selectedSize && size.id === availableSizes[0].id);
                      const sizePrice = colorObj?.combo_prices?.[size.id];
                      return (
                        <button key={size.id} onClick={() => !sizeOutOfStock && setSelectedSize(size.label[locale])}
                          className={cn(
                            "relative px-3 py-2.5 rounded-lg border text-sm font-medium transition-all min-w-[56px] text-center",
                            sizeOutOfStock ? "border-red-200 bg-red-50 text-red-300 cursor-not-allowed" :
                            isActive ? "border-foreground bg-foreground text-background" :
                            "border-border hover:border-muted-foreground"
                          )}>
                          <span className={cn(sizeOutOfStock && "opacity-50")}>{size.label[locale]}</span>
                          {sizePrice != null && sizePrice > 0 && (
                            <div className={cn("text-[10px] block", sizeOutOfStock ? "opacity-30" : isActive ? "opacity-80" : "text-muted-foreground")}>
                              {t("common.currency")}{sizePrice}
                            </div>
                          )}
                          {sizeOutOfStock && (
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

              {stockWarning && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{stockWarning}
                </div>
              )}
              {isOutOfStock ? (
                <div className="w-full h-14 flex items-center justify-center border-2 border-red-200 rounded-xl text-red-500 font-medium text-sm mb-4">
                  אזל מהמלאי
                </div>
              ) : cartFull ? (
                <div className="w-full h-14 flex items-center justify-center border-2 border-amber-200 rounded-xl text-amber-700 font-medium text-sm mb-4">
                  כל המלאי כבר בסל
                </div>
              ) : (
                <>
                  {isMeterProduct && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-foreground block mb-2">{locale === "ar" ? "الطول (متر)" : "אורך (מטר)"}</span>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={meterLength}
                        onChange={(e) => setMeterLength(Math.max(0.1, Number(e.target.value)))}
                        className="w-full h-11 rounded-lg border border-border px-4 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      />
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">{t("product.quantity")}</p>
                      {!isCustomColor && currentStock < 9999 && effectiveMax > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {locale === "ar" ? "متوفر" : "במלאי"}: {effectiveMax}
                          {cartQty > 0 && <> · {cartQty} {locale === "ar" ? "في السلة" : "בסל"}</>}
                        </span>
                      )}
                    </div>
                    <QuantitySelector quantity={quantity} onQuantityChange={(q) => setQuantity(Math.min(q, effectiveMax))} max={effectiveMax} />
                  </div>
                  {isMeterProduct && meterLength > 0 && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {locale === "ar" ? "المجموع" : "סה״כ"}: {meterLength} × {t("common.currency")}{currentPrice.toLocaleString()} × {quantity} = <span className="font-bold text-foreground">{t("common.currency")}{(currentPrice * meterLength * quantity).toLocaleString()}</span>
                    </p>
                  )}

                  <AnimatePresence mode="wait">
                    {addedConfirm ? (
                      <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full h-14 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl bg-green-600 text-white"><Check className="w-4 h-4" />{t("contractor.addedToCart")}</motion.div>
                    ) : (
                      <motion.button key="add" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={handleAdd} disabled={isAdding} className={cn("w-full h-14 flex items-center justify-center text-sm font-semibold border-2 border-foreground rounded-xl transition-colors", isAdding ? "opacity-70 cursor-not-allowed" : "text-foreground hover:bg-foreground hover:text-background")}>
                        {isAdding ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <ShoppingBag className="w-4 h-4 me-2" />}
                        {isAdding ? t("product.adding") : t("product.addToBag")}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14 border-t border-border">
        <div className="section-container">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("product.about")}</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-5">{product.name[locale]}</h2>
              <p className="text-base text-muted-foreground leading-relaxed">{getLocaleText(product.longDescription, locale)}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">{t("product.productDetails")}</h3>
              {(product as any).productDetails && (product as any).productDetails.length > 0 ? (
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {(product as any).productDetails.map((d: any, i: number) => {
                    const label = locale === "ar" ? d.label_ar : d.label_he;
                    const value = locale === "ar" ? d.value_ar : d.value_he;
                    if (!label && !value) return null;
                    return (
                      <div key={i} className={cn("flex justify-between py-3.5 px-4", i % 2 === 0 ? "bg-muted/50" : "")}>
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    );
                  })}
                </div>
              ) : product.materials ? (
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  <div className="flex justify-between py-3.5 px-4 bg-muted/50"><span className="text-sm text-muted-foreground">{t("product.materials")}</span><span className="text-sm font-medium">{product.materials}</span></div>
                </div>
              ) : null}
            </div>
          </div>
          {(product as any).contentHtml?.[locale] ? (
            <div className="mt-12 prose prose-sm md:prose-base max-w-none [&_img]:rounded-xl [&_video]:rounded-xl [&_img]:w-full [&_video]:w-full" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((product as any).contentHtml[locale], { ADD_TAGS: ['iframe'], ADD_ATTR: ['allowfullscreen', 'frameborder', 'allow'] }) }} />
          ) : (
            <div className="mt-12"><ProductImagesSection images={product.images} /></div>
          )}
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="py-10 md:py-14 border-t border-border">
          <div className="section-container md:!max-w-[90%]">
            <h2 className="text-xl md:text-2xl font-bold mb-8">{t("product.relatedProducts")}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">{relatedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
          </div>
        </section>
      )}

      <CustomColorModal
        open={customColorOpen}
        onClose={() => setCustomColorOpen(false)}
        onSelect={(color) => {
          setSelectedColor(color);
          setIsCustomColor(true);
          if (color.prices) {
            const firstSize = product.sizes.find(s => color.prices![s.id] != null && color.prices![s.id] > 0);
            if (firstSize) setSelectedSize(firstSize.label[locale]);
          }
        }}
        colorGroups={customColorGroups}
        selectedColorId={selectedColor?.id}
        selectedSizeId={selectedSizeObj?.id}
      />
      <AnimatePresence>{lightboxOpen && (<ImageLightbox images={product.images} startIndex={lightboxStart} onClose={() => setLightboxOpen(false)} />)}</AnimatePresence>
    </Layout>
  );
};

/* ─── Admin Edit FAB ─── */
const AdminEditFab = ({ productId }: { productId: string }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return (
    <a
      href={`/admin/products/edit/${productId}`}
      className="fixed bottom-6 start-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full shadow-lg hover:bg-gray-700 transition-colors"
    >
      <Pencil className="w-3.5 h-3.5" />
      Edit Product
    </a>
  );
};

/* ─── Main Router ─── */
const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, localePath } = useLocale();
  const { getProductBySlug, getRelatedProducts, collections, isLoading } = useShopData();

  if (isLoading) {
    return (
      <Layout>
        <div className="section-container py-28 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const product = getProductBySlug(slug || "");

  if (!product) {
    return (
      <Layout>
        <div className="section-container py-28 text-center">
          <h1 className="text-3xl font-bold mb-4">{t("product.notFound")}</h1>
          <p className="text-muted-foreground mb-8">{t("product.notFoundText")}</p>
          <Button asChild className="rounded-lg"><Link to={localePath("/shop")}>{t("product.browseAll")}</Link></Button>
        </div>
      </Layout>
    );
  }

  const relatedProducts = getRelatedProducts(product.id);

  if (product.type === "contractor") {
    return (
      <>
        <ContractorProductPage product={product as ContractorProduct} collections={collections} relatedProducts={relatedProducts} />
        <AdminEditFab productId={product.id} />
      </>
    );
  }

  return (
    <>
      <RetailProductPage product={product as RetailProduct} collections={collections} relatedProducts={relatedProducts} />
      <AdminEditFab productId={product.id} />
    </>
  );
};

export default ProductDetail;
