import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock, ArrowLeft, Send } from "lucide-react";

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
    { icon: Mail,  label: t("contact.emailLabel"),   value: "info@amgpergola.co.il", href: "mailto:info@amgpergola.co.il" },
    { icon: Phone, label: t("contact.phoneLabel"),   value: "03-1234567",             href: "tel:+97231234567" },
    { icon: MapPin,label: t("contact.addressLabel"), value: t("contact.addressText") },
    { icon: Clock, label: t("contact.hoursLabel"),   value: t("contact.hoursText") },
  ];

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative h-[52vh] md:h-[62vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        <div className="relative h-full flex flex-col justify-end section-container pb-14 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-white/55 mb-3">
              {t("contact.subtitle")}
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
              {t("contact.title")}
            </h1>
            {/* Quick contact pills */}
            <div className="flex flex-wrap gap-3 mt-2">
              <a
                href="tel:+97231234567"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-medium hover:bg-white/25 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                03-1234567
              </a>
              <a
                href="mailto:info@amgpergola.co.il"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-medium hover:bg-white/25 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                info@amgpergola.co.il
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="section-container">
          <div className="grid md:grid-cols-12 gap-12 md:gap-20 max-w-5xl mx-auto">

            {/* ── Form ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-7"
            >
              <h2 className="text-xl md:text-2xl font-black mb-8 text-foreground">
                {t("contact.infoTitle")}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("contact.name")} *
                  </label>
                  <Input
                    name="name" value={formData.name} onChange={handleChange} required
                    className="rounded-xl h-12 border-border/60 focus:border-foreground transition-colors bg-gray-50/50"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t("contact.email")} *
                    </label>
                    <Input
                      name="email" type="email" value={formData.email} onChange={handleChange} required
                      className="rounded-xl h-12 border-border/60 focus:border-foreground transition-colors bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t("contact.phone")}
                    </label>
                    <Input
                      name="phone" type="tel" value={formData.phone} onChange={handleChange}
                      className="rounded-xl h-12 border-border/60 focus:border-foreground transition-colors bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("contact.message")} *
                  </label>
                  <Textarea
                    name="message" value={formData.message} onChange={handleChange} required
                    placeholder={t("contact.messagePlaceholder")}
                    className="rounded-xl border-border/60 focus:border-foreground transition-colors min-h-[160px] resize-none bg-gray-50/50"
                  />
                </div>

                <Button
                  type="submit" size="lg" disabled={isSubmitting}
                  className="rounded-xl px-8 h-12 text-sm font-semibold gap-2 w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    t("contact.sending")
                  ) : (
                    <>
                      {t("contact.send")}
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>

            {/* ── Contact info ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-5 space-y-8"
            >
              {/* Info cards */}
              <div className="space-y-4">
                {contactInfo.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.08 }}
                    className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-border/40"
                  >
                    <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-background" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a href={item.href} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-foreground">{item.value}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Map embed placeholder */}
              <div className="rounded-2xl overflow-hidden border border-border/40 h-52 bg-gray-100 flex items-center justify-center">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d108623.3654726395!2d34.7229978!3d32.0879976!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151d4ca6193b7c1f%3A0xc1fb72a2c0963f90!2sTel%20Aviv-Yafo!5e0!3m2!1sen!2sil!4v1710000000000!5m2!1sen!2sil"
                  width="100%" height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location"
                />
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
