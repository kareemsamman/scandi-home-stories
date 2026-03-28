import { useState, useRef } from "react";
import { useLocale } from "@/i18n/useLocale";
import { usePergolaConfigurator } from "@/stores/usePergolaConfigurator";
import { useCreatePergolaRequest } from "@/hooks/usePergolaRequests";
import { useToast } from "@/hooks/use-toast";
import { generatePergolaPdf } from "@/lib/generatePergolaPdf";
import { PergolaForm, type PergolaFormValues } from "./PergolaForm";
import { PergolaPreview } from "./PergolaPreview";
import { PergolaSpecsSummary } from "./PergolaSpecsSummary";
import { CheckCircle2, ArrowRight } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const PergolaConfigurator = () => {
  const { t, locale, localePath } = useLocale();
  const { specs } = usePergolaConfigurator();
  const createRequest = useCreatePergolaRequest();
  const { toast } = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pendingValues = useRef<PergolaFormValues | null>(null);

  const handleFormSubmit = (values: PergolaFormValues) => {
    pendingValues.current = values;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const values = pendingValues.current;
    if (!values || !specs) return;
    setConfirmOpen(false);
    setIsSubmitting(true);

    try {
      // Generate PDF
      const svgEl = document.querySelector("#pergola-preview-svg svg") as SVGSVGElement | null;
      const pdfUrl = await generatePergolaPdf(values, specs, locale, svgEl);

      // Save to database
      await createRequest.mutateAsync({
        customer_name: values.customerName.trim(),
        customer_phone: values.customerPhone.trim(),
        customer_email: values.customerEmail?.trim() || null,
        width: Number(values.width),
        length: Number(values.length),
        height: values.height ? Number(values.height) : null,
        pergola_type: values.pergolaType,
        mount_type: values.mountType,
        installation: values.installation,
        lighting: values.lighting,
        santaf_roofing: values.santafRoofing,
        frame_color: values.frameColor,
        roof_color: values.roofColor,
        notes: values.notes.trim(),
        module_classification: specs.moduleClassification,
        carrier_count: specs.carrierCount,
        front_post_count: specs.frontPostCount,
        back_post_count: specs.backPostCount,
        pdf_url: pdfUrl,
        locale,
      });

      setSubmitted(true);
    } catch (err) {
      toast({
        title: locale === "ar" ? "خطأ" : "שגיאה",
        description: locale === "ar" ? "حدث خطأ. حاول مرة أخرى." : "אירעה שגיאה. נסו שוב.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success view
  if (submitted) {
    return (
      <div className="text-center py-16 space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t("pergolaRequest.successTitle")}</h2>
        <p className="text-gray-500 max-w-md mx-auto">{t("pergolaRequest.successText")}</p>
        <a
          href={localePath("/")}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          {t("pergolaRequest.backToHome")}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Form */}
        <div>
          <PergolaForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
        </div>

        {/* Preview (sticky on desktop) */}
        <div className="lg:sticky lg:top-8 lg:self-start space-y-4">
          <PergolaSpecsSummary />
          <PergolaPreview />
          <p className="text-xs text-gray-400 leading-relaxed">
            {t("pergolaRequest.disclaimer")}
          </p>
        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("pergolaRequest.submitConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>{t("pergolaRequest.submitConfirmText")}</span>
              <br />
              <span className="text-xs text-gray-400 block mt-2">{t("pergolaRequest.disclaimer")}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("pergolaRequest.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>{t("pergolaRequest.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
