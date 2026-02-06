import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { useRef } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { CollectionCard } from "@/components/CollectionCard";
import { collections, getFeaturedProducts, getNewProducts, products } from "@/data/products";
import { Button } from "@/components/ui/button";

const Index = () => {
  const featuredProducts = getFeaturedProducts();
  const newProducts = getNewProducts();
  const displayedCollections = collections.slice(0, 6);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <Layout>
      {/* Hero Section — Full Viewport */}
      <section ref={heroRef} className="relative h-[100svh] -mt-16 md:-mt-20 overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroImageY }}>
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80"
            alt="Curated home lifestyle"
            className="w-full h-[120%] object-cover animate-ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-charcoal/10 to-charcoal/50" />
        </motion.div>

        <motion.div
          className="relative container-full h-full flex flex-col justify-end pb-20 md:pb-28 pt-16 md:pt-20"
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-3xl"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white/70 mb-6"
            >
              Curated for Considered Living
            </motion.p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl xl:text-9xl text-white mb-8 leading-[0.9] tracking-tight">
              Objects of
              <br />
              <span className="italic font-normal">Quiet Beauty</span>
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-10 leading-relaxed max-w-lg">
              Handcrafted home goods and lifestyle pieces designed to bring
              warmth and intention to everyday moments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium"
              >
                <Link to="/products">
                  Explore Collection
                  <ArrowRight className="ml-3 w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/about">Our Story</Link>
              </Button>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="w-4 h-4 text-white/50" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee Text Banner */}
      <section className="py-5 border-y border-border bg-background overflow-hidden">
        <div className="marquee">
          <div className="marquee-content gap-12 animate-marquee">
            {[
              "Handcrafted with Intention",
              "Natural Materials",
              "Scandinavian Heritage",
              "Timeless Design",
              "Artisan Made",
              "Sustainable Living",
              "Handcrafted with Intention",
              "Natural Materials",
              "Scandinavian Heritage",
              "Timeless Design",
              "Artisan Made",
              "Sustainable Living",
            ].map((text, i) => (
              <span
                key={i}
                className="text-sm font-medium tracking-[0.2em] uppercase text-muted-foreground/50 whitespace-nowrap flex items-center gap-12"
              >
                {text}
                <span className="w-1.5 h-1.5 rounded-full bg-primary/30" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Statement */}
      <section className="py-24 md:py-36">
        <div className="container-narrow text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="divider-ornament mb-12">
              <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-primary whitespace-nowrap">
                Our Philosophy
              </span>
            </div>
            <p className="font-serif text-2xl md:text-4xl lg:text-5xl text-foreground leading-[1.3] tracking-tight">
              We believe in the beauty of slow living—in objects made with care,
              materials that age gracefully, and spaces that invite{" "}
              <span className="italic">pause</span>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Large Editorial Image Banner */}
      <section className="px-6 lg:px-12 mb-24 md:mb-36">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative aspect-[4/5] md:aspect-auto md:h-[85vh] overflow-hidden group"
            >
              <img
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80"
                alt="Minimal Scandinavian interior"
                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-white/60 mb-3">
                  The Living Room Edit
                </p>
                <h3 className="font-serif text-3xl md:text-4xl text-white mb-3 leading-tight">
                  Spaces That
                  <br />
                  <span className="italic">Breathe</span>
                </h3>
                <Link
                  to="/products?collection=furniture"
                  className="inline-flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-white/80 hover:text-white transition-colors"
                >
                  Shop Furniture
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative aspect-[4/5] md:aspect-auto md:h-[85vh] overflow-hidden group"
            >
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
                alt="Elegant home interior"
                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-white/60 mb-3">
                  Curated Details
                </p>
                <h3 className="font-serif text-3xl md:text-4xl text-white mb-3 leading-tight">
                  The Art of
                  <br />
                  <span className="italic">Dwelling</span>
                </h3>
                <Link
                  to="/products?collection=objects"
                  className="inline-flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-white/80 hover:text-white transition-colors"
                >
                  Shop Objects
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 md:py-32">
        <div className="container-full">
          <div className="flex items-end justify-between mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
                Editor's Picks
              </p>
              <h2 className="font-serif text-4xl md:text-5xl text-foreground">
                Featured Pieces
              </h2>
            </motion.div>
            <Link
              to="/products"
              className="hidden md:flex items-center gap-3 text-sm font-medium tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors group"
            >
              View All
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          <div className="mt-14 text-center md:hidden">
            <Button
              asChild
              variant="outline"
              className="rounded-none px-8 py-5 text-sm tracking-[0.15em] uppercase"
            >
              <Link to="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Full-Width Lifestyle Banner */}
      <section className="relative h-[70vh] md:h-[80vh] overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
            alt="Beautiful home interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/30" />
        </motion.div>

        <div className="relative container-full h-full flex items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-2xl"
          >
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white/60 mb-6">
              Craftsmanship & Heritage
            </p>
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white mb-6 leading-[0.95]">
              Made to Be
              <br />
              <span className="italic">Treasured</span>
            </h2>
            <p className="text-base text-white/70 mb-10 max-w-md mx-auto leading-relaxed">
              Every piece is selected for its material integrity, its maker's
              story, and its ability to endure beautifully.
            </p>
            <Button
              asChild
              size="lg"
              className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase bg-white text-charcoal hover:bg-white/90"
            >
              <Link to="/about">
                Discover Our Story
                <ArrowRight className="ml-3 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-24 md:py-36">
        <div className="container-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
              Browse By
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">
              Collections
            </h2>
          </motion.div>

          {/* Asymmetric grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            {/* First row: 2 items */}
            <div className="md:col-span-7">
              <CollectionCard
                collection={displayedCollections[0]}
                index={0}
                variant="wide"
              />
            </div>
            <div className="md:col-span-5">
              <CollectionCard
                collection={displayedCollections[1]}
                index={1}
              />
            </div>

            {/* Second row: 3 items */}
            <div className="md:col-span-4">
              <CollectionCard
                collection={displayedCollections[2]}
                index={2}
              />
            </div>
            <div className="md:col-span-4">
              <CollectionCard
                collection={displayedCollections[3]}
                index={3}
              />
            </div>
            <div className="md:col-span-4">
              <CollectionCard
                collection={displayedCollections[4]}
                index={4}
              />
            </div>

            {/* Third row: 1 wide item */}
            <div className="md:col-span-12">
              <CollectionCard
                collection={displayedCollections[5]}
                index={5}
                variant="wide"
              />
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-20 md:py-32 bg-linen">
        <div className="container-full">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[4/5] overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&q=80"
                  alt="New arrivals"
                  className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                />
              </div>
              {/* Floating accent image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="absolute -bottom-8 -right-4 md:-right-12 w-48 md:w-64 aspect-square overflow-hidden shadow-2xl border-4 border-background"
              >
                <img
                  src="https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&q=80"
                  alt="Detail"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="md:pl-8"
            >
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-5">
                Just Arrived
              </p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 leading-[1.05]">
                New Additions
                <br />
                to the{" "}
                <span className="italic">Collection</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-10 text-base max-w-md">
                Discover our latest carefully selected pieces—from sculptural
                ceramics to heirloom-quality textiles. Each new addition has been
                chosen to complement the rhythms of thoughtful living.
              </p>

              {/* Mini product grid */}
              <div className="grid grid-cols-2 gap-6 mb-10">
                {newProducts.slice(0, 2).map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug}`}
                    className="group/item"
                  >
                    <div className="aspect-square overflow-hidden bg-muted/50 mb-3">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-105"
                      />
                    </div>
                    <p className="text-sm font-serif text-foreground group-hover/item:text-primary transition-colors">
                      {product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${product.price}
                    </p>
                  </Link>
                ))}
              </div>

              <Button
                asChild
                className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase"
              >
                <Link to="/products?collection=new-arrivals">
                  Shop New Arrivals
                  <ArrowRight className="ml-3 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Three-Image Editorial Strip */}
      <section className="py-4 md:py-6">
        <div className="grid grid-cols-3 gap-2 md:gap-4 h-[40vh] md:h-[60vh]">
          {[
            {
              src: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80",
              alt: "Handcrafted ceramics",
            },
            {
              src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
              alt: "Styled living space",
            },
            {
              src: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80",
              alt: "Artisan textiles",
            },
          ].map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              className="overflow-hidden group"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-28 md:py-40 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/70" />
        </div>

        <div className="relative container-narrow text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white/50 mb-6">
              Stay Connected
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-5 leading-tight">
              Join Our World
            </h2>
            <p className="text-white/60 mb-10 max-w-md mx-auto leading-relaxed">
              Be the first to know about new arrivals, seasonal collections, and
              stories from our workshop.
            </p>
            <form className="flex flex-col sm:flex-row gap-0 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 h-14 px-6 text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 transition-colors"
              />
              <button
                type="submit"
                className="h-14 px-10 text-sm font-medium tracking-[0.15em] uppercase bg-white text-charcoal hover:bg-white/90 transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
