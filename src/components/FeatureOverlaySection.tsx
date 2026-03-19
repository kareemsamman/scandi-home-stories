import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { Shield, Droplets, Zap, Award, Star, Check } from "lucide-react";
import { useHomeContent } from "@/hooks/useHomeContent";

const icons = [Shield, Droplets, Zap, Award];

const ICON_MAP: Record<string, any> = {
  shield: Shield,
  droplets: Droplets,
  zap: Zap,
  award: Award,
  star: Star,
  check: Check,
};

export const FeatureOverlaySection = ({ sectionKey = "feature_overlay" }: { sectionKey?: string }) => {
  const { t, locale } = useLocale();
  const { data: dbData } = useHomeContent(sectionKey, locale);
  const features = dbData && dbData.title ? dbData : t("features");

  if (!features?.items) return null;

  return (
    <section className="overflow-hidden">
      {/* ── Image strip with title ── */}
      <div className="relative h-[360px] md:h-[460px]">
        <img
          src={dbData?.bg_image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        {/* gradient — transparent top, dark bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/75" />

        {/* Title anchored at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="absolute bottom-0 inset-x-0 px-6 md:px-16 pb-10 text-center"
        >
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {features.title}
          </h2>
          {features.description && (
            <p className="mt-2 text-sm md:text-base text-white/75 max-w-lg mx-auto">
              {features.description}
            </p>
          )}
        </motion.div>
      </div>

      {/* ── Feature cards strip ── */}
      <div className="bg-white border-t border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-border/50 rtl:divide-x-reverse">
          {features.items.map((item: any, index: number) => {
            const Icon = ICON_MAP[item.icon] || icons[index % icons.length];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center gap-3 px-6 py-2"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
