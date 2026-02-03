import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Collection } from "@/data/products";

interface CollectionCardProps {
  collection: Collection;
  index?: number;
}

export const CollectionCard = ({ collection, index = 0 }: CollectionCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link
        to={`/products?collection=${collection.slug}`}
        className="group block"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-muted rounded-sm mb-4">
          <img
            src={collection.image}
            alt={collection.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="font-serif text-xl md:text-2xl text-white mb-1">
              {collection.name}
            </h3>
            <p className="text-sm text-white/80">
              {collection.description}
            </p>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};
