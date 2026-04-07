import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Ruler } from "lucide-react";
import { Product, RetailProduct, ContractorProduct, getLocaleText } from "@/data/products";
import { useShopData } from "@/hooks/useShopData";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { QuickBuyModal } from "./QuickBuyModal";
import { cn } from "@/lib/utils";
import { useProductInventory } from "@/hooks/useInventoryBatch";

interface ProductCardProps {
  product: Product;
  index?: number;
  animate?: boolean;
}

const QuickCartIcon = () => (
  <svg role="presentation" strokeWidth="2" focusable="false" width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 7H3.577A2 2 0 0 0 1.64 9.497l2.051 8A2 2 0 0 0 5.63 19H16.37a2 2 0 0 0 1.937-1.503l2.052-8A2 2 0 0 0 18.422 7H11Zm0 0V1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ProductCard = ({ product, index = 0, animate = true }: ProductCardProps) => {
  const { addItem: addToCart } = useCart();
  const { locale, localePath, t } = useLocale();
  const { collections } = useShopData();
  const collection = collections.find((c) => c.id === product.collection);
  const hasSecondImage = product.images.length > 1;
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);

  const isRetail = product.type === "retail";
  const isContractor = product.type === "contractor";
  const retail = isRetail ? (product as RetailProduct) : null;
  const contractor = isContractor ? (product as ContractorProduct) : null;

  const isMeterProduct = product.soldByMeter === true;
  const hasOptions = isMeterProduct || (retail && retail.colors.length > 0) || (contractor && (contractor.sizes.length > 0 || contractor.colorGroups.some(g => g.colors.length > 0)));

  // OOS check: if all tracked inventory rows sum to 0
  const inventory = useProductInventory(product.id);
  // Products with custom color groups are never fully OOS (custom colors are made-to-order)
  const hasCustomColors = contractor?.colorGroups && contractor.colorGroups.length > 1 &&
    contractor.colorGroups.slice(1).some(g => g.colors.length > 0);
  const isOutOfStock = !hasCustomColors && inventory.length > 0 && inventory.every(r => r.stock_quantity === 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasOptions) { setQuickBuyOpen(true); } else { addToCart(product, 1); }
  };

  const getLengthRange = () => {
    if (!contractor || contractor.sizes.length === 0) return null;
    const labels = contractor.sizes.map(s => s.label[locale]);
    if (labels.length === 1) return labels[0];
    return `${labels[0]}–${labels[labels.length - 1]}`;
  };

  const lengthRange = getLengthRange();
  const displayPrice = contractor?.sizes?.[0]?.price || product.price;

  if (isContractor && contractor) {
    return (
      <>
        <motion.article initial={animate ? { opacity: 0, y: 20 } : false} whileInView={animate ? { opacity: 1, y: 0 } : undefined} viewport={animate ? { once: true, margin: "-50px" } : undefined} transition={{ duration: 0.5, delay: index * 0.08 }} className="group rounded-2xl overflow-hidden bg-background border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-shadow">
          <Link to={localePath(`/product/${product.slug}`)} className="block">
            <div className="relative aspect-square overflow-hidden bg-muted">
              <img src={product.images[0]} alt={product.name[locale]} className={cn("w-full h-full object-cover transition-all duration-500 group-hover:scale-105", isOutOfStock && "opacity-60")} loading="lazy" />
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-end justify-center pb-14">
                  <span className="px-3 py-1.5 bg-white/95 text-gray-700 text-xs font-bold rounded-full shadow-sm border border-gray-200">
                    {locale === "ar" ? "نفد من المخزون" : "אזל מהמלאי"}
                  </span>
                </div>
              )}
              {product.new && (<span className="absolute top-3 start-3 px-2.5 py-1 text-[10px] font-semibold bg-primary text-primary-foreground rounded-md">{t("product.newBadge")}</span>)}
              <button onClick={handleQuickAdd} disabled={isOutOfStock} className={cn("absolute bottom-3 end-3 w-10 h-10 flex items-center justify-center rounded-full bg-background border border-border shadow-md transition-colors", isOutOfStock ? "opacity-40 cursor-not-allowed" : "hover:bg-foreground hover:text-background")} aria-label={t("product.addToBag")}><QuickCartIcon /></button>
            </div>
          </Link>
          <div className="p-3 space-y-1.5">
            {collection && (<p className="text-[11px] font-medium text-muted-foreground">{collection.name[locale]}</p>)}
            <h3 className="text-sm font-bold text-foreground group-hover:text-accent-strong transition-colors">{product.name[locale]}</h3>
            <p className="text-sm font-bold text-foreground">{t("common.currency")}{displayPrice.toLocaleString()}</p>
            {contractor.colorGroups.length > 0 && contractor.colorGroups[0].colors.length > 0 && (
              <div className="pt-1">
                <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{t("contractor.color")}:</p>
                <div className="flex gap-2 flex-wrap">
                  {contractor.colorGroups[0].colors.map((color) => (
                    <div key={color.id} className="flex flex-col items-center gap-1">
                      <span className="w-6 h-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: color.hex }} />
                      <span className="text-[8px] text-muted-foreground leading-none max-w-[40px] text-center truncate">{color.name[locale]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {contractor.sizes.length > 0 && (
              <div className="pt-1">
                <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{t("contractor.size")}:</p>
                <div className="flex gap-1.5 flex-wrap">
                  {contractor.sizes.map((s) => (
                    <span key={s.id} className="px-2 py-1 rounded-md border border-border text-[10px] font-medium text-muted-foreground">
                      {s.label[locale]}
                    </span>
                  ))}
                </div>
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
      <motion.article initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: index * 0.08 }} className="group rounded-2xl overflow-hidden bg-background border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-shadow">
        <Link to={localePath(`/product/${product.slug}`)} className="block">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img src={product.images[0]} alt={product.name[locale]} className={cn("w-full h-full object-cover transition-all duration-500", hasSecondImage ? "group-hover:opacity-0 group-hover:scale-105" : "group-hover:scale-105", isOutOfStock && "opacity-60")} loading="lazy" />
            {hasSecondImage && !isOutOfStock && (<img src={product.images[1]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 scale-105 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100" />)}
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-end justify-center pb-14">
                <span className="px-3 py-1.5 bg-white/95 text-gray-700 text-xs font-bold rounded-full shadow-sm border border-gray-200">
                  {locale === "ar" ? "نفد من المخزون" : "אזל מהמלאי"}
                </span>
              </div>
            )}
            <div className="absolute top-3 start-3 flex flex-col gap-1.5">
              {product.new && (<span className="px-2.5 py-1 text-[10px] font-semibold bg-primary text-primary-foreground rounded-md">{t("product.newBadge")}</span>)}
              {product.featured && (<span className="px-2.5 py-1 text-[10px] font-semibold bg-foreground text-background rounded-md">{t("product.featuredBadge")}</span>)}
            </div>
            <button onClick={handleQuickAdd} disabled={isOutOfStock} className={cn("absolute bottom-3 end-3 w-10 h-10 flex items-center justify-center rounded-full bg-background border border-border shadow-md transition-colors", isOutOfStock ? "opacity-40 cursor-not-allowed" : "hover:bg-foreground hover:text-background")} aria-label={t("product.addToBag")}><QuickCartIcon /></button>
          </div>
        </Link>
        <div className="p-3 space-y-1.5">
          {collection && (<p className="text-[11px] font-medium text-muted-foreground">{collection.name[locale]}</p>)}
          <h3 className="text-sm font-bold text-foreground group-hover:text-accent-strong transition-colors">{product.name[locale]}</h3>
          <p className="text-sm font-bold text-foreground">
            {t("common.currency")}{product.price.toLocaleString()}
            {isMeterProduct && <span className="text-[10px] font-normal text-muted-foreground ms-1">/ {locale === "ar" ? "متر" : "מטר"}</span>}
          </p>
          {retail && retail.colors.length > 0 && (
            <div className="pt-1">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{t("contractor.color")}:</p>
              <div className="flex gap-2 flex-wrap">
                {retail.colors.map((color) => (
                  <div key={color.id} className="flex flex-col items-center gap-1">
                    <span className="w-6 h-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: color.hex }} />
                    <span className="text-[8px] text-muted-foreground leading-none max-w-[40px] text-center truncate">{color.name[locale]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {retail && (retail as any).sizes?.length > 0 && (
            <div className="pt-1">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{t("contractor.size")}:</p>
              <div className="flex gap-1.5 flex-wrap">
                {(retail as any).sizes.map((s: any) => (
                  <span key={s.id} className="px-2 py-1 rounded-md border border-border text-[10px] font-medium text-muted-foreground">
                    {s.label[locale]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.article>
      <QuickBuyModal product={product} open={quickBuyOpen} onClose={() => setQuickBuyOpen(false)} />
    </>
  );
};
