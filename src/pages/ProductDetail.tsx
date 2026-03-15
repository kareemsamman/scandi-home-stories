import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { QuantitySelector } from "@/components/QuantitySelector";
import { getProductBySlug, getRelatedProducts, collections, getLocaleText, RetailProduct, ContractorProduct, ColorOption } from "@/data/products";
import { useCart, CartItemOptions } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug || "");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeColorTab, setActiveColorTab] = useState<string | null>(null);
  const { addItem: addToCart } = useCart();
  const { toast } = useToast();
  const { t, locale, localePath } = useLocale();

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
  const collection = collections.find((c) => c.id === product.collection);

  const handleAddToCart = () => {
    const options: CartItemOptions = {};
    if (selectedColor) {
      options.color = { id: selectedColor.id, name: selectedColor.name[locale], hex: selectedColor.hex };
    }
    if (selectedSize) {
      options.size = selectedSize;
    }

    if (product.type === "contractor") {
      const contractor = product as ContractorProduct;
      if (contractor.sizes.length > 0 && !selectedSize) {
        toast({ title: t("contractor.selectSize"), variant: "destructive" });
        return;
      }
      if (!selectedColor) {
        toast({ title: t("contractor.selectColor"), variant: "destructive" });
        return;
      }
    }

    addToCart(product, quantity, options);
    setQuantity(1);
  };

  const isRetail = product.type === "retail";
  const isContractor = product.type === "contractor";

  // Initialize defaults
  if (isContractor && !activeColorTab) {
    const contractor = product as ContractorProduct;
    if (contractor.colorGroups.length > 0) {
      setActiveColorTab(contractor.colorGroups[0].id);
    }
  }

  if (isRetail && !selectedColor) {
    const retail = product as RetailProduct;
    if (retail.colors.length > 0) {
      setSelectedColor(retail.colors[0]);
    }
  }

  if (isContractor && !selectedSize) {
    const contractor = product as ContractorProduct;
    if (contractor.sizes.length > 0) {
      setSelectedSize(contractor.sizes[0].id);
    }
  }

  return (
    <Layout>
      <div className="section-container py-6 border-b border-border mt-16 md:mt-20">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link to={localePath("/shop")} className="hover:text-foreground transition-colors">{t("nav.shop")}</Link>
          <span>/</span>
          {collection && (<><Link to={localePath(`/shop?collection=${collection.slug}`)} className="hover:text-foreground transition-colors">{collection.name[locale]}</Link><span>/</span></>)}
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <section className="py-8 md:py-14">
        <div className="section-container">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Images */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted group">
                <AnimatePresence mode="wait">
                  <motion.img key={currentImageIndex} src={product.images[currentImageIndex]} alt={product.name}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover" />
                </AnimatePresence>
                {product.images.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImageIndex((p) => p === 0 ? product.images.length - 1 : p - 1)} className="absolute start-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={() => setCurrentImageIndex((p) => p === product.images.length - 1 ? 0 : p + 1)} className="absolute end-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-5 h-5" /></button>
                  </>
                )}
                {product.new && <span className="absolute top-4 start-4 px-3 py-1 text-[10px] font-semibold bg-primary text-primary-foreground rounded-md">{t("product.newBadge")}</span>}
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((img, i) => (
                    <button key={i} onClick={() => setCurrentImageIndex(i)} className={cn("w-20 h-20 rounded-lg overflow-hidden", i === currentImageIndex ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100")}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
              {collection && <Link to={localePath(`/shop?collection=${collection.slug}`)} className="text-xs font-semibold text-accent-strong mb-3 block">{collection.name[locale]}</Link>}
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{product.name}</h1>

              {isContractor && (
                <div className="space-y-1 mb-4">
                  <p className="text-sm text-muted-foreground">{t("contractor.sku")}: {(product as ContractorProduct).sku}</p>
                  <p className="text-sm text-muted-foreground">{t("contractor.length")}: {getLocaleText((product as ContractorProduct).length, locale)}</p>
                </div>
              )}

              <p className="text-2xl font-bold mb-6">{t("common.currency")}{product.price.toLocaleString()}</p>
              <div className="h-px bg-border mb-6" />
              <p className="text-muted-foreground leading-relaxed mb-8">{getLocaleText(product.longDescription, locale)}</p>

              {/* Size selection for contractor */}
              {isContractor && (product as ContractorProduct).sizes.length > 0 && (
                <div className="mb-6">
                  <span className="text-xs font-semibold text-muted-foreground block mb-2">{t("contractor.size")}</span>
                  <div className="flex flex-wrap gap-2">
                    {(product as ContractorProduct).sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size.id)}
                        className={cn(
                          "px-4 py-2 text-sm font-medium rounded-lg border transition-colors",
                          selectedSize === size.id
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:border-foreground"
                        )}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color selection for retail */}
              {isRetail && (product as RetailProduct).colors.length > 0 && (
                <div className="mb-6">
                  <span className="text-xs font-semibold text-muted-foreground block mb-2">
                    {t("contractor.color")}{selectedColor ? `: ${selectedColor.name[locale]}` : ""}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(product as RetailProduct).colors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          selectedColor?.id === color.id ? "border-foreground scale-110" : "border-border hover:border-foreground/50"
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={color.name[locale]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Color tabs for contractor */}
              {isContractor && (product as ContractorProduct).colorGroups.length > 0 && (
                <div className="mb-6">
                  <span className="text-xs font-semibold text-muted-foreground block mb-2">{t("contractor.color")}</span>
                  <div className="flex gap-1 mb-3 border-b border-border">
                    {(product as ContractorProduct).colorGroups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => setActiveColorTab(group.id)}
                        className={cn(
                          "px-3 py-2 text-xs font-medium transition-colors relative",
                          activeColorTab === group.id
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {group.name[locale]}
                        {activeColorTab === group.id && (
                          <span className="absolute bottom-0 start-0 end-0 h-0.5 bg-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                  {(product as ContractorProduct).colorGroups
                    .filter((g) => g.id === activeColorTab)
                    .map((group) => (
                      <div key={group.id} className="grid grid-cols-6 gap-2">
                        {group.colors.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => setSelectedColor(color)}
                            className={cn(
                              "flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all",
                              selectedColor?.id === color.id ? "ring-2 ring-foreground bg-muted" : "hover:bg-muted"
                            )}
                          >
                            <span
                              className="w-7 h-7 rounded-full border border-border"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                              {color.name[locale]}
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                  {selectedColor && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("contractor.selectedColor")}: {selectedColor.name[locale]}
                    </p>
                  )}
                </div>
              )}

              {/* Materials + Dimensions */}
              <div className="space-y-4 mb-8 pb-8 border-b border-border">
                <div><span className="text-xs font-semibold text-muted-foreground block mb-1">{t("product.materials")}</span><span className="text-sm">{product.materials}</span></div>
                {isRetail && (product as RetailProduct).dimensions && (
                  <div><span className="text-xs font-semibold text-muted-foreground block mb-1">{t("product.dimensions")}</span><span className="text-sm">{(product as RetailProduct).dimensions}</span></div>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-5">
                <span className="text-xs font-semibold text-muted-foreground block mb-2">{t("product.quantity")}</span>
                {isContractor ? (
                  <div className="flex items-center gap-3">
                    <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} max={9999} />
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1) setQuantity(Math.min(val, 9999));
                      }}
                      className="w-20 h-10 text-center"
                      min={1}
                      max={9999}
                    />
                  </div>
                ) : (
                  <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} />
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button size="lg" onClick={handleAddToCart} className="rounded-lg w-full py-6 text-sm font-semibold">
                  <ShoppingBag className="w-4 h-4 me-2" />{t("product.addToBag")}
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t border-border grid grid-cols-3 gap-4">
                <div><p className="text-[10px] font-semibold text-muted-foreground/60 mb-1">{t("product.shipping")}</p><p className="text-xs text-muted-foreground">{t("product.shippingText")}</p></div>
                <div><p className="text-[10px] font-semibold text-muted-foreground/60 mb-1">{t("product.returns")}</p><p className="text-xs text-muted-foreground">{t("product.returnsText")}</p></div>
                <div><p className="text-[10px] font-semibold text-muted-foreground/60 mb-1">{t("product.warranty")}</p><p className="text-xs text-muted-foreground">{t("product.warrantyText")}</p></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="py-14 md:py-20 bg-surface">
          <div className="section-container">
            <h2 className="text-2xl font-bold mb-10">{t("product.relatedProducts")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ProductDetail;
