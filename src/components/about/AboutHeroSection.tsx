import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80";

export const AboutHeroSection = ({ sectionKey = "about_hero" }: { sectionKey?: string }) => {
  const { t, locale } = useLocale();
  const { data: db } = useHomeContent(sectionKey, locale);

  const subtitle      = db?.subtitle     || t("about.heroSubtitle");
  const title         = db?.title        || t("about.heroTitle");
  const desc          = db?.description  || t("about.heroDescription");
  const imageDesktop  = db?.image        || DEFAULT_IMAGE;
  const imageMobile   = db?.image_mobile || imageDesktop;

  return (
    <section className="relative h-[60vh] md:h-[75vh] overflow-hidden">
      {/* Mobile image */}
      <img src={imageMobile}  alt="" className="absolute inset-0 w-full h-full object-cover md:hidden" />
      {/* Desktop image */}
      <img src={imageDesktop} alt="" className="absolute inset-0 w-full h-full object-cover hidden md:block" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/10" />
      <div className="relative section-container h-full flex flex-col justify-end pb-16 md:pb-24 pt-24">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          {subtitle && <p className="text-xs font-semibold text-white/60 mb-4 uppercase tracking-widest">{subtitle}</p>}
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 whitespace-pre-line leading-[1.1]">{title}</h1>
          {desc && <p className="text-white/70 max-w-lg text-base leading-relaxed">{desc}</p>}
        </motion.div>
      </div>
    </section>
  );
};
