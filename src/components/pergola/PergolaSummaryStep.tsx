import { useState } from "react";
import { useLocale } from "@/i18n/useLocale";
import { usePergolaConfigurator } from "@/stores/usePergolaConfigurator";
import { mmToCm, cmToMm, STANDARD_COLORS, SLAT_COLORS, SANTAF_COLORS } from "@/types/pergola";
import { calcSlatCount } from "@/lib/pergolaRules";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PergolaPartsSection } from "./PergolaPartsSection";
import { ArrowLeft, Send, User, FileText, Loader2, Download } from "lucide-react";

interface Props {
  onBack: () => void;
  onSubmit: (customerName: string, customerPhone: string, customerEmail: string, notes: string, installation: boolean) => void;
  isSubmitting: boolean;
  pdfUrl: string | null;
}

export const PergolaSummaryStep = ({ onBack, onSubmit, isSubmitting, pdfUrl }: Props) => {
  const { t, locale } = useLocale();
  const { config, specs, carrierConfigs } = usePergolaConfigurator();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [installation, setInstallation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!specs) return null;

  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    if (digits.length > 0 && digits.length !== 10) {
      setErrors((prev) => ({ ...prev, phone: t("pergolaRequest.phoneMustBe10") }));
    } else {
      setErrors((prev) => { const { phone: _, ...rest } = prev; return rest; });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) errs.name = t("pergolaRequest.required");
    if (!phone.trim() || phone.trim().length !== 10 || !/^\d{10}$/.test(phone.trim())) errs.phone = t("pergolaRequest.phoneMustBe10");
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
            config.lighting === "none" ? t("pergolaRequest.lightingNone") : config.lighting?.toUpperCase()
          } />
          {config.pergolaType === "fixed" && (
            <SummaryCard label={t("pergolaRequest.roofFillMode")} value={config.roofFillMode === "slats" ? t("pergolaRequest.roofSlats") : t("pergolaRequest.roofSantafOnly")} />
          )}
          <SummaryCard label={t("pergolaRequest.santafRoofing")} value={config.santaf === "with" ? t("pergolaRequest.santafWith") : t("pergolaRequest.santafWithout")} />
          <SummaryCard label={t("pergolaRequest.frameColor")} value={getColorName(config.frameColor || "#383E42", locale)} color={config.frameColor} />
          <SummaryCard label={t("pergolaRequest.roofColor")} value={getColorName(config.roofColor || "#A5A5A5", locale)} color={config.roofColor} />
          {config.santaf === "with" && config.santafColor && (
            <SummaryCard label={t("pergolaRequest.santafColorLabel")} value={getColorName(config.santafColor, locale)} color={config.santafColor} />
          )}
        </div>

      </div>

      {/* Per-carrier details */}
      {config.pergolaType === "fixed" && config.roofFillMode === "slats" && carrierConfigs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">{t("pergolaRequest.slatsPerCarrier")}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {carrierConfigs.map((cc, i) => {
              const count = calcSlatCount(cmToMm(Number(config.lengthCm) || 400), cc.slatGapCm * 10, cc.slatSize);
              const displayNum = carrierConfigs.length - i;
              return (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">חלוקה {displayNum}</span>
                    <span className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: cc.slatColor }} />
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-gray-400">{t("pergolaRequest.slatsLabel")}</span><span className="font-medium text-gray-700">{count}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">{t("pergolaRequest.slatSizeLabel")}</span><span className="font-medium text-gray-700">{cc.slatSize === "20x40" ? "20×40 mm" : cc.slatSize === "20x100" ? "20×100 mm" : "20×70 mm"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">{t("pergolaRequest.slatGap")}</span><span className="font-medium text-gray-700">{cc.slatGapCm} cm</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">{t("pergolaRequest.lighting")}</span><span className="font-medium text-gray-700">{cc.lightingEnabled ? cc.lighting?.toUpperCase() : t("pergolaRequest.lightingNone")}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PergolaPartsSection />

      {/* PDF Download — centered, pro design */}
      {pdfUrl && (
        <div className="text-center py-6">
          <div className="inline-flex flex-col items-center gap-3 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center">
              <Download className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{t("pergolaRequest.downloadPdfTitle")}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{t("pergolaRequest.downloadPdfDesc")}</p>
            </div>
            <button
              onClick={() => {
                const link = document.createElement("a");
                link.href = pdfUrl;
                link.download = `AMG-Pergola-Request-${Date.now()}.pdf`;
                link.click();
              }}
              className="bg-gray-900 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              {t("pergolaRequest.downloadPdf")}
            </button>
          </div>
        </div>
      )}

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
            <Input value={phone} onChange={(e) => handlePhoneChange(e.target.value)} type="tel" dir="ltr" placeholder="05XXXXXXXX" maxLength={10} />
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
          <button
            type="button"
            role="switch"
            aria-checked={installation}
            onClick={() => setInstallation(!installation)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
              installation ? "bg-gray-900" : "bg-gray-200"
            }`}
          >
            <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
              installation ? "translate-x-5" : "translate-x-0"
            }`} />
          </button>
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
