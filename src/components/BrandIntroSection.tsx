import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";

export const BrandIntroSection = () => {
  const { t } = useLocale();
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
            {t("brand.title")}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t("brand.description")}
          </p>
        </motion.div>
      </div>
    </section>
  );
};