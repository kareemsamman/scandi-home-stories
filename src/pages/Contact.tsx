import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const Contact = () => {
  const { t } = useLocale();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast({ title: "✓", description: t("checkout.successText") });
    setFormData({ name: "", email: "", phone: "", message: "" });
    setIsSubmitting(false);
  };

  const contactInfo = [
    { icon: Mail, label: t("contact.emailLabel"), value: "info@amgpergola.co.il", href: "mailto:info@amgpergola.co.il" },
    { icon: Phone, label: t("contact.phoneLabel"), value: "03-1234567", href: "tel:+97231234567" },
    { icon: MapPin, label: t("contact.addressLabel"), value: t("contact.addressText") },
    { icon: Clock, label: t("contact.hoursLabel"), value: t("contact.hoursText") },
  ];

  return (
    <Layout>
      <section className="py-16 md:py-24 mt-16 md:mt-20">
        <div className="section-container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("contact.title")}</h1>
            <p className="text-muted-foreground max-w-md mx-auto">{t("contact.subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-12 gap-10 md:gap-16 max-w-5xl mx-auto">
            {/* Form */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-7">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("contact.name")} *</label><Input name="name" value={formData.name} onChange={handleChange} required className="rounded-lg h-11" /></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("contact.email")} *</label><Input name="email" type="email" value={formData.email} onChange={handleChange} required className="rounded-lg h-11" /></div>
                  <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("contact.phone")}</label><Input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="rounded-lg h-11" /></div>
                </div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("contact.message")} *</label><Textarea name="message" value={formData.message} onChange={handleChange} required placeholder={t("contact.messagePlaceholder")} className="rounded-lg min-h-[140px]" /></div>
                <Button type="submit" size="lg" disabled={isSubmitting} className="rounded-lg px-8 py-5 text-sm font-semibold">
                  {isSubmitting ? t("contact.sending") : t("contact.send")}
                </Button>
              </form>
            </motion.div>

            {/* Contact info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-5">
              <h2 className="text-lg font-bold mb-6">{t("contact.infoTitle")}</h2>
              <div className="space-y-6">
                {contactInfo.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-accent-strong" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-0.5">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm font-medium hover:text-accent-strong transition-colors">{item.value}</a>
                      ) : (
                        <p className="text-sm font-medium">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;