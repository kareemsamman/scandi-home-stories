import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
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
      {/* Header */}
      <section className="py-12 md:py-16 bg-linen">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
              {currentCollection ? currentCollection.name : "All Products"}
            </h1>
            {currentCollection && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {currentCollection.description}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-border sticky top-16 md:top-20 bg-background z-40">
        <div className="container-wide">
          <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFilterChange("all")}
              className={cn(
                "rounded-full px-4 whitespace-nowrap",
                activeCollection === "all" && "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
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
                  "rounded-full px-4 whitespace-nowrap",
                  activeCollection === collection.slug && "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                )}
              >
                {collection.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 md:py-16">
        <div className="container-wide">
          {filteredProducts.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-8">
                {filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}
              </p>
              <div className="editorial-grid">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                No products found in this collection.
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Products;
