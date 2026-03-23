import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Plus,
  Trash2,
  X,
  Loader2,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Globe,
  Layout,
  Link2,
} from "lucide-react";

const db = supabase as any;

// ─── ImageUpload ──────────────────────────────────────────────────────────────

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
}

const ImageUpload = ({ value, onChange, label }: ImageUploadProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `site/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("site-media")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {value ? (
        <div className="relative">
          <img src={value} alt="" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-2 w-full text-xs py-1.5 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Change Image"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:bg-gray-50 transition-colors text-gray-500 disabled:opacity-50"
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-xs">{uploading ? "Uploading..." : "Upload Image"}</span>
          </button>
          <Input
            placeholder="Or paste URL..."
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            onBlur={() => {
              if (pasteUrl.trim()) {
                onChange(pasteUrl.trim());
                setPasteUrl("");
              }
            }}
            className="text-xs h-8"
          />
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};

// ─── Repeater ─────────────────────────────────────────────────────────────────

interface RepeaterProps {
  label: string;
  note?: string;
  value: any[];
  onChange: (v: any[]) => void;
  renderItem: (item: any, idx: number, update: (key: string, val: any) => void) => React.ReactNode;
  defaultItem: () => any;
}

const Repeater = ({ label, note, value, onChange, renderItem, defaultItem }: RepeaterProps) => {
  const items = Array.isArray(value) ? value : [];

  const update = (idx: number, key: string, val: any) => {
    const next = items.map((item, i) => (i === idx ? { ...item, [key]: val } : item));
    onChange(next);
  };

  const remove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const add = () => {
    onChange([...items, defaultItem()]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-medium text-gray-600">{label}</label>
          {note && <p className="text-xs text-gray-400">{note}</p>}
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">#{idx + 1}</span>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {renderItem(item, idx, (key, val) => update(idx, key, val))}
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-3">No items yet. Click Add to create one.</p>
      )}
    </div>
  );
};

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const SectionCard = ({ icon: Icon, title, children, defaultOpen = false }: SectionCardProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-4" dir="ltr">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── SEED DATA ─────────────────────────────────────────────────────────────────

const SEED: Record<string, Record<string, any>> = {
  he: {
    header: {
      logo: "",
      nav_links: [
        { label: "חנות", href: "/shop" },
        { label: "קטלוג", href: "/catalog" },
        { label: "אודות", href: "/about" },
        { label: "צור קשר", href: "/contact" },
      ],
      announcement_messages: [
        "משלוח חינם בכל הארץ",
        "פרגולות מהמותג הישראלי המוביל",
      ],
      social_links: [
        { platform: "tiktok", url: "https://www.tiktok.com/@amg.pergola" },
      ],
    },
    footer: {
      copyright: "© {year}, AMG Pergola",
      social_links: [
        { platform: "tiktok", url: "https://www.tiktok.com/@amg.pergola" },
      ],
      columns: [
        { title: "קולקציות מובחרות", links: [
          { label: "פרגולות ביוקלימטיות", href: "/shop?collection=bioclimatic" },
          { label: "מערכות למלות", href: "/shop?collection=motorized" },
          { label: "פרגולות קבועות", href: "/shop?collection=fixed" },
          { label: "גגות נפתחים", href: "/shop?collection=retractable" },
          { label: "אביזרים", href: "/shop?collection=accessories" },
        ]},
        { title: "תמיכה", links: [
          { label: "שאלות נפוצות", href: "/contact" },
          { label: "אחריות", href: "/contact" },
          { label: "משלוחים והחזרות", href: "/contact" },
        ]},
        { title: "מדיניות", links: [
          { label: "מדיניות פרטיות", href: "#" },
          { label: "תנאי שימוש", href: "#" },
          { label: "נגישות", href: "#" },
        ]},
        { title: "AMG Pergola", links: [
          { label: "אודות", href: "/about" },
          { label: "הסיפור שלנו", href: "/about" },
        ]},
        { title: "יצירת קשר", links: [
          { label: "mail@amgpergola.co.il", href: "mailto:mail@amgpergola.co.il" },
          { label: "052-812-2846", href: "tel:+972528122846" },
        ]},
      ],
    },
  },
  ar: {
    header: {
      logo: "",
      nav_links: [
        { label: "المتجر", href: "/shop" },
        { label: "الكتالوج", href: "/catalog" },
        { label: "من نحن", href: "/about" },
        { label: "اتصل بنا", href: "/contact" },
      ],
      announcement_messages: [
        "شحن مجاني في جميع أنحاء البلاد",
        "برجولات من العلامة التجارية الإسرائيلية الرائدة",
      ],
      social_links: [
        { platform: "tiktok", url: "https://www.tiktok.com/@amg.pergola" },
      ],
    },
    footer: {
      copyright: "© {year}, AMG Pergola",
      social_links: [
        { platform: "tiktok", url: "https://www.tiktok.com/@amg.pergola" },
      ],
      columns: [
        { title: "مجموعات مميزة", links: [
          { label: "برجولات بيوكليماتيكية", href: "/shop?collection=bioclimatic" },
          { label: "أنظمة شرائح", href: "/shop?collection=motorized" },
          { label: "برجولات ثابتة", href: "/shop?collection=fixed" },
          { label: "أسقف قابلة للطي", href: "/shop?collection=retractable" },
          { label: "إكسسوارات", href: "/shop?collection=accessories" },
        ]},
        { title: "الدعم", links: [
          { label: "الأسئلة الشائعة", href: "/contact" },
          { label: "الضمان", href: "/contact" },
          { label: "الشحن والإرجاع", href: "/contact" },
        ]},
        { title: "السياسات", links: [
          { label: "سياسة الخصوصية", href: "#" },
          { label: "شروط الاستخدام", href: "#" },
          { label: "إمكانية الوصول", href: "#" },
        ]},
        { title: "AMG Pergola", links: [
          { label: "من نحن", href: "/about" },
          { label: "قصتنا", href: "/about" },
        ]},
        { title: "تواصل معنا", links: [
          { label: "mail@amgpergola.co.il", href: "mailto:mail@amgpergola.co.il" },
          { label: "052-812-2846", href: "tel:+972528122846" },
        ]},
      ],
    },
  },
};

const getSeed = (locale: string, section: string) =>
  SEED[locale]?.[section] ?? SEED.he[section];

// ─── AdminSiteContent ──────────────────────────────────────────────────────────

const AdminSiteContent = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [initialized, setInitialized] = useState(false);

  const [headerData, setHeaderData] = useState<any>(getSeed("he", "header"));
  const [footerData, setFooterData] = useState<any>(getSeed("he", "footer"));

  const { data: allContent, isLoading } = useQuery({
    queryKey: ["site_content_all", locale],
    queryFn: async () => {
      const { data } = await db
        .from("home_content")
        .select("section, data")
        .eq("locale", locale)
        .in("section", ["header", "footer"]);
      const map: Record<string, any> = {};
      (data || []).forEach((row: any) => { map[row.section] = row.data; });
      return map;
    },
  });

  useEffect(() => {
    if (!allContent) return;
    setHeaderData(allContent["header"] ?? getSeed(locale, "header"));
    setFooterData(allContent["footer"] ?? getSeed(locale, "footer"));
    setInitialized(true);
  }, [allContent, locale]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const otherLocale = locale === "he" ? "ar" : "he";

      // Upsert header for current locale
      const { error: e1 } = await db
        .from("home_content")
        .upsert({ locale, section: "header", data: headerData }, { onConflict: "locale,section" });
      if (e1) throw e1;

      // Upsert footer for current locale
      const { error: e2 } = await db
        .from("home_content")
        .upsert({ locale, section: "footer", data: footerData }, { onConflict: "locale,section" });
      if (e2) throw e2;

      // Sync logo to other locale's header
      const { data: otherHeaderRow } = await db
        .from("home_content")
        .select("data")
        .eq("locale", otherLocale)
        .eq("section", "header")
        .maybeSingle();
      const otherHeaderData = otherHeaderRow?.data ?? getSeed(otherLocale, "header");
      const { error: e3 } = await db
        .from("home_content")
        .upsert(
          { locale: otherLocale, section: "header", data: { ...otherHeaderData, logo: headerData.logo } },
          { onConflict: "locale,section" }
        );
      if (e3) throw e3;

      // Sync social_links to other locale's footer
      const { data: otherFooterRow } = await db
        .from("home_content")
        .select("data")
        .eq("locale", otherLocale)
        .eq("section", "footer")
        .maybeSingle();
      const otherFooterData = otherFooterRow?.data ?? getSeed(otherLocale, "footer");
      const { error: e4 } = await db
        .from("home_content")
        .upsert(
          { locale: otherLocale, section: "footer", data: { ...otherFooterData, social_links: footerData.social_links } },
          { onConflict: "locale,section" }
        );
      if (e4) throw e4;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_content_all"] });
      queryClient.invalidateQueries({ queryKey: ["site_content"] });
      toast({ title: "Saved", description: "Header & Footer content updated successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Header &amp; Footer</h1>
          <p className="text-sm text-gray-500 mt-1">Edit header and footer content</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">
            {locale}
          </span>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save All
          </Button>
        </div>
      </div>

      {/* Header Section */}
      <SectionCard icon={Layout} title="Header" defaultOpen={false}>
        {/* Logo */}
        <ImageUpload
          label="Logo Image"
          value={headerData.logo || ""}
          onChange={(url) => setHeaderData((s: any) => ({ ...s, logo: url }))}
        />
        <p className="text-xs text-gray-400">Same for both languages</p>

        {/* Announcement Messages */}
        <Repeater
          label="Announcement Bar Messages (rotating)"
          value={headerData.announcement_messages || []}
          onChange={(msgs) => setHeaderData((s: any) => ({ ...s, announcement_messages: msgs }))}
          defaultItem={() => ({ message: "" })}
          renderItem={(item, _idx, upd) => (
            <Input
              value={item.message || ""}
              placeholder="Message text"
              className="text-sm"
              onChange={(e) => upd("message", e.target.value)}
            />
          )}
        />

        {/* Nav Links */}
        <Repeater
          label="Navigation Links"
          value={headerData.nav_links || []}
          onChange={(links) => setHeaderData((s: any) => ({ ...s, nav_links: links }))}
          defaultItem={() => ({ label: "", href: "" })}
          renderItem={(item, _idx, upd) => (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Label</label>
                <Input
                  value={item.label || ""}
                  placeholder="Label"
                  className="text-sm"
                  onChange={(e) => upd("label", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">URL path e.g. /shop</label>
                <Input
                  value={item.href || ""}
                  placeholder="/shop"
                  className="text-sm"
                  onChange={(e) => upd("href", e.target.value)}
                />
              </div>
            </div>
          )}
        />
        <p className="text-xs text-gray-400">Tip: use paths like /shop, /about (locale prefix is added automatically)</p>

        {/* Social Links (header) */}
        <Repeater
          label="Social Links"
          note="Same for both languages"
          value={headerData.social_links || []}
          onChange={(links) => setHeaderData((s: any) => ({ ...s, social_links: links }))}
          defaultItem={() => ({ platform: "tiktok", url: "" })}
          renderItem={(item, _idx, upd) => (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Platform</label>
                <select
                  value={item.platform || "tiktok"}
                  onChange={(e) => upd("platform", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-white"
                >
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="youtube">YouTube</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">URL</label>
                <Input
                  value={item.url || ""}
                  placeholder="https://..."
                  className="text-sm"
                  onChange={(e) => upd("url", e.target.value)}
                />
              </div>
            </div>
          )}
        />
      </SectionCard>

      {/* Footer Section */}
      <SectionCard icon={Globe} title="Footer" defaultOpen={false}>
        {/* Copyright */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Copyright Text</label>
          <Input
            value={footerData.copyright || ""}
            placeholder="© {year}, Your Company"
            onChange={(e) => setFooterData((s: any) => ({ ...s, copyright: e.target.value }))}
          />
          <p className="text-xs text-gray-400">Use {"{year}"} as placeholder for current year</p>
        </div>

        {/* Footer Columns */}
        <Repeater
          label="Footer Columns"
          value={footerData.columns || []}
          onChange={(cols) => setFooterData((s: any) => ({ ...s, columns: cols }))}
          defaultItem={() => ({ title: "", links: [] })}
          renderItem={(col, _colIdx, updCol) => (
            <>
              <div>
                <label className="text-xs text-gray-500">Column Title</label>
                <Input
                  value={col.title || ""}
                  className="text-sm"
                  onChange={(e) => updCol("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-500">Links</label>
                  <button
                    type="button"
                    onClick={() => updCol("links", [...(col.links || []), { label: "", href: "" }])}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Link
                  </button>
                </div>
                {(col.links || []).map((link: any, li: number) => (
                  <div key={li} className="flex gap-2 items-center">
                    <Input
                      value={link.label || ""}
                      placeholder="Label"
                      className="text-xs flex-1"
                      onChange={(e) => {
                        const links = [...(col.links || [])];
                        links[li] = { ...links[li], label: e.target.value };
                        updCol("links", links);
                      }}
                    />
                    <Input
                      value={link.href || ""}
                      placeholder="href"
                      className="text-xs flex-1"
                      onChange={(e) => {
                        const links = [...(col.links || [])];
                        links[li] = { ...links[li], href: e.target.value };
                        updCol("links", links);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => updCol("links", (col.links || []).filter((_: any, i: number) => i !== li))}
                      className="text-red-400 hover:text-red-600 flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(!col.links || col.links.length === 0) && (
                  <p className="text-xs text-gray-400">No links yet</p>
                )}
              </div>
            </>
          )}
        />

        {/* Social Links (footer - synced) */}
        <Repeater
          label="Social Links"
          note="Synced with header - same for both languages"
          value={footerData.social_links || []}
          onChange={(links) => setFooterData((s: any) => ({ ...s, social_links: links }))}
          defaultItem={() => ({ platform: "tiktok", url: "" })}
          renderItem={(item, _idx, upd) => (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Platform</label>
                <select
                  value={item.platform || "tiktok"}
                  onChange={(e) => upd("platform", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-white"
                >
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="youtube">YouTube</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">URL</label>
                <Input
                  value={item.url || ""}
                  placeholder="https://..."
                  className="text-sm"
                  onChange={(e) => upd("url", e.target.value)}
                />
              </div>
            </div>
          )}
        />
      </SectionCard>
    </div>
  );
};

export default AdminSiteContent;
