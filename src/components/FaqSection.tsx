import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FaqSection = () => {
  const { t, localePath } = useLocale();
  const faq = t("faq");
  if (!faq?.items) return null;

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
              {faq.title}
            </h2>
            <p className="text-muted-foreground mb-6">{faq.subtitle}</p>
            <p className="text-sm text-muted-foreground">{faq.contactText}</p>
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
              {faq.items.map((item: any, index: number) => (
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