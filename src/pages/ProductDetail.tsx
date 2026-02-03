import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { getProductBySlug, getRelatedProducts, collections } from "@/data/products";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug || "");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addItem, removeItem, isInWishlist } = useWishlist();

  if (!product) {
    return (
      <Layout>
        <div className="container-wide py-20 text-center">
          <h1 className="font-serif text-3xl mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The piece you're looking for doesn't exist.
          </p>
          <Button asChild className="rounded-sm">
            <Link to="/products">Browse All Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const relatedProducts = getRelatedProducts(product.id);
  const collection = collections.find((c) => c.id === product.collection);

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="container-wide py-4">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
      </div>

      {/* Product Content */}
      <section className="pb-16 md:pb-24">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-[4/5] overflow-hidden bg-muted rounded-sm">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={product.images[currentImageIndex]}
                    alt={product.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "w-20 h-20 rounded-sm overflow-hidden border-2 transition-colors",
                        index === currentImageIndex
                          ? "border-foreground"
                          : "border-transparent hover:border-muted-foreground"
                      )}
                    >
                      <img
                        src={image}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:sticky lg:top-32 lg:self-start"
            >
              {collection && (
                <Link
                  to={`/products?collection=${collection.slug}`}
                  className="inline-block text-sm font-medium tracking-widest uppercase text-primary mb-4 hover:underline"
                >
                  {collection.name}
                </Link>
              )}

              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
                {product.name}
              </h1>

              <p className="text-2xl font-medium text-foreground mb-6">
                ${product.price.toLocaleString()}
              </p>

              <p className="text-muted-foreground leading-relaxed mb-8">
                {product.longDescription}
              </p>

              {/* Details */}
              <div className="space-y-4 mb-8 pb-8 border-b border-border">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Materials</span>
                  <span className="text-sm text-foreground">{product.materials}</span>
                </div>
                {product.dimensions && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Dimensions</span>
                    <span className="text-sm text-foreground">{product.dimensions}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button asChild size="lg" className="rounded-sm w-full">
                  <Link to={`/inquiry?product=${product.slug}`}>
                    Inquire About This Piece
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-sm w-full"
                  onClick={handleWishlistToggle}
                >
                  <Heart
                    className={cn(
                      "w-4 h-4 mr-2",
                      inWishlist && "fill-primary text-primary"
                    )}
                  />
                  {inWishlist ? "Saved to Wishlist" : "Add to Wishlist"}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 md:py-24 bg-card">
          <div className="container-wide">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-8">
              More from {collection?.name}
            </h2>
            <div className="editorial-grid">
              {relatedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ProductDetail;
