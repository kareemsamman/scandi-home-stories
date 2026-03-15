import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, getSubtotal, clearCart } = useCart();
  const { t, locale, localePath } = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", postalCode: "", country: "", notes: "" });

  const subtotal = getSubtotal();
  const shipping = subtotal > 5000 ? 0 : 250;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="section-container py-28 text-center mt-16 md:mt-20">
          <h1 className="text-3xl font-bold mb-4">{t("checkout.emptyTitle")}</h1>
          <p className="text-muted-foreground mb-8">{t("checkout.emptyText")}</p>
          <Button asChild size="lg" className="rounded-lg"><Link to={localePath("/shop")}>{t("cart.startShopping")}</Link></Button>
        </div>
      </Layout>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast({ title: t("checkout.successTitle"), description: t("checkout.successText") });
    clearCart();
    setIsSubmitting(false);
    navigate(localePath("/"));
  };

  return (
    <Layout>
      <div className="bg-primary/10 border-b border-primary/20 mt-16 md:mt-20">
        <div className="section-container py-3 flex items-center gap-3 text-sm">
          <AlertCircle className="w-4 h-4 text-accent-strong" />
          <span className="font-medium">{t("checkout.comingSoon")}</span>
          <span className="text-muted-foreground">{t("checkout.comingSoonText")}</span>
        </div>
      </div>

      <section className="py-8 md:py-14">
        <div className="section-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-10">{t("checkout.title")}</h1>
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
            <div className="lg:col-span-7">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <h2 className="text-lg font-bold mb-4">{t("checkout.contactInfo")}</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("checkout.firstName")} *</label><Input name="firstName" value={formData.firstName} onChange={handleChange} required className="rounded-lg h-11" /></div>
                    <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("checkout.lastName")} *</label><Input name="lastName" value={formData.lastName} onChange={handleChange} required className="rounded-lg h-11" /></div>
                    <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("checkout.email")} *</label><Input name="email" type="email" value={formData.email} onChange={handleChange} required className="rounded-lg h-11" /></div>
                    <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("checkout.phone")}</label><Input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="rounded-lg h-11" /></div>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-4">{t("checkout.shippingAddress")}</h2>
                  <div className="space-y-4">
                    <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("checkout.address")} *</label><Input name="address" value={formData.address} onChange={handleChange} required className="rounded-lg h-11" /></div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("checkout.city")} *</label><Input name="city" value={formData.city} onChange={handleChange} required className="rounded-lg h-11" /></div>
                      <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("checkout.postalCode")}</label><Input name="postalCode" value={formData.postalCode} onChange={handleChange} className="rounded-lg h-11" /></div>
                      <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("checkout.country")} *</label><Input name="country" value={formData.country} onChange={handleChange} required className="rounded-lg h-11" /></div>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-4">{t("checkout.orderNotes")}</h2>
                  <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder={t("checkout.orderNotesPlaceholder")} className="rounded-lg min-h-[100px]" />
                </div>
                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full rounded-lg py-6 text-sm font-semibold">
                  {isSubmitting ? t("checkout.submitting") : <>{t("checkout.submit")}<ArrowRight className="w-4 h-4 ms-2" /></>}
                </Button>
              </form>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-surface rounded-lg p-6 lg:sticky lg:top-28">
                <h2 className="text-lg font-bold mb-5">{t("cart.orderSummary")}</h2>
                <div className="space-y-3 mb-5">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="w-14 h-16 rounded-md overflow-hidden"><img src={item.product.images[0]} alt="" className="w-full h-full object-cover" /></div>
                      <div className="flex-1"><p className="text-sm font-medium line-clamp-1">{item.product.name}</p><p className="text-xs text-muted-foreground">{t("product.quantity")}: {item.quantity}</p><p className="text-sm font-medium">{t("common.currency")}{(item.product.price * item.quantity).toLocaleString()}</p></div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("cart.subtotal")}</span><span>{t("common.currency")}{subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("cart.shipping")}</span><span>{shipping === 0 ? t("cart.complimentary") : `${t("common.currency")}${shipping}`}</span></div>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-bold text-lg"><span>{t("cart.total")}</span><span>{t("common.currency")}{total.toLocaleString()}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;