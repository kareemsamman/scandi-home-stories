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

/** Full RAL palette — for PVC pergola aluminum (all standard RAL colors) */
export const RAL_COLORS: ColorPreset[] = [
  ...STANDARD_COLORS,
  { id: 'ral1000', name_he: 'RAL 1000 בז׳ ירוק', name_ar: 'RAL 1000 بيج أخضر', hex: '#BEBD7F' },
  { id: 'ral1001', name_he: 'RAL 1001 בז׳', name_ar: 'RAL 1001 بيج', hex: '#C2B078' },
  { id: 'ral1002', name_he: 'RAL 1002 צהוב חול', name_ar: 'RAL 1002 أصفر رملي', hex: '#C6A961' },
  { id: 'ral1003', name_he: 'RAL 1003 צהוב אות', name_ar: 'RAL 1003 أصفر إشارة', hex: '#E5BE01' },
  { id: 'ral1004', name_he: 'RAL 1004 צהוב זהב', name_ar: 'RAL 1004 أصفر ذهبي', hex: '#CDA434' },
  { id: 'ral1015', name_he: 'RAL 1015 שנהב בהיר', name_ar: 'RAL 1015 عاجي فاتح', hex: '#E6D690' },
  { id: 'ral1021', name_he: 'RAL 1021 צהוב קדמיום', name_ar: 'RAL 1021 أصفر كادميوم', hex: '#F3DA0B' },
  { id: 'ral2004', name_he: 'RAL 2004 כתום טהור', name_ar: 'RAL 2004 برتقالي نقي', hex: '#E75B12' },
  { id: 'ral3000', name_he: 'RAL 3000 אדום אש', name_ar: 'RAL 3000 أحمر ناري', hex: '#AF2B1E' },
  { id: 'ral3003', name_he: 'RAL 3003 אדום רובי', name_ar: 'RAL 3003 أحمر ياقوتي', hex: '#711521' },
  { id: 'ral3005', name_he: 'RAL 3005 אדום יין', name_ar: 'RAL 3005 أحمر نبيذي', hex: '#5E2129' },
  { id: 'ral3020', name_he: 'RAL 3020 אדום תנועה', name_ar: 'RAL 3020 أحمر مرور', hex: '#CC0605' },
  { id: 'ral5002', name_he: 'RAL 5002 כחול אולטרמרין', name_ar: 'RAL 5002 أزرق أولترامارين', hex: '#20214F' },
  { id: 'ral5003', name_he: 'RAL 5003 כחול ספיר', name_ar: 'RAL 5003 أزرق ياقوتي', hex: '#1D1E33' },
  { id: 'ral5005', name_he: 'RAL 5005 כחול אות', name_ar: 'RAL 5005 أزرق إشارة', hex: '#1E4174' },
  { id: 'ral5010', name_he: 'RAL 5010 כחול גנטיאנה', name_ar: 'RAL 5010 أزرق جنطيانا', hex: '#0E4C6F' },
  { id: 'ral5015', name_he: 'RAL 5015 כחול שמיים', name_ar: 'RAL 5015 أزرق سماوي', hex: '#2271B3' },
  { id: 'ral6005', name_he: 'RAL 6005 ירוק אזוב', name_ar: 'RAL 6005 أخضر طحلب', hex: '#2F4538' },
  { id: 'ral6009', name_he: 'RAL 6009 ירוק אשוח', name_ar: 'RAL 6009 أخضر تنوب', hex: '#31372B' },
  { id: 'ral6029', name_he: 'RAL 6029 ירוק נענע', name_ar: 'RAL 6029 أخضر نعنع', hex: '#20603D' },
  { id: 'ral7001', name_he: 'RAL 7001 אפור כסף', name_ar: 'RAL 7001 رمادي فضي', hex: '#8A9597' },
  { id: 'ral7004', name_he: 'RAL 7004 אפור אות', name_ar: 'RAL 7004 رمادي إشارة', hex: '#969992' },
  { id: 'ral7011', name_he: 'RAL 7011 אפור ברזל', name_ar: 'RAL 7011 رمادي حديدي', hex: '#434B4D' },
  { id: 'ral7012', name_he: 'RAL 7012 אפור בזלת', name_ar: 'RAL 7012 رمادي بازلت', hex: '#4E5754' },
  { id: 'ral7015', name_he: 'RAL 7015 אפור צפחה', name_ar: 'RAL 7015 رمادي أردواز', hex: '#434750' },
  { id: 'ral7035', name_he: 'RAL 7035 אפור בהיר', name_ar: 'RAL 7035 رمادي فاتح', hex: '#D7D7D7' },
  { id: 'ral7036', name_he: 'RAL 7036 אפור פלטינום', name_ar: 'RAL 7036 رمادي بلاتيني', hex: '#7F7679' },
  { id: 'ral7037', name_he: 'RAL 7037 אפור אבק', name_ar: 'RAL 7037 رمادي غبار', hex: '#7D7F7D' },
  { id: 'ral7038', name_he: 'RAL 7038 אפור אגת', name_ar: 'RAL 7038 رمادي عقيق', hex: '#B5B8B1' },
  { id: 'ral7039', name_he: 'RAL 7039 אפור קוורץ', name_ar: 'RAL 7039 رمادي كوارتز', hex: '#6C6960' },
  { id: 'ral7040', name_he: 'RAL 7040 אפור חלון', name_ar: 'RAL 7040 رمادي نافذة', hex: '#9DA1AA' },
  { id: 'ral7042', name_he: 'RAL 7042 אפור תנועה A', name_ar: 'RAL 7042 رمادي مرور أ', hex: '#8D948D' },
  { id: 'ral7044', name_he: 'RAL 7044 אפור משי', name_ar: 'RAL 7044 رمادي حريري', hex: '#CAC4B0' },
  { id: 'ral7047', name_he: 'RAL 7047 אפור טלקום', name_ar: 'RAL 7047 رمادي تلك', hex: '#D0D0CE' },
  { id: 'ral8001', name_he: 'RAL 8001 חום אוכרה', name_ar: 'RAL 8001 بني مغرة', hex: '#955F20' },
  { id: 'ral8003', name_he: 'RAL 8003 חום חמר', name_ar: 'RAL 8003 بني طيني', hex: '#734222' },
  { id: 'ral8011', name_he: 'RAL 8011 חום אגוז', name_ar: 'RAL 8011 بني جوز', hex: '#593315' },
  { id: 'ral8014', name_he: 'RAL 8014 חום ספיה', name_ar: 'RAL 8014 بني سبيا', hex: '#382C1E' },
  { id: 'ral8017', name_he: 'RAL 8017 חום שוקולד', name_ar: 'RAL 8017 بني شوكولاتة', hex: '#45322E' },
  { id: 'ral8019', name_he: 'RAL 8019 חום אפור', name_ar: 'RAL 8019 بني رمادي', hex: '#403A3A' },
  { id: 'ral8022', name_he: 'RAL 8022 חום שחור', name_ar: 'RAL 8022 بني أسود', hex: '#212121' },
  { id: 'ral9001', name_he: 'RAL 9001 לבן שמנת', name_ar: 'RAL 9001 أبيض كريمي', hex: '#FDF4E3' },
  { id: 'ral9002', name_he: 'RAL 9002 לבן אפור', name_ar: 'RAL 9002 أبيض رمادي', hex: '#E7EBDA' },
  { id: 'ral9003', name_he: 'RAL 9003 לבן אות', name_ar: 'RAL 9003 أبيض إشارة', hex: '#F4F4F4' },
  { id: 'ral9010', name_he: 'RAL 9010 לבן טהור', name_ar: 'RAL 9010 أبيض نقي', hex: '#FFFFFF' },
  { id: 'ral9011', name_he: 'RAL 9011 שחור גרפיט', name_ar: 'RAL 9011 أسود جرافيت', hex: '#1C1C1C' },
];

/** PVC fabric colors — for the pergola covering */
export const PVC_FABRIC_COLORS: ColorPreset[] = [
  { id: 'pvc_cream', name_he: 'שמנת', name_ar: 'كريمي', hex: '#D4C9A8' },
  { id: 'pvc_burgundy', name_he: 'בורדו', name_ar: 'بوردو', hex: '#5B1A2A' },
  { id: 'pvc_red', name_he: 'אדום', name_ar: 'أحمر', hex: '#C41E24' },
  { id: 'pvc_green', name_he: 'ירוק', name_ar: 'أخضر', hex: '#2E5E3F' },
  { id: 'pvc_gray', name_he: 'אפור', name_ar: 'رمادي', hex: '#A0A0A0' },
  { id: 'pvc_dark_gray', name_he: 'אפור כהה', name_ar: 'رمادي غامق', hex: '#4A4A4A' },
  { id: 'pvc_black', name_he: 'שחור', name_ar: 'أسود', hex: '#2C2C2C' },
  { id: 'pvc_white', name_he: 'לבן', name_ar: 'أبيض', hex: '#F0F0F0' },
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
  // PVC fabric color (per-section via carrierConfigs)
  fabricColor: string;
  // Colors
  frameColor: string;
  roofColor: string;
  // Spacing
  spacingMode: SpacingMode;
  // Division beams (קורות חלוקה)
  carrierCountOverride: number; // 0 = auto, >0 = manual
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
  fabricColor: string; // PVC fabric color per section
  subCarrierColor: string; // PVC sub-carrier bar color (RAL or fabric)
  pvcLightType: 'none' | 'side' | 'full'; // side=left+right spots, full=strip (alternating)
  slatCount: number; // 0 = auto-calculate, >0 = manual
  lighting: LightingChoice; // 'none' | '3000k' | '4000k' | '6000k'
  lightingEnabled: boolean;
}

export function defaultCarrierConfig(global: {
  slatSize?: SlatSizeId;
  slatGapCm?: number;
  slatColor?: string;
  lighting?: LightingChoice;
  fabricColor?: string;
}): CarrierConfig {
  return {
    slatSize: global.slatSize || "20x70",
    slatGapCm: global.slatGapCm || 3,
    slatColor: global.slatColor || "#383E42",
    fabricColor: global.fabricColor || "#D4C9A8",
    subCarrierColor: "#383E42",
    pvcLightType: "none",
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
