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
    <section className="py-10 md:py-16">
      <div className="section-container">
        <div className="relative rounded-lg overflow-hidden min-h-[500px] md:min-h-[600px]">
          <img
            src={dbData?.bg_image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20" />

          {/* Glass panel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative flex items-center justify-center min-h-[500px] md:min-h-[600px] p-6"
          >
            <div className="glass-panel max-w-3xl w-full p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {features.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-10 max-w-md mx-auto">
                {features.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {features.items.map((item: any, index: number) => {
                  const Icon = ICON_MAP[item.icon] || icons[index % icons.length];
                  return (
                    <div key={index} className="text-center">
                      <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-accent-strong" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};