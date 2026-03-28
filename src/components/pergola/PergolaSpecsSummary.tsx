import { usePergolaConfigurator } from "@/stores/usePergolaConfigurator";
import { useLocale } from "@/i18n/useLocale";
import { AlertTriangle } from "lucide-react";

export const PergolaSpecsSummary = () => {
  const { specs } = usePergolaConfigurator();
  const { t } = useLocale();

  if (!specs) return null;

  const moduleLabels: Record<string, string> = {
    single: t("pergolaRequest.moduleSingle"),
    double: t("pergolaRequest.moduleDouble"),
    triple: t("pergolaRequest.moduleTriple"),
    custom: t("pergolaRequest.moduleCustom"),
  };

  const isCustom = specs.moduleClassification === "custom";

  return (
    <div className="space-y-3 mb-4">
      <h3 className="text-sm font-semibold text-gray-700">{t("pergolaRequest.specs")}</h3>

      <div className="flex flex-wrap gap-2">
        <Badge
          label={t("pergolaRequest.moduleType")}
          value={moduleLabels[specs.moduleClassification]}
          warn={isCustom}
        />
        <Badge label={t("pergolaRequest.carriers")} value={String(specs.carrierCount)} />
        <Badge label={t("pergolaRequest.frontPosts")} value={String(specs.frontPostCount)} />
        {specs.backPostCount > 0 && (
          <Badge label={t("pergolaRequest.backPosts")} value={String(specs.backPostCount)} />
        )}
      </div>

      {isCustom && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{t("pergolaRequest.customReviewNote")}</span>
        </div>
      )}
    </div>
  );
};

function Badge({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border ${
        warn
          ? "bg-amber-50 text-amber-800 border-amber-200"
          : "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      <span className="text-gray-400">{label}:</span> {value}
    </span>
  );
}
