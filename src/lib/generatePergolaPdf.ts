import { jsPDF } from "jspdf";
import type { PergolaSpecs } from "@/types/pergola";
import { calcSlatCount, getSlatProfileHeight } from "./pergolaRules";

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
  const renderW = 900;
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
      const data = canvas.toDataURL("image/jpeg", 0.6);
      URL.revokeObjectURL(url);
      resolve({ data, width: renderW, height: renderH, ratio });
    };
    img.onerror = reject;
    img.src = url;
  });
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
    isometric: "מבט איזומטרי",
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
    isometric: "منظور أيزومتري",
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
 * We build a hidden HTML element, render it to canvas, then put it into the PDF.
 */
export async function generatePergolaPdf(
  input: PdfInput,
  specs: PergolaSpecs,
  locale: string,
  images: PdfImages,
): Promise<string> {
  const L = locale === "ar" ? LABELS.ar : LABELS.he;
  const dir = "rtl";
  const typeMap: Record<string, string> = { fixed: L.fixed, pvc: L.pvc };
  const mountMap: Record<string, string> = { wall: L.wall, freestanding: L.freestanding };
  const moduleMap: Record<string, string> = { single: L.single, double: L.double, triple: L.triple, custom: L.custom };

  // Build HTML content for page 1
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
      carrierHtml += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #eee;">
        <span style="width:16px;height:16px;border-radius:3px;background:${cc.slatColor};display:inline-block;border:1px solid #ccc;"></span>
        <span style="font-weight:600;">${L.carrier} ${i + 1}</span>
        <span style="color:#666;">${count} ${L.slatsComp} · ${cc.slatSize} · ${L.gap} ${cc.slatGapCm} cm · ${L.light}: ${lightTxt}</span>
      </div>`;
    });
    carrierHtml += `</div>`;
  }

  // Parts for fixed pergola
  let partsHtml = "";
  if (input.pergolaType === "fixed") {
    partsHtml = `<div style="margin-top:16px;"><h3 style="font-size:14px;font-weight:bold;color:#333;margin-bottom:8px;">${L.parts}</h3>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <span style="padding:4px 12px;background:#f5f5f5;border-radius:6px;font-size:12px;">${L.frame}</span>
        <span style="padding:4px 12px;background:#f5f5f5;border-radius:6px;font-size:12px;">${L.division}</span>
        <span style="padding:4px 12px;background:#f5f5f5;border-radius:6px;font-size:12px;">${L.slatsComp}</span>
        <span style="padding:4px 12px;background:#f5f5f5;border-radius:6px;font-size:12px;">${L.post}</span>
      </div></div>`;
  }

  const notesHtml = input.notes?.trim() ? `<div style="margin-top:16px;"><h3 style="font-size:14px;font-weight:bold;color:#333;margin-bottom:4px;">${L.notesLabel}</h3><p style="font-size:11px;color:#555;line-height:1.6;">${input.notes.trim()}</p></div>` : "";

  const row = (label: string, value: string, colorHex?: string) => {
    const colorSwatch = colorHex ? `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${colorHex};border:1px solid #ccc;vertical-align:middle;margin-inline-end:4px;"></span>` : "";
    return `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f0f0f0;">
      <span style="color:#888;font-size:11px;">${label}</span>
      <span style="font-size:12px;font-weight:600;color:#222;">${colorSwatch}${value}</span>
    </div>`;
  };

  const section = (title: string, content: string) => `
    <div style="margin-top:16px;">
      <div style="background:#f8f8f8;padding:4px 8px;border-radius:4px;margin-bottom:6px;">
        <span style="font-size:13px;font-weight:bold;color:#333;">${title}</span>
      </div>
      ${content}
    </div>`;

  const page1Html = `
    <div style="direction:${dir};font-family:'Heebo','Cairo','Assistant',sans-serif;width:700px;padding:24px;background:white;">
      <!-- Header -->
      <div style="background:#0f0f0f;color:white;padding:20px;border-radius:8px;text-align:center;margin-bottom:16px;">
        <div style="font-size:28px;font-weight:bold;letter-spacing:2px;">A.M.G  PERGOLA</div>
        <div style="font-size:11px;color:#aaa;margin-top:4px;">${L.subtitle}</div>
        <div style="font-size:9px;color:#666;margin-top:2px;">L T D</div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:#999;margin-bottom:12px;">
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
        row(L.frameColor, input.frameColor, input.frameColor) +
        row(L.roofColor, input.roofColor, input.roofColor) +
        (input.slatColor && input.roofFillMode === "slats" ? row(L.slatColor, input.slatColor, input.slatColor) : "") +
        (input.santaf === "with" && input.santafColor ? row(L.santafColor, input.santafColor, input.santafColor) : "")
      )}

      ${carrierHtml}
      ${partsHtml}
      ${notesHtml}

      <!-- Footer -->
      <div style="margin-top:24px;border-top:1px solid #eee;padding-top:8px;text-align:center;font-size:8px;color:#aaa;line-height:1.8;">
        <div>A.M.G PERGOLA LTD  |  052-812-2846  |  mail@amgpergola.co.il</div>
        <div>${L.disclaimer1}</div>
        <div>${L.disclaimer2}</div>
      </div>
    </div>`;

  // Render HTML to canvas
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  container.innerHTML = page1Html;
  document.body.appendChild(container);

  // Dynamic import html2canvas
  const { default: html2canvas } = await import("html2canvas" as any).catch(() => ({ default: null }));

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const m = 10;
  const cw = W - m * 2;

  if (html2canvas) {
    try {
      const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const imgW = cw;
      const imgH = (canvas.height * imgW) / canvas.width;

      let heightLeft = imgH;
      let position = 0;

      doc.addImage(imgData, "JPEG", m, m + position, imgW, imgH);
      heightLeft -= (H - m * 2);

      while (heightLeft > 0) {
        position -= (H - m * 2);
        doc.addPage();
        doc.addImage(imgData, "JPEG", m, m + position, imgW, imgH);
        heightLeft -= (H - m * 2);
      }
    } catch (e) {
      console.warn("html2canvas failed, using fallback", e);
      // Fallback: simple text
      doc.setFontSize(14);
      doc.text("A.M.G PERGOLA - Configuration Request", W / 2, 20, { align: "center" });
    }
  } else {
    // Fallback without html2canvas
    doc.setFontSize(14);
    doc.text("A.M.G PERGOLA - Configuration Request", W / 2, 20, { align: "center" });
  }

  document.body.removeChild(container);

  // ── Page 2+: Drawings ──
  const viewEntries: [string, PdfImageEntry | undefined][] = [
    [L.isometric, images.isometric],
    [L.topView, images.top],
    [L.frontView, images.front],
  ];
  const availableViews = viewEntries.filter(([, img]) => img) as [string, PdfImageEntry][];

  if (availableViews.length > 0) {
    doc.addPage();
    let y = m;

    // Header for drawings page
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, W, 22, "F");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(L.drawingsTitle, W / 2, 14, { align: "center" });
    y = 30;

    for (const [label, entry] of availableViews) {
      const maxImgW = cw - 8;
      const maxImgH = 130;
      let imgW = maxImgW;
      let imgH = imgW / entry.ratio;
      if (imgH > maxImgH) { imgH = maxImgH; imgW = imgH * entry.ratio; }
      const frameW = imgW + 8;
      const frameH = imgH + 8;
      const frameX = m + (cw - frameW) / 2;

      if (y + frameH + 14 > H - 30) {
        doc.addPage();
        y = m;
      }

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "bold");
      doc.text(label, W / 2, y, { align: "center" });
      y += 5;

      doc.setDrawColor(230, 230, 230);
      doc.setFillColor(252, 252, 252);
      doc.roundedRect(frameX, y, frameW, frameH, 2, 2, "FD");
      doc.addImage(entry.data, "JPEG", frameX + 4, y + 4, imgW, imgH);
      y += frameH + 10;
    }
  }

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(230, 230, 230);
    doc.line(m, H - 15, W - m, H - 15);
    doc.setFontSize(6);
    doc.setTextColor(160, 160, 160);
    doc.setFont("helvetica", "normal");
    doc.text("A.M.G PERGOLA LTD  |  052-812-2846  |  mail@amgpergola.co.il", W / 2, H - 10, { align: "center" });
    doc.text(`${L.page} ${p} ${L.of} ${totalPages}`, W / 2, H - 5, { align: "center" });
  }

  return doc.output("datauristring");
}
