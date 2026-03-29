import { create } from "zustand";
import type {
  PergolaFormInput, PergolaSpecs, MountType, SpacingMode, PergolaType,
} from "@/types/pergola";
import { computeSpecs } from "@/lib/pergolaRules";
import { cmToMm } from "@/types/pergola";

const DEFAULT_CONFIG: PergolaFormInput = {
  widthCm: 400,
  lengthCm: 400,
  heightCm: 250,
  pergolaType: "fixed",
  mountType: "wall",
  installation: false,
  lighting: "none",
  lightingPosition: "none",
  lightingFixture: "none",
  lightingRoof: false,
  lightingPosts: [],
  roofFillMode: "slats",
  slatCount: 0, // 0 = auto-calculate
  slatGapCm: 3,
  slatSize: "20x70",
  slatColor: "#383E42",
  santaf: "without",
  santafColor: "",
  frameColor: "#383838",
  roofColor: "#C0C0C0",
  spacingMode: "automatic",
  selectedProfiles: {} as any,
  notes: "",
  customerName: "",
  customerPhone: "",
};

function recompute(config: Partial<PergolaFormInput>): PergolaSpecs | null {
  const w = cmToMm(Number(config.widthCm) || 0);
  const l = cmToMm(Number(config.lengthCm) || 0);
  if (w <= 0 || l <= 0) return null;
  return computeSpecs({
    widthMm: w,
    lengthMm: l,
    mountType: (config.mountType || "wall") as MountType,
    spacingMode: (config.spacingMode || "automatic") as SpacingMode,
    pergolaType: (config.pergolaType || "fixed") as PergolaType,
    slatGapCm: Number(config.slatGapCm) || 3,
    slatCount: Number(config.slatCount) || undefined,
    slatSize: (config.slatSize as string) || "20x70",
  });
}

interface PergolaConfiguratorState {
  config: Partial<PergolaFormInput>;
  specs: PergolaSpecs | null;
  activeView: "top" | "front" | "isometric";
  setConfig: (partial: Partial<PergolaFormInput>) => void;
  setActiveView: (view: "top" | "front" | "isometric") => void;
  resetConfig: () => void;
}

export const usePergolaConfigurator = create<PergolaConfiguratorState>((set) => ({
  config: DEFAULT_CONFIG,
  specs: recompute(DEFAULT_CONFIG),
  activeView: "top",

  setConfig: (partial) =>
    set((state) => {
      const next = { ...state.config, ...partial };
      return {
        config: next,
        specs: recompute(next) ?? state.specs,
      };
    }),

  setActiveView: (view) => set({ activeView: view }),

  resetConfig: () =>
    set({
      config: DEFAULT_CONFIG,
      specs: recompute(DEFAULT_CONFIG),
      activeView: "top",
    }),
}));
