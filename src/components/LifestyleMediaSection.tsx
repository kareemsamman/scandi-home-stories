import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHomeContent } from "@/hooks/useHomeContent";
import { optimizeImageUrl } from "@/lib/imageOptimize";

export const LifestyleMediaSection = ({ sectionKey = "lifestyle_media" }: { sectionKey?: string }) => {
  const { t, localePath, locale } = useLocale();
  const { data: dbData } = useHomeContent(sectionKey, locale);
  return (
    <section className="py-10 md:py-16">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-lg overflow-hidden mb-10"
        >
          <img
            src={dbData?.image || "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=80"}
            alt=""
            className="w-full h-[300px] md:h-[500px] object-cover"
            loading="lazy"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {dbData?.title || t("lifestyle.title")}
          </h2>
          <p className="text-muted-foreground mb-8">{dbData?.description || t("lifestyle.description")}</p>
          <Button asChild variant="outline" className="rounded-lg">
            <Link to={localePath(dbData?.cta_link || "/shop")}>
              {dbData?.cta || t("lifestyle.cta")}
              <ArrowLeft className="w-4 h-4 ms-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
