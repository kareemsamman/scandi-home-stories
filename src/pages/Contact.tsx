import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, Loader2 } from "lucide-react";
import { SEOHead, getOrganizationSchema } from "@/components/SEOHead";

const DEFAULT_HERO_IMAGE    = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80";
const DEFAULT_HERO_IMAGE_MB = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";

const Contact = () => {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: heroDb }   = useHomeContent("contact_hero",   locale);
  const { data: detailsDb } = useHomeContent("contact_details", locale);

  // Hero content
  const heroTitle    = heroDb?.title       || t("contact.title");
  const heroSubtitle = heroDb?.subtitle    || t("contact.subtitle");
  const heroImage    = heroDb?.image       || DEFAULT_HERO_IMAGE;
  const heroImageMb  = heroDb?.image_mobile|| heroDb?.image || DEFAULT_HERO_IMAGE_MB;

  // Contact details
  const phone   = detailsDb?.phone   || "052-812-2846";
  const email   = detailsDb?.email   || "mail@amgpergola.co.il";
  const address = detailsDb?.address || t("contact.addressText");
  const hours   = detailsDb?.hours   || t("contact.hoursText");
  const mapSrc  = detailsDb?.map_embed_url || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d108623.3654726395!2d34.7229978!3d32.0879976!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151d4ca6193b7c1f%3A0xc1fb72a2c0963f90!2sTel%20Aviv-Yafo!5e0!3m2!1sen!2sil!4v1710000000000!5m2!1sen!2sil";

  const contactInfo = [
    { icon: Mail,   label: t("contact.emailLabel"),   value: email,   href: `mailto:${email}` },
    { icon: Phone,  label: t("contact.phoneLabel"),   value: phone,   href: `tel:${phone.replace(/\D/g, "")}` },
    { icon: MapPin, label: t("contact.addressLabel"), value: address },
    { icon: Clock,  label: t("contact.hoursLabel"),   value: hours },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2)
      errs.name = locale === "ar" ? "الاسم مطلوب (حرفان على الأقل)" : "שם חובה (לפחות 2 תווים)";
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRx.test(formData.email))
      errs.email = locale === "ar" ? "بريد إلكتروني غير صالح" : "כתובת אימייל לא תקינה";
    if (formData.phone.trim()) {
      const phoneRx = /^[0-9\s\-\+\(\)]{7,15}$/;
      if (!phoneRx.test(formData.phone.trim()))
        errs.phone = locale === "ar" ? "رقم هاتف غير صالح" : "מספר טלפון לא תקין";
    }
    if (!formData.message.trim())
      errs.message = locale === "ar" ? "الرسالة مطلوبة" : "הודעה נדרשת";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any).functions.invoke("send-contact-email", {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          message: formData.message.trim(),
          locale,
        },
      });
      if (error) throw error;
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
      setErrors({});
    } catch {
      toast({ title: locale === "ar" ? "خطأ" : "שגיאה", description: locale === "ar" ? "אירעה שגיאה. נסה שוב." : "אירעה שגיאה. נסה שוב.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const seoTitle = locale === "ar" ? "تواصل معنا | A.M.G PERGOLA LTD" : "צור קשר | A.M.G PERGOLA LTD";
  const seoDesc = locale === "ar"
    ? "تواصلوا مع A.M.G Pergola للاستشارة المجانية وعروض الأسعار. تصميم وتصنيع وتركيب برجولات وحلول تظليل متقدمة."
    : "צרו קשר עם A.M.G Pergola לייעוץ חינם והצעת מחיר. תכנון, ייצור והתקנת פרגולות ופתרונות הצללה מתקדמים.";

  return (
    <Layout>
      <SEOHead title={seoTitle} description={seoDesc} jsonLd={[getOrganizationSchema()]} />
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative h-[52vh] md:h-[62vh] overflow-hidden">
        <img src={heroImageMb}  alt="" className="absolute inset-0 w-full h-full object-cover md:hidden" />
        <img src={heroImage}    alt="" className="absolute inset-0 w-full h-full object-cover hidden md:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        <div className="relative h-full flex flex-col justify-end section-container pb-14 md:pb-20">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/55 mb-3">
              {heroSubtitle}
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
              {heroTitle}
            </h1>
            <div className="flex flex-wrap gap-3 mt-2">
              <a href={`tel:${phone.replace(/\D/g, "")}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-medium hover:bg-white/25 transition-colors">
                <Phone className="w-3.5 h-3.5" />{phone}
              </a>
              <a href={`mailto:${email}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-medium hover:bg-white/25 transition-colors">
                <Mail className="w-3.5 h-3.5" />{email}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="section-container">
          <div className="grid md:grid-cols-12 gap-12 md:gap-20 max-w-5xl mx-auto">

            {/* Form */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-7">
              <h2 className="text-xl md:text-2xl font-black mb-8 text-foreground">{t("contact.infoTitle")}</h2>

              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center gap-4 py-14 px-6 rounded-2xl bg-green-50 border border-green-200">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <div>
                    <h3 className="text-lg font-bold text-green-800 mb-1">
                      {locale === "ar" ? "تم الإرسال بنجاح!" : "הפנייה נשלחה בהצלחה!"}
                    </h3>
                    <p className="text-sm text-green-700">
                      {locale === "ar" ? "سنتواصل معك قريباً" : "ניצור איתך קשר בהקדם"}
                    </p>
                  </div>
                  <button onClick={() => setSubmitted(false)}
                    className="text-xs text-green-600 underline underline-offset-2 hover:text-green-800">
                    {locale === "ar" ? "إرسال رسالة أخرى" : "שלח פנייה נוספת"}
                  </button>
                </motion.div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("contact.name")} *</label>
                  <Input name="name" value={formData.name} onChange={handleChange}
                    className={`rounded-xl h-12 bg-gray-50/50 ${errors.name ? "border-red-400 focus-visible:ring-red-300" : "border-border/60"}`} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("contact.email")} *</label>
                    <Input name="email" type="email" value={formData.email} onChange={handleChange}
                      className={`rounded-xl h-12 bg-gray-50/50 ${errors.email ? "border-red-400 focus-visible:ring-red-300" : "border-border/60"}`} />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("contact.phone")}</label>
                    <Input name="phone" type="tel" value={formData.phone} onChange={handleChange}
                      className={`rounded-xl h-12 bg-gray-50/50 ${errors.phone ? "border-red-400 focus-visible:ring-red-300" : "border-border/60"}`} />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("contact.message")} *</label>
                  <Textarea name="message" value={formData.message} onChange={handleChange}
                    placeholder={t("contact.messagePlaceholder")}
                    className={`rounded-xl min-h-[160px] resize-none bg-gray-50/50 ${errors.message ? "border-red-400 focus-visible:ring-red-300" : "border-border/60"}`} />
                  {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
                </div>
                <Button type="submit" size="lg" disabled={isSubmitting} className="rounded-xl px-8 h-12 text-sm font-semibold gap-2 w-full sm:w-auto">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />{t("contact.sending")}</> : <>{t("contact.send")}<Send className="w-4 h-4" /></>}
                </Button>
              </form>
              )}
            </motion.div>

            {/* Contact info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-5 space-y-4">
              {contactInfo.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.08 }}
                  className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-border/40">
                  <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">{item.value}</a>
                    ) : (
                      <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Map */}
              <div className="rounded-2xl overflow-hidden border border-border/40 h-52 mt-2">
                <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Location" />
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
