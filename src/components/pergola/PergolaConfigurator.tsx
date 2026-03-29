import { useState } from "react";
import { useLocale } from "@/i18n/useLocale";
import { usePergolaConfigurator } from "@/stores/usePergolaConfigurator";
import { useCreatePergolaRequest } from "@/hooks/usePergolaRequests";
import { useToast } from "@/hooks/use-toast";
import { generatePergolaPdf } from "@/lib/generatePergolaPdf";
import { cmToMm } from "@/types/pergola";
import type { PergolaType } from "@/types/pergola";
import { PergolaStartStep } from "./PergolaStartStep";
import { PergolaEditorStep } from "./PergolaEditorStep";
import { PergolaSummaryStep } from "./PergolaSummaryStep";
import { CheckCircle2, ArrowRight } from "lucide-react";

type Step = "start" | "editor" | "summary" | "success";

export const PergolaConfigurator = () => {
  const { t, locale, localePath } = useLocale();
  const { specs, config, setConfig, setActiveView } = usePergolaConfigurator();
  const createRequest = useCreatePergolaRequest();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("start");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 → Step 2: Initialize config and open editor
  const handleStart = (widthCm: number, lengthCm: number, pergolaType: PergolaType) => {
    setConfig({ widthCm, lengthCm, pergolaType });
    setActiveView("isometric"); // Default to 3D-like view
    setStep("editor");
  };

  // Step 2 → Step 3: Move to summary
  const handleEditorNext = () => {
    setStep("summary");
  };

  // Step 3 → Back to editor
  const handleSummaryBack = () => {
    setStep("editor");
  };

  // Step 3 → Submit
  const handleSubmit = async (
    customerName: string,
    customerPhone: string,
    customerEmail: string,
    notes: string,
    installation: boolean,
  ) => {
    if (!specs) return;
    setIsSubmitting(true);

    try {
      const svgEl = document.querySelector("#pergola-preview-svg svg") as SVGSVGElement | null;
      const pdfValues = {
        customerName,
        customerPhone,
        customerEmail,
        widthCm: Number(config.widthCm) || 400,
        lengthCm: Number(config.lengthCm) || 400,
        heightCm: Number(config.heightCm) || 250,
        pergolaType: config.pergolaType || "fixed",
        mountType: config.mountType || "wall",
        installation,
        lighting: config.lighting || "none",
        lightingPosition: config.lightingPosition || "none",
        lightingFixture: config.lightingFixture || "none",
        lightingRoof: config.lightingRoof || false,
        santaf: config.santaf || "without",
        santafColor: config.santafColor || "",
        frameColor: config.frameColor || "#383838",
        roofColor: config.roofColor || "#C0C0C0",
        spacingMode: config.spacingMode || "automatic",
        notes,
      };
      const pdfUrl = await generatePergolaPdf(pdfValues, specs, locale, svgEl);

      await createRequest.mutateAsync({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        width: cmToMm(Number(config.widthCm)),
        length: cmToMm(Number(config.lengthCm)),
        height: config.heightCm ? cmToMm(Number(config.heightCm)) : null,
        pergola_type: config.pergolaType || "fixed",
        mount_type: config.mountType || "wall",
        installation,
        lighting: config.lighting || "none",
        lighting_position: config.lightingPosition || "none",
        lighting_type: config.lightingFixture || "none",
        lighting_posts: config.lightingPosts || [],
        lighting_roof: config.lightingRoof || false,
        santaf_roofing: config.santaf === "with",
        santaf_color: config.santafColor || "",
        frame_color: config.frameColor || "#383838",
        roof_color: config.roofColor || "#C0C0C0",
        notes,
        module_classification: specs.moduleClassification,
        carrier_count: specs.carrierCount,
        front_post_count: specs.frontPostCount,
        back_post_count: specs.backPostCount,
        spacing_mode: config.spacingMode || "automatic",
        spacing_cm: specs.spacingMm / 10,
        profile_preset: "standard",
        selected_profiles: specs.profiles as any,
        post_layout: null,
        pdf_url: pdfUrl,
        locale,
      });

      setStep("success");
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "שגיאה",
        description: locale === "ar" ? "حدث خطأ. حاول مرة أخرى." : "אירעה שגיאה. נסו שוב.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step rendering ──

  if (step === "success") {
    return (
      <div className="text-center py-16 space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t("pergolaRequest.successTitle")}</h2>
        <p className="text-gray-500 max-w-md mx-auto">{t("pergolaRequest.successText")}</p>
        <a
          href={localePath("/")}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          {t("pergolaRequest.backToHome")}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  if (step === "start") {
    return <PergolaStartStep onStart={handleStart} />;
  }

  if (step === "editor") {
    return <PergolaEditorStep onNext={handleEditorNext} />;
  }

  if (step === "summary") {
    return (
      <PergolaSummaryStep
        onBack={handleSummaryBack}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  return null;
};
