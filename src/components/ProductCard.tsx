import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Product, RetailProduct, ContractorProduct, collections, getLocaleText } from "@/data/products";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { locale, localePath, t } = useLocale();
  const inWishlist = isInWishlist(product.id);
  const collection = collections.find((c) => c.id === product.collection);
  const hasSecondImage = product.images.length > 1;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) removeItem(product.id);
    else addItem(product);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only retail products without required color selection can quick-add
    if (product.type === "retail") {
      const retail = product as RetailProduct;
      const defaultColor = retail.colors.length > 0 ? { id: retail.colors[0].id, name: retail.colors[0].name[locale], hex: retail.colors[0].hex } : undefined;
      addToCart(product, 1, defaultColor ? { color: defaultColor } : undefined);
    }
  };

  if (product.type === "contractor") {
    const contractor = product as ContractorProduct;
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: index * 0.08 }}
        className="group"
      >
        <Link to={localePath(`/product/${product.slug}`)} className="block">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted mb-4">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {product.new && (
              <span className="absolute top-3 start-3 px-2.5 py-1 text-[10px] font-semibold bg-primary text-primary-foreground rounded-md">
                {t("product.newBadge")}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-accent-strong transition-colors">
              {product.name}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t("contractor.sku")}: {contractor.sku}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {t("contractor.length")}: {getLocaleText(contractor.length, locale)}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {t("common.currency")}{product.price.toLocaleString()}
            </p>
          </div>
        </Link>
      </motion.article>
    );
  }

  // Retail product card
  const retail = product as RetailProduct;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group"
    >
      <Link to={localePath(`/product/${product.slug}`)} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted mb-4">
          <img
            src={product.images[0]}
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              hasSecondImage ? "group-hover:opacity-0 group-hover:scale-105" : "group-hover:scale-105"
            )}
            loading="lazy"
          />
          {hasSecondImage && (
            <img
              src={product.images[1]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-0 scale-105 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100"
            />
          )}

          <button
            onClick={handleWishlistToggle}
            className={cn(
              "absolute top-3 end-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-300",
              "opacity-0 group-hover:opacity-100",
              inWishlist && "opacity-100"
            )}
          >
            <Heart className={cn("w-4 h-4", inWishlist ? "fill-primary text-primary" : "text-foreground")} />
          </button>

          <div className="absolute top-3 start-3 flex flex-col gap-1.5">
            {product.new && (
              <span className="px-2.5 py-1 text-[10px] font-semibold bg-primary text-primary-foreground rounded-md">
                {t("product.newBadge")}
              </span>
            )}
            {product.featured && (
              <span className="px-2.5 py-1 text-[10px] font-semibold bg-foreground text-background rounded-md">
                {t("product.featuredBadge")}
              </span>
            )}
          </div>

          {/* Quick add to cart button */}
          <div className="absolute bottom-0 start-0 end-0 flex justify-center pb-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={handleQuickAdd}
              className="px-5 py-2 text-xs font-medium bg-white/95 backdrop-blur-sm text-foreground rounded-lg shadow-lg flex items-center gap-2 hover:bg-foreground hover:text-background transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {t("product.addToBag")}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          {collection && (
            <p className="text-[11px] font-medium text-muted-foreground">
              {collection.name[locale]}
            </p>
          )}
          <h3 className="text-sm font-semibold text-foreground group-hover:text-accent-strong transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {getLocaleText(product.description, locale)}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {t("common.currency")}{product.price.toLocaleString()}
          </p>

          {/* Color swatches */}
          {retail.colors.length > 0 && (
            <div className="flex gap-1.5 pt-1">
              {retail.colors.slice(0, 5).map((color) => (
                <span
                  key={color.id}
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: color.hex }}
                  title={color.name[locale]}
                />
              ))}
              {retail.colors.length > 5 && (
                <span className="text-[10px] text-muted-foreground self-center">+{retail.colors.length - 5}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  );
};
