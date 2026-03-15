import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { collections } from "@/data/products";

export const CategoryScroller = () => {
  const { locale, localePath } = useLocale();

  return (
    <section className="py-10 md:py-14">
      <div className="section-container">
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {collections.map((col, index) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="snap-start flex-shrink-0 w-[200px] md:w-[240px]"
            >
              <Link
                to={localePath(`/shop?collection=${col.slug}`)}
                className="block relative h-[260px] md:h-[300px] rounded-lg overflow-hidden group"
              >
                <img
                  src={col.image}
                  alt={col.name[locale]}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 start-0 end-0 p-4">
                  <h3 className="text-sm font-semibold text-white">
                    {col.name[locale]}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};