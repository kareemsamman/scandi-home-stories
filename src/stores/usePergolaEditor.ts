import { create } from "zustand";
import type { LightingChoice, SantafChoice, SpacingMode, MountType } from "@/types/pergola";
import { calcPostCount } from "@/lib/pergolaRules";
import { cmToMm } from "@/types/pergola";

// ── Element types that can be selected ──

export type ElementType =
  | "front_post"
  | "back_post"
  | "roof"
  | "santaf"
  | "frame"
  | "carrier"
  | "roof_lighting"
  | "add_post_slot";

export interface SelectedElement {
  type: ElementType;
  index: number; // post index, carrier index, or -1 for global elements
}

// ── Validation results ──

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

// ── Editor state ──

interface PergolaEditorState {
  selected: SelectedElement | null;
  isAdmin: boolean;
  hoverElement: SelectedElement | null;

  select: (el: SelectedElement | null) => void;
  setIsAdmin: (admin: boolean) => void;
  setHoverElement: (el: SelectedElement | null) => void;
}

export const usePergolaEditor = create<PergolaEditorState>((set) => ({
  selected: null,
  isAdmin: false,
  hoverElement: null,

  select: (el) => set({ selected: el }),
  setIsAdmin: (admin) => set({ isAdmin: admin }),
  setHoverElement: (el) => set({ hoverElement: el }),
}));

// ── Rule validation functions ──

export function canAddPost(
  widthMm: number,
  mountType: MountType,
  currentFrontCount: number,
  isAdmin: boolean,
): ValidationResult {
  const rules = calcPostCount(widthMm, mountType);
  const maxAllowed = isAdmin ? rules.front + 2 : rules.front;
  if (currentFrontCount >= maxAllowed) {
    return { allowed: false, reason: `מקסימום ${maxAllowed} עמודים ברוחב זה` };
  }
  return { allowed: true };
}

export function canRemovePost(
  widthMm: number,
  currentFrontCount: number,
  isAdmin: boolean,
): ValidationResult {
  const minPosts = 2; // structural minimum
  if (currentFrontCount <= minPosts) {
    return { allowed: false, reason: "חובה לפחות 2 עמודים" };
  }
  // Non-admin: can only remove if above the rule-calculated count
  if (!isAdmin) {
    const rules = calcPostCount(widthMm, "wall");
    if (currentFrontCount <= rules.front) {
      return { allowed: false, reason: "לא ניתן להסיר עמודים מעבר למינימום הנדרש" };
    }
  }
  return { allowed: true };
}

export function canTogglePostLight(
  lighting: LightingChoice,
): ValidationResult {
  if (lighting === "none") {
    return { allowed: false, reason: "יש לבחור סוג תאורה תחילה" };
  }
  return { allowed: true };
}

export function canEditSpacing(isAdmin: boolean): ValidationResult {
  // Customers choose presets; admin can fine-tune
  return { allowed: true };
}

export function canToggleSantaf(): ValidationResult {
  return { allowed: true };
}

export function getValidPostPositions(
  widthMm: number,
  currentPositions: number[],
  maxPosts: number,
): number[] {
  // Generate allowed slots: evenly spaced positions for possible post counts
  if (currentPositions.length >= maxPosts) return [];
  const slots: number[] = [];
  const nextCount = currentPositions.length + 1;
  for (let i = 0; i < nextCount; i++) {
    const pos = (i / (nextCount - 1)) * widthMm;
    if (!currentPositions.some((p) => Math.abs(p - pos) < widthMm * 0.05)) {
      slots.push(pos);
    }
  }
  return slots;
}
