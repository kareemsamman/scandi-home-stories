import { usePergolaConfigurator } from "@/stores/usePergolaConfigurator";
import { useLocale } from "@/i18n/useLocale";
import { cmToMm } from "@/types/pergola";
import type { DrawingConfig } from "@/types/pergola";
import { PergolaTopView } from "./PergolaTopView";
import { PergolaFrontView } from "./PergolaFrontView";
import { PergolaIsometricView } from "./PergolaIsometricView";

const VIEWS = ["top", "front", "isometric"] as const;

export const PergolaPreview = () => {
  const { config, specs, activeView, setActiveView } = usePergolaConfigurator();
  const { t } = useLocale();

  if (!specs) return null;

  const drawingConfig: DrawingConfig = {
    widthMm: cmToMm(Number(config.widthCm) || 400),
    lengthMm: cmToMm(Number(config.lengthCm) || 400),
    heightMm: cmToMm(Number(config.heightCm) || 250),
    mountType: config.mountType || "wall",
    lighting: config.lighting || "none",
    lightingPosition: config.lightingPosition || "none",
    lightingFixture: config.lightingFixture || "none",
    lightingRoof: config.lightingRoof || false,
    lightingPosts: config.lightingPosts || [],
    santaf: config.santaf || "without",
    santafColor: config.santafColor || "",
    specs,
    frameColor: config.frameColor || "#383838",
    roofColor: config.roofColor || "#C0C0C0",
  };

  const viewLabels: Record<string, string> = {
    top: t("pergolaRequest.topView"),
    front: t("pergolaRequest.frontView"),
    isometric: t("pergolaRequest.isometricView"),
  };

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeView === v
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>

      {/* View area */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 min-h-[340px] flex items-center justify-center" id="pergola-preview-svg">
        {activeView === "top" && <PergolaTopView config={drawingConfig} />}
        {activeView === "front" && <PergolaFrontView config={drawingConfig} />}
        {activeView === "isometric" && <PergolaIsometricView config={drawingConfig} />}
      </div>
    </div>
  );
};
