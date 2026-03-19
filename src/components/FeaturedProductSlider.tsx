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

  const updateState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setScrollPct(maxScroll > 0 ? (el.scrollLeft / maxScroll) * 100 : 0);
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScroll - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateState();
    el.addEventListener("scroll", updateState, { passive: true });
    const ro = new ResizeObserver(updateState);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateState); ro.disconnect(); };
  }, [products.length]);

  const scroll = (dir: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-slider-card]");
    const cardW = card ? card.offsetWidth + 16 : 300;
    el.scrollBy({ left: dir === "next" ? cardW * 2 : -cardW * 2, behavior: "smooth" });
  };

  if (!config || !title || products.length === 0) return null;

  const isRtl = locale === "he" || locale === "ar";

  return (
    <section className="py-10 md:py-16 bg-white overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>

      {/* Header row — aligned with page content */}
      <div className="px-5 md:px-10 lg:px-16 mb-7 flex items-center justify-between gap-4">
        <h2 className="text-2xl md:text-[2rem] font-black tracking-tight text-foreground uppercase leading-none">
          {title}
        </h2>
        <div className="flex items-center gap-3 shrink-0">
          {buttonText && (
            <Link
              to={localePath(buttonLink)}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
            >
              {buttonText}
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}
          {/* Arrows */}
          <div className="flex gap-1.5">
            <button
              onClick={() => scroll("prev")}
              disabled={!canScrollLeft}
              aria-label="Previous"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background hover:border-foreground transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("next")}
              disabled={!canScrollRight}
              aria-label="Next"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background hover:border-foreground transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable cards — bleeds to the right edge */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-5 md:px-10 lg:px-16"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            data-slider-card
            className="shrink-0 w-[82vw] sm:w-[46vw] md:w-[32vw] lg:w-[30vw] xl:w-[28vw]"
          >
            <ProductCard product={product} index={i} />
          </div>
        ))}
        {/* Right edge spacer so last card doesn't touch viewport edge */}
        <div className="shrink-0 w-5 md:w-10" />
      </div>

      {/* Scroll progress bar */}
      <div className="mt-5 px-5 md:px-10 lg:px-16">
        <div className="h-px w-full bg-gray-200 relative">
          <div
            className="h-px bg-foreground absolute inset-y-0 start-0 transition-[width] duration-100"
            style={{ width: `${scrollPct}%` }}
          />
        </div>
        {/* Mobile "View all" link below bar */}
        {buttonText && (
          <div className="sm:hidden mt-4 flex justify-center">
            <Link
              to={localePath(buttonLink)}
              className="text-sm font-semibold text-foreground underline underline-offset-2"
            >
              {buttonText}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
