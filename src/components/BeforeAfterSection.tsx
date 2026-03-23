import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";
import { optimizeImageUrl } from "@/lib/imageOptimize";

export const BeforeAfterSection = ({ sectionKey = "before_after" }: { sectionKey?: string }) => {
  const { t, locale } = useLocale();
  const { data: dbData } = useHomeContent(sectionKey, locale);
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percent);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updatePosition(e.clientX);
  };

  const onPointerUp = () => {
    isDragging.current = false;
  };

  return (
    <section className="py-10 md:py-16">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {dbData?.title || t("beforeAfter.title")}
          </h2>
          <p className="text-sm text-muted-foreground">{dbData?.subtitle || t("beforeAfter.subtitle")}</p>
        </motion.div>

        <div
          ref={containerRef}
          className="relative rounded-lg overflow-hidden h-[300px] md:h-[500px] cursor-col-resize select-none touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* After (full) */}
          <img
            src={dbData?.after_image || "/assets/after-with-pergola.webp"}
            alt={dbData?.after_label || t("beforeAfter.after")}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Before (clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          >
            <img
              src={dbData?.before_image || "/assets/before-no-pergola.webp"}
              alt={dbData?.before_label || t("beforeAfter.before")}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Divider */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
            style={{ left: `${position}%` }}
          >
            <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
              <span className="text-foreground text-xs font-bold">⟷</span>
            </div>
          </div>

          {/* Labels */}
          <span className="absolute top-4 start-4 px-3 py-1 bg-black/50 text-white text-xs rounded-md z-10">
            {dbData?.before_label || t("beforeAfter.before")}
          </span>
          <span className="absolute top-4 end-4 px-3 py-1 bg-black/50 text-white text-xs rounded-md z-10">
            {dbData?.after_label || t("beforeAfter.after")}
          </span>
        </div>
      </div>
    </section>
  );
};