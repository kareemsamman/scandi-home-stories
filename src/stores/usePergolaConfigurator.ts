import { create } from "zustand";
import type { PergolaFormInput, PergolaSpecs } from "@/types/pergola";
import { computeSpecs } from "@/lib/pergolaRules";

interface PergolaConfiguratorState {
  config: Partial<PergolaFormInput>;
  specs: PergolaSpecs | null;
  activeView: "top" | "front" | "isometric";
  setConfig: (partial: Partial<PergolaFormInput>) => void;
  setActiveView: (view: "top" | "front" | "isometric") => void;
}

export const usePergolaConfigurator = create<PergolaConfiguratorState>((set) => ({
  config: {
    width: 4000,
    length: 4000,
    height: 2500,
    mountType: "wall",
    lighting: "none",
    pergolaType: "bioclimatic",
    installation: false,
    santafRoofing: false,
    frameColor: "#333333",
    roofColor: "#CCCCCC",
    notes: "",
    customerName: "",
    customerPhone: "",
  },
  specs: computeSpecs({ width: 4000, length: 4000, mountType: "wall" }),
  activeView: "top",

  setConfig: (partial) =>
    set((state) => {
      const next = { ...state.config, ...partial };
      const w = Number(next.width) || 0;
      const l = Number(next.length) || 0;
      const mt = next.mountType || "wall";
      return {
        config: next,
        specs: w > 0 && l > 0 ? computeSpecs({ width: w, length: l, mountType: mt }) : state.specs,
      };
    }),

  setActiveView: (view) => set({ activeView: view }),
}));
