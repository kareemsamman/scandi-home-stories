import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
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
  const preselectedProduct = productSlug ? getProductBySlug(productSlug) : null;

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
    // In a real app, you'd send this to your backend
    console.log("Inquiry submitted:", formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Layout>
        <section className="py-20 md:py-28">
          <div className="container-narrow">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
                Thank You
              </h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                We've received your inquiry and will be in touch within 1-2 business days. 
                We look forward to helping you find the perfect piece.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="rounded-sm">
                  <Link to="/products">Continue Browsing</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-sm">
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
      {/* Header */}
      <section className="py-12 md:py-16 bg-linen">
        <div className="container-narrow text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Inquire
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Have questions about a specific piece or looking for something particular? 
              We're here to help guide you to the perfect choice.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 md:py-16">
        <div className="container-narrow">
          <div className="max-w-xl mx-auto">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-sm"
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="rounded-sm"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product">Product of Interest</Label>
                <Select
                  value={formData.product}
                  onValueChange={(value) => setFormData({ ...formData, product: value })}
                >
                  <SelectTrigger className="rounded-sm">
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
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="rounded-sm resize-none"
                  placeholder="Tell us about your inquiry—questions about materials, dimensions, availability, or anything else you'd like to know..."
                />
              </div>

              <Button type="submit" size="lg" className="w-full rounded-sm">
                Send Inquiry
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                We typically respond within 1-2 business days.
              </p>
            </motion.form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Inquiry;
