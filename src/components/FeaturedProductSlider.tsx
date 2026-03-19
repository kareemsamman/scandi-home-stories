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
  const [scrollPct, setScrollPct] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  const updateState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const left = Math.abs(el.scrollLeft); // abs handles RTL negative values
    setScrollPct(maxScroll > 0 ? Math.min((left / maxScroll) * 100, 100) : 0);
    setCanScrollLeft(left > 4);
    setCanScrollRight(left < maxScroll - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Small delay so the DOM is ready
    const t = setTimeout(updateState, 100);
    el.addEventListener("scroll", updateState, { passive: true });
    const ro = new ResizeObserver(updateState);
    ro.observe(el);
    return () => { clearTimeout(t); el.removeEventListener("scroll", updateState); ro.disconnect(); };
  }, [products.length]);

  const scroll = (dir: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-slider-card]");
    const cardW = (card?.offsetWidth ?? 300) + 16; // +gap-4
    el.scrollBy({ left: dir === "next" ? cardW : -cardW, behavior: "smooth" });
  };

  if (!config || !title || products.length === 0) return null;

  return (
    <section className="py-10 md:py-16 bg-white overflow-hidden">

      {/* Header: title left, view-all right */}
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
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Cards — always LTR so scrollLeft works consistently */}
      <div
        ref={scrollRef}
        dir="ltr"
        className="flex gap-4 overflow-x-auto scroll-smooth"
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
            /* Mobile: 82vw (shows 1.2), tablet 46vw (shows ~2.2), desktop: 30vw (shows 3.2) */
            className="shrink-0 w-[82vw] sm:w-[46vw] md:w-[31vw] lg:w-[29.5vw]"
          >
            <ProductCard product={product} index={i} />
          </div>
        ))}
        {/* Trailing spacer so last card doesn't flush to edge */}
        <div className="shrink-0 w-10 md:w-16 lg:w-20" aria-hidden />
      </div>

      {/* Bottom: progress bar + arrows */}
      <div className="mt-5 px-5 md:px-10 lg:px-16 flex items-center gap-4">
        {/* Progress track */}
        <div className="flex-1 h-px bg-gray-200 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-foreground transition-[width] duration-150 ease-out"
            style={{ width: `${scrollPct}%` }}
          />
        </div>

        {/* Arrow buttons */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => scroll("prev")}
            disabled={!canScrollLeft}
            aria-label="Previous"
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background hover:border-foreground transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("next")}
            disabled={!canScrollRight}
            aria-label="Next"
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background hover:border-foreground transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
