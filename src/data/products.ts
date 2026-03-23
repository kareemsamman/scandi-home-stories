import type { Locale } from "@/i18n/translations";
import profileGateTubeImg from "@/assets/profile-gate-tube.png";
import profileBeakImg from "@/assets/profile-beak.png";
import profileHitechImg from "@/assets/profile-hitech.png";

export interface LocaleString {
  he: string;
  ar: string;
}

export interface Collection {
  id: string;
  name: LocaleString;
  slug: string;
  description: LocaleString;
  image: string;
  heroImage?: string;
}

export interface ColorOption {
  id: string;
  name: LocaleString;
  hex: string;
  price?: number;
  prices?: Record<string, number>; // sizeId -> price for custom colors (per-length pricing)
  lengths?: string[]; // IDs of lengths available for this color (contractor variable products)
  combo_prices?: Record<string, number>; // lengthId -> price for variable products
}

export interface ColorGroup {
  id: string;
  name: LocaleString;
  colors: ColorOption[];
}

export interface SizeOption {
  id: string;
  label: string;
  price?: number;
}

// Subcategory for contractor product filtering
export interface SubCategory {
  id: string;
  name: LocaleString;
  image?: string;
}

// Base product fields
interface BaseProduct {
  id: string;
  name: string;
  slug: string;
  collection: string;
  price: number;
  description: LocaleString;
  longDescription: LocaleString;
  materials: string;
  images: string[];
  featured?: boolean;
  new?: boolean;
  sort_order?: number;
  contentHtml?: { he: string; ar: string };
  productDetails?: { label_he: string; label_ar: string; value_he: string; value_ar: string }[];
}

// TYPE 1: Retail products (Pergolas) — fixed size, color swatches only
export interface RetailProduct extends BaseProduct {
  type: "retail";
  dimensions?: string;
  colors: ColorOption[];
}

// TYPE 2: Contractor products (Aluminum profiles) — sizes, color groups (standard + RAL + wood)
export interface ContractorProduct extends BaseProduct {
  type: "contractor";
  sku: string;
  length: LocaleString;
  sizes: SizeOption[];
  colorGroups: ColorGroup[];
  maxQuantity?: number;
  subCategory?: string; // references SubCategory.id
}

export type Product = RetailProduct | ContractorProduct;

// Subcategories for aluminum profiles
export const profileSubCategories: SubCategory[] = [
  { id: "gate-profiles", name: { he: "פרופילי שער", ar: "بروفيلات بوابات" } },
  { id: "accessories", name: { he: "אביזרים", ar: "إكسسوارات" } },
  { id: "angles", name: { he: "זוויות שווה-ש", ar: "زوايا متساوية" } },
  { id: "fences-gates", name: { he: "גדרות ושערים", ar: "أسوار وبوابات" } },
  { id: "hitech", name: { he: "הייטק אטום", ar: "هايتك مغلق" } },
];

export const collections: Collection[] = [
  {
    id: "bioclimatic",
    name: { he: "פרגולות ביוקלימטיות", ar: "برجولات بيوكليماتيكية" },
    slug: "bioclimatic",
    description: { he: "למלות מתכווננות לשליטה מלאה באור ואוורור", ar: "شرائح قابلة للتعديل للتحكم الكامل في الضوء والتهوية" },
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=75&fm=webp&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=75&fm=webp&fit=crop",
  },
  {
    id: "motorized",
    name: { he: "מערכות למלות מוטוריות", ar: "أنظمة شرائح آلية" },
    slug: "motorized",
    description: { he: "שליטה חשמלית מלאה עם שלט רחוק וחיישנים", ar: "تحكم كهربائي كامل مع ريموت وأجهزة استشعار" },
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=75&fm=webp&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&q=75&fm=webp&fit=crop",
  },
  {
    id: "fixed",
    name: { he: "פרגולות קבועות", ar: "برجولات ثابتة" },
    slug: "fixed",
    description: { he: "מבנים קבועים ויציבים להצללה קבועה", ar: "هياكل ثابتة ومتينة للتظليل الدائم" },
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80",
  },
  {
    id: "retractable",
    name: { he: "גגות נפתחים", ar: "أسقف قابلة للطي" },
    slug: "retractable",
    description: { he: "גגות מתקפלים ונפתחים בלחיצת כפתור", ar: "أسقف قابلة للطي بضغطة زر" },
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=80",
  },
  {
    id: "accessories",
    name: { he: "אביזרים ותוספות", ar: "إكسسوارات وإضافات" },
    slug: "accessories",
    description: { he: "תאורה, ניקוז, חיישנים ואביזרים נלווים", ar: "إضاءة وتصريف وأجهزة استشعار وملحقات" },
    image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1920&q=80",
  },
  {
    id: "profiles",
    name: { he: "פרופילי אלומיניום", ar: "بروفيلات ألمنيوم" },
    slug: "profiles",
    description: { he: "פרופילים מקצועיים לקבלנים ומתקינים", ar: "بروفيلات احترافية للمقاولين والفنيين" },
    image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1920&q=80",
  },
];

// Shared color definitions
const standardColors: ColorOption[] = [
  { id: "black", name: { he: "שחור", ar: "أسود" }, hex: "#1a1a1a" },
  { id: "white", name: { he: "לבן", ar: "أبيض" }, hex: "#f5f5f5" },
  { id: "charcoal", name: { he: "פחם", ar: "فحمي" }, hex: "#444444" },
  { id: "aluminum", name: { he: "אלומיניום", ar: "ألمنيوم" }, hex: "#c0c0c0" },
];

const ralColors: ColorOption[] = [
  { id: "ral7016", name: { he: "RAL 7016 – Anthracite Grey", ar: "RAL 7016 – رمادي أنثراسايت" }, hex: "#383e42" },
  { id: "ral9005", name: { he: "RAL 9005 – Jet Black", ar: "RAL 9005 – أسود نفاث" }, hex: "#0e0e10" },
  { id: "ral9016", name: { he: "RAL 9016 – Traffic White", ar: "RAL 9016 – أبيض مروري" }, hex: "#f1f0ea" },
  { id: "ral7035", name: { he: "RAL 7035 – Light Grey", ar: "RAL 7035 – رمادي فاتح" }, hex: "#c5c7c4" },
  { id: "ral7000", name: { he: "RAL 7000 – Squirrel Grey", ar: "RAL 7000 – رمادي سنجابي" }, hex: "#7a8b7a" },
  { id: "ral7001", name: { he: "RAL 7001 – Silver Grey", ar: "RAL 7001 – رمادي فضي" }, hex: "#8d948d" },
  { id: "ral7002", name: { he: "RAL 7002 – Olive Grey", ar: "RAL 7002 – رمادي زيتوني" }, hex: "#817f68" },
  { id: "ral7003", name: { he: "RAL 7003 – Moss Grey", ar: "RAL 7003 – رمادي طحلبي" }, hex: "#7a7b6d" },
  { id: "ral7004", name: { he: "RAL 7004 – Signal Grey", ar: "RAL 7004 – رمادي إشارة" }, hex: "#9b9b9b" },
  { id: "ral7005", name: { he: "RAL 7005 – Mouse Grey", ar: "RAL 7005 – رمادي فأري" }, hex: "#6c7066" },
  { id: "ral7006", name: { he: "RAL 7006 – Beige Grey", ar: "RAL 7006 – رمادي بيج" }, hex: "#756f61" },
  { id: "ral7008", name: { he: "RAL 7008 – Khaki Grey", ar: "RAL 7008 – رمادي كاكي" }, hex: "#6a5d4d" },
];

const passivationColors: ColorOption[] = [
  { id: "pass-clear", name: { he: "פסיבציה שקופה", ar: "تخميل شفاف" }, hex: "#e8e8e0" },
  { id: "pass-yellow", name: { he: "פסיבציה צהובה", ar: "تخميل أصفر" }, hex: "#d4c96a" },
  { id: "pass-blue", name: { he: "פסיבציה כחולה", ar: "تخميل أزرق" }, hex: "#8fa8c8" },
];

const woodFinishColors: ColorOption[] = [
  { id: "oak", name: { he: "אלון – Oak", ar: "بلوط – Oak" }, hex: "#b8860b" },
  { id: "walnut", name: { he: "אגוז – Walnut", ar: "جوز – Walnut" }, hex: "#5c4033" },
  { id: "teak", name: { he: "טיק – Teak", ar: "ساج – Teak" }, hex: "#c19a6b" },
  { id: "mahogany", name: { he: "מהגוני – Mahogany", ar: "ماهوغاني – Mahogany" }, hex: "#c04000" },
  { id: "pine", name: { he: "אורן – Pine", ar: "صنوبر – Pine" }, hex: "#deb887" },
  { id: "cherry", name: { he: "דובדבן – Cherry", ar: "كرز – Cherry" }, hex: "#9b111e" },
];

const ironColors: ColorOption[] = [
  { id: "iron-rust", name: { he: "חלודה – Rust", ar: "صدأ – Rust" }, hex: "#b7410e" },
  { id: "iron-patina", name: { he: "פטינה – Patina", ar: "باتينا – Patina" }, hex: "#5f8575" },
  { id: "iron-dark", name: { he: "ברזל כהה – Dark Iron", ar: "حديد داكن – Dark Iron" }, hex: "#3b3b3b" },
];

const metalColors: ColorOption[] = [
  { id: "metal-bronze", name: { he: "ברונזה – Bronze", ar: "برونز – Bronze" }, hex: "#cd7f32" },
  { id: "metal-champagne", name: { he: "שמפניה – Champagne", ar: "شامبانيا – Champagne" }, hex: "#f7e7ce" },
  { id: "metal-titanium", name: { he: "טיטניום – Titanium", ar: "تيتانيوم – Titanium" }, hex: "#878681" },
  { id: "metal-silver", name: { he: "כסף – Silver", ar: "فضي – Silver" }, hex: "#c0c0c0" },
];

const contractorColorGroups: ColorGroup[] = [
  { id: "standard", name: { he: "סטנדרט", ar: "قياسي" }, colors: standardColors },
  { id: "ral", name: { he: "צבעי RAL", ar: "ألوان RAL" }, colors: ralColors },
  { id: "passivation", name: { he: "פסיבציה", ar: "تخميل" }, colors: passivationColors },
  { id: "wood", name: { he: "דמוי עץ", ar: "شبيه الخشب" }, colors: woodFinishColors },
  { id: "iron", name: { he: "אירון", ar: "حديد" }, colors: ironColors },
  { id: "metal", name: { he: "מטאל", ar: "معدن" }, colors: metalColors },
];

const defaultSizes: SizeOption[] = [
  { id: "3m", label: "3m", price: 80 },
  { id: "4m", label: "4m", price: 100 },
  { id: "5m", label: "5m", price: 110 },
  { id: "6m", label: "6m", price: 120 },
];

export const products: Product[] = [
  // ── RETAIL PRODUCTS (Pergolas) ──
  {
    id: "elite-4000",
    type: "retail",
    name: "AMG Elite 4000",
    slug: "amg-elite-4000",
    collection: "bioclimatic",
    price: 45000,
    description: { he: "פרגולה ביוקלימטית פרימיום עם למלות אלומיניום מתכווננות", ar: "برجولة بيوكليماتيكية فاخرة مع شرائح ألمنيوم قابلة للتعديل" },
    longDescription: { he: "ה-Elite 4000 היא הדגם המוביל שלנו. למלות אלומיניום מתכווננות ב-180 מעלות מאפשרות שליטה מלאה באור, אוורור והגנה מגשם. מערכת ניקוז מובנית, מנוע שקט במיוחד, ואפשרות לשליטה מרחוק ואפליקציה.", ar: "Elite 4000 هو طرازنا الرائد. شرائح ألمنيوم قابلة للتعديل بزاوية 180 درجة للتحكم الكامل في الضوء والتهوية والحماية من المطر." },
    materials: "Powder-coated aluminum 6063-T5",
    dimensions: "600×400 cm (customizable)",
    colors: standardColors,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    ],
    featured: true,
  },
  {
    id: "pro-3000",
    type: "retail",
    name: "AMG Pro 3000",
    slug: "amg-pro-3000",
    collection: "bioclimatic",
    price: 35000,
    description: { he: "פרגולה ביוקלימטית קומפקטית למרפסות וגינות", ar: "برجولة بيوكليماتيكية مدمجة للشرفات والحدائق" },
    longDescription: { he: "ה-Pro 3000 מציעה את כל היתרונות של מערכת ביוקלימטית בפורמט קומפקטי. מושלמת למרפסות, פטיו וגינות קטנות עד בינוניות.", ar: "Pro 3000 تقدم جميع مزايا النظام البيوكليماتيكي بتصميم مدمج. مثالية للشرفات والحدائق." },
    materials: "Powder-coated aluminum 6063-T5",
    dimensions: "400×300 cm (customizable)",
    colors: standardColors,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    ],
    new: true,
  },
  {
    id: "louvermax-500",
    type: "retail",
    name: "AMG LouverMax 500",
    slug: "amg-louvermax-500",
    collection: "motorized",
    price: 52000,
    description: { he: "מערכת למלות מוטורית מתקדמת עם חיישני מזג אוויר", ar: "نظام شرائح آلي متقدم مع أجهزة استشعار الطقس" },
    longDescription: { he: "ה-LouverMax 500 היא מערכת הלמלות המוטוריות המתקדמת ביותר שלנו. חיישני גשם, רוח ושמש מפעילים את המערכת אוטומטית לפי תנאי מזג האוויר.", ar: "LouverMax 500 هو نظام الشرائح الآلية الأكثر تقدماً لدينا. أجهزة استشعار للمطر والرياح والشمس." },
    materials: "Marine-grade aluminum, stainless steel hardware",
    dimensions: "700×500 cm (customizable)",
    colors: standardColors,
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    ],
    featured: true,
  },
  {
    id: "smartblade-200",
    type: "retail",
    name: "AMG SmartBlade 200",
    slug: "amg-smartblade-200",
    collection: "motorized",
    price: 42000,
    description: { he: "למלות חכמות עם שליטה באפליקציה", ar: "شرائح ذكية مع تحكم بالتطبيق" },
    longDescription: { he: "ה-SmartBlade 200 משלבת מנועים שקטים עם שליטה חכמה דרך אפליקציה. ניתן לתכנת תרחישי הפעלה אוטומטיים.", ar: "SmartBlade 200 تجمع بين محركات هادئة وتحكم ذكي عبر التطبيق." },
    materials: "Powder-coated aluminum, Somfy motors",
    dimensions: "500×400 cm (customizable)",
    colors: standardColors,
    images: [
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    ],
    new: true,
  },
  {
    id: "classicshade-100",
    type: "retail",
    name: "AMG ClassicShade",
    slug: "amg-classicshade",
    collection: "fixed",
    price: 22000,
    description: { he: "פרגולה קבועה קלאסית עם גג אלומיניום", ar: "برجولة ثابتة كلاسيكية بسقف ألمنيوم" },
    longDescription: { he: "ה-ClassicShade מציעה הצללה קבועה ואמינה. מבנה חזק במיוחד עם גג אלומיניום מלא ומערכת ניקוז משולבת.", ar: "ClassicShade تقدم تظليل ثابت وموثوق. هيكل قوي مع سقف ألمنيوم كامل." },
    materials: "Powder-coated aluminum frame and roof panels",
    dimensions: "500×350 cm (customizable)",
    colors: standardColors,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80",
    ],
  },
  {
    id: "solidtop-500",
    type: "retail",
    name: "AMG SolidTop 500",
    slug: "amg-solidtop-500",
    collection: "fixed",
    price: 28000,
    description: { he: "גג קבוע מבודד עם פנלים מרופדים", ar: "سقف ثابت معزول مع ألواح مبطنة" },
    longDescription: { he: "ה-SolidTop 500 מציעה בידוד תרמי מעולה עם פנלים סנדוויץ' מרופדים. אידיאלית לשימוש כל-שנתי.", ar: "SolidTop 500 تقدم عزل حراري ممتاز مع ألواح ساندوتش مبطنة." },
    materials: "Insulated sandwich panels, aluminum frame",
    dimensions: "600×400 cm (customizable)",
    colors: standardColors,
    images: [
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    ],
    featured: true,
  },
  {
    id: "flexroof-600",
    type: "retail",
    name: "AMG FlexRoof 600",
    slug: "amg-flexroof-600",
    collection: "retractable",
    price: 38000,
    description: { he: "גג נפתח חשמלי עם בד PVC עמיד", ar: "سقف قابل للطي كهربائي مع قماش PVC متين" },
    longDescription: { he: "ה-FlexRoof 600 מציעה גמישות מלאה — פתוח לשמש, סגור לגשם. בד PVC עמיד בציפוי UV עם מנוע שקט.", ar: "FlexRoof 600 تقدم مرونة كاملة — مفتوح للشمس، مغلق للمطر." },
    materials: "PVC fabric, powder-coated aluminum frame",
    dimensions: "500×400 cm (customizable)",
    colors: standardColors,
    images: [
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    ],
    new: true,
  },
  {
    id: "stormguard-800",
    type: "retail",
    name: "AMG StormGuard 800",
    slug: "amg-stormguard-800",
    collection: "retractable",
    price: 48000,
    description: { he: "גג נפתח כפול עמיד לסערות", ar: "سقف قابل للطي مزدوج مقاوم للعواصف" },
    longDescription: { he: "ה-StormGuard 800 מתוכנן לתנאי מזג אוויר קשים. מערכת גג כפולה עם חיזוקים מיוחדים ועמידות לרוחות חזקות.", ar: "StormGuard 800 مصمم لظروف الطقس القاسية. نظام سقف مزدوج مع تعزيزات خاصة." },
    materials: "Heavy-duty aluminum, reinforced PVC",
    dimensions: "700×500 cm (customizable)",
    colors: standardColors,
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
    ],
    featured: true,
  },
  {
    id: "led-kit",
    type: "retail",
    name: "AMG LED Lighting Kit",
    slug: "amg-led-lighting-kit",
    collection: "accessories",
    price: 3500,
    description: { he: "ערכת תאורת LED משולבת לפרגולות", ar: "مجموعة إضاءة LED مدمجة للبرجولات" },
    longDescription: { he: "ערכת תאורת LED מותקנת בתוך פרופיל הלמלות. תאורת RGB עם שלט רחוק ואפשרות לדימר.", ar: "مجموعة إضاءة LED مثبتة داخل شرائح البرجولة. إضاءة RGB مع ريموت." },
    materials: "IP65 LED strips, aluminum housing",
    colors: [],
    images: [
      "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
    ],
  },
  {
    id: "drainage-system",
    type: "retail",
    name: "AMG Rain Drainage System",
    slug: "amg-rain-drainage-system",
    collection: "accessories",
    price: 4200,
    description: { he: "מערכת ניקוז גשם משולבת", ar: "نظام تصريف مياه الأمطار المتكامل" },
    longDescription: { he: "מערכת ניקוז גשם מובנית בתוך עמודי הפרגולה. ניקוז שקט ויעיל ללא צנרת חיצונית.", ar: "نظام تصريف مياه مدمج في أعمدة البرجولة. تصريف هادئ وفعال." },
    materials: "Aluminum gutters, PVC piping",
    colors: [],
    images: [
      "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    ],
  },

  // ── CONTRACTOR PRODUCTS (Aluminum Profiles) ──
  {
    id: "profile-gate-tube",
    type: "contractor",
    name: "פרופיל שער צינור",
    slug: "profile-gate-tube",
    collection: "profiles",
    subCategory: "gate-profiles",
    price: 180,
    sku: "900YSL1300-60",
    length: { he: "6 מטר", ar: "6 متر" },
    description: { he: "פרופיל צינור לשערים מאלומיניום מחוזק", ar: "بروفيل أنبوبي للبوابات من ألمنيوم مقوى" },
    longDescription: { he: "פרופיל צינור מאלומיניום 6063-T5 לבניית שערים. מתאים לשערים חשמליים וידניים. עמיד בפני קורוזיה וחלודה.", ar: "بروفيل أنبوبي من ألمنيوم 6063-T5 لبناء البوابات. مناسب للبوابات الكهربائية واليدوية." },
    materials: "Aluminum 6063-T5",
    sizes: defaultSizes,
    colorGroups: contractorColorGroups,
    images: [profileGateTubeImg],
  },
  {
    id: "profile-hinge",
    type: "contractor",
    name: "פרופיל ציר",
    slug: "profile-hinge",
    collection: "profiles",
    subCategory: "gate-profiles",
    price: 95,
    sku: "900YSL1310-50",
    length: { he: "5 מטר", ar: "5 متر" },
    description: { he: "פרופיל ציר לשערי אלומיניום", ar: "بروفيل محور لبوابات ألمنيوم" },
    longDescription: { he: "פרופיל ציר מאלומיניום לחיבור דלתות ושערים. מתאים לשערים דו-כנפיים וחד-כנפיים.", ar: "بروفيل محور من الألمنيوم لربط الأبواب والبوابات." },
    materials: "Aluminum 6063-T5",
    sizes: defaultSizes,
    colorGroups: contractorColorGroups,
    images: [profileGateTubeImg],
  },
  {
    id: "gate-stopper",
    type: "contractor",
    name: "סטופר לשער",
    slug: "gate-stopper",
    collection: "profiles",
    subCategory: "accessories",
    price: 45,
    sku: "900YSL1400-25",
    length: { he: "2.5 מטר", ar: "2.5 متر" },
    description: { he: "סטופר אלומיניום לשערים הזזה", ar: "ماسك ألمنيوم للبوابات المنزلقة" },
    longDescription: { he: "סטופר מאלומיניום לבלימת שערים הזזה. התקנה קלה עם ברגים מובנים. עמיד לכל תנאי מזג האוויר.", ar: "ماسك من الألمنيوم لإيقاف البوابات المنزلقة. تركيب سهل بمسامير مدمجة." },
    materials: "Aluminum 6063-T5",
    sizes: [
      { id: "2.5m", label: "2.5m" },
      { id: "3m", label: "3m" },
      { id: "4m", label: "4m" },
    ],
    colorGroups: contractorColorGroups,
    images: [profileGateTubeImg],
  },
  {
    id: "beak-profile",
    type: "contractor",
    name: "משופע מקור 40x20 6 מ׳",
    slug: "beak-profile",
    collection: "profiles",
    subCategory: "gate-profiles",
    price: 120,
    sku: "900YSL1500-40",
    length: { he: "6 מטר", ar: "6 متر" },
    description: { he: "פרופיל משופע מקור לגימור עליון", ar: "بروفيل مائل للتشطيب العلوي" },
    longDescription: { he: "פרופיל אלומיניום משופע בצורת מקור לגימור עליון של גדרות ושערים. מעניק מראה מקצועי ומוגמר.", ar: "بروفيل ألمنيوم مائل بشكل منقار للتشطيب العلوي للأسوار والبوابات." },
    materials: "Aluminum 6063-T5",
    sizes: defaultSizes,
    colorGroups: contractorColorGroups,
    images: [profileBeakImg],
    featured: true,
  },
  {
    id: "fence-slat",
    type: "contractor",
    name: "למלת גדר",
    slug: "fence-slat",
    collection: "profiles",
    subCategory: "fences-gates",
    price: 95,
    sku: "900YSL1600-35",
    length: { he: "6 מטר", ar: "6 متر" },
    description: { he: "למלת אלומיניום לגדרות פרטיות", ar: "شريحة ألمنيوم لأسوار الخصوصية" },
    longDescription: { he: "למלת אלומיניום לבניית גדרות פרטיות. עיצוב מודרני, התקנה מהירה, ומגוון צבעים.", ar: "شريحة ألمنيوم لبناء أسوار الخصوصية. تصميم عصري وتركيب سريع." },
    materials: "Aluminum 6063-T5",
    sizes: [
      { id: "3m", label: "3m" },
      { id: "4m", label: "4m" },
      { id: "5m", label: "5m" },
      { id: "6m", label: "6m" },
    ],
    colorGroups: contractorColorGroups,
    images: [profileHitechImg],
    new: true,
  },
  {
    id: "diamond-40x20",
    type: "contractor",
    name: "מעוין 40x20",
    slug: "diamond-40x20",
    collection: "profiles",
    subCategory: "gate-profiles",
    price: 135,
    sku: "900YSL1700-60",
    length: { he: "6 מטר", ar: "6 متر" },
    description: { he: "פרופיל מעוין 40x20 מ\"מ", ar: "بروفيل معيني 40x20 مم" },
    longDescription: { he: "פרופיל אלומיניום בצורת מעוין 40x20 מ\"מ לגדרות ושערים. חוזק מירבי ומראה ייחודי.", ar: "بروفيل ألمنيوم بشكل معيني 40x20 مم للأسوار والبوابات." },
    materials: "Aluminum 6063-T5",
    sizes: defaultSizes,
    colorGroups: contractorColorGroups,
    images: [profileBeakImg],
  },
  {
    id: "hitech-sealed-20",
    type: "contractor",
    name: "הייטק אטום 20",
    slug: "hitech-sealed-20",
    collection: "profiles",
    subCategory: "hitech",
    price: 110,
    sku: "900YSL1800-60",
    length: { he: "6 מטר", ar: "6 متر" },
    description: { he: "פרופיל הייטק אטום 20 מ\"מ", ar: "بروفيل هايتك مغلق 20 مم" },
    longDescription: { he: "פרופיל הייטק אטום 20 מ\"מ לגדרות מודרניות. עיצוב נקי ומינימליסטי, אטום לחלוטין.", ar: "بروفيل هايتك مغلق 20 مم لأسوار عصرية. تصميم نظيف وبسيط." },
    materials: "Aluminum 6063-T5",
    sizes: defaultSizes,
    colorGroups: contractorColorGroups,
    images: [profileHitechImg],
  },
  {
    id: "hitech-sealed-40",
    type: "contractor",
    name: "הייטק אטום 40",
    slug: "hitech-sealed-40",
    collection: "profiles",
    subCategory: "hitech",
    price: 155,
    sku: "900YSL1900-60",
    length: { he: "6 מטר", ar: "6 متر" },
    description: { he: "פרופיל הייטק אטום 40 מ\"מ", ar: "بروفيل هايتك مغلق 40 مم" },
    longDescription: { he: "פרופיל הייטק אטום 40 מ\"מ רחב יותר לגדרות ומחיצות. מראה מקצועי ופרימיום.", ar: "بروفيل هايتك مغلق 40 مم أعرض للأسوار والحواجز." },
    materials: "Aluminum 6063-T5",
    sizes: defaultSizes,
    colorGroups: contractorColorGroups,
    images: [profileHitechImg],
    featured: true,
  },
  {
    id: "equal-angle-25",
    type: "contractor",
    name: "זווית שווה 25x25",
    slug: "equal-angle-25",
    collection: "profiles",
    subCategory: "angles",
    price: 65,
    sku: "900YSL2000-60",
    length: { he: "6 מטר", ar: "6 متر" },
    description: { he: "זווית אלומיניום שווה 25x25 מ\"מ", ar: "زاوية ألمنيوم متساوية 25x25 مم" },
    longDescription: { he: "זווית אלומיניום שווה-שוקיים 25x25 מ\"מ. שימושי לחיבורים, פינות וגימורים.", ar: "زاوية ألمنيوم متساوية الأضلاع 25x25 مم. مفيدة للتوصيلات والزوايا." },
    materials: "Aluminum 6063-T5",
    sizes: defaultSizes,
    colorGroups: contractorColorGroups,
    images: [profileGateTubeImg],
  },
  {
    id: "equal-angle-40",
    type: "contractor",
    name: "זווית שווה 40x40",
    slug: "equal-angle-40",
    collection: "profiles",
    subCategory: "angles",
    price: 85,
    sku: "900YSL2100-60",
    length: { he: "6 מטר", ar: "6 متر" },
    description: { he: "זווית אלומיניום שווה 40x40 מ\"מ", ar: "زاوية ألمنيوم متساوية 40x40 مم" },
    longDescription: { he: "זווית אלומיניום שווה-שוקיים 40x40 מ\"מ. חזקה ומתאימה לפרויקטים גדולים.", ar: "زاوية ألمنيوم متساوية الأضلاع 40x40 مم. قوية ومناسبة للمشاريع الكبيرة." },
    materials: "Aluminum 6063-T5",
    sizes: defaultSizes,
    colorGroups: contractorColorGroups,
    images: [profileGateTubeImg],
  },
  {
    id: "fence-post-60",
    type: "contractor",
    name: "עמוד גדר 60x60",
    slug: "fence-post-60",
    collection: "profiles",
    subCategory: "fences-gates",
    price: 210,
    sku: "900YSL2200-30",
    length: { he: "3 מטר", ar: "3 متر" },
    description: { he: "עמוד אלומיניום 60x60 לגדרות", ar: "عمود ألمنيوم 60x60 للأسوار" },
    longDescription: { he: "עמוד אלומיניום 60x60 מ\"מ לגדרות ושערים. חוזק מרבי, מתאים לכל סוגי הגדרות.", ar: "عمود ألمنيوم 60x60 مم للأسوار والبوابات. قوة قصوى." },
    materials: "Aluminum 6063-T5",
    sizes: [
      { id: "2m", label: "2m" },
      { id: "2.5m", label: "2.5m" },
      { id: "3m", label: "3m" },
    ],
    colorGroups: contractorColorGroups,
    images: [profileGateTubeImg],
  },
  {
    id: "u-channel-20",
    type: "contractor",
    name: "פרופיל U 20x20",
    slug: "u-channel-20",
    collection: "profiles",
    subCategory: "accessories",
    price: 55,
    sku: "900YSL2300-60",
    length: { he: "6 מטר", ar: "6 متر" },
    description: { he: "פרופיל U אלומיניום 20x20 מ\"מ", ar: "بروفيل U ألمنيوم 20x20 مم" },
    longDescription: { he: "פרופיל U מאלומיניום 20x20 מ\"מ. שימושי לגימורים, מסילות ואביזרי חיבור.", ar: "بروفيل U من الألمنيوم 20x20 مم. مفيد للتشطيبات والقضبان." },
    materials: "Aluminum 6063-T5",
    sizes: defaultSizes,
    colorGroups: contractorColorGroups,
    images: [profileGateTubeImg],
  },
];

export const getProductsByCollection = (collectionSlug: string): Product[] => {
  return products.filter((p) => p.collection === collectionSlug);
};

export const getFeaturedProducts = (): Product[] => {
  return products.filter((p) => p.featured);
};

export const getNewProducts = (): Product[] => {
  return products.filter((p) => p.new);
};

export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find((p) => p.slug === slug);
};

export const getCollectionBySlug = (slug: string): Collection | undefined => {
  return collections.find((c) => c.slug === slug);
};

export const getRelatedProducts = (productId: string, limit = 4): Product[] => {
  const product = products.find((p) => p.id === productId);
  if (!product) return [];
  return products.filter((p) => p.collection === product.collection && p.id !== productId).slice(0, limit);
};

export const getLocaleName = (item: { name: LocaleString } | { name: string }, locale: Locale): string => {
  if (typeof item.name === 'string') return item.name;
  return item.name[locale];
};

export const getLocaleText = (text: LocaleString, locale: Locale): string => {
  return text[locale];
};
