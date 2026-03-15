import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { useLocale } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const heroImages = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80",
];

export const HeroSlider = () => {
  const { t, localePath } = useLocale();
  const slides: any[] = t("hero.slides");
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

  if (!Array.isArray(slides)) return null;

  return (
    <section className="relative h-[65vh] md:h-[80vh] overflow-hidden -mt-14 md:-mt-20">
      <div ref={emblaRef} className="h-full">
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 relative h-full">
              <img
                src={heroImages[index % heroImages.length]}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

              <div className="relative section-container h-full flex flex-col justify-end pb-16 md:pb-24 pt-24">
                <div className="max-w-xl">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-[1.1] whitespace-pre-line">
                    {slide.title}
                  </h1>
                  <p className="text-base md:text-lg text-white/70 mb-8 max-w-md">
                    {slide.subtitle}
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="rounded-lg px-8 py-6 text-sm font-semibold bg-foreground text-background hover:bg-foreground/90"
                  >
                    <Link to={localePath("/shop")}>
                      {slide.cta}
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
    </section>
  );
};
