import { usePergolaConfigurator } from "@/stores/usePergolaConfigurator";
import { useLocale } from "@/i18n/useLocale";
import { mmToCm, cmToMm } from "@/types/pergola";
import { calcSlatCount, getSlatProfileWidth } from "@/lib/pergolaRules";
import { AlertTriangle } from "lucide-react";

export const PergolaSpecsSummary = () => {
  const { specs, config, carrierConfigs } = usePergolaConfigurator();
  const { t } = useLocale();

  if (!specs) return null;

  const moduleLabels: Record<string, string> = {
    single: t("pergolaRequest.moduleSingle"),
    double: t("pergolaRequest.moduleDouble"),
    triple: t("pergolaRequest.moduleTriple"),
    custom: t("pergolaRequest.moduleCustom"),
  };
  const isCustom = specs.moduleClassification === "custom";
  const isFixedSlats = config.pergolaType === "fixed" && config.roofFillMode === "slats";
  const widthMm = cmToMm(Number(config.widthCm) || 400);

  const rows: [string, string][] = [
    [t("pergolaRequest.moduleType"), moduleLabels[specs.moduleClassification]],
    [t("pergolaRequest.carriers"), String(specs.carrierCount)],
    [t("pergolaRequest.frontPosts"), String(specs.frontPostCount)],
  ];
  if (specs.backPostCount > 0) {
    rows.push([t("pergolaRequest.backPosts"), String(specs.backPostCount)]);
  }
  rows.push([t("pergolaRequest.spacingLabel"), `~${mmToCm(specs.spacingMm)} cm`]);

  // Total slats across all sections
  if (isFixedSlats && carrierConfigs.length > 0) {
    let totalSlats = 0;
    carrierConfigs.forEach((cc) => {
      totalSlats += calcSlatCount(widthMm, cc.slatGapCm * 10, cc.slatSize);
    });
    rows.push([t("pergolaRequest.slatsLabel"), String(totalSlats)]);
  } else if (isFixedSlats) {
    rows.push([t("pergolaRequest.slatsLabel"), String(specs.slatCount)]);
  }

  // Roof fill mode
  if (config.pergolaType === "fixed") {
    rows.push([t("pergolaRequest.roofFillMode"), config.roofFillMode === "slats" ? t("pergolaRequest.roofSlats") : t("pergolaRequest.roofSantafOnly")]);
  }

  // Lighting
  if (config.lighting && config.lighting !== "none") {
    rows.push([t("pergolaRequest.lightingLabel"), config.lighting.toUpperCase()]);
  }

  // Santaf
  if (config.santaf === "with" || config.roofFillMode === "santaf") {
    rows.push([t("pergolaRequest.santafRoofing"), t("pergolaRequest.santafWith")]);
  }

  return (
    <div className="space-y-3 mb-4">
      <h3 className="text-sm font-semibold text-gray-700">{t("pergolaRequest.specs")}</h3>

      {/* Main specs */}
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {rows.map(([label, value], i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-xs font-medium text-gray-700">{value}</span>
          </div>
        ))}
      </div>

      {/* Per-carrier breakdown */}
      {isFixedSlats && carrierConfigs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t("pergolaRequest.slatsPerCarrier")}
          </h4>
          <div className="space-y-1">
            {carrierConfigs.map((cc, i) => {
              const count = calcSlatCount(widthMm, cc.slatGapCm * 10, cc.slatSize);
              return (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm border border-gray-200 shrink-0" style={{ backgroundColor: cc.slatColor }} />
                    נשא {i + 1}
                  </span>
                  <span className="text-gray-600">
                    {count} × {cc.slatSize === "20x40" ? "20×40" : "20×70"}
                    <span className="text-gray-300 mx-1">&middot;</span>
                    {cc.slatGapCm} cm
                    {cc.lightingEnabled && (
                      <span className="text-gray-300 mx-1">&middot; 💡</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCustom && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{t("pergolaRequest.customReviewNote")}</span>
        </div>
      )}
    </div>
  );
};
