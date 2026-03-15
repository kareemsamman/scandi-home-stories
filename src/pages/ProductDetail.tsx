import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag, ZoomIn, X, Check, Star, Truck, Shield, RotateCcw } from "lucide-react";
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

/* ─── Fullscreen Gallery Lightbox ─── */
const ImageLightbox = ({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) => {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        setIdx((p) => e.key === "ArrowRight" ? (p + 1) % images.length : (p - 1 + images.length) % images.length);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-10">
        <X className="w-5 h-5" />
      </button>
      <button onClick={(e) => { e.stopPropagation(); setIdx((p) => (p - 1 + images.length) % images.length); }} className="absolute start-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <img src={images[idx]} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
      <button onClick={(e) => { e.stopPropagation(); setIdx((p) => (p + 1) % images.length); }} className="absolute end-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2">
        {images.map((_, i) => (
          <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
            className={cn("w-2 h-2 rounded-full transition-colors", i === idx ? "bg-white" : "bg-white/30")} />
        ))}
      </div>
    </motion.div>
  );
};

/* ─── Retail (B2C) Product Page ─── */
const RetailProductPage = ({ product }: { product: RetailProduct }) => {
  const { t, locale, localePath } = useLocale();
  const { addItem: addToCart } = useCart();
  const [currentImg, setCurrentImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(product.colors[0] || null);
  const [quantity, setQuantity] = useState(1);
  const collection = collections.find((c) => c.id === product.collection);
  const relatedProducts = getRelatedProducts(product.id);

  const handleAdd = () => {
    const options: CartItemOptions = {};
    if (selectedColor) options.color = { id: selectedColor.id, name: selectedColor.name[locale], hex: selectedColor.hex };
    addToCart(product, quantity, options);
    setQuantity(1);
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="section-container py-4 border-b border-border mt-16 md:mt-20">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Link to={localePath("/shop")} className="hover:text-foreground transition-colors">{t("nav.shop")}</Link>
          <span>/</span>
          {collection && (<><Link to={localePath(`/shop?collection=${collection.slug}`)} className="hover:text-foreground transition-colors">{collection.name[locale]}</Link><span>/</span></>)}
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <section className="py-8 md:py-14">
        <div className="section-container">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-14">
            {/* LEFT: Image Gallery */}
            <div className="lg:col-span-7 space-y-3">
              {/* Main image */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted group cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImg}
                    src={product.images[currentImg]}
                    alt={product.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                {/* Zoom button */}
                <button className="absolute bottom-4 end-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4" />
                </button>
                {/* Badges */}
                <div className="absolute top-4 start-4 flex flex-col gap-2">
                  {product.new && <span className="px-3 py-1 text-[10px] font-semibold bg-primary text-primary-foreground rounded-md">{t("product.newBadge")}</span>}
                  {product.featured && <span className="px-3 py-1 text-[10px] font-semibold bg-foreground text-background rounded-md">{t("product.featuredBadge")}</span>}
                </div>
                {/* Arrows */}
                {product.images.length > 1 && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentImg((p) => (p - 1 + product.images.length) % product.images.length); }}
                      className="absolute start-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentImg((p) => (p + 1) % product.images.length); }}
                      className="absolute end-14 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2.5">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImg(i)}
                      className={cn(
                        "w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                        i === currentImg ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Product Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start"
            >
              {/* Category */}
              {collection && (
                <Link to={localePath(`/shop?collection=${collection.slug}`)} className="text-xs font-semibold text-accent-strong mb-2 block">
                  {collection.name[locale]}
                </Link>
              )}

              {/* Name */}
              <h1 className="text-2xl md:text-3xl font-bold mb-3">{product.name}</h1>

              {/* Reviews placeholder */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-accent-strong text-accent-strong" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{t("product.noReviews")}</span>
              </div>

              {/* Price */}
              <p className="text-2xl font-bold mb-5">{t("common.currency")}{product.price.toLocaleString()}</p>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{getLocaleText(product.description, locale)}</p>

              <div className="h-px bg-border mb-6" />

              {/* Color */}
              {product.colors.length > 0 && (
                <div className="mb-6">
                  <span className="text-sm font-medium text-foreground block mb-2.5">
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
              <div className="mb-6">
                <span className="text-sm font-medium text-foreground block mb-2.5">{t("product.quantity")}</span>
                <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} />
              </div>

              {/* Add to cart */}
              <Button size="lg" onClick={handleAdd} className="rounded-xl w-full py-6 text-sm font-semibold">
                <ShoppingBag className="w-4 h-4 me-2" />
                {t("product.addToBag")}
              </Button>

              {/* Trust badges */}
              <div className="mt-8 pt-6 border-t border-border grid grid-cols-3 gap-4">
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

      {/* Product details section */}
      <section className="py-12 border-t border-border">
        <div className="section-container">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Long description */}
            <div>
              <h2 className="text-xl font-bold mb-4">{t("product.description")}</h2>
              <p className="text-muted-foreground leading-relaxed">{getLocaleText(product.longDescription, locale)}</p>
            </div>

            {/* Specs */}
            <div>
              <h2 className="text-xl font-bold mb-4">{t("product.specifications")}</h2>
              <div className="divide-y divide-border">
                <div className="flex justify-between py-3">
                  <span className="text-sm text-muted-foreground">{t("product.materials")}</span>
                  <span className="text-sm font-medium">{product.materials}</span>
                </div>
                {product.dimensions && (
                  <div className="flex justify-between py-3">
                    <span className="text-sm text-muted-foreground">{t("product.dimensions")}</span>
                    <span className="text-sm font-medium">{product.dimensions}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="py-14 md:py-20 border-t border-border">
          <div className="section-container">
            <h2 className="text-2xl font-bold mb-10">{t("product.relatedProducts")}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <ImageLightbox images={product.images} startIndex={currentImg} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </Layout>
  );
};

/* ─── Contractor (B2B) Product Page — Redirects to shop ─── */
const ContractorProductPage = ({ product }: { product: ContractorProduct }) => {
  const { t, locale, localePath } = useLocale();
  const { addItem } = useCart();
  const [selectedColor, setSelectedColor] = useState<{ id: string; name: string; hex: string } | null>(null);
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes[0]?.label || null);
  const [quantity, setQuantity] = useState(1);
  const [addedConfirm, setAddedConfirm] = useState(false);
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
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

  // Initialize default color
  useEffect(() => {
    if (!selectedColor && standardColors.length > 0) {
      setSelectedColor({ id: standardColors[0].id, name: standardColors[0].name[locale], hex: standardColors[0].hex });
    }
  }, []);

  const handleAdd = () => {
    const colorOption = selectedColor || (standardColors.length > 0 ? { id: standardColors[0].id, name: standardColors[0].name[locale], hex: standardColors[0].hex } : undefined);
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
    setAddedConfirm(true);
    setTimeout(() => { setAddedConfirm(false); setQuantity(1); }, 1000);
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="section-container py-4 border-b border-border mt-16 md:mt-20">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Link to={localePath("/shop")} className="hover:text-foreground transition-colors">{t("nav.shop")}</Link>
          <span>/</span>
          {collection && (<><Link to={localePath(`/shop?collection=${collection.slug}`)} className="hover:text-foreground transition-colors">{collection.name[locale]}</Link><span>/</span></>)}
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <section className="py-8 md:py-14">
        <div className="section-container">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-14">
            {/* LEFT: Product image gallery */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted sticky top-28 group cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImg}
                    src={product.images[currentImg]}
                    alt={product.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                <button className="absolute bottom-4 end-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4" />
                </button>
                {product.images.length > 1 && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentImg((p) => (p - 1 + product.images.length) % product.images.length); }}
                      className="absolute start-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentImg((p) => (p + 1) % product.images.length); }}
                      className="absolute end-14 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2.5">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImg(i)}
                      className={cn(
                        "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                        i === currentImg ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Fast ordering interface */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-7 lg:sticky lg:top-28 lg:self-start"
            >
              <h1 className="text-xl md:text-2xl font-bold mb-2">{product.name}</h1>
              <p className="text-sm text-muted-foreground mb-1">{t("contractor.sku")}: {product.sku}</p>
              <p className="text-2xl font-bold mb-6">{t("common.currency")}{currentPrice.toLocaleString()}</p>

              <div className="h-px bg-border mb-6" />

              {/* Color selection */}
              {standardColors.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-foreground mb-2.5">
                    {t("contractor.color")}: <span className="text-muted-foreground font-normal">
                      {selectedColor?.name || standardColors[0].name[locale]}
                    </span>
                  </p>

                  {/* Custom color indicator */}
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
                <div className="mb-6">
                  <p className="text-sm font-medium text-foreground mb-2.5">{t("contractor.size")}:</p>
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
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground mb-2.5">{t("product.quantity")}</p>
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
                    className="w-full h-14 flex items-center justify-center text-sm font-semibold border-2 border-foreground rounded-xl text-foreground hover:bg-foreground hover:text-background transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 me-2" />
                    {t("product.addToBag")}
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Description */}
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">{getLocaleText(product.longDescription, locale)}</p>
              </div>

              {/* Materials */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">{t("product.materials")}</span>
                  <span className="text-sm font-medium">{product.materials}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="py-14 md:py-20 border-t border-border">
          <div className="section-container">
            <h2 className="text-2xl font-bold mb-10">{t("product.relatedProducts")}</h2>
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
