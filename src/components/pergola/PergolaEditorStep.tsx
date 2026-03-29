import { useLocale } from "@/i18n/useLocale";
import { usePergolaConfigurator } from "@/stores/usePergolaConfigurator";
import { usePergolaEditor } from "@/stores/usePergolaEditor";
import { cmToMm, mmToCm, STANDARD_COLORS, SANTAF_COLORS } from "@/types/pergola";
import type { DrawingConfig, LightingChoice, MountType, SpacingMode, SantafChoice } from "@/types/pergola";
import { PergolaTopView } from "./PergolaTopView";
import { PergolaFrontView } from "./PergolaFrontView";
import { PergolaIsometricView } from "./PergolaIsometricView";
import { PergolaElementEditor } from "./PergolaElementEditor";
import {
  Columns3, Lightbulb, Paintbrush, Mountain, ArrowRight, MousePointerClick, Maximize2,
} from "lucide-react";

const VIEWS = ["isometric", "top", "front"] as const;

interface Props {
  onNext: () => void;
}

export const PergolaEditorStep = ({ onNext }: Props) => {
  const { t } = useLocale();
  const { config, specs, activeView, setActiveView, setConfig } = usePergolaConfigurator();
  const { selected } = usePergolaEditor();

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
    isometric: t("pergolaRequest.isometricView"),
    top: t("pergolaRequest.topView"),
    front: t("pergolaRequest.frontView"),
  };

  return (
    <div className="space-y-4">
      {/* Top bar: view switcher + quick controls + next */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* View tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeView === v
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>

        {/* Quick toolbar */}
        <div className="flex items-center gap-1.5">
          <QuickToggle
            active={config.mountType === "freestanding"}
            onClick={() => setConfig({ mountType: config.mountType === "freestanding" ? "wall" : "freestanding" })}
            icon={<Columns3 className="w-4 h-4" />}
            label={config.mountType === "freestanding" ? t("pergolaRequest.mountFreestanding") : t("pergolaRequest.mountWall")}
          />
          <QuickToggle
            active={config.lighting !== "none"}
            onClick={() => {
              if (config.lighting === "none") {
                setConfig({ lighting: "white", lightingPosition: "all_posts", lightingFixture: "led_strip" });
              } else {
                setConfig({ lighting: "none", lightingPosition: "none", lightingFixture: "none", lightingRoof: false, lightingPosts: [] });
              }
            }}
            icon={<Lightbulb className="w-4 h-4" />}
            label={t("pergolaRequest.lighting")}
          />
          <QuickToggle
            active={config.santaf === "with"}
            onClick={() => setConfig({ santaf: config.santaf === "with" ? "without" : "with" as SantafChoice })}
            icon={<Mountain className="w-4 h-4" />}
            label={t("pergolaRequest.santafRoofing")}
          />
        </div>

        {/* Next button */}
        <button
          onClick={onNext}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm shrink-0"
        >
          {t("pergolaRequest.nextStep")}
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </button>
      </div>

      {/* Main editor area */}
      <div className="grid lg:grid-cols-4 gap-4">
        {/* Visual editor: 3 columns */}
        <div className="lg:col-span-3">
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sm:p-6 min-h-[480px] flex items-center justify-center relative" id="pergola-preview-svg">
            {activeView === "isometric" && <PergolaIsometricView config={drawingConfig} />}
            {activeView === "top" && <PergolaTopView config={drawingConfig} />}
            {activeView === "front" && <PergolaFrontView config={drawingConfig} />}

            {/* Hint overlay when nothing selected */}
            {!selected && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs text-gray-400 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100">
                <MousePointerClick className="w-3.5 h-3.5" />
                {t("pergolaRequest.clickToEdit")}
              </div>
            )}
          </div>

          {/* Element editor panel — below the drawing */}
          <div className="mt-3">
            <PergolaElementEditor />
          </div>
        </div>

        {/* Side panel: compact context controls */}
        <div className="space-y-4">
          {/* Dimensions tweak */}
          <SideCard title={t("pergolaRequest.dimensions")} icon="📐">
            <div className="grid grid-cols-2 gap-2">
              <MiniInput label={t("pergolaRequest.width")} value={Number(config.widthCm) || 400}
                onChange={(v) => setConfig({ widthCm: v })} min={100} max={1500} step={10} suffix="cm" />
              <MiniInput label={t("pergolaRequest.length")} value={Number(config.lengthCm) || 400}
                onChange={(v) => setConfig({ lengthCm: v })} min={200} max={1000} step={10} suffix="cm" />
            </div>
            <MiniInput label={t("pergolaRequest.height")} value={Number(config.heightCm) || 250}
              onChange={(v) => setConfig({ heightCm: v })} min={150} max={500} step={10} suffix="cm" />
          </SideCard>

          {/* Lighting details (when enabled) */}
          {config.lighting !== "none" && (
            <SideCard title={t("pergolaRequest.lighting")} icon="💡">
              <div className="flex gap-1.5">
                {(["white", "rgb"] as const).map((lt) => (
                  <button key={lt} onClick={() => setConfig({ lighting: lt as LightingChoice })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                      config.lighting === lt ? "border-gray-900 bg-gray-50" : "border-gray-100 text-gray-400"
                    }`}>
                    {lt === "white" ? t("pergolaRequest.lightingWhite") : "RGB"}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-gray-400">{t("pergolaRequest.lightingRoof")}</span>
                <button
                  onClick={() => setConfig({ lightingRoof: !config.lightingRoof })}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    config.lightingRoof ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {config.lightingRoof ? t("pergolaRequest.yes") : t("pergolaRequest.no")}
                </button>
              </div>
            </SideCard>
          )}

          {/* Colors */}
          <SideCard title={t("pergolaRequest.colors")} icon="🎨">
            <MiniColorRow label={t("pergolaRequest.frameColor")} value={config.frameColor || "#383838"} onChange={(v) => setConfig({ frameColor: v })} colors={STANDARD_COLORS} />
            <MiniColorRow label={t("pergolaRequest.roofColor")} value={config.roofColor || "#C0C0C0"} onChange={(v) => setConfig({ roofColor: v })} colors={STANDARD_COLORS} />
            {config.santaf === "with" && (
              <MiniColorRow label={t("pergolaRequest.santafColorLabel")} value={config.santafColor || "#B22222"} onChange={(v) => setConfig({ santafColor: v })} colors={SANTAF_COLORS} />
            )}
          </SideCard>

          {/* Spacing */}
          <SideCard title={t("pergolaRequest.spacing")} icon="↔️">
            <div className="grid grid-cols-2 gap-1.5">
              {(["automatic", "dense", "standard", "wide"] as const).map((sm) => (
                <button key={sm} onClick={() => setConfig({ spacingMode: sm as SpacingMode })}
                  className={`py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                    config.spacingMode === sm ? "border-gray-900 bg-gray-50" : "border-gray-100 text-gray-400"
                  }`}>
                  {t(`pergolaRequest.spacing${sm.charAt(0).toUpperCase() + sm.slice(1)}`)}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {specs.carrierCount} {t("pergolaRequest.carriers")} &middot; ~{mmToCm(specs.spacingMm)} cm
            </p>
          </SideCard>

          {/* Quick specs */}
          <SideCard title={t("pergolaRequest.specs")} icon="📋">
            <div className="space-y-1">
              <SpecRow label={t("pergolaRequest.moduleType")} value={
                specs.moduleClassification === "single" ? t("pergolaRequest.moduleSingle") :
                specs.moduleClassification === "double" ? t("pergolaRequest.moduleDouble") :
                specs.moduleClassification === "triple" ? t("pergolaRequest.moduleTriple") :
                t("pergolaRequest.moduleCustom")
              } />
              <SpecRow label={t("pergolaRequest.frontPosts")} value={String(specs.frontPostCount)} />
              {specs.backPostCount > 0 && <SpecRow label={t("pergolaRequest.backPosts")} value={String(specs.backPostCount)} />}
              <SpecRow label={t("pergolaRequest.carriers")} value={String(specs.carrierCount)} />
            </div>
          </SideCard>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ──

function QuickToggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
        active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function SideCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2.5">
      <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
        <span>{icon}</span> {title}
      </h4>
      {children}
    </div>
  );
}

function MiniInput({ label, value, onChange, min, max, step, suffix }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; suffix: string }) {
  return (
    <div>
      <label className="text-[10px] text-gray-400 block mb-0.5">{label}</label>
      <div className="flex items-center gap-1">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} step={step}
          className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300" />
        <span className="text-[10px] text-gray-400 shrink-0">{suffix}</span>
      </div>
    </div>
  );
}

function MiniColorRow({ label, value, onChange, colors }: { label: string; value: string; onChange: (v: string) => void; colors: { id: string; hex: string }[] }) {
  return (
    <div>
      <label className="text-[10px] text-gray-400 block mb-1">{label}</label>
      <div className="flex flex-wrap gap-1">
        {colors.map((c) => (
          <button key={c.id} onClick={() => onChange(c.hex)}
            className={`w-6 h-6 rounded-md border-2 transition-all ${value === c.hex ? "border-gray-900 scale-110" : "border-gray-200"}`}
            style={{ backgroundColor: c.hex }} />
        ))}
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-700">{value}</span>
    </div>
  );
}
