import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, ArrowRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useWishlist } from "@/hooks/useWishlist";
import { collections } from "@/data/products";
import { Button } from "@/components/ui/button";

const Wishlist = () => {
  const { items, removeItem, clearWishlist } = useWishlist();

  if (items.length === 0) {
    return (
      <Layout>
        <section className="py-28 md:py-40">
          <div className="container-narrow text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-20 h-20 bg-muted/50 flex items-center justify-center mx-auto mb-8">
                <Heart className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
                Your Wishlist is Empty
              </h1>
              <p className="text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">
                Save pieces you love by clicking the heart icon on any product.
                They'll appear here for easy browsing.
              </p>
              <Button
                asChild
                className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase"
              >
                <Link to="/products">
                  Explore Products
                  <ArrowRight className="ml-3 w-4 h-4" />
                </Link>
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
      <section className="py-14 md:py-20 bg-linen">
        <div className="container-full">
          <div className="flex items-end justify-between">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
                Your Collection
              </p>
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
              className="text-xs tracking-[0.1em] uppercase text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </section>

      {/* Items */}
      <section className="py-14 md:py-20">
        <div className="container-full">
          <div className="space-y-px">
            <AnimatePresence>
              {items.map((product, index) => {
                const collection = collections.find(
                  (c) => c.id === product.collection
                );
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="flex gap-6 md:gap-10 py-8 border-b border-border group"
                  >
                    <Link
                      to={`/product/${product.slug}`}
                      className="w-28 h-36 md:w-40 md:h-48 flex-shrink-0 overflow-hidden bg-muted/30"
                    >
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      {collection && (
                        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground/60 mb-1">
                          {collection.name}
                        </p>
                      )}
                      <Link
                        to={`/product/${product.slug}`}
                        className="font-serif text-xl md:text-2xl text-foreground hover:text-primary transition-colors duration-300"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1 hidden md:block">
                        {product.description}
                      </p>
                      <p className="text-base font-serif text-foreground mt-3">
                        ${product.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 justify-center">
                      <Button
                        asChild
                        size="sm"
                        className="rounded-none text-xs tracking-[0.1em] uppercase px-6"
                      >
                        <Link to={`/inquiry?product=${product.slug}`}>
                          Inquire
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(product.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Wishlist;
