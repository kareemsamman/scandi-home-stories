import { create } from "zustand";
import type {
  PergolaFormInput, PergolaSpecs, MountType, SpacingMode, PergolaType,
  CarrierConfig,
} from "@/types/pergola";
import { computeSpecs } from "@/lib/pergolaRules";
import { cmToMm, defaultCarrierConfig } from "@/types/pergola";

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
  slatCount: 0,
  slatGapCm: 3,
  slatSize: "20x70",
  slatColor: "#383E42",
  santaf: "without",
  santafColor: "",
  frameColor: "#383E42",
  roofColor: "#A5A5A5",
  spacingMode: "automatic",
  carrierCountOverride: 0,
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
    carrierCountOverride: Number(config.carrierCountOverride) || 0,
  });
}

function buildCarrierConfigs(count: number, config: Partial<PergolaFormInput>, existing: CarrierConfig[]): CarrierConfig[] {
  const globalDef = defaultCarrierConfig({
    slatSize: config.slatSize as any,
    slatGapCm: Number(config.slatGapCm) || 3,
    slatColor: config.slatColor,
    lighting: config.lighting as any,
  });
  return Array.from({ length: Math.max(1, count - 1) }, (_, i) =>
    existing[i] || { ...globalDef }
  );
}

interface PergolaConfiguratorState {
  config: Partial<PergolaFormInput>;
  specs: PergolaSpecs | null;
  activeView: "top" | "front" | "isometric";
  carrierConfigs: CarrierConfig[];
  setConfig: (partial: Partial<PergolaFormInput>) => void;
  setActiveView: (view: "top" | "front" | "isometric") => void;
  resetConfig: () => void;
  setCarrierConfig: (index: number, partial: Partial<CarrierConfig>) => void;
  applyGlobalToAllCarriers: () => void;
}

export const usePergolaConfigurator = create<PergolaConfiguratorState>((set, get) => ({
  config: DEFAULT_CONFIG,
  specs: recompute(DEFAULT_CONFIG),
  activeView: "top",
  carrierConfigs: [],

  setConfig: (partial) =>
    set((state) => {
      const next = { ...state.config, ...partial };
      const specs = recompute(next) ?? state.specs;

      // Check if global slat/lighting settings changed → update all carriers
      const globalChanged =
        partial.slatSize !== undefined ||
        partial.slatGapCm !== undefined ||
        partial.slatColor !== undefined ||
        partial.lighting !== undefined;

      const carrierCountChanged =
        partial.carrierCountOverride !== undefined ||
        partial.spacingMode !== undefined ||
        partial.widthCm !== undefined;

      let carrierConfigs = state.carrierConfigs;
      if (specs && (globalChanged || specs.carrierCount !== state.specs?.carrierCount)) {
        if (globalChanged) {
          // Apply new global to all carriers
          const globalDef = defaultCarrierConfig({
            slatSize: next.slatSize as any,
            slatGapCm: Number(next.slatGapCm) || 3,
            slatColor: next.slatColor,
            lighting: next.lighting as any,
          });
          carrierConfigs = Array.from({ length: Math.max(1, specs.carrierCount - 1) }, () => ({ ...globalDef }));
        } else {
          // Just resize to match carrier count
          carrierConfigs = buildCarrierConfigs(specs.carrierCount, next, state.carrierConfigs);
        }
      }

      return { config: next, specs, carrierConfigs };
    }),

  setActiveView: (view) => set({ activeView: view }),

  resetConfig: () =>
    set({
      config: DEFAULT_CONFIG,
      specs: recompute(DEFAULT_CONFIG),
      activeView: "top",
      carrierConfigs: [],
    }),

  // Update a single carrier section
  setCarrierConfig: (index, partial) =>
    set((state) => {
      const configs = [...state.carrierConfigs];
      if (index >= 0 && index < configs.length) {
        configs[index] = { ...configs[index], ...partial };
      }
      return { carrierConfigs: configs };
    }),

  // Re-apply global settings to all carriers (reset customization)
  applyGlobalToAllCarriers: () =>
    set((state) => {
      const globalDef = defaultCarrierConfig({
        slatSize: state.config.slatSize as any,
        slatGapCm: Number(state.config.slatGapCm) || 3,
        slatColor: state.config.slatColor,
        lighting: state.config.lighting as any,
      });
      return {
        carrierConfigs: state.carrierConfigs.map(() => ({ ...globalDef })),
      };
    }),
}));
