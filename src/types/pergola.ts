export type MountType = 'wall' | 'freestanding';
/** Lighting color temperature: 3000K warm, 4000K neutral, 6000K cool */
export type LightingChoice = 'none' | '3000k' | '4000k' | '6000k';
export type LightingPosition = 'none' | 'all_posts' | 'selected_posts' | 'no_posts';
export type LightingFixture = 'none' | 'spotlight' | 'led_strip' | 'rgb_strip' | 'mixed';
export type ModuleClassification = 'single' | 'double' | 'triple' | 'custom';
export type PergolaRequestStatus = 'new' | 'in_review' | 'needs_inspection' | 'ready_for_quote' | 'quoted' | 'closed';
export type SpacingMode = 'automatic' | 'dense' | 'standard' | 'wide';
export type PergolaType = 'fixed' | 'pvc';
export type SantafChoice = 'without' | 'with';
export type RoofFillMode = 'slats' | 'santaf'; // primary fill for fixed pergola (santaf can also be added on top of slats)

/** Profile names matching the technical PDF reference */
export const PROFILE_NAMES = [
  'rafter',
  'gutter',
  'carrier_post',
  'fabric_master',
  'fabric_carrier',
  'motor_box',
  'roof_sash',
  'motor_shaft_thick',
  'motor_shaft_thin',
] as const;
export type ProfileName = typeof PROFILE_NAMES[number];

/** Standard color presets */
export interface ColorPreset {
  id: string;
  name_he: string;
  name_ar: string;
  hex: string;
}

/** RAL color presets — used for frame, roof, and general elements */
export const STANDARD_COLORS: ColorPreset[] = [
  { id: 'ral9007', name_he: 'RAL 9007 אפור אלומיניום', name_ar: 'RAL 9007 رمادي ألومنيوم', hex: '#8F8F8F' },
  { id: 'ral7016', name_he: 'RAL 7016 אנתרציט', name_ar: 'RAL 7016 أنثراسايت', hex: '#383E42' },
  { id: 'ral9016', name_he: 'RAL 9016 לבן', name_ar: 'RAL 9016 أبيض', hex: '#ECEAE4' },
  { id: 'ral9005', name_he: 'RAL 9005 שחור', name_ar: 'RAL 9005 أسود', hex: '#0A0A0A' },
  { id: 'ral9006', name_he: 'RAL 9006 אלומיניום לבן', name_ar: 'RAL 9006 ألومنيوم أبيض', hex: '#A5A5A5' },
  { id: 'ral1013', name_he: 'RAL 1013 שנהב', name_ar: 'RAL 1013 عاجي', hex: '#E3D9BA' },
];

/** Profile/slat colors — RAL colors + 2 wood finishes */
export const SLAT_COLORS: ColorPreset[] = [
  ...STANDARD_COLORS,
  { id: 'wood_dark', name_he: 'עץ כהה', name_ar: 'خشب غامق', hex: '#7A4B2A' },
  { id: 'wood_light', name_he: 'עץ בהיר', name_ar: 'خشب فاتح', hex: '#C8923C' },
];

/** סנטף colors — only 2 options */
export const SANTAF_COLORS: ColorPreset[] = [
  { id: 'santaf_gray', name_he: 'אפור', name_ar: 'رمادي', hex: '#7A8B9A' },
  { id: 'santaf_clear', name_he: 'שקוף / תכלת', name_ar: 'شفاف / أزرق فاتح', hex: '#A8D4E6' },
];

/** Slat profile sizes (width x height in mm) */
export const SLAT_SIZES = [
  { id: '20x40', label: '20 × 40 mm', widthMm: 20, heightMm: 40 },
  { id: '20x70', label: '20 × 70 mm', widthMm: 20, heightMm: 70 },
  { id: '20x100', label: '20 × 100 mm', widthMm: 20, heightMm: 100 },
] as const;
export type SlatSizeId = typeof SLAT_SIZES[number]['id'];

/** Slat available lengths in mm */
export const SLAT_LENGTHS = [3000, 4000, 6000] as const;

/** Lighting color temperature options */
export const LIGHTING_TEMPS = [
  { id: '3000k' as const, label: '3000K', name_he: 'חם', name_ar: 'دافئ', color: '#FFD27F' },
  { id: '4000k' as const, label: '4000K', name_he: 'ניטרלי', name_ar: 'محايد', color: '#FFF4E0' },
  { id: '6000k' as const, label: '6000K', name_he: 'קר', name_ar: 'بارد', color: '#F0F4FF' },
] as const;

/** What the customer fills in the form — dimensions in cm */
export interface PergolaFormInput {
  widthCm: number;
  lengthCm: number;
  heightCm: number;
  pergolaType: PergolaType;
  mountType: MountType;
  installation: boolean;
  // Lighting
  lighting: LightingChoice;
  lightingPosition: LightingPosition;
  lightingFixture: LightingFixture;
  lightingRoof: boolean;
  lightingPosts: number[]; // indices of posts with lights (for selected_posts)
  // Roof fill mode (fixed pergola only)
  roofFillMode: RoofFillMode;
  // Slats (when roofFillMode === 'slats')
  slatCount: number;
  slatGapCm: number; // gap between slats in cm (1, 2, 3, 4)
  slatSize: SlatSizeId; // '20x70' or '20x40'
  slatColor: string;
  // Santaf (when roofFillMode === 'santaf')
  santaf: SantafChoice;
  santafColor: string;
  // Colors
  frameColor: string;
  roofColor: string;
  // Spacing
  spacingMode: SpacingMode;
  // Profiles
  selectedProfiles: Record<ProfileName, string>; // profile name → preset label
  // Customer
  notes: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
}

/** Output of the rule engine */
export interface PergolaSpecs {
  moduleClassification: ModuleClassification;
  moduleCount: number;
  carrierCount: number;
  frontPostCount: number;
  backPostCount: number;
  moduleWidths: number[]; // in mm
  spacingMm: number; // actual spacing between profiles in mm
  profiles: Record<ProfileName, string>; // which profiles are active
  // Slat calculations (fixed pergola)
  slatCount: number;
  slatGapMm: number;
  slatWidthMm: number; // each slat profile width
}

/** Full DB row */
export interface PergolaRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  width: number; // stored in mm
  length: number;
  height: number | null;
  pergola_type: string;
  mount_type: MountType;
  installation: boolean;
  lighting: LightingChoice;
  lighting_position: LightingPosition;
  lighting_type: LightingFixture;
  lighting_posts: number[];
  lighting_roof: boolean;
  santaf_roofing: boolean;
  santaf_color: string;
  frame_color: string;
  roof_color: string;
  notes: string;
  module_classification: ModuleClassification;
  carrier_count: number;
  front_post_count: number;
  back_post_count: number;
  spacing_mode: SpacingMode;
  spacing_cm: number | null;
  profile_preset: string;
  selected_profiles: Record<string, string>;
  post_layout: any;
  pdf_url: string | null;
  status: PergolaRequestStatus;
  admin_notes: string;
  admin_modified_config: Record<string, any> | null;
  quoted_price: number | null;
  admin_response_sent_at: string | null;
  response_token: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

/** Props for SVG drawing components */
export interface DrawingConfig {
  widthMm: number;
  lengthMm: number;
  heightMm: number;
  mountType: MountType;
  lighting: LightingChoice;
  lightingPosition: LightingPosition;
  lightingFixture: LightingFixture;
  lightingRoof: boolean;
  lightingPosts: number[];
  roofFillMode: RoofFillMode;
  santaf: SantafChoice;
  santafColor: string;
  slatColor: string;
  specs: PergolaSpecs;
  frameColor: string;
  roofColor: string;
  pergolaType: PergolaType;
  carrierConfigs: CarrierConfig[];
}

/** Per-carrier section configuration (allows per-קורת חלוקה customization) */
export interface CarrierConfig {
  slatSize: SlatSizeId;
  slatGapCm: number;
  slatColor: string;
  slatCount: number; // 0 = auto-calculate, >0 = manual
  lighting: LightingChoice; // 'none' | '3000k' | '4000k' | '6000k'
  lightingEnabled: boolean;
}

export function defaultCarrierConfig(global: {
  slatSize?: SlatSizeId;
  slatGapCm?: number;
  slatColor?: string;
  lighting?: LightingChoice;
}): CarrierConfig {
  return {
    slatSize: global.slatSize || "20x70",
    slatGapCm: global.slatGapCm || 3,
    slatColor: global.slatColor || "#383E42",
    slatCount: 0,
    lighting: global.lighting || "none",
    lightingEnabled: (global.lighting || "none") !== "none",
  };
}

// ── Helpers ──

/** Get the visual color for a lighting temperature */
export function lightingColor(choice: LightingChoice): string {
  if (choice === '3000k') return '#FFD27F';
  if (choice === '4000k') return '#FFF4E0';
  if (choice === '6000k') return '#F0F4FF';
  return '#FDE68A'; // fallback
}

export function cmToMm(cm: number): number {
  return Math.round(cm * 10);
}

export function mmToCm(mm: number): number {
  return mm / 10;
}
