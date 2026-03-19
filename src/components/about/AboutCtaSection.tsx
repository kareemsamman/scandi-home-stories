import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";
import { Button } from "@/components/ui/button";

export const AboutCtaSection = ({ sectionKey = "about_cta" }: { sectionKey?: string }) => {
  const { t, locale, localePath } = useLocale();
  const { data: db } = useHomeContent(sectionKey, locale);

  const title  = db?.title  || t("about.ctaTitle");
  const text   = db?.text   || t("about.ctaText");
  const button = db?.button || t("about.ctaButton");
  const link   = db?.link   || "/contact";
  const image  = db?.image  || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80";

  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative section-container text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">{title}</h2>
          {text && <p className="text-white/60 mb-10 text-base max-w-md mx-auto">{text}</p>}
          <Button asChild size="lg" className="rounded-xl px-8 py-6 text-base font-semibold">
            <Link to={localePath(link)}>
              {button}
              <ArrowLeft className="w-4 h-4 ms-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
