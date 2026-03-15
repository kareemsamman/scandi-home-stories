import type { Locale } from "@/i18n/translations";

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

export interface Product {
  id: string;
  name: string;
  slug: string;
  collection: string;
  price: number;
  description: LocaleString;
  longDescription: LocaleString;
  materials: string;
  dimensions?: string;
  images: string[];
  featured?: boolean;
  new?: boolean;
}

export const collections: Collection[] = [
  {
    id: "bioclimatic",
    name: { he: "פרגולות ביוקלימטיות", ar: "برجولات بيوكليماتيكية" },
    slug: "bioclimatic",
    description: { he: "למלות מתכווננות לשליטה מלאה באור ואוורור", ar: "شرائح قابلة للتعديل للتحكم الكامل في الضوء والتهوية" },
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",
  },
  {
    id: "motorized",
    name: { he: "מערכות למלות מוטוריות", ar: "أنظمة شرائح آلية" },
    slug: "motorized",
    description: { he: "שליטה חשמלית מלאה עם שלט רחוק וחיישנים", ar: "تحكم كهربائي كامل مع ريموت وأجهزة استشعار" },
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    heroImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80",
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
];

export const products: Product[] = [
  {
    id: "elite-4000",
    name: "AMG Elite 4000",
    slug: "amg-elite-4000",
    collection: "bioclimatic",
    price: 45000,
    description: { he: "פרגולה ביוקלימטית פרימיום עם למלות אלומיניום מתכווננות", ar: "برجولة بيوكليماتيكية فاخرة مع شرائح ألمنيوم قابلة للتعديل" },
    longDescription: { he: "ה-Elite 4000 היא הדגם המוביל שלנו. למלות אלומיניום מתכווננות ב-180 מעלות מאפשרות שליטה מלאה באור, אוורור והגנה מגשם. מערכת ניקוז מובנית, מנוע שקט במיוחד, ואפשרות לשליטה מרחוק ואפליקציה.", ar: "Elite 4000 هو طرازنا الرائد. شرائح ألمنيوم قابلة للتعديل بزاوية 180 درجة للتحكم الكامل في الضوء والتهوية والحماية من المطر." },
    materials: "Powder-coated aluminum 6063-T5",
    dimensions: "600×400 cm (customizable)",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    ],
    featured: true,
  },
  {
    id: "pro-3000",
    name: "AMG Pro 3000",
    slug: "amg-pro-3000",
    collection: "bioclimatic",
    price: 35000,
    description: { he: "פרגולה ביוקלימטית קומפקטית למרפסות וגינות", ar: "برجولة بيوكليماتيكية مدمجة للشرفات والحدائق" },
    longDescription: { he: "ה-Pro 3000 מציעה את כל היתרונות של מערכת ביוקלימטית בפורמט קומפקטי. מושלמת למרפסות, פטיו וגינות קטנות עד בינוניות.", ar: "Pro 3000 تقدم جميع مزايا النظام البيوكليماتيكي بتصميم مدمج. مثالية للشرفات والحدائق." },
    materials: "Powder-coated aluminum 6063-T5",
    dimensions: "400×300 cm (customizable)",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    ],
    new: true,
  },
  {
    id: "louvermax-500",
    name: "AMG LouverMax 500",
    slug: "amg-louvermax-500",
    collection: "motorized",
    price: 52000,
    description: { he: "מערכת למלות מוטורית מתקדמת עם חיישני מזג אוויר", ar: "نظام شرائح آلي متقدم مع أجهزة استشعار الطقس" },
    longDescription: { he: "ה-LouverMax 500 היא מערכת הלמלות המוטוריות המתקדמת ביותר שלנו. חיישני גשם, רוח ושמש מפעילים את המערכת אוטומטית לפי תנאי מזג האוויר.", ar: "LouverMax 500 هو نظام الشرائح الآلية الأكثر تقدماً لدينا. أجهزة استشعار للمطر والرياح والشمس." },
    materials: "Marine-grade aluminum, stainless steel hardware",
    dimensions: "700×500 cm (customizable)",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    ],
    featured: true,
  },
  {
    id: "smartblade-200",
    name: "AMG SmartBlade 200",
    slug: "amg-smartblade-200",
    collection: "motorized",
    price: 42000,
    description: { he: "למלות חכמות עם שליטה באפליקציה", ar: "شرائح ذكية مع تحكم بالتطبيق" },
    longDescription: { he: "ה-SmartBlade 200 משלבת מנועים שקטים עם שליטה חכמה דרך אפליקציה. ניתן לתכנת תרחישי הפעלה אוטומטיים.", ar: "SmartBlade 200 تجمع بين محركات هادئة وتحكم ذكي عبر التطبيق." },
    materials: "Powder-coated aluminum, Somfy motors",
    dimensions: "500×400 cm (customizable)",
    images: [
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    ],
    new: true,
  },
  {
    id: "classicshade-100",
    name: "AMG ClassicShade",
    slug: "amg-classicshade",
    collection: "fixed",
    price: 22000,
    description: { he: "פרגולה קבועה קלאסית עם גג אלומיניום", ar: "برجولة ثابتة كلاسيكية بسقف ألمنيوم" },
    longDescription: { he: "ה-ClassicShade מציעה הצללה קבועה ואמינה. מבנה חזק במיוחד עם גג אלומיניום מלא ומערכת ניקוז משולבת.", ar: "ClassicShade تقدم تظليل ثابت وموثوق. هيكل قوي مع سقف ألمنيوم كامل." },
    materials: "Powder-coated aluminum frame and roof panels",
    dimensions: "500×350 cm (customizable)",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80",
    ],
  },
  {
    id: "solidtop-500",
    name: "AMG SolidTop 500",
    slug: "amg-solidtop-500",
    collection: "fixed",
    price: 28000,
    description: { he: "גג קבוע מבודד עם פנלים מרופדים", ar: "سقف ثابت معزول مع ألواح مبطنة" },
    longDescription: { he: "ה-SolidTop 500 מציעה בידוד תרמי מעולה עם פנלים סנדוויץ\' מרופדים. אידיאלית לשימוש כל-שנתי.", ar: "SolidTop 500 تقدم عزل حراري ممتاز مع ألواح ساندوتش مبطنة." },
    materials: "Insulated sandwich panels, aluminum frame",
    dimensions: "600×400 cm (customizable)",
    images: [
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    ],
    featured: true,
  },
  {
    id: "flexroof-600",
    name: "AMG FlexRoof 600",
    slug: "amg-flexroof-600",
    collection: "retractable",
    price: 38000,
    description: { he: "גג נפתח חשמלי עם בד PVC עמיד", ar: "سقف قابل للطي كهربائي مع قماش PVC متين" },
    longDescription: { he: "ה-FlexRoof 600 מציעה גמישות מלאה — פתוח לשמש, סגור לגשם. בד PVC עמיד בציפוי UV עם מנוע שקט.", ar: "FlexRoof 600 تقدم مرونة كاملة — مفتوح للشمس، مغلق للمطر." },
    materials: "PVC fabric, powder-coated aluminum frame",
    dimensions: "500×400 cm (customizable)",
    images: [
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    ],
    new: true,
  },
  {
    id: "stormguard-800",
    name: "AMG StormGuard 800",
    slug: "amg-stormguard-800",
    collection: "retractable",
    price: 48000,
    description: { he: "גג נפתח כפול עמיד לסערות", ar: "سقف قابل للطي مزدوج مقاوم للعواصف" },
    longDescription: { he: "ה-StormGuard 800 מתוכנן לתנאי מזג אוויר קשים. מערכת גג כפולה עם חיזוקים מיוחדים ועמידות לרוחות חזקות.", ar: "StormGuard 800 مصمم لظروف الطقس القاسية. نظام سقف مزدوج مع تعزيزات خاصة." },
    materials: "Heavy-duty aluminum, reinforced PVC",
    dimensions: "700×500 cm (customizable)",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
    ],
    featured: true,
  },
  {
    id: "led-kit",
    name: "AMG LED Lighting Kit",
    slug: "amg-led-lighting-kit",
    collection: "accessories",
    price: 3500,
    description: { he: "ערכת תאורת LED משולבת לפרגולות", ar: "مجموعة إضاءة LED مدمجة للبرجولات" },
    longDescription: { he: "ערכת תאורת LED מותקנת בתוך פרופיל הלמלות. תאורת RGB עם שלט רחוק ואפשרות לדימר.", ar: "مجموعة إضاءة LED مثبتة داخل شرائح البرجولة. إضاءة RGB مع ريموت." },
    materials: "IP65 LED strips, aluminum housing",
    images: [
      "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
    ],
  },
  {
    id: "drainage-system",
    name: "AMG Rain Drainage System",
    slug: "amg-rain-drainage-system",
    collection: "accessories",
    price: 4200,
    description: { he: "מערכת ניקוז גשם משולבת", ar: "نظام تصريف مياه الأمطار المتكامل" },
    longDescription: { he: "מערכת ניקוז גשם מובנית בתוך עמודי הפרגולה. ניקוז שקט ויעיל ללא צנרת חיצונית.", ar: "نظام تصريف مياه مدمج في أعمدة البرجولة. تصريف هادئ وفعال." },
    materials: "Aluminum gutters, PVC piping",
    images: [
      "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    ],
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