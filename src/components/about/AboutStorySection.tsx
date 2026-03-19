import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";

export const AboutStorySection = ({ sectionKey = "about_story" }: { sectionKey?: string }) => {
  const { t, locale } = useLocale();
  const { data: db } = useHomeContent(sectionKey, locale);

  const title  = db?.title  || t("about.storyTitle");
  const text1  = db?.text1  || t("about.storyText");
  const text2  = db?.text2  || t("about.storyText2");
  const image  = db?.image  || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80";
  const tag    = db?.tag    || (locale === "ar" ? "قصتنا" : "הסיפור שלנו");

  return (
    <section className="py-16 md:py-24 bg-surface">
      <div className="section-container">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
          >
            <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-4 block">{tag}</span>
            <h3 className="text-2xl md:text-3xl font-black mb-6 leading-tight">{title}</h3>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{text1}</p>
              {text2 && <p>{text2}</p>}
            </div>
          </motion.div>

          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
          >
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-xl">
                <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              {/* Decorative accent */}
              <div className="absolute -bottom-4 -start-4 w-24 h-24 rounded-2xl bg-primary/10 -z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
