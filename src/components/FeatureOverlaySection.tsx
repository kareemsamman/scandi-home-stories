import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";

// ── Distinct SVG icons ────────────────────────────────────────────────────────

// Hexagon with "AL" — premium aluminium
const IconAluminium = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 4L32 11.5V26.5L19 34L6 26.5V11.5L19 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <text x="12.5" y="21.5" fontSize="7" fontWeight="800" fill="currentColor" fontFamily="sans-serif" letterSpacing="0.5">AL</text>
  </svg>
);

// Lightning bolt — smart control
const IconSmartControl = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 5L10 21H19L16 33L28 17H19L22 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

// Water drop — drainage / weather resistance
const IconDrainage = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6C19 6 8 18 8 25C8 31.1 13 35 19 35C25 35 30 31.1 30 25C30 18 19 6 19 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M13 26C13 26 14 30 18 31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Shield with check — warranty
const IconWarranty = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 4L7 9V19C7 26.5 12.4 33.2 19 35C25.6 33.2 31 26.5 31 19V9L19 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M13.5 19.5L17 23L24.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Medal / award — extended warranty / quality
const IconAward = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="19" cy="15" r="10" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14 24L12 34L19 30L26 34L24 24" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M19 10L20.5 13.5L24 14L21.5 16.5L22 20L19 18.5L16 20L16.5 16.5L14 14L17.5 13.5L19 10Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

// Frame with plus — accessories
const IconAccessories = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M28 14V28M21 21H35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ICON_MAP: Record<string, React.ComponentType> = {
  // new keys
  aluminium: IconAluminium,
  materials: IconAluminium,
  smart:     IconSmartControl,
  zap:       IconSmartControl,
  drainage:  IconDrainage,
  droplets:  IconDrainage,
  weather:   IconDrainage,
  warranty:  IconWarranty,
  shield:    IconWarranty,
  award:     IconAward,
  star:      IconAward,
  check:     IconWarranty,
  accessories: IconAccessories,
};

const DEFAULT_ICONS = [IconAluminium, IconSmartControl, IconDrainage, IconWarranty];

// ─────────────────────────────────────────────────────────────────────────────

export const FeatureOverlaySection = ({ sectionKey = "feature_overlay" }: { sectionKey?: string }) => {
  const { t, locale } = useLocale();
  const { data: dbData } = useHomeContent(sectionKey, locale);
  const features = dbData && dbData.title ? dbData : t("features");

  if (!features?.items) return null;

  return (
    <section className="py-10 md:py-16">
      <div className="section-container">
        {/* Taller container so the image shows above the panel */}
        <div className="relative rounded-2xl overflow-hidden flex flex-col justify-end min-h-[460px] md:min-h-[560px]">
          {/* Background image */}
          <img
            src={optimizeImageUrl(dbData?.bg_image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80", 1280)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {/* subtle bottom scrim so panel text is legible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

          {/* Glass panel pinned to the bottom */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative mx-5 mb-5 md:mx-8 md:mb-8 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(210, 215, 210, 0.52)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              border: "1px solid rgba(255,255,255,0.4)",
              boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
            }}
          >
            {/* Title + Description */}
            <div className="px-7 md:px-12 pt-7 pb-5 text-center">
              {features.title && (
                <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight mb-2">
                  {features.title}
                </h2>
              )}
              <p className="text-sm md:text-[15px] text-foreground/90 leading-relaxed font-medium max-w-2xl mx-auto">
                {features.description}
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-foreground/12 mx-7 md:mx-12" />

            {/* Feature icon columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-foreground/10 rtl:divide-x-reverse">
              {features.items.map((item: any, index: number) => {
                const Icon = ICON_MAP[item.icon] || DEFAULT_ICONS[index % DEFAULT_ICONS.length];
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center gap-2.5 px-4 py-6"
                  >
                    <div className="text-foreground/75">
                      <Icon />
                    </div>
                    <span className="text-xs md:text-[13px] font-semibold text-foreground/85 leading-snug">
                      {item.title}
                    </span>
                    {item.description && (
                      <span className="text-[11px] text-foreground/55 leading-tight hidden md:block">
                        {item.description}
                      </span>
                    )}
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
