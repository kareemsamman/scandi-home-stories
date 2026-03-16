import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { useCategories, getLocaleName } from "@/hooks/useDbData";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const CategoryScroller = () => {
  const { locale, localePath } = useLocale();
  const { data: categories } = useCategories();
  const isRtl = locale === "he" || locale === "ar";
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    direction: isRtl ? "rtl" : "ltr",
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="section-container relative">
        {/* Prev arrow – desktop only */}
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shadow-md transition-opacity",
            !canScrollPrev && "opacity-0 pointer-events-none",
            "start-0 -ms-2"
          )}
          aria-label="Previous"
        >
          {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {/* Next arrow – desktop only */}
        <button
          onClick={() => emblaApi?.scrollNext()}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shadow-md transition-opacity",
            !canScrollNext && "opacity-0 pointer-events-none",
            "end-0 -me-2"
          )}
          aria-label="Next"
        >
          {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-4">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-[0_0_200px] md:flex-[0_0_240px] min-w-0"
              >
                <Link
                  to={localePath(`/shop?collection=${cat.slug}`)}
                  className="block relative h-[260px] md:h-[300px] rounded-lg overflow-hidden group"
                >
                  <img
                    src={cat.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"}
                    alt={getLocaleName(cat, locale)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 start-0 end-0 p-4">
                    <h3 className="text-sm font-semibold text-white">
                      {getLocaleName(cat, locale)}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
