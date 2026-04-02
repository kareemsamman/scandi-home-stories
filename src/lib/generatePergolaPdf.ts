import { jsPDF } from "jspdf";
import type { PergolaSpecs } from "@/types/pergola";
import { STANDARD_COLORS, SLAT_COLORS, SANTAF_COLORS } from "@/types/pergola";
import { calcSlatCount, getSlatProfileHeight } from "./pergolaRules";

function getColorLabel(hex: string | undefined, locale: string): string {
  if (!hex) return hex || "";
  const allColors = [...STANDARD_COLORS, ...SLAT_COLORS, ...SANTAF_COLORS];
  const match = allColors.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
  if (match) return locale === "ar" ? match.name_ar : match.name_he;
  return hex;
}

export interface PdfInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  widthCm: number;
  lengthCm: number;
  heightCm?: number | 0;
  pergolaType: string;
  mountType: string;
  installation: boolean;
  lighting: string;
  lightingPosition: string;
  lightingFixture: string;
  lightingRoof: boolean;
  roofFillMode?: string;
  slatGapCm?: number;
  slatColor?: string;
  santaf: string;
  santafColor: string;
  frameColor: string;
  roofColor: string;
  spacingMode: string;
  notes: string;
  carrierConfigs?: { slatSize: string; slatGapCm: number; slatColor: string; lightingEnabled: boolean; lighting: string }[];
}

export interface PdfImageEntry {
  data: string;
  ratio: number;
}

export interface PdfImages {
  isometric?: PdfImageEntry;
  top?: PdfImageEntry;
  front?: PdfImageEntry;
}

export interface CapturedImage {
  data: string;
  width: number;
  height: number;
  ratio: number;
}

interface RenderedHtmlImage {
  data: string;
  width: number;
  height: number;
}

export async function svgToImage(svgEl: SVGSVGElement): Promise<string> {
  const captured = await svgToImageWithSize(svgEl);
  return captured.data;
}

export async function svgToImageWithSize(svgEl: SVGSVGElement): Promise<CapturedImage> {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  const vb = svgEl.getAttribute("viewBox");
  let vbW = 1000, vbH = 1000;
  if (vb) {
    const parts = vb.split(/[\s,]+/).map(Number);
    if (parts.length >= 4) { vbW = parts[2]; vbH = parts[3]; }
  }
  const ratio = vbW / vbH;
  const renderW = 1200;
  const renderH = Math.round(renderW / ratio);
  clone.setAttribute("width", String(renderW));
  clone.setAttribute("height", String(renderH));

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = renderW;
      canvas.height = renderH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#FAFAFA";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, renderW, renderH);
      const data = canvas.toDataURL("image/jpeg", 0.75);
      URL.revokeObjectURL(url);
      resolve({ data, width: renderW, height: renderH, ratio });
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function renderHtmlImage(
  html: string,
  html2canvasImpl: ((element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>) | null,
  backgroundColor = "#ffffff",
): Promise<RenderedHtmlImage | null> {
  if (!html2canvasImpl) return null;

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  container.style.zIndex = "-9999";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    try {
      await document.fonts.ready;
    } catch {
      /* continue */
    }

    const canvas = await html2canvasImpl(container.firstElementChild as HTMLElement, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor,
      allowTaint: true,
    });

    return {
      data: canvas.toDataURL("image/jpeg", 0.92),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    document.body.removeChild(container);
  }
}

function addPaginatedImage(
  doc: jsPDF,
  image: RenderedHtmlImage,
  options: { x: number; y: number; width: number; pageHeight: number; forceNewPage?: boolean },
) {
  const { x, y, width, pageHeight, forceNewPage } = options;
  const imageHeight = (image.height * width) / image.width;
  let remainingHeight = imageHeight;
  let offsetY = 0;
  let firstSlice = true;

  while (remainingHeight > 0) {
    if ((forceNewPage && firstSlice) || !firstSlice) {
      doc.addPage();
    }

    doc.addImage(image.data, "JPEG", x, y + offsetY, width, imageHeight);
    remainingHeight -= pageHeight;
    offsetY -= pageHeight;
    firstSlice = false;
  }
}

// ── Locale labels ──
const LABELS = {
  he: {
    title: "א.מ.ג פרגולות בע״מ",
    subtitle: "בקשת הצעת מחיר",
    ltd: "פרגולות מעוצבות",
    date: "תאריך",
    customerDetails: "פרטי לקוח",
    name: "שם",
    phone: "טלפון",
    email: "אימייל",
    pergolaConfig: "פרטי הפרגולה",
    type: "סוג פרגולה",
    mount: "סוג התקנה",
    installationLabel: "התקנה",
    module: "מודול",
    dimensions: "מידות",
    width: "רוחב",
    length: "אורך",
    height: "גובה",
    structure: "מבנה",
    frontPosts: "עמודים קדמיים",
    backPosts: "עמודים אחוריים",
    carriers: "קורות חלוקה",
    spacing: "מרווח",
    roof: "גג / מילוי",
    fillMode: "מצב מילוי גג",
    slats: "שלבים / פרופילים",
    santafOnly: "גג סנטף",
    slatCount: "כמות שלבים",
    slatGap: "מרווח בין שלבים",
    santaf: "סנטף",
    included: "כלול",
    lightingLabel: "תאורה",
    none: "ללא",
    colors: "צבעים",
    frameColor: "צבע מסגרת",
    roofColor: "צבע גג / בד",
    slatColor: "צבע שלבים",
    santafColor: "צבע סנטף",
    slatsPerCarrier: "שלבים לכל חלוקה",
    carrier: "חלוקה",
    slatProfile: "פרופיל שלב",
    gap: "מרווח",
    light: "תאורה",
    notesLabel: "הערות",
    drawingsTitle: "שרטוטים טכניים",
    isometric: "תלת מימד",
    topView: "מבט עליון",
    frontView: "מבט קדמי",
    yes: "כן",
    no: "לא",
    disclaimer1: "מסמך זה הינו בקשת הצעת מחיר ואינו הצעת מחיר סופית.",
    disclaimer2: "כל השרטוטים והמפרטים הם ראשוניים ובכפוף לבדיקת אתר.",
    page: "עמוד",
    of: "מתוך",
    fixed: "פרגולה קבועה",
    pvc: "פרגולת PVC",
    wall: "צמוד קיר",
    freestanding: "עצמאית",
    single: "יחיד",
    double: "כפול",
    triple: "משולש",
    custom: "מותאם",
    parts: "רכיבים",
    frame: "מסגרת",
    division: "חלוקה",
    slatsComp: "שלבים",
    post: "עמוד",
  },
  ar: {
    title: "أ.م.ج بيرجولا م.ض",
    subtitle: "طلب عرض سعر",
    ltd: "بيرجولات مصممة",
    date: "التاريخ",
    customerDetails: "بيانات العميل",
    name: "الاسم",
    phone: "الهاتف",
    email: "البريد",
    pergolaConfig: "تفاصيل البيرجولا",
    type: "نوع البيرجولا",
    mount: "نوع التركيب",
    installationLabel: "تركيب",
    module: "وحدة",
    dimensions: "الأبعاد",
    width: "العرض",
    length: "الطول",
    height: "الارتفاع",
    structure: "الهيكل",
    frontPosts: "أعمدة أمامية",
    backPosts: "أعمدة خلفية",
    carriers: "قوارص التقسيم",
    spacing: "المسافة",
    roof: "السقف / التعبئة",
    fillMode: "وضع ملء السقف",
    slats: "شرائح / بروفيلات",
    santafOnly: "سقف سنطف",
    slatCount: "عدد الشرائح",
    slatGap: "مسافة بين الشرائح",
    santaf: "سنطف",
    included: "مشمول",
    lightingLabel: "إضاءة",
    none: "بدون",
    colors: "الألوان",
    frameColor: "لون الإطار",
    roofColor: "لون السقف / القماش",
    slatColor: "لون الشرائح",
    santafColor: "لون السنطف",
    slatsPerCarrier: "شرائح لكل تقسيم",
    carrier: "تقسيم",
    slatProfile: "بروفيل شريحة",
    gap: "مسافة",
    light: "إضاءة",
    notesLabel: "ملاحظات",
    drawingsTitle: "رسومات تقنية",
    isometric: "تلت أبعاد",
    topView: "منظر علوي",
    frontView: "منظر أمامي",
    yes: "نعم",
    no: "لا",
    disclaimer1: "هذا المستند طلب عرض سعر وليس عرض سعر نهائي.",
    disclaimer2: "جميع الرسومات والمواصفات أولية وتخضع لفحص الموقع.",
    page: "صفحة",
    of: "من",
    fixed: "بيرجولا ثابتة",
    pvc: "بيرجولا PVC",
    wall: "ملاصق للجدار",
    freestanding: "مستقلة",
    single: "مفرد",
    double: "مزدوج",
    triple: "ثلاثي",
    custom: "مخصص",
    parts: "المكونات",
    frame: "إطار",
    division: "تقسيم",
    slatsComp: "شرائح",
    post: "عمود",
  },
};

/**
 * Generate the PDF using html2canvas to properly render Hebrew/Arabic text.
 */
export async function generatePergolaPdf(
  input: PdfInput,
  specs: PergolaSpecs,
  locale: string,
  images: PdfImages,
): Promise<string> {
  const L = locale === "ar" ? LABELS.ar : LABELS.he;
  const dir = "rtl";
  const fontFamily = locale === "ar" ? "'Cairo','Tajawal','Arial',sans-serif" : "'Heebo','Assistant','Arial',sans-serif";
  const typeMap: Record<string, string> = { fixed: L.fixed, pvc: L.pvc };
  const mountMap: Record<string, string> = { wall: L.wall, freestanding: L.freestanding };
  const moduleMap: Record<string, string> = { single: L.single, double: L.double, triple: L.triple, custom: L.custom };

  const dateStr = new Date().toLocaleDateString(locale === "ar" ? "ar-SA" : "he-IL");
  const refNum = `REF-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  // Slat calculation using lengthMm
  const lengthMm = input.lengthCm * 10;

  let carrierHtml = "";
  if (input.roofFillMode === "slats" && input.carrierConfigs && input.carrierConfigs.length > 0) {
    carrierHtml = `<div style="margin-top:16px;"><h3 style="font-size:14px;font-weight:bold;color:#333;margin-bottom:8px;">${L.slatsPerCarrier}</h3>`;
    input.carrierConfigs.forEach((cc, i) => {
      const slatH = getSlatProfileHeight(cc.slatSize);
      const gapMm = cc.slatGapCm * 10;
      const usable = lengthMm - 90;
      const count = Math.max(1, Math.floor(usable / (slatH + gapMm)));
      const lightTxt = cc.lightingEnabled ? cc.lighting.toUpperCase() : L.none;
      const displayNum = i + 1;
      carrierHtml += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee;">
        <span style="width:16px;height:16px;border-radius:3px;background:${cc.slatColor};display:inline-block;border:1px solid #ccc;flex-shrink:0;"></span>
        <span style="font-weight:600;font-size:13px;">${L.carrier} ${displayNum}</span>
        <span style="color:#555;font-size:12px;">${count} ${L.slatsComp} · ${cc.slatSize} · ${L.gap} ${cc.slatGapCm} cm · ${L.light}: ${lightTxt}</span>
      </div>`;
    });
    carrierHtml += `</div>`;
  }

  // Parts for fixed pergola
  let partsHtml = "";
  if (input.pergolaType === "fixed") {
    partsHtml = `<div style="direction:${dir};font-family:${fontFamily};width:700px;padding:28px;background:white;color:#222;line-height:1.6;">
      <div style="background:#0f0f0f;color:white;padding:18px 22px;border-radius:8px;text-align:center;margin-bottom:20px;">
        <div style="font-size:22px;font-weight:700;">${L.parts}</div>
        <div style="font-size:12px;color:#d1d5db;margin-top:6px;">${typeMap[input.pergolaType] || input.pergolaType}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">
        <div style="padding:18px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;text-align:center;font-size:18px;font-weight:700;">${L.frame}</div>
        <div style="padding:18px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;text-align:center;font-size:18px;font-weight:700;">${L.division}</div>
        <div style="padding:18px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;text-align:center;font-size:18px;font-weight:700;">${L.slatsComp}</div>
        <div style="padding:18px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;text-align:center;font-size:18px;font-weight:700;">${L.post}</div>
      </div>
    </div>`;
  }

  const notesHtml = input.notes?.trim() ? `<div style="margin-top:16px;"><h3 style="font-size:14px;font-weight:bold;color:#333;margin-bottom:4px;">${L.notesLabel}</h3><p style="font-size:12px;color:#555;line-height:1.6;">${input.notes.trim()}</p></div>` : "";
  const disclaimerHtml = `<div style="margin-top:18px;padding-top:10px;border-top:1px solid #eee;font-size:10px;color:#888;line-height:1.8;">
    <div>${L.disclaimer1}</div>
    <div>${L.disclaimer2}</div>
  </div>`;

  const row = (label: string, value: string, colorHex?: string) => {
    const colorSwatch = colorHex ? `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${colorHex};border:1px solid #ccc;vertical-align:middle;margin-inline-end:4px;"></span>` : "";
    return `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f0f0f0;">
      <span style="color:#666;font-size:13px;">${label}</span>
      <span style="font-size:13px;font-weight:600;color:#222;">${colorSwatch}${value}</span>
    </div>`;
  };

  const section = (title: string, content: string) => `
    <div style="margin-top:16px;">
      <div style="background:#f8f8f8;padding:6px 10px;border-radius:4px;margin-bottom:6px;">
        <span style="font-size:14px;font-weight:bold;color:#333;">${title}</span>
      </div>
      ${content}
    </div>`;

  const page1Html = `
    <div style="direction:${dir};font-family:${fontFamily};width:700px;padding:28px;background:white;color:#222;line-height:1.5;">
      <!-- Header -->
      <div style="background:#0f0f0f;color:white;padding:22px;border-radius:8px;text-align:center;margin-bottom:16px;">
        <div style="font-size:28px;font-weight:bold;letter-spacing:2px;font-family:Arial,sans-serif;">A.M.G  PERGOLA</div>
        <div style="font-size:12px;color:#bbb;margin-top:4px;">${L.subtitle}</div>
        <div style="font-size:9px;color:#666;margin-top:2px;">L T D</div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#999;margin-bottom:12px;">
        <span>${L.date}: ${dateStr}</span><span>${refNum}</span>
      </div>

      ${input.customerName ? section(L.customerDetails,
        row(L.name, input.customerName) +
        row(L.phone, input.customerPhone) +
        (input.customerEmail ? row(L.email, input.customerEmail) : "")
      ) : ""}

      ${section(L.pergolaConfig,
        row(L.type, typeMap[input.pergolaType] || input.pergolaType) +
        row(L.mount, mountMap[input.mountType] || input.mountType) +
        row(L.installationLabel, input.installation ? L.yes : L.no) +
        row(L.module, moduleMap[specs.moduleClassification] || specs.moduleClassification)
      )}

      ${section(L.dimensions,
        row(L.width, `${input.widthCm} cm`) +
        row(L.length, `${input.lengthCm} cm`) +
        (input.heightCm ? row(L.height, `${input.heightCm} cm`) : "")
      )}

      ${section(L.structure,
        row(L.frontPosts, String(specs.frontPostCount)) +
        (specs.backPostCount > 0 ? row(L.backPosts, String(specs.backPostCount)) : "") +
        row(L.carriers, String(specs.carrierCount)) +
        row(L.spacing, `~${(specs.spacingMm / 10).toFixed(1)} cm`)
      )}

      ${section(L.roof,
        (input.roofFillMode === "slats"
          ? row(L.fillMode, L.slats) + row(L.slatCount, String(specs.slatCount)) + row(L.slatGap, `${input.slatGapCm || 3} cm`)
          : row(L.fillMode, L.santafOnly)) +
        (input.santaf === "with" ? row(L.santaf, L.included) : "") +
        row(L.lightingLabel, input.lighting === "none" ? L.none : input.lighting.toUpperCase())
      )}

      ${section(L.colors,
        row(L.frameColor, getColorLabel(input.frameColor, locale), input.frameColor) +
        row(L.roofColor, getColorLabel(input.roofColor, locale), input.roofColor) +
        (input.slatColor && input.roofFillMode === "slats" ? row(L.slatColor, getColorLabel(input.slatColor, locale), input.slatColor) : "") +
        (input.santaf === "with" && input.santafColor ? row(L.santafColor, getColorLabel(input.santafColor, locale), input.santafColor) : "")
      )}

      ${carrierHtml}
      ${notesHtml}
      ${disclaimerHtml}
    </div>`;

  // Dynamic import html2canvas
  const { default: html2canvas } = await import("html2canvas" as any).catch(() => ({ default: null }));

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const m = 10;
  const cw = W - m * 2;
  const footerReserved = 20;
  const contentHeight = H - m - footerReserved;

  if (html2canvas) {
    try {
      const mainPageImage = await renderHtmlImage(page1Html, html2canvas, "#ffffff");
      if (mainPageImage) {
        addPaginatedImage(doc, mainPageImage, { x: m, y: m, width: cw, pageHeight: contentHeight });
      }

      if (partsHtml) {
        const partsPageImage = await renderHtmlImage(partsHtml, html2canvas, "#ffffff");
        if (partsPageImage) {
          addPaginatedImage(doc, partsPageImage, { x: m, y: m, width: cw, pageHeight: contentHeight, forceNewPage: true });
        }
      }
    } catch (e) {
      console.warn("html2canvas failed, using fallback", e);
      doc.setFontSize(14);
      doc.text("A.M.G PERGOLA - Configuration Request", W / 2, 20, { align: "center" });
    }
  } else {
    doc.setFontSize(14);
    doc.text("A.M.G PERGOLA - Configuration Request", W / 2, 20, { align: "center" });
  }

  // ── Drawings pages: render header as html2canvas too for proper Hebrew ──
  const viewEntries: [string, PdfImageEntry | undefined][] = [
    [L.isometric, images.isometric],
    [L.topView, images.top],
    [L.frontView, images.front],
  ];
  const availableViews = viewEntries.filter(([, img]) => img) as [string, PdfImageEntry][];

  for (const [label, entry] of availableViews) {
    doc.addPage();

    // Render header bar as html2canvas for proper Hebrew/Arabic text
    const headerImage = await renderHtmlImage(
      `<div style="direction:${dir};font-family:${fontFamily};width:700px;background:#0f0f0f;color:white;padding:14px 20px;text-align:center;font-size:18px;font-weight:bold;">${label}</div>`,
      html2canvas,
      "#0f0f0f",
    );
    if (headerImage) {
      const headerH = (headerImage.height * cw) / headerImage.width;
      doc.addImage(headerImage.data, "JPEG", m, 0, cw, headerH);
    } else {
      doc.setFillColor(15, 15, 15);
      doc.rect(0, 0, W, 22, "F");
    }

    let y = 28;

    // Image — fill most of the page
    const maxImgW = cw - 4;
    const maxImgH = H - y - footerReserved;
    let imgW = maxImgW;
    let imgH = imgW / entry.ratio;
    if (imgH > maxImgH) { imgH = maxImgH; imgW = imgH * entry.ratio; }
    const imgX = m + (cw - imgW) / 2;

    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(imgX - 2, y - 2, imgW + 4, imgH + 4, 2, 2, "FD");
    doc.addImage(entry.data, "JPEG", imgX, y, imgW, imgH);
  }

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const footerImage = await renderHtmlImage(
      `<div style="direction:${dir};font-family:${fontFamily};width:700px;padding:0 12px 8px;background:white;color:#9ca3af;font-size:10px;line-height:1.7;text-align:center;">
        <div style="border-top:1px solid #e5e7eb;padding-top:8px;">
          <div style="font-family:Arial,sans-serif;">A.M.G PERGOLA LTD  |  052-812-2846  |  mail@amgpergola.co.il</div>
          <div>${L.page} ${p} ${L.of} ${totalPages}</div>
        </div>
      </div>`,
      html2canvas,
      "#ffffff",
    );

    if (footerImage) {
      const footerH = (footerImage.height * cw) / footerImage.width;
      doc.addImage(footerImage.data, "JPEG", m, H - footerH - 2, cw, footerH);
    } else {
      doc.setDrawColor(230, 230, 230);
      doc.line(m, H - 15, W - m, H - 15);
      doc.setFontSize(6);
      doc.setTextColor(160, 160, 160);
      doc.setFont("helvetica", "normal");
      doc.text("A.M.G PERGOLA LTD  |  052-812-2846  |  mail@amgpergola.co.il", W / 2, H - 10, { align: "center" });
    }
  }

  return doc.output("datauristring");
}