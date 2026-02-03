import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";

const About = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80"
            alt="Artisan workshop"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/40" />
        </div>
        
        <div className="relative container-wide h-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center"
          >
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white mb-4">
              Our Story
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl">
              Curating beauty for considered living
            </p>
          </motion.div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20 md:py-28">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <p className="text-sm font-medium tracking-widest uppercase text-primary mb-6">
              Our Philosophy
            </p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-8 leading-tight">
              We believe that the objects we surround ourselves with should tell stories, 
              age beautifully, and bring quiet joy to everyday moments.
            </h2>
          </motion.div>
        </div>
      </section>

      {/* Story Grid */}
      <section className="pb-20 md:pb-28">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-6">
                The Beginning
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Maison began as a personal quest—a search for objects that felt meaningful 
                in an age of disposable everything. After years of collecting and curating, 
                we opened our doors to share these discoveries with others who value 
                craftsmanship over convenience.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                What started as a small collection has grown into a carefully edited 
                selection of home goods and lifestyle pieces, each chosen for its ability 
                to bring warmth, texture, and intention to the spaces we inhabit.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="aspect-[4/5] rounded-sm overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80"
                alt="Living space"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="aspect-[4/5] rounded-sm overflow-hidden md:order-first"
            >
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
                alt="Artisan hands at work"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-6">
                Our Approach
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Every piece in our collection passes through our hands before reaching yours. 
                We visit workshops, meet makers, and learn the stories behind each object. 
                This personal connection ensures that what we offer isn't just beautiful—it's 
                honest.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We prioritize natural materials, traditional techniques, and makers who share 
                our values. Whether it's a hand-thrown ceramic vessel or a solid oak table 
                built to last generations, we believe in objects that get better with time, 
                not worse.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28 bg-linen">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-sm font-medium tracking-widest uppercase text-primary mb-4">
              What Guides Us
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">
              Our Values
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <h3 className="font-serif text-xl text-foreground mb-4">Craftsmanship</h3>
              <p className="text-muted-foreground leading-relaxed">
                We champion the work of skilled hands—artisans who have honed their craft 
                over years, creating objects with care and intention that machines cannot replicate.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <h3 className="font-serif text-xl text-foreground mb-4">Sustainability</h3>
              <p className="text-muted-foreground leading-relaxed">
                We choose natural materials that age gracefully and makers who respect 
                the environment. Quality over quantity means less waste and more meaning.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <h3 className="font-serif text-xl text-foreground mb-4">Slow Living</h3>
              <p className="text-muted-foreground leading-relaxed">
                In a world of constant acceleration, we believe in the beauty of pause. 
                Our objects invite moments of calm and presence in daily life.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container-narrow text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
              Have a Question?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              We're always happy to discuss our pieces, our makers, or help you find 
              exactly what you're looking for.
            </p>
            <a
              href="/inquiry"
              className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
            >
              Get in Touch
            </a>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
