import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";
import { useShopData } from "@/hooks/useShopData";
import { useProducts as useDbProducts } from "@/hooks/useDbData";
import { ProductCard } from "@/components/ProductCard";

export const FeaturedProductSlider = ({ sectionKey = "featured_slider" }: { sectionKey?: string }) => {
  const { locale, localePath } = useLocale();
  const { data: config } = useHomeContent(sectionKey, locale);
  const { products: allProducts } = useShopData();
  const { data: dbProducts = [] } = useDbProducts();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPct, setScrollPct] = useState(0);
  // RTL: canScrollLeft = more items to the left (forward), canScrollRight = can go back right
  const [canScrollLeft, setCanScrollLeft] = useState(true);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const products = (() => {
    if (!config || !allProducts.length) return [];
    if (config.mode === "category" && config.category_id) {
      // Match by parent category_id OR sub_category_id (for sub-category selections)
      const matchingIds = new Set(
        dbProducts
          .filter((p: any) => p.category_id === config.category_id || p.sub_category_id === config.category_id)
          .map((p: any) => p.id)
      );
      // Also match by collection (= category_id in useShopData) as fallback
      return allProducts
        .filter((p) => matchingIds.has(p.id) || p.collection === config.category_id)
        .slice(0, 12);
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
  const compact = !!config?.compact_images;

  const updateState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    // In RTL, scrollLeft is 0 at start (rightmost) and goes negative as we scroll left
    const left = Math.abs(el.scrollLeft);
    setScrollPct(maxScroll > 0 ? Math.min((left / maxScroll) * 100, 100) : 0);
    // canScrollLeft: haven't reached leftmost end yet → more items to reveal
    setCanScrollLeft(left < maxScroll - 4);
    // canScrollRight: have scrolled some → can go back to start
    setCanScrollRight(left > 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const t = setTimeout(updateState, 100);
    el.addEventListener("scroll", updateState, { passive: true });
    const ro = new ResizeObserver(updateState);
    ro.observe(el);
    return () => { clearTimeout(t); el.removeEventListener("scroll", updateState); ro.disconnect(); };
  }, [products.length]);

  // In RTL: scrollBy -cardW goes left (forward/next), +cardW goes right (back/prev)
  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-slider-card]");
    const cardW = (card?.offsetWidth ?? 300) + 16;
    el.scrollBy({ left: dir === "left" ? -cardW : cardW, behavior: "smooth" });
  };

  if (!config || !title || products.length === 0) return null;

  return (
    <section className="py-10 md:py-16 bg-white overflow-hidden">

      {/* Header: in RTL flex — title on right (first), view-all on left (second) */}
      <div className="flex items-center justify-between px-5 md:px-10 lg:px-16 mb-6">
        <h2 className="text-2xl md:text-[2rem] font-black tracking-tight text-foreground uppercase leading-none">
          {title}
        </h2>
        {buttonText && (
          <Link
            to={localePath(buttonLink)}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors shrink-0"
          >
            {buttonText}
            <ChevronLeft className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Cards — RTL natural, first card on the right */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingInlineStart: "clamp(20px, 5vw, 80px)",
        }}
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            data-slider-card
            className={compact
              ? "shrink-0 w-[55vw] sm:w-[32vw] md:w-[21vw] lg:w-[19vw]"
              : "shrink-0 w-[75vw] sm:w-[46vw] md:w-[31vw] lg:w-[29.5vw]"
            }
          >
            <ProductCard product={product} index={i} animate={false} />
          </div>
        ))}
        {/* Trailing spacer so last card doesn't flush to edge */}
        <div className="shrink-0 w-10 md:w-16 lg:w-20" aria-hidden />
      </div>

      {/* Bottom: in RTL flex — arrows on left (last), progress bar on right (first) */}
      <div className="mt-5 px-5 md:px-10 lg:px-16 flex items-center gap-4">
        {/* Progress track */}
        <div className="flex-1 h-px bg-gray-200 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-foreground transition-[width] duration-150 ease-out"
            style={{ width: `${scrollPct}%` }}
          />
        </div>

        {/* Arrow buttons — in RTL this div is on the left side */}
        <div className="flex gap-2 shrink-0">
          {/* ChevronRight = go back right (prev) — first in DOM = right of the pair in RTL */}
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Previous"
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background hover:border-foreground transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* ChevronLeft = scroll left / see more (next) — second in DOM = left of the pair in RTL */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Next"
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background hover:border-foreground transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
