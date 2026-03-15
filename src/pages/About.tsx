import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";

const About = () => {
  const { t, localePath } = useLocale();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[60vh] md:h-[75vh] overflow-hidden">
        <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
        <div className="relative section-container h-full flex flex-col justify-end pb-16 md:pb-24 pt-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-xs font-semibold text-white/60 mb-4">{t("about.heroSubtitle")}</p>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 whitespace-pre-line leading-[1.1]">{t("about.heroTitle")}</h1>
            <p className="text-white/70 max-w-lg">{t("about.heroDescription")}</p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 md:py-28">
        <div className="section-container max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-relaxed">{t("about.missionTitle")}</h2>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="pb-16 md:pb-24">
        <div className="section-container">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <h3 className="text-2xl font-bold mb-6">{t("about.storyTitle")}</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">{t("about.storyText")}</p>
              <p className="text-muted-foreground leading-relaxed">{t("about.storyText2")}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="aspect-[4/5] rounded-lg overflow-hidden">
                <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80" alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="section-container">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-2xl md:text-3xl font-bold text-center mb-14">{t("about.valuesTitle")}</motion.h2>
          <div className="grid md:grid-cols-3 gap-10 md:gap-12">
            {(t("about.values") as any[])?.map((v: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <span className="text-xs font-semibold text-muted-foreground/50 mb-3 block">{v.number}</span>
                <h3 className="text-xl font-bold mb-4">{v.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative section-container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("about.ctaTitle")}</h2>
            <p className="text-white/60 mb-8">{t("about.ctaText")}</p>
            <Button asChild size="lg" className="rounded-lg px-8 py-6">
              <Link to={localePath("/contact")}>{t("about.ctaButton")}<ArrowRight className="w-4 h-4 ms-2" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;