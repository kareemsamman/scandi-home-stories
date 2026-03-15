import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ZoomIn, X, Check, Star, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { QuantitySelector } from "@/components/QuantitySelector";
import { CustomColorModal } from "@/components/CustomColorModal";
import { getProductBySlug, getRelatedProducts, collections, getLocaleText, RetailProduct, ContractorProduct, ColorOption } from "@/data/products";
import { useCart, CartItemOptions } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button onClick={onClose} className="absolute top-4 end-4 w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted z-10">
        <X className="w-5 h-5" />
      </button>

      {/* Image */}
      <img src={images[idx]} alt="" className="max-h-[80vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />

      {/* Bottom pagination with arrows */}
      {images.length > 1 && (
        <div className="absolute bottom-6 inset-x-0 flex justify-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-4 bg-background border border-border rounded-full px-4 py-2 shadow-sm">
            <button
              onClick={() => !isFirst && setIdx((p) => p - 1)}
              disabled={isFirst}
              className={cn("w-8 h-8 flex items-center justify-center rounded-full transition-colors", isFirst ? "opacity-30 cursor-not-allowed" : "hover:bg-muted")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium tabular-nums">
              {idx + 1} / {images.length}
            </span>
            <button
              onClick={() => !isLast && setIdx((p) => p + 1)}
              disabled={isLast}
              className={cn("w-8 h-8 flex items-center justify-center rounded-full transition-colors", isLast ? "opacity-30 cursor-not-allowed" : "hover:bg-muted")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

/* ─── Mobile Swipe Gallery with Dots ─── */
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
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${document.documentElement.dir === 'rtl' ? current * 100 : -current * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((img, i) => (
          <div key={i} className="w-full flex-shrink-0 aspect-[4/5]">
            <img src={img} alt="" className="w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
          </div>
        ))}
      </div>
      {/* Zoom button - top start on mobile */}
      <button
        onClick={() => onZoom(current)}
        className="absolute top-3 start-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      {/* Blurred dots */}
      {images.length > 1 && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center">
          <div className="bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === current ? "bg-white scale-110" : "bg-white/40"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Desktop Gallery with Thumbnails + Touch ─── */
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
      {/* Main image */}
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted cursor-zoom-in"
        onClick={() => onZoom(current)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={images[current]}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
        {/* Always-visible zoom button - bottom start */}
        <button
          onClick={(e) => { e.stopPropagation(); onZoom(current); }}
          className="absolute bottom-3 start-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        {/* Badges */}
        {badges}
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                i === current ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Additional Product Images Section ─── */
const ProductImagesSection = ({ images }: { images: string[] }) => {
  if (images.length <= 1) return null;
  return (
    <div className="space-y-4">
      {images.map((img, i) => (
        <div key={i} className="rounded-xl overflow-hidden">
          <img src={img} alt="" className="w-full h-auto object-cover" loading="lazy" />
        </div>
      ))}
    </div>
  );
};

/* ─── Retail (B2C) Product Page ─── */
const RetailProductPage = ({ product }: { product: RetailProduct }) => {
  const { t, locale, localePath } = useLocale();
  const { addItem: addToCart } = useCart();
  const isMobile = useIsMobile();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(product.colors[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const collection = collections.find((c) => c.id === product.collection);
  const relatedProducts = getRelatedProducts(product.id);

  const handleZoom = (idx: number) => {
    setLightboxStart(idx);
    setLightboxOpen(true);
  };

  const handleAdd = async () => {
    setIsAdding(true);
    const options: CartItemOptions = {};
    if (selectedColor) options.color = { id: selectedColor.id, name: selectedColor.name[locale], hex: selectedColor.hex };
    await new Promise((r) => setTimeout(r, 600));
    addToCart(product, quantity, options);
    setQuantity(1);
    setIsAdding(false);
  };

  return (
    <Layout>
      {/* Breadcrumb — light, no border */}
      <div className="section-container pt-2 pb-1 mt-14 md:mt-16">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to={localePath("/shop")} className="hover:text-foreground transition-colors">{t("nav.shop")}</Link>
          <span>/</span>
          {collection && (<><Link to={localePath(`/shop?collection=${collection.slug}`)} className="hover:text-foreground transition-colors">{collection.name[locale]}</Link><span>/</span></>)}
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <section className="py-4 md:py-8">
        <div className="section-container">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
            {/* LEFT: Image Gallery */}
            <div className="lg:col-span-7">
              {isMobile ? (
                <MobileGallery images={product.images} onZoom={handleZoom} />
              ) : (
                <DesktopGallery
                  images={product.images}
                  onZoom={handleZoom}
                  badges={
                    <div className="absolute top-4 start-4 flex flex-col gap-2">
                      {product.new && <span className="px-3 py-1 text-[10px] font-semibold bg-primary text-primary-foreground rounded-md">{t("product.newBadge")}</span>}
                      {product.featured && <span className="px-3 py-1 text-[10px] font-semibold bg-foreground text-background rounded-md">{t("product.featuredBadge")}</span>}
                    </div>
                  }
                />
              )}
            </div>

            {/* RIGHT: Product Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start"
            >
              {collection && (
                <Link to={localePath(`/shop?collection=${collection.slug}`)} className="text-xs font-semibold text-accent-strong mb-2 block">
                  {collection.name[locale]}
                </Link>
              )}
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-2xl font-bold mb-4">{t("common.currency")}{product.price.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{getLocaleText(product.description, locale)}</p>
              <div className="h-px bg-border mb-5" />

              {/* Color */}
              {product.colors.length > 0 && (
                <div className="mb-5">
                  <span className="text-sm font-medium text-foreground block mb-2">
                    {t("contractor.color")}: <span className="text-muted-foreground font-normal">{selectedColor?.name[locale]}</span>
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "w-9 h-9 rounded-full border-2 transition-all",
                          selectedColor?.id === color.id ? "border-foreground scale-110" : "border-border hover:border-muted-foreground"
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={color.name[locale]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-5">
                <span className="text-sm font-medium text-foreground block mb-2">{t("product.quantity")}</span>
                <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} />
              </div>

              {/* Add to cart with loading */}
              <Button
                size="lg"
                onClick={handleAdd}
                disabled={isAdding}
                className="rounded-xl w-full py-6 text-sm font-semibold"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                ) : (
                  <ShoppingBag className="w-4 h-4 me-2" />
                )}
                {isAdding ? t("product.adding") : t("product.addToBag")}
              </Button>

              {/* Trust badges */}
              <div className="mt-6 pt-5 border-t border-border grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center gap-1.5">
                  <Truck className="w-5 h-5 text-muted-foreground" />
                  <p className="text-[10px] font-semibold text-muted-foreground">{t("product.shipping")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("product.shippingText")}</p>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <RotateCcw className="w-5 h-5 text-muted-foreground" />
                  <p className="text-[10px] font-semibold text-muted-foreground">{t("product.returns")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("product.returnsText")}</p>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <p className="text-[10px] font-semibold text-muted-foreground">{t("product.warranty")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("product.warrantyText")}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About + Details — Side by side like Mirador */}
      <section className="py-10 md:py-14">
        <div className="section-container">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            {/* Right side (in RTL) — About text */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("product.about")}</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-5">{product.name}</h2>
              <p className="text-base text-muted-foreground leading-relaxed">{getLocaleText(product.longDescription, locale)}</p>
            </div>

            {/* Left side (in RTL) — Specs table */}
            <div>
              <h3 className="text-lg font-bold mb-4">{t("product.productDetails")}</h3>
              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                <div className="flex justify-between py-3.5 px-4 bg-muted/50">
                  <span className="text-sm text-muted-foreground">{t("product.materials")}</span>
                  <span className="text-sm font-medium">{product.materials}</span>
                </div>
                {product.dimensions && (
                  <div className="flex justify-between py-3.5 px-4">
                    <span className="text-sm text-muted-foreground">{t("product.dimensions")}</span>
                    <span className="text-sm font-medium">{product.dimensions}</span>
                  </div>
                )}
                <div className="flex justify-between py-3.5 px-4 bg-muted/50">
                  <span className="text-sm text-muted-foreground">{t("product.warranty")}</span>
                  <span className="text-sm font-medium">{t("product.warrantyText")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional product images below both columns */}
          <div className="mt-12">
            <ProductImagesSection images={product.images} />
          </div>
        </div>
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="py-10 md:py-14 border-t border-border">
          <div className="section-container md:!max-w-[90%]">
            <h2 className="text-xl md:text-2xl font-bold mb-8">{t("product.relatedProducts")}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <ImageLightbox images={product.images} startIndex={lightboxStart} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </Layout>
  );
};

/* ─── Contractor (B2B) Product Page ─── */
const ContractorProductPage = ({ product }: { product: ContractorProduct }) => {
  const { t, locale, localePath } = useLocale();
  const { addItem } = useCart();
  const isMobile = useIsMobile();
  const [selectedColor, setSelectedColor] = useState<{ id: string; name: string; hex: string } | null>(null);
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes[0]?.label || null);
  const [quantity, setQuantity] = useState(1);
  const [addedConfirm, setAddedConfirm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);
  const collection = collections.find((c) => c.id === product.collection);
  const relatedProducts = getRelatedProducts(product.id);

  const standardColors = product.colorGroups[0]?.colors || [];
  const customColorGroups = product.colorGroups.slice(1);
  const hasCustomColors = customColorGroups.length > 0 && customColorGroups.some(g => g.colors.length > 0);

  const currentPrice = (() => {
    if (selectedSize) {
      const s = product.sizes.find((s) => s.label === selectedSize);
      if (s?.price) return s.price;
    }
    return product.sizes[0]?.price || product.price;
  })();

  useEffect(() => {
    if (!selectedColor && standardColors.length > 0) {
      setSelectedColor({ id: standardColors[0].id, name: standardColors[0].name[locale], hex: standardColors[0].hex });
    }
  }, []);

  const handleZoom = (idx: number) => {
    setLightboxStart(idx);
    setLightboxOpen(true);
  };

  const handleAdd = async () => {
    setIsAdding(true);
    const colorOption = selectedColor || (standardColors.length > 0 ? { id: standardColors[0].id, name: standardColors[0].name[locale], hex: standardColors[0].hex } : undefined);
    await new Promise((r) => setTimeout(r, 500));
    const cart = useCart.getState();
    const key = `${product.id}__${selectedSize || ""}__${colorOption?.id || ""}`;
    const existing = cart.items.find(
      (i) => `${i.product.id}__${i.options?.size || ""}__${i.options?.color?.id || ""}` === key
    );
    if (existing) {
      cart.updateQuantity(key, Math.min(existing.quantity + quantity, 9999));
    } else {
      useCart.setState((state) => ({
        items: [...state.items, { product, quantity, options: { color: colorOption, size: selectedSize || undefined } }],
      }));
    }
    setIsAdding(false);
    setAddedConfirm(true);
    setTimeout(() => { setAddedConfirm(false); setQuantity(1); }, 1000);
  };

  return (
    <Layout>
      {/* Breadcrumb — light, no border */}
      <div className="section-container pt-2 pb-1 mt-14 md:mt-16">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to={localePath("/shop")} className="hover:text-foreground transition-colors">{t("nav.shop")}</Link>
          <span>/</span>
          {collection && (<><Link to={localePath(`/shop?collection=${collection.slug}`)} className="hover:text-foreground transition-colors">{collection.name[locale]}</Link><span>/</span></>)}
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <section className="py-4 md:py-6">
        <div className="section-container">
          <div className="grid lg:grid-cols-12 gap-5 lg:gap-8">
            {/* LEFT: Product image gallery */}
            <div className="lg:col-span-5">
              {isMobile ? (
                <MobileGallery images={product.images} onZoom={handleZoom} />
              ) : (
                <div className="sticky top-24">
                  <DesktopGallery images={product.images} onZoom={handleZoom} />
                </div>
              )}
            </div>

            {/* RIGHT: Fast ordering interface */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-7 lg:sticky lg:top-24 lg:self-start"
            >
              <h1 className="text-xl md:text-2xl font-bold mb-1">{product.name}</h1>
              <p className="text-sm text-muted-foreground mb-1">{t("contractor.sku")}: {product.sku}</p>
              <p className="text-2xl font-bold mb-3">{t("common.currency")}{currentPrice.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{getLocaleText(product.description, locale)}</p>
              <div className="h-px bg-border mb-4" />

              {/* Color selection */}
              {standardColors.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground mb-2">
                    {t("contractor.color")}: <span className="text-muted-foreground font-normal">
                      {selectedColor?.name || standardColors[0].name[locale]}
                    </span>
                  </p>
                  {isCustomColor && selectedColor && (
                    <div className="flex items-center gap-2.5 mb-3 p-2.5 rounded-xl border border-foreground bg-muted">
                      <span className="w-8 h-8 rounded-lg border border-foreground flex-shrink-0" style={{ backgroundColor: selectedColor.hex }} />
                      <span className="text-sm font-medium text-foreground flex-1">{selectedColor.name}</span>
                      <button onClick={() => { setIsCustomColor(false); setSelectedColor(null); }} className="text-xs text-muted-foreground hover:text-foreground underline">
                        {t("contractor.cancel")}
                      </button>
                    </div>
                  )}
                  <div className={cn("flex gap-2.5 flex-wrap", isCustomColor && "opacity-40 pointer-events-none")}>
                    {standardColors.map((color) => {
                      const isActive = !isCustomColor && (selectedColor?.id === color.id || (!selectedColor && color.id === standardColors[0].id));
                      return (
                        <button
                          key={color.id}
                          onClick={() => { setSelectedColor({ id: color.id, name: color.name[locale], hex: color.hex }); setIsCustomColor(false); }}
                          className={cn("w-10 h-10 rounded border-2 transition-all", isActive ? "border-foreground scale-110" : "border-border hover:border-muted-foreground")}
                          style={{ backgroundColor: color.hex }}
                          title={color.name[locale]}
                        />
                      );
                    })}
                  </div>
                  {hasCustomColors && (
                    <button
                      onClick={() => setCustomColorOpen(true)}
                      className="mt-3 px-5 py-3 text-sm font-semibold rounded-xl w-full bg-foreground text-background hover:opacity-90 transition-opacity"
                    >
                      {t("contractor.customColor")}
                    </button>
                  )}
                </div>
              )}

              {/* Length selection */}
              {product.sizes.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground mb-2">{t("contractor.size")}:</p>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((size) => {
                      const isActive = selectedSize === size.label || (!selectedSize && size.id === product.sizes[0].id);
                      return (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size.label)}
                          className={cn(
                            "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all flex flex-col items-center",
                            isActive ? "border-foreground bg-foreground text-background" : "border-border hover:border-muted-foreground"
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
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2">{t("product.quantity")}</p>
                <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} max={9999} />
              </div>

              {/* Add to cart */}
              <AnimatePresence mode="wait">
                {addedConfirm ? (
                  <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full h-14 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl bg-green-600 text-white"
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
                    disabled={isAdding}
                    className={cn(
                      "w-full h-14 flex items-center justify-center text-sm font-semibold border-2 border-foreground rounded-xl transition-colors",
                      isAdding ? "opacity-70 cursor-not-allowed" : "text-foreground hover:bg-foreground hover:text-background"
                    )}
                  >
                    {isAdding ? (
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    ) : (
                      <ShoppingBag className="w-4 h-4 me-2" />
                    )}
                    {isAdding ? t("product.adding") : t("product.addToBag")}
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About + Details — Side by side like Mirador */}
      <section className="py-10 md:py-14 border-t border-border">
        <div className="section-container">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            {/* About text */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("product.about")}</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-5">{product.name}</h2>
              <p className="text-base text-muted-foreground leading-relaxed">{getLocaleText(product.longDescription, locale)}</p>
            </div>

            {/* Specs table */}
            <div>
              <h3 className="text-lg font-bold mb-4">{t("product.productDetails")}</h3>
              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                <div className="flex justify-between py-3.5 px-4 bg-muted/50">
                  <span className="text-sm text-muted-foreground">{t("product.materials")}</span>
                  <span className="text-sm font-medium">{product.materials}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional images below */}
          <div className="mt-12">
            <ProductImagesSection images={product.images} />
          </div>
        </div>
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="py-10 md:py-14 border-t border-border">
          <div className="section-container md:!max-w-[90%]">
            <h2 className="text-xl md:text-2xl font-bold mb-8">{t("product.relatedProducts")}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* Custom color modal */}
      <CustomColorModal
        open={customColorOpen}
        onClose={() => setCustomColorOpen(false)}
        onSelect={(color) => { setSelectedColor(color); setIsCustomColor(true); }}
        colorGroups={customColorGroups}
        selectedColorId={selectedColor?.id}
      />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <ImageLightbox images={product.images} startIndex={lightboxStart} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </Layout>
  );
};

/* ─── Main Router ─── */
const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug || "");
  const { t, localePath } = useLocale();

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

  if (product.type === "contractor") {
    return <ContractorProductPage product={product as ContractorProduct} />;
  }

  return <RetailProductPage product={product as RetailProduct} />;
};

export default ProductDetail;
