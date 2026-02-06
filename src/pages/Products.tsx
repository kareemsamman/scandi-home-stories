import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { products, collections, getCollectionBySlug } from "@/data/products";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCollection = searchParams.get("collection") || "all";

  const filteredProducts = useMemo(() => {
    if (activeCollection === "all") {
      return products;
    }
    return products.filter((product) => {
      const collection = collections.find((c) => c.slug === activeCollection);
      return collection ? product.collection === collection.id : true;
    });
  }, [activeCollection]);

  const currentCollection = activeCollection !== "all"
    ? getCollectionBySlug(activeCollection)
    : null;

  const handleFilterChange = (slug: string) => {
    if (slug === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ collection: slug });
    }
  };

  return (
    <Layout>
      {/* Hero Banner */}
      <section className="relative h-[40vh] md:h-[55vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={
              currentCollection?.heroImage ||
              "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
            }
            alt={currentCollection?.name || "All Products"}
            className="w-full h-full object-cover transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/20 to-charcoal/10" />
        </div>

        <div className="relative container-full h-full flex flex-col justify-end pb-12 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-white/50 mb-3">
              {currentCollection ? "Collection" : "Shop"}
            </p>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white mb-3 leading-[0.95]">
              {currentCollection ? currentCollection.name : "All Pieces"}
            </h1>
            {currentCollection && (
              <p className="text-base text-white/70 max-w-lg">
                {currentCollection.description}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-5 border-b border-border sticky top-16 md:top-20 bg-background/95 backdrop-blur-md z-40">
        <div className="container-full">
          <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFilterChange("all")}
              className={cn(
                "rounded-none px-5 whitespace-nowrap text-xs tracking-[0.1em] uppercase transition-all duration-300",
                activeCollection === "all"
                  ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                  : "hover:bg-accent"
              )}
            >
              All
            </Button>
            {collections.map((collection) => (
              <Button
                key={collection.id}
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange(collection.slug)}
                className={cn(
                  "rounded-none px-5 whitespace-nowrap text-xs tracking-[0.1em] uppercase transition-all duration-300",
                  activeCollection === collection.slug
                    ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                    : "hover:bg-accent"
                )}
              >
                {collection.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-14 md:py-20">
        <div className="container-full">
          {filteredProducts.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-10">
                <p className="text-sm text-muted-foreground">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "piece" : "pieces"}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-28">
              <p className="font-serif text-2xl text-muted-foreground mb-4">
                No pieces found
              </p>
              <p className="text-muted-foreground mb-8">
                This collection is currently being curated.
              </p>
              <Button
                asChild
                variant="outline"
                className="rounded-none px-8 text-sm tracking-[0.1em] uppercase"
              >
                <Link to="/products">View All Pieces</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative h-[50vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"
            alt="Interior lifestyle"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/50" />
        </div>
        <div className="relative h-full flex items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-white/50 mb-4">
              Need Help Choosing?
            </p>
            <h2 className="font-serif text-3xl md:text-5xl text-white mb-6">
              Let Us Guide You
            </h2>
            <Button
              asChild
              size="lg"
              className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase bg-white text-charcoal hover:bg-white/90"
            >
              <Link to="/inquiry">
                Get in Touch
                <ArrowRight className="ml-3 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
