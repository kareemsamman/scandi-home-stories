import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";

export const AboutValuesSection = ({ sectionKey = "about_values" }: { sectionKey?: string }) => {
  const { t, locale } = useLocale();
  const { data: db } = useHomeContent(sectionKey, locale);

  const title  = db?.title  || t("about.valuesTitle");
  const values = db?.items  || (t("about.values") as any[]) || [];

  if (!values?.length) return null;

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="text-2xl md:text-4xl font-black text-foreground">{title}</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border rtl:md:divide-x-reverse">
          {values.map((v: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.6 }}
              className="px-8 md:px-10 py-8 md:py-0"
            >
              <span className="text-[11px] font-semibold text-muted-foreground/40 tracking-[0.2em] uppercase mb-5 block">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl md:text-2xl font-black mb-4 leading-tight">{v.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{v.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
