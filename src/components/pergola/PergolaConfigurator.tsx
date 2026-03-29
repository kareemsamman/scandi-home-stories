import { useState } from "react";
import { useLocale } from "@/i18n/useLocale";
import { usePergolaConfigurator } from "@/stores/usePergolaConfigurator";
import { useCreatePergolaRequest } from "@/hooks/usePergolaRequests";
import { useToast } from "@/hooks/use-toast";
import { generatePergolaPdf, svgToImageWithSize, type PdfImages } from "@/lib/generatePergolaPdf";
import { supabase } from "@/integrations/supabase/client";
import { cmToMm } from "@/types/pergola";
import type { PergolaType } from "@/types/pergola";
import { PergolaStartStep } from "./PergolaStartStep";
import { PergolaEditorStep } from "./PergolaEditorStep";
import { PergolaSummaryStep } from "./PergolaSummaryStep";
import { CheckCircle2, ArrowRight, Download } from "lucide-react";

type Step = "start" | "editor" | "summary" | "success";

export const PergolaConfigurator = () => {
  const { t, locale, localePath } = useLocale();
  const { specs, config, setConfig, setActiveView, carrierConfigs } = usePergolaConfigurator();
  const createRequest = useCreatePergolaRequest();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("start");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [capturedImages, setCapturedImages] = useState<PdfImages>({});

  // Step 1 → Step 2: Initialize config and open editor
  const handleStart = (widthCm: number, lengthCm: number, pergolaType: PergolaType) => {
    setConfig({ widthCm, lengthCm, pergolaType });
    setActiveView("isometric"); // Default to 3D-like view
    setStep("editor");
  };

  // Capture current SVG view as image with size (target the pergola drawing, not zoom icons)
  const captureCurrentView = async () => {
    const container = document.querySelector("#pergola-drawing-area");
    if (!container) return undefined;
    const svgEl = container.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) return undefined;
    try { return await svgToImageWithSize(svgEl); } catch { return undefined; }
  };

  // Step 2 → Step 3: Capture all 3 views, generate PDF, then move to summary
  const handleEditorNext = async () => {
    if (!specs) { setStep("summary"); return; }

    const images: PdfImages = {};
    const currentView = usePergolaConfigurator.getState().activeView;

    // Capture current view first
    const currentImg = await captureCurrentView();
    if (currentImg) images[currentView] = { data: currentImg.data, ratio: currentImg.ratio };

    // Capture the other 2 views
    const otherViews = (["isometric", "top", "front"] as const).filter((v) => v !== currentView);
    for (const view of otherViews) {
      setActiveView(view);
      await new Promise((r) => setTimeout(r, 200)); // wait for render
      const img = await captureCurrentView();
      if (img) images[view] = { data: img.data, ratio: img.ratio };
    }
    setActiveView(currentView); // restore original view
    setCapturedImages(images);

    // Generate PDF preview
    try {
      const pdfUrl = await generatePergolaPdf({
        customerName: "", customerPhone: "",
        widthCm: Number(config.widthCm) || 400, lengthCm: Number(config.lengthCm) || 400,
        heightCm: Number(config.heightCm) || 250, pergolaType: config.pergolaType || "fixed",
        mountType: config.mountType || "wall", installation: false,
        lighting: config.lighting || "none", lightingPosition: config.lightingPosition || "none",
        lightingFixture: config.lightingFixture || "none", lightingRoof: config.lightingRoof || false,
        roofFillMode: config.roofFillMode || "slats", slatGapCm: Number(config.slatGapCm) || 3,
        slatColor: config.slatColor || "#383E42", santaf: config.santaf || "without",
        santafColor: config.santafColor || "", frameColor: config.frameColor || "#383E42",
        roofColor: config.roofColor || "#A5A5A5", spacingMode: config.spacingMode || "automatic",
        notes: "",
        carrierConfigs: carrierConfigs as any,
      }, specs, locale, images);
      setGeneratedPdfUrl(pdfUrl);
    } catch { /* proceed without PDF */ }

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
      // Regenerate PDF with customer details (SVG was captured when leaving editor)
      const pdfUrl = await generatePergolaPdf({
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
        roofFillMode: config.roofFillMode || "slats",
        slatGapCm: Number(config.slatGapCm) || 3,
        slatColor: config.slatColor || "#383E42",
        santaf: config.santaf || "without",
        santafColor: config.santafColor || "",
        frameColor: config.frameColor || "#383E42",
        roofColor: config.roofColor || "#A5A5A5",
        spacingMode: config.spacingMode || "automatic",
        notes,
        carrierConfigs: carrierConfigs as any,
      }, specs, locale, capturedImages);

      // Build extra config data as JSON (safe for both v1 and v2 schemas)
      const extraConfig = {
        lighting_position: config.lightingPosition || "none",
        lighting_type: config.lightingFixture || "none",
        lighting_posts: config.lightingPosts || [],
        lighting_roof: config.lightingRoof || false,
        santaf_color: config.santafColor || "",
        spacing_mode: config.spacingMode || "automatic",
        spacing_cm: specs.spacingMm / 10,
        roof_fill_mode: config.roofFillMode || "slats",
        slat_gap_cm: Number(config.slatGapCm) || 3,
        slat_size: config.slatSize || "20x70",
        slat_color: config.slatColor || "#383E42",
        profiles: specs.profiles,
        carrier_configs: carrierConfigs,
      };

      const result = await createRequest.mutateAsync({
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
        santaf_roofing: config.santaf === "with",
        frame_color: config.frameColor || "#383E42",
        roof_color: config.roofColor || "#A5A5A5",
        notes,
        module_classification: specs.moduleClassification,
        carrier_count: specs.carrierCount,
        front_post_count: specs.frontPostCount,
        back_post_count: specs.backPostCount,
        admin_modified_config: extraConfig,
        pdf_url: null,
        locale,
      });

      setGeneratedPdfUrl(pdfUrl);
      setStep("success");

      // Send SMS notification to admin (fire & forget)
      try {
        await supabase.functions.invoke("send-pergola-sms", {
          body: {
            action: "notify_admin",
            request_id: result.id,
            site_origin: window.location.origin,
          },
        });
      } catch { /* non-critical */ }
    } catch (err: any) {
      const msg = err?.message || err?.error?.message || JSON.stringify(err);
      console.error("Submit error:", msg, err);
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
    const handleDownloadPdf = () => {
      if (!generatedPdfUrl) return;
      const link = document.createElement("a");
      link.href = generatedPdfUrl;
      link.download = `pergola-request-${Date.now()}.pdf`;
      link.click();
    };
    return (
      <div className="text-center py-16 space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t("pergolaRequest.successTitle")}</h2>
        <p className="text-gray-500 max-w-md mx-auto">{t("pergolaRequest.successText")}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {generatedPdfUrl && (
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 bg-white border-2 border-gray-900 text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              {t("pergolaRequest.downloadPdf")}
            </button>
          )}
          <a
            href={localePath("/")}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            {t("pergolaRequest.backToHome")}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
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
        pdfUrl={generatedPdfUrl}
      />
    );
  }

  return null;
};
