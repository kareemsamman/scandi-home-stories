import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";

const Wishlist = () => {
  const { items, removeItem, clearWishlist } = useWishlist();

  if (items.length === 0) {
    return (
      <Layout>
        <section className="py-20 md:py-28">
          <div className="container-narrow text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
                Your Wishlist is Empty
              </h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Save pieces you love by clicking the heart icon on any product. 
                They'll appear here for easy browsing.
              </p>
              <Button asChild className="rounded-sm">
                <Link to="/products">Explore Products</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="py-12 md:py-16 bg-linen">
        <div className="container-wide">
          <div className="flex items-end justify-between">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-2">
                Saved Items
              </h1>
              <p className="text-muted-foreground">
                {items.length} {items.length === 1 ? "piece" : "pieces"} saved
              </p>
            </motion.div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearWishlist}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </section>

      {/* Items */}
      <section className="py-12 md:py-16">
        <div className="container-wide">
          <div className="space-y-6">
            {items.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-6 p-4 bg-card rounded-sm border border-border"
              >
                <Link
                  to={`/product/${product.slug}`}
                  className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 overflow-hidden rounded-sm bg-muted"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${product.slug}`}
                    className="font-serif text-lg md:text-xl text-foreground hover:text-primary transition-colors"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <p className="text-sm font-medium text-foreground mt-2">
                    ${product.price.toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button asChild size="sm" className="rounded-sm">
                    <Link to={`/inquiry?product=${product.slug}`}>Inquire</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(product.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Wishlist;
