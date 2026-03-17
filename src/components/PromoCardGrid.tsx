import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { ArrowLeft } from "lucide-react";
import { useHomeContent } from "@/hooks/useHomeContent";

const promoImages = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
];

export const PromoCardGrid = () => {
  const { t, localePath, locale } = useLocale();
  const { data: dbData } = useHomeContent("promo_grid", locale);
  const promos: any[] = (dbData?.items?.length ? dbData.items : t("promos")) as any[];
  if (!Array.isArray(promos)) return null;

  return (
    <section className="py-10 md:py-16">
      <div className="section-container">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {promos.map((promo, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={localePath(promo.link || "/shop")}
                className="block relative h-[320px] md:h-[400px] rounded-lg overflow-hidden group"
              >
                <img
                  src={promo.image || promoImages[index % promoImages.length]}
                  alt={promo.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 start-0 end-0 p-6 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-white/60 mb-1">{promo.subtitle}</p>
                    <h3 className="text-lg font-semibold text-white">{promo.title}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <ArrowLeft className="w-4 h-4 text-background" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
