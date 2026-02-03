import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { CollectionCard } from "@/components/CollectionCard";
import { collections, getFeaturedProducts, products } from "@/data/products";
import { Button } from "@/components/ui/button";

const Index = () => {
  const featuredProducts = getFeaturedProducts();
  const displayedCollections = collections.slice(0, 6);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[80vh] md:h-[90vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80"
            alt="Curated home lifestyle"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 via-charcoal/20 to-transparent" />
        </div>
        
        <div className="relative container-wide h-full flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl"
          >
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight">
              Objects for
              <br />
              Considered Living
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
              A curated collection of handcrafted home goods and lifestyle pieces, 
              designed to bring warmth and intention to everyday moments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="rounded-sm">
                <Link to="/products">
                  Explore Collection
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-sm bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white">
                <Link to="/about">Our Story</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Statement */}
      <section className="py-20 md:py-28 bg-linen">
        <div className="container-narrow text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-serif text-2xl md:text-3xl lg:text-4xl text-foreground leading-relaxed">
              We believe in the beauty of slow living—in objects made with care, 
              materials that age gracefully, and spaces that invite pause. 
              Each piece in our collection tells a story of craftsmanship and intention.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-2">
                Editor's Picks
              </p>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground">
                Featured Pieces
              </h2>
            </div>
            <Link
              to="/products"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="editorial-grid">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          <div className="mt-12 text-center md:hidden">
            <Button asChild variant="outline" className="rounded-sm">
              <Link to="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-2">
              Browse By
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">
              Collections
            </h2>
          </div>

          <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {displayedCollections.map((collection, index) => (
              <CollectionCard key={collection.id} collection={collection} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Latest Arrivals Highlight */}
      <section className="py-16 md:py-24">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[4/5] overflow-hidden rounded-sm"
            >
              <img
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80"
                alt="New arrivals"
                className="w-full h-full object-cover"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-sm font-medium tracking-widest uppercase text-primary mb-4">
                Just Arrived
              </p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-6">
                New Additions to the Collection
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Discover our latest carefully selected pieces—from sculptural ceramics 
                to heirloom-quality textiles. Each new addition has been chosen to 
                complement the rhythms of thoughtful living.
              </p>
              <Button asChild className="rounded-sm">
                <Link to="/products?collection=new-arrivals">
                  Shop New Arrivals
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container-narrow text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              Join Our World
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
              Be the first to know about new arrivals, seasonal collections, 
              and stories from our workshop.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 text-sm bg-primary-foreground/10 border border-primary-foreground/20 rounded-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground/50"
              />
              <Button
                type="submit"
                variant="secondary"
                className="rounded-sm px-8"
              >
                Subscribe
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
