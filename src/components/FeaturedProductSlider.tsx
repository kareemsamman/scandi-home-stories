import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";
import { useShopData } from "@/hooks/useShopData";
import { ProductCard } from "@/components/ProductCard";

export const FeaturedProductSlider = () => {
  const { locale, localePath } = useLocale();
  const { data: config } = useHomeContent("featured_slider", locale);
  const { products: allProducts } = useShopData();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Derive which products to show
  const products = (() => {
    if (!config || !allProducts.length) return [];
    if (config.mode === "category" && config.category_id) {
      return allProducts.filter((p) => p.collection === config.category_id).slice(0, 12);
    }
    if (Array.isArray(config.product_ids) && config.product_ids.length > 0) {
      return config.product_ids
        .map((id: string) => allProducts.find((p) => p.id === id))
        .filter(Boolean) as typeof allProducts;
    }
    return [];
  })();

  const title = config?.title || "";
  const buttonText = config?.button_text || "";
  const buttonLink = config?.button_link || "/shop";

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateArrows); ro.disconnect(); };
  }, [products.length]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("div")?.clientWidth ?? 280;
    el.scrollBy({ left: dir === "left" ? -cardWidth * 2 : cardWidth * 2, behavior: "smooth" });
  };

  if (!config || !title || products.length === 0) return null;

  return (
    <section className="py-10 md:py-14 bg-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">

        {/* Header row */}
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground uppercase leading-none">
            {title}
          </h2>
          <div className="flex items-center gap-3">
            {buttonText && (
              <Link
                to={localePath(buttonLink)}
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors whitespace-nowrap flex items-center gap-1"
              >
                {buttonText}
                <ChevronLeft className="w-4 h-4" />
              </Link>
            )}
            {/* Nav arrows */}
            <div className="flex gap-1.5">
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable product row */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product, i) => (
            <div key={product.id} className="shrink-0 w-[260px] sm:w-[300px]">
              <ProductCard product={product} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
