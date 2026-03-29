import { usePergolaConfigurator } from "@/stores/usePergolaConfigurator";
import { useLocale } from "@/i18n/useLocale";
import { mmToCm } from "@/types/pergola";
import { AlertTriangle } from "lucide-react";

export const PergolaSpecsSummary = () => {
  const { specs, config } = usePergolaConfigurator();
  const { t } = useLocale();

  if (!specs) return null;

  const moduleLabels: Record<string, string> = {
    single: t("pergolaRequest.moduleSingle"),
    double: t("pergolaRequest.moduleDouble"),
    triple: t("pergolaRequest.moduleTriple"),
    custom: t("pergolaRequest.moduleCustom"),
  };
  const isCustom = specs.moduleClassification === "custom";

  const rows: [string, string][] = [
    [t("pergolaRequest.moduleType"), moduleLabels[specs.moduleClassification]],
    [t("pergolaRequest.carriers"), String(specs.carrierCount)],
    [t("pergolaRequest.frontPosts"), String(specs.frontPostCount)],
  ];
  if (specs.backPostCount > 0) {
    rows.push([t("pergolaRequest.backPosts"), String(specs.backPostCount)]);
  }
  rows.push([t("pergolaRequest.spacingLabel"), `~${mmToCm(specs.spacingMm)} cm`]);

  // Lighting summary
  if (config.lighting && config.lighting !== "none") {
    rows.push([t("pergolaRequest.lightingLabel"), t(`pergolaRequest.lighting${config.lighting.charAt(0).toUpperCase() + config.lighting.slice(1)}`)]);
    if (config.lightingFixture && config.lightingFixture !== "none") {
      rows.push([t("pergolaRequest.lightingFixture"), t(`pergolaRequest.fixture${config.lightingFixture.split("_").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join("")}`)]);
    }
    if (config.lightingRoof) {
      rows.push([t("pergolaRequest.lightingRoof"), t("pergolaRequest.yes")]);
    }
  }

  // Santaf
  if (config.santaf === "with") {
    rows.push([t("pergolaRequest.santafRoofing"), t("pergolaRequest.santafWith")]);
  }

  // Height
  if (config.heightCm && Number(config.heightCm) !== 250) {
    rows.push([t("pergolaRequest.height"), `${config.heightCm} cm`]);
  }

  // Profiles summary
  if (specs.profiles) {
    rows.push([t("pergolaRequest.profileRafter"), specs.profiles.rafter]);
    rows.push([t("pergolaRequest.profileCarrierPost"), specs.profiles.carrier_post]);
    rows.push([t("pergolaRequest.profileFabricMaster"), specs.profiles.fabric_master]);
  }

  return (
    <div className="space-y-3 mb-4">
      <h3 className="text-sm font-semibold text-gray-700">{t("pergolaRequest.specs")}</h3>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {rows.map(([label, value], i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-xs font-medium text-gray-700">{value}</span>
          </div>
        ))}
      </div>

      {isCustom && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{t("pergolaRequest.customReviewNote")}</span>
        </div>
      )}
    </div>
  );
};
