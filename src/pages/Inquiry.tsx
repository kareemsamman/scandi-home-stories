import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { getProductBySlug, products } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Inquiry = () => {
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get("product");
  const preselectedProduct = productSlug
    ? getProductBySlug(productSlug)
    : null;

  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    product: preselectedProduct?.name || "",
    message: "",
  });

  useEffect(() => {
    if (preselectedProduct) {
      setFormData((prev) => ({ ...prev, product: preselectedProduct.name }));
    }
  }, [preselectedProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Inquiry submitted:", formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Layout>
        <section className="py-28 md:py-40">
          <div className="container-narrow">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-primary/10 flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
                Thank You
              </h1>
              <p className="text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">
                We've received your inquiry and will be in touch within 1-2
                business days. We look forward to helping you find the perfect
                piece.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  className="rounded-none px-10 py-5 text-sm tracking-[0.15em] uppercase"
                >
                  <Link to="/products">
                    Continue Browsing
                    <ArrowRight className="ml-3 w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-none px-10 py-5 text-sm tracking-[0.1em] uppercase"
                >
                  <Link to="/">Return Home</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80"
            alt="Workshop"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/20 to-charcoal/10" />
        </div>
        <div className="relative container-full h-full flex flex-col justify-end pb-12 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white/60 mb-3">
              Get in Touch
            </p>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-[0.95]">
              Inquire
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 md:py-24">
        <div className="container-narrow">
          <div className="grid md:grid-cols-12 gap-16">
            {/* Left column — info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="md:col-span-4"
            >
              <p className="text-muted-foreground leading-[1.8] mb-8">
                Have questions about a specific piece or looking for something
                particular? We're here to help guide you to the perfect choice.
              </p>

              <div className="space-y-6 pb-8 border-b border-border mb-8">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground/60 mb-1.5">
                    Email
                  </p>
                  <a
                    href="mailto:hello@maison.com"
                    className="text-sm text-foreground hover:text-primary transition-colors"
                  >
                    hello@maison.com
                  </a>
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground/60 mb-1.5">
                    Response Time
                  </p>
                  <p className="text-sm text-foreground">1-2 business days</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground/50 leading-relaxed">
                Your information is kept private and never shared with third
                parties.
              </p>
            </motion.div>

            {/* Right column — form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="md:col-span-8 space-y-8"
            >
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground"
                  >
                    Name *
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="rounded-none border-border/60 focus:border-foreground py-5 transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground"
                  >
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="rounded-none border-border/60 focus:border-foreground py-5 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground"
                >
                  Phone (optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="rounded-none border-border/60 focus:border-foreground py-5 transition-colors"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="product"
                  className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground"
                >
                  Product of Interest
                </Label>
                <Select
                  value={formData.product}
                  onValueChange={(value) =>
                    setFormData({ ...formData, product: value })
                  }
                >
                  <SelectTrigger className="rounded-none border-border/60 py-5">
                    <SelectValue placeholder="Select a product (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.name}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="message"
                  className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground"
                >
                  Message *
                </Label>
                <Textarea
                  id="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="rounded-none border-border/60 focus:border-foreground resize-none transition-colors"
                  placeholder="Tell us about your inquiry—questions about materials, dimensions, availability, or anything else you'd like to know..."
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium"
              >
                Send Inquiry
                <ArrowRight className="ml-3 w-4 h-4" />
              </Button>
            </motion.form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Inquiry;
