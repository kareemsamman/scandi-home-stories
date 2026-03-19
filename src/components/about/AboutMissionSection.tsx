import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";

export const AboutMissionSection = ({ sectionKey = "about_mission" }: { sectionKey?: string }) => {
  const { t, locale } = useLocale();
  const { data: db } = useHomeContent(sectionKey, locale);

  const title = db?.title || t("about.missionTitle");
  const stat1Label = db?.stat1_label || (locale === "ar" ? "سنة خبرة" : "שנות ניסיון");
  const stat1Value = db?.stat1_value || "15+";
  const stat2Label = db?.stat2_label || (locale === "ar" ? "مشروع منجز" : "פרויקטים שהושלמו");
  const stat2Value = db?.stat2_value || "2,000+";
  const stat3Label = db?.stat3_label || (locale === "ar" ? "عميل راضٍ" : "לקוחות מרוצים");
  const stat3Value = db?.stat3_value || "98%";

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="section-container max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-foreground leading-relaxed">{title}</h2>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-8 border-t border-border pt-12">
          {[
            { value: stat1Value, label: stat1Label },
            { value: stat2Value, label: stat2Label },
            { value: stat3Value, label: stat3Label },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-3xl md:text-5xl font-black text-foreground mb-2">{s.value}</div>
              <div className="text-xs md:text-sm text-muted-foreground font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
