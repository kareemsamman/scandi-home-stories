import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { collections, profileSubCategories } from "@/data/products";

// Map which collections have subcategories
const collectionSubCategories: Record<string, typeof profileSubCategories> = {
  profiles: profileSubCategories,
};

const Catalog = () => {
  const { t, locale, localePath } = useLocale();

  return (
    <Layout>
      <section className="section-container py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {t("catalog.title")}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {t("catalog.subtitle")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((col, index) => {
            const subs = collectionSubCategories[col.slug];
            return (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
              >
                <Link
                  to={localePath(`/shop?collection=${col.slug}`)}
                  className="block relative rounded-xl overflow-hidden group aspect-[4/3]"
                >
                  <img
                    src={col.image}
                    alt={col.name[locale]}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 start-0 end-0 p-5">
                    <h2 className="text-lg font-bold text-white mb-1">
                      {col.name[locale]}
                    </h2>
                    <p className="text-xs text-white/70 line-clamp-2">
                      {col.description[locale]}
                    </p>
                  </div>
                </Link>

                {/* Subcategories */}
                {subs && subs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {subs.map((sub) => (
                      <Link
                        key={sub.id}
                        to={localePath(`/shop?collection=${col.slug}&sub=${sub.id}`)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {sub.name[locale]}
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>
    </Layout>
  );
};

export default Catalog;
