import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { useLocale } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHeroSlides, getLocaleField } from "@/hooks/useDbData";

/**
 * Convert a Supabase Storage public URL to a resized/compressed version via
 * the Supabase Image Transformation API.
 * Falls back to the original URL if it isn't a storage URL.
 */
function optimizeSupabaseImage(url: string, width = 1920, quality = 75): string {
  if (!url) return url;
  // Match: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const match = url.match(/^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/object\/public\/(.+)$/);
  if (!match) return url;
  return `${match[1]}/storage/v1/render/image/public/${match[2]}?width=${width}&quality=${quality}&format=webp`;
}

export const HeroSlider = () => {
  const { locale, localePath } = useLocale();
  const { data: dbSlides, isLoading } = useHeroSlides();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: "rtl" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  // Autoplay
  useEffect(() => {
    if (!emblaApi) return;
    const timer = setInterval(() => {
      emblaApi.scrollNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [emblaApi]);

  if (isLoading) {
    return (
      <section className="relative h-[65vh] md:h-[80vh] overflow-hidden -mt-14 md:-mt-[7rem] bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </section>
    );
  }

  const slides = dbSlides || [];
  if (slides.length === 0) return null;

  return (
    <section className="relative h-[65vh] md:h-[80vh] overflow-hidden -mt-14 md:-mt-[7rem]">
      <div ref={emblaRef} className="h-full">
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div key={slide.id} className="flex-[0_0_100%] min-w-0 relative h-full bg-gray-200">
              <img
                src={optimizeSupabaseImage(slide.image)}
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "low"}
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

              <div className="relative section-container h-full flex flex-col justify-end pb-16 md:pb-24 pt-24">
                <div className="max-w-xl">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-[1.1] whitespace-pre-line">
                    {getLocaleField(slide, "title", locale)}
                  </h1>
                  <p className="text-base md:text-lg text-white/70 mb-8 max-w-md">
                    {getLocaleField(slide, "subtitle", locale)}
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="rounded-lg px-8 py-6 text-sm font-semibold bg-foreground text-background hover:bg-foreground/90"
                  >
                    <Link to={localePath(slide.link || "/shop")}>
                      {getLocaleField(slide, "cta", locale) || (locale === "ar" ? "تسوق الآن" : "לחנות")}
                      <ArrowLeft className="w-4 h-4 ms-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 start-1/2 -translate-x-1/2 flex gap-2 rtl:translate-x-1/2 rtl:-translate-x-0">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "w-8 h-1 rounded-full transition-all duration-300",
                index === selectedIndex ? "bg-white" : "bg-white/30"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
};
