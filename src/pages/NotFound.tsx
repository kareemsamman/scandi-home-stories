import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const { t, localePath } = useLocale();
  return (
    <Layout>
      <section className="py-28 mt-16 md:mt-20">
        <div className="section-container max-w-lg mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-7xl font-bold text-muted-foreground/20 mb-4">404</p>
            <h1 className="text-2xl font-bold mb-4">{t("notFound.title")}</h1>
            <p className="text-muted-foreground mb-8">{t("notFound.text")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="rounded-lg"><Link to={localePath("/")}>{t("notFound.home")}</Link></Button>
              <Button asChild variant="outline" className="rounded-lg"><Link to={localePath("/shop")}>{t("notFound.shop")}</Link></Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;