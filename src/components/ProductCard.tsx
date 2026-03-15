import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Ruler } from "lucide-react";
import { Product, RetailProduct, ContractorProduct, collections, getLocaleText } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { QuickBuyModal } from "./QuickBuyModal";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const QuickCartIcon = () => (
  <svg role="presentation" fill="none" strokeWidth="2" focusable="false" width="16" height="14" viewBox="0 0 16 14">
    <path d="M7.75 4.75H2.283a1 1 0 0 0-.97 1.244l1.574 6.25a1 1 0 0 0 .97.756h7.787a1 1 0 0 0 .97-.756l1.573-6.25a1 1 0 0 0-.97-1.244H7.75Zm0 0V1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addItem: addToCart } = useCart();
  const { locale, localePath, t } = useLocale();
  const collection = collections.find((c) => c.id === product.collection);
  const hasSecondImage = product.images.length > 1;
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);

  const isRetail = product.type === "retail";
  const isContractor = product.type === "contractor";
  const retail = isRetail ? (product as RetailProduct) : null;
  const contractor = isContractor ? (product as ContractorProduct) : null;

  const hasOptions = (retail && retail.colors.length > 0) || (contractor && (contractor.sizes.length > 0 || contractor.colorGroups.some(g => g.colors.length > 0)));

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasOptions) {
      setQuickBuyOpen(true);
    } else {
      addToCart(product, 1);
    }
  };

  // Get display price - for contractor, show base price or first size price
  const displayPrice = contractor?.sizes?.[0]?.price || product.price;

  if (isContractor && contractor) {
    return (
      <>
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: index * 0.08 }}
          className="group rounded-2xl overflow-hidden bg-background border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-shadow"
        >
          <Link to={localePath(`/product/${product.slug}`)} className="block">
            <div className="relative aspect-square overflow-hidden bg-muted">
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
              <button
                onClick={handleQuickAdd}
                className="absolute bottom-3 end-3 w-10 h-10 flex items-center justify-center rounded-full bg-background border border-border shadow-md hover:bg-foreground hover:text-background transition-colors"
                aria-label={t("product.addToBag")}
              >
                <QuickCartIcon />
              </button>
            </div>
          </Link>
          <div className="p-3 space-y-1.5">
            <h3 className="text-sm font-bold text-foreground group-hover:text-accent-strong transition-colors">
              {product.name}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t("contractor.sku")}: {contractor.sku}
            </p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              {getLocaleText(contractor.length, locale)} – {t("common.currency")}{displayPrice.toLocaleString()}
            </p>

            {/* Color label + swatches */}
            {contractor.colorGroups.length > 0 && contractor.colorGroups[0].colors.length > 0 && (
              <div className="pt-1">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">{t("contractor.color")}:</p>
                <div className="flex gap-1">
                  {contractor.colorGroups[0].colors.slice(0, 5).map((color) => (
                    <span
                      key={color.id}
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: color.hex }}
                      title={color.name[locale]}
                    />
                  ))}
                  {contractor.colorGroups[0].colors.length > 5 && (
                    <span className="text-[10px] text-muted-foreground self-center">+{contractor.colorGroups[0].colors.length - 5}</span>
                  )}
                </div>
              </div>
            )}

            {/* Size label + options */}
            {contractor.sizes.length > 0 && (
              <div className="pt-0.5">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">{t("contractor.size")}:</p>
                <p className="text-[11px] text-muted-foreground">
                  {contractor.sizes.map(s => s.label).join(" · ")}
                </p>
              </div>
            )}
          </div>
        </motion.article>
        <QuickBuyModal product={product} open={quickBuyOpen} onClose={() => setQuickBuyOpen(false)} />
      </>
    );
  }

  // Retail product card
  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: index * 0.08 }}
        className="group rounded-2xl overflow-hidden bg-background border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-shadow"
      >
        <Link to={localePath(`/product/${product.slug}`)} className="block">
          <div className="relative aspect-square overflow-hidden bg-muted">
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
            <button
              onClick={handleQuickAdd}
              className="absolute bottom-3 end-3 w-10 h-10 flex items-center justify-center rounded-full bg-background border border-border shadow-md hover:bg-foreground hover:text-background transition-colors"
              aria-label={t("product.addToBag")}
            >
              <QuickCartIcon />
            </button>
          </div>
        </Link>

        <div className="p-3 space-y-1.5">
          {collection && (
            <p className="text-[11px] font-medium text-muted-foreground">
              {collection.name[locale]}
            </p>
          )}
          <h3 className="text-sm font-bold text-foreground group-hover:text-accent-strong transition-colors">
            {product.name}
          </h3>
          <p className="text-sm font-bold text-foreground">
            {t("common.currency")}{product.price.toLocaleString()}
          </p>

          {/* Color swatches on card */}
          {retail && retail.colors.length > 0 && (
            <div className="pt-0.5">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">{t("contractor.color")}:</p>
              <div className="flex gap-1.5">
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
            </div>
          )}
        </div>
      </motion.article>
      <QuickBuyModal product={product} open={quickBuyOpen} onClose={() => setQuickBuyOpen(false)} />
    </>
  );
};
