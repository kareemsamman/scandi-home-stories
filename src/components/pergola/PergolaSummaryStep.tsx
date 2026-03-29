import { useState } from "react";
import { useLocale } from "@/i18n/useLocale";
import { usePergolaConfigurator } from "@/stores/usePergolaConfigurator";
import { mmToCm } from "@/types/pergola";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PergolaPartsSection } from "./PergolaPartsSection";
import { ArrowLeft, Send, User, FileText, Loader2 } from "lucide-react";

interface Props {
  onBack: () => void;
  onSubmit: (customerName: string, customerPhone: string, customerEmail: string, notes: string, installation: boolean) => void;
  isSubmitting: boolean;
}

export const PergolaSummaryStep = ({ onBack, onSubmit, isSubmitting }: Props) => {
  const { t, locale } = useLocale();
  const { config, specs } = usePergolaConfigurator();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [installation, setInstallation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!specs) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) errs.name = t("pergolaRequest.required");
    if (!phone.trim() || !/^[0-9\s\-\+\(\)]{7,15}$/.test(phone.trim())) errs.phone = t("pergolaRequest.invalidPhone");
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(name.trim(), phone.trim(), email.trim(), notes.trim(), installation);
  };

  const moduleLabel = specs.moduleClassification === "single" ? t("pergolaRequest.moduleSingle") :
    specs.moduleClassification === "double" ? t("pergolaRequest.moduleDouble") :
    specs.moduleClassification === "triple" ? t("pergolaRequest.moduleTriple") : t("pergolaRequest.moduleCustom");

  const typeLabel = t(`pergolaRequest.pergolaTypes.${config.pergolaType || "fixed"}`);
  const mountLabel = config.mountType === "freestanding" ? t("pergolaRequest.mountFreestanding") : t("pergolaRequest.mountWall");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        {t("pergolaRequest.backToEditor")}
      </button>

      {/* Technical summary */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-900">{t("pergolaRequest.summaryTitle")}</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <SummaryCard label={t("pergolaRequest.pergolaType")} value={typeLabel} />
          <SummaryCard label={t("pergolaRequest.mountType")} value={mountLabel} />
          <SummaryCard label={t("pergolaRequest.moduleType")} value={moduleLabel} />
          <SummaryCard label={t("pergolaRequest.width")} value={`${config.widthCm} cm`} />
          <SummaryCard label={t("pergolaRequest.length")} value={`${config.lengthCm} cm`} />
          <SummaryCard label={t("pergolaRequest.height")} value={`${config.heightCm || 250} cm`} />
          <SummaryCard label={t("pergolaRequest.frontPosts")} value={String(specs.frontPostCount)} />
          {specs.backPostCount > 0 && <SummaryCard label={t("pergolaRequest.backPosts")} value={String(specs.backPostCount)} />}
          <SummaryCard label={t("pergolaRequest.carriers")} value={String(specs.carrierCount)} />
          <SummaryCard label={t("pergolaRequest.spacingLabel")} value={`~${mmToCm(specs.spacingMm)} cm`} />
          <SummaryCard label={t("pergolaRequest.lighting")} value={
            config.lighting === "none" ? t("pergolaRequest.lightingNone") :
            config.lighting === "white" ? t("pergolaRequest.lightingWhite") : "RGB"
          } />
          {config.pergolaType === "fixed" && (
            <SummaryCard label={t("pergolaRequest.roofFillMode")} value={config.roofFillMode === "slats" ? t("pergolaRequest.roofSlats") : t("pergolaRequest.roofSantafOnly")} />
          )}
          {config.roofFillMode === "slats" && config.pergolaType === "fixed" && (
            <>
              <SummaryCard label={t("pergolaRequest.slatsLabel")} value={String(specs.slatCount)} />
              <SummaryCard label={t("pergolaRequest.slatGap")} value={`${config.slatGapCm || 3} cm`} />
              <SummaryCard label={t("pergolaRequest.slatColor")} value={config.slatColor || "#383838"} color={config.slatColor} />
            </>
          )}
          {(config.roofFillMode === "santaf" || config.santaf === "with") && (
            <SummaryCard label={t("pergolaRequest.santafRoofing")} value={t("pergolaRequest.santafWith")} />
          )}
          {(config.roofFillMode !== "santaf" && config.santaf !== "with") && config.pergolaType !== "fixed" && (
            <SummaryCard label={t("pergolaRequest.santafRoofing")} value={t("pergolaRequest.santafWithout")} />
          )}
          <SummaryCard label={t("pergolaRequest.frameColor")} value={config.frameColor || "#383838"} color={config.frameColor} />
          <SummaryCard label={t("pergolaRequest.roofColor")} value={config.roofColor || "#C0C0C0"} color={config.roofColor} />
          {config.santaf === "with" && config.santafColor && (
            <SummaryCard label={t("pergolaRequest.santafColorLabel")} value={config.santafColor} color={config.santafColor} />
          )}
        </div>
      </div>

      {/* Parts section */}
      <PergolaPartsSection />

      {/* Customer info form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">{t("pergolaRequest.customerInfo")}</h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">{t("pergolaRequest.customerName")}</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setErrors({}); }} />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{t("pergolaRequest.customerPhone")}</Label>
            <Input value={phone} onChange={(e) => { setPhone(e.target.value); setErrors({}); }} type="tel" dir="ltr" />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{t("pergolaRequest.customerEmail")}</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{t("pergolaRequest.notes")}</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("pergolaRequest.notesPlaceholder")} rows={3} />
        </div>
        <div className="flex items-center justify-between py-1">
          <Label className="text-sm">{t("pergolaRequest.installation")}</Label>
          <Switch checked={installation} onCheckedChange={setInstallation} />
        </div>
      </div>

      {/* Disclaimer + submit */}
      <div className="space-y-4">
        <p className="text-xs text-gray-400 leading-relaxed">{t("pergolaRequest.disclaimer")}</p>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-gray-900 text-white py-4 px-6 rounded-xl font-semibold text-base hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> {t("pergolaRequest.submitting")}</>
          ) : (
            <><Send className="w-5 h-5" /> {t("pergolaRequest.submit")}</>
          )}
        </button>
      </div>
    </div>
  );
};

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5 flex items-center gap-2">
        {color && <span className="w-4 h-4 rounded border border-gray-200 shrink-0" style={{ backgroundColor: color }} />}
        {!color && value}
      </p>
    </div>
  );
}
