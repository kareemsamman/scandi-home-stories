import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";

// ── Custom SVG icons matching the reference design ────────────────────────────

const IconMaterials = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 4L4 9.5V20.5L13 26L22 20.5V9.5L13 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M20 7L29 12.5V23.5L20 29L11 23.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="2 1.5" />
    <text x="11" y="18" fontSize="5.5" fontWeight="700" fill="currentColor" fontFamily="sans-serif">AL</text>
  </svg>
);

const IconWeather = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 4L20.8 13.2H30.5L22.8 18.8L25.7 28L18 22.4L10.3 28L13.2 18.8L5.5 13.2H15.2L18 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M18 4C18 4 10 10 10 20C10 26 13.6 30 18 32C22.4 30 26 26 26 20C26 10 18 4 18 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const IconWarranty = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 3L6 8V18C6 25 11.4 31.6 18 33C24.6 31.6 30 25 30 18V8L18 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <rect x="14" y="15" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M15.5 15V13.5C15.5 11.8 16.6 10.5 18 10.5C19.4 10.5 20.5 11.8 20.5 13.5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="18" cy="18.5" r="1" fill="currentColor" />
  </svg>
);

const IconAccessories = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M26 12H23M26 12V9M26 12V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 26H31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 31H31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CUSTOM_ICONS: Record<string, React.ComponentType> = {
  materials: IconMaterials,
  weather: IconWeather,
  warranty: IconWarranty,
  accessories: IconAccessories,
  // legacy mappings
  shield: IconWarranty,
  droplets: IconWeather,
  zap: IconWeather,
  award: IconMaterials,
  star: IconWeather,
  check: IconWarranty,
};

const DEFAULT_ICONS = [IconMaterials, IconWeather, IconWarranty, IconAccessories];

// ─────────────────────────────────────────────────────────────────────────────

export const FeatureOverlaySection = ({ sectionKey = "feature_overlay" }: { sectionKey?: string }) => {
  const { t, locale } = useLocale();
  const { data: dbData } = useHomeContent(sectionKey, locale);
  const features = dbData && dbData.title ? dbData : t("features");

  if (!features?.items) return null;

  return (
    <section className="py-10 md:py-16">
      <div className="section-container">
        <div className="relative rounded-2xl overflow-hidden min-h-[340px] md:min-h-[420px]">
          {/* Background image */}
          <img
            src={dbData?.bg_image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />

          {/* Glass panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative m-6 md:m-10 rounded-xl overflow-hidden"
            style={{
              background: "rgba(220, 224, 220, 0.45)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,0.35)",
            }}
          >
            {/* Description text */}
            <div className="px-6 md:px-10 pt-7 pb-6">
              <p className="text-sm md:text-base text-foreground/85 leading-relaxed max-w-2xl">
                {features.description}
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-foreground/10 mx-6 md:mx-10" />

            {/* Feature columns */}
            <div className="grid grid-cols-2 md:grid-cols-4">
              {features.items.map((item: any, index: number) => {
                const Icon = CUSTOM_ICONS[item.icon] || DEFAULT_ICONS[index % DEFAULT_ICONS.length];
                const isLast = index === features.items.length - 1;
                const isOddRow = features.items.length % 2 !== 0;
                return (
                  <div
                    key={index}
                    className={[
                      "flex flex-col items-center text-center gap-3 px-4 py-7",
                      // vertical dividers between columns
                      index % 2 !== 0 ? "" : "border-e border-foreground/10",
                      // on md+ every column except last gets a divider
                      "md:border-e md:last:border-e-0",
                    ].join(" ")}
                  >
                    <div className="text-foreground/80">
                      <Icon />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-foreground/80 leading-snug">
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
