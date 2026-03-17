import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";

export const BrandIntroSection = () => {
  const { t, locale } = useLocale();
  const { data: dbData } = useHomeContent("brand_intro", locale);
  const title = dbData?.title || t("brand.title");
  const description = dbData?.description || t("brand.description");
  return (
    <section className="py-16 md:py-24">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {title}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        </motion.div>
      </div>
    </section>
  );
};