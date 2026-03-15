import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { QuantitySelector } from "@/components/QuantitySelector";
import { getProductBySlug, getRelatedProducts, collections, getLocaleText } from "@/data/products";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug || "");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
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

  const inWishlist = isInWishlist(product.id);
  const relatedProducts = getRelatedProducts(product.id);
  const collection = collections.find((c) => c.id === product.collection);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast({ title: t("product.addToBag"), description: `${quantity} × ${product.name}` });
    setQuantity(1);
  };

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
              <p className="text-2xl font-bold mb-6">{t("common.currency")}{product.price.toLocaleString()}</p>
              <div className="h-px bg-border mb-6" />
              <p className="text-muted-foreground leading-relaxed mb-8">{getLocaleText(product.longDescription, locale)}</p>

              <div className="space-y-4 mb-8 pb-8 border-b border-border">
                <div><span className="text-xs font-semibold text-muted-foreground block mb-1">{t("product.materials")}</span><span className="text-sm">{product.materials}</span></div>
                {product.dimensions && <div><span className="text-xs font-semibold text-muted-foreground block mb-1">{t("product.dimensions")}</span><span className="text-sm">{product.dimensions}</span></div>}
              </div>

              <div className="mb-5">
                <span className="text-xs font-semibold text-muted-foreground block mb-2">{t("product.quantity")}</span>
                <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} />
              </div>

              <div className="flex flex-col gap-3">
                <Button size="lg" onClick={handleAddToCart} className="rounded-lg w-full py-6 text-sm font-semibold">
                  <ShoppingBag className="w-4 h-4 me-2" />{t("product.addToBag")}
                </Button>
                <Button variant="outline" size="lg" className="rounded-lg w-full py-6 text-sm" onClick={() => { inWishlist ? removeFromWishlist(product.id) : addToWishlist(product); }}>
                  <Heart className={cn("w-4 h-4 me-2", inWishlist && "fill-primary text-primary")} />
                  {inWishlist ? t("product.savedToWishlist") : t("product.addToWishlist")}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ProductDetail;