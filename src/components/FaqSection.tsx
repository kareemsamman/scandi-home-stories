import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useHomeContent } from "@/hooks/useHomeContent";

export const FaqSection = ({ sectionKey = "faq" }: { sectionKey?: string }) => {
  const { t, localePath, locale } = useLocale();
  const faq = t("faq");
  const { data: dbData } = useHomeContent(sectionKey, locale);

  const title = dbData?.title || faq.title;
  const subtitle = dbData?.subtitle || faq.subtitle;
  const contactText = dbData?.contact_text || faq.contactText;
  const items = dbData?.items?.length ? dbData.items : faq.items;

  if (!items) return null;

  return (
    <section className="py-16 md:py-24 bg-surface">
      <div className="section-container">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16">
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-4"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {title}
            </h2>
            <p className="text-muted-foreground mb-6">{subtitle}</p>
            <p className="text-sm text-muted-foreground">{contactText}</p>
          </motion.div>

          {/* Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-8"
          >
            <Accordion type="single" collapsible className="w-full">
              {items.map((item: any, index: number) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                  <AccordionTrigger className="text-start py-5 text-base font-medium hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
};