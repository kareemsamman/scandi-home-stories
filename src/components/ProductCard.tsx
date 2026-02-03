import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@/data/products";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted rounded-sm mb-4">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {/* Wishlist button */}
          <button
            onClick={handleWishlistToggle}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-full transition-all duration-300",
              "bg-background/80 backdrop-blur-sm hover:bg-background",
              "opacity-0 group-hover:opacity-100",
              inWishlist && "opacity-100"
            )}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                inWishlist ? "fill-primary text-primary" : "text-foreground"
              )}
            />
          </button>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.new && (
              <span className="px-2 py-1 text-[10px] font-medium tracking-wider uppercase bg-foreground text-background rounded-sm">
                New
              </span>
            )}
            {product.featured && (
              <span className="px-2 py-1 text-[10px] font-medium tracking-wider uppercase bg-primary text-primary-foreground rounded-sm">
                Featured
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-serif text-lg text-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {product.description}
          </p>
          <p className="text-sm font-medium text-foreground">
            ${product.price.toLocaleString()}
          </p>
        </div>
      </Link>
    </motion.article>
  );
};
