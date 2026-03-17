import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Image,
  LayoutGrid,
  Type,
  Play,
  ArrowLeftRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  X,
  Save,
  Loader2,
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
      const path = `home/${Date.now()}.${ext}`;
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
            <Image className="w-5 h-5" />
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
  value: any[];
  onChange: (v: any[]) => void;
  renderItem: (item: any, idx: number, update: (key: string, val: any) => void) => React.ReactNode;
  defaultItem: () => any;
}

const Repeater = ({ label, value, onChange, renderItem, defaultItem }: RepeaterProps) => {
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
        <label className="text-xs font-medium text-gray-600">{label}</label>
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
        <div className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Field helpers ────────────────────────────────────────────────────────────

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    {children}
  </div>
);

// ─── AdminHomePage ─────────────────────────────────────────────────────────────

const SECTIONS = ["feature_overlay", "promo_grid", "brand_intro", "lifestyle_media", "before_after", "faq"] as const;

const defaultFeatureOverlay = () => ({
  bg_image: "",
  title: "",
  description: "",
  items: [
    { icon: "shield", title: "", description: "" },
    { icon: "droplets", title: "", description: "" },
    { icon: "zap", title: "", description: "" },
    { icon: "award", title: "", description: "" },
  ],
});

const defaultPromoGrid = () => ({
  items: [
    { title: "", subtitle: "", image: "", link: "/shop" },
    { title: "", subtitle: "", image: "", link: "/shop" },
    { title: "", subtitle: "", image: "", link: "/shop" },
  ],
});

const defaultBrandIntro = () => ({ title: "", description: "" });

const defaultLifestyleMedia = () => ({
  image: "",
  title: "",
  description: "",
  cta: "",
  cta_link: "/shop",
});

const defaultBeforeAfter = () => ({
  title: "",
  subtitle: "",
  before_label: "",
  after_label: "",
  before_image: "",
  after_image: "",
});

const defaultFaq = () => ({
  title: "",
  subtitle: "",
  contact_text: "",
  items: [{ question: "", answer: "" }],
});

const AdminHomePage = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [initialized, setInitialized] = useState(false);

  const [featureOverlay, setFeatureOverlay] = useState<any>(defaultFeatureOverlay());
  const [promoGrid, setPromoGrid] = useState<any>(defaultPromoGrid());
  const [brandIntro, setBrandIntro] = useState<any>(defaultBrandIntro());
  const [lifestyleMedia, setLifestyleMedia] = useState<any>(defaultLifestyleMedia());
  const [beforeAfter, setBeforeAfter] = useState<any>(defaultBeforeAfter());
  const [faqData, setFaqData] = useState<any>(defaultFaq());

  const { data: allContent, isLoading } = useQuery({
    queryKey: ["home_content_all", locale],
    queryFn: async () => {
      const { data } = await db
        .from("home_content")
        .select("section, data")
        .eq("locale", locale)
        .in("section", SECTIONS);
      const map: Record<string, any> = {};
      (data || []).forEach((row: any) => {
        map[row.section] = row.data;
      });
      return map;
    },
  });

  useEffect(() => {
    if (!allContent) return;
    setFeatureOverlay(allContent["feature_overlay"] ?? defaultFeatureOverlay());
    setPromoGrid(allContent["promo_grid"] ?? defaultPromoGrid());
    setBrandIntro(allContent["brand_intro"] ?? defaultBrandIntro());
    setLifestyleMedia(allContent["lifestyle_media"] ?? defaultLifestyleMedia());
    setBeforeAfter(allContent["before_after"] ?? defaultBeforeAfter());
    setFaqData(allContent["faq"] ?? defaultFaq());
    setInitialized(true);
  }, [allContent, locale]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rows = [
        { locale, section: "feature_overlay", data: featureOverlay },
        { locale, section: "promo_grid", data: promoGrid },
        { locale, section: "brand_intro", data: brandIntro },
        { locale, section: "lifestyle_media", data: lifestyleMedia },
        { locale, section: "before_after", data: beforeAfter },
        { locale, section: "faq", data: faqData },
      ];
      for (const row of rows) {
        const { error } = await db
          .from("home_content")
          .upsert(row, { onConflict: "locale,section" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home_content_all", locale] });
      queryClient.invalidateQueries({ queryKey: ["home_content"] });
      toast({ title: "Saved", description: "Home page content updated successfully." });
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
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Page</h1>
          <p className="text-sm text-gray-500 mt-1">Edit home page content sections</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">
            {locale}
          </span>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="gap-2"
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

      {/* Feature Overlay */}
      <SectionCard icon={Image} title="Feature Overlay" defaultOpen>
        <ImageUpload
          label="Background Image"
          value={featureOverlay.bg_image || ""}
          onChange={(url) => setFeatureOverlay((s: any) => ({ ...s, bg_image: url }))}
        />
        <Field label="Title">
          <Input
            value={featureOverlay.title || ""}
            onChange={(e) => setFeatureOverlay((s: any) => ({ ...s, title: e.target.value }))}
            placeholder="Section title"
          />
        </Field>
        <Field label="Description">
          <Input
            value={featureOverlay.description || ""}
            onChange={(e) => setFeatureOverlay((s: any) => ({ ...s, description: e.target.value }))}
            placeholder="Section description"
          />
        </Field>
        <Repeater
          label="Feature Items"
          value={featureOverlay.items || []}
          onChange={(items) => setFeatureOverlay((s: any) => ({ ...s, items }))}
          defaultItem={() => ({ icon: "shield", title: "", description: "" })}
          renderItem={(item, _idx, update) => (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Icon</label>
                <select
                  value={item.icon || "shield"}
                  onChange={(e) => update("icon", e.target.value)}
                  className="w-full mt-0.5 h-9 px-3 rounded-lg border border-input text-sm bg-white"
                >
                  <option value="shield">Shield (Quality)</option>
                  <option value="droplets">Droplets (Water)</option>
                  <option value="zap">Zap (Speed)</option>
                  <option value="award">Award (Award)</option>
                  <option value="star">Star</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <Field label="Title">
                <Input
                  value={item.title || ""}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Feature title"
                />
              </Field>
              <Field label="Description">
                <Input
                  value={item.description || ""}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Feature description"
                />
              </Field>
            </div>
          )}
        />
      </SectionCard>

      {/* Promo Grid */}
      <SectionCard icon={LayoutGrid} title="Promo Card Grid">
        <Repeater
          label="Promo Cards"
          value={promoGrid.items || []}
          onChange={(items) => setPromoGrid((s: any) => ({ ...s, items }))}
          defaultItem={() => ({ title: "", subtitle: "", image: "", link: "/shop" })}
          renderItem={(item, _idx, update) => (
            <div className="space-y-2">
              <ImageUpload
                label="Card Image"
                value={item.image || ""}
                onChange={(url) => update("image", url)}
              />
              <Field label="Title">
                <Input
                  value={item.title || ""}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Card title"
                />
              </Field>
              <Field label="Subtitle">
                <Input
                  value={item.subtitle || ""}
                  onChange={(e) => update("subtitle", e.target.value)}
                  placeholder="Card subtitle"
                />
              </Field>
              <Field label="Link">
                <Input
                  value={item.link || ""}
                  onChange={(e) => update("link", e.target.value)}
                  placeholder="/shop"
                />
              </Field>
            </div>
          )}
        />
      </SectionCard>

      {/* Brand Intro */}
      <SectionCard icon={Type} title="Brand Intro">
        <Field label="Title">
          <Input
            value={brandIntro.title || ""}
            onChange={(e) => setBrandIntro((s: any) => ({ ...s, title: e.target.value }))}
            placeholder="Brand title"
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={brandIntro.description || ""}
            onChange={(e) => setBrandIntro((s: any) => ({ ...s, description: e.target.value }))}
            placeholder="Brand description"
            rows={4}
          />
        </Field>
      </SectionCard>

      {/* Lifestyle Media */}
      <SectionCard icon={Play} title="Lifestyle Media">
        <ImageUpload
          label="Section Image"
          value={lifestyleMedia.image || ""}
          onChange={(url) => setLifestyleMedia((s: any) => ({ ...s, image: url }))}
        />
        <Field label="Title">
          <Input
            value={lifestyleMedia.title || ""}
            onChange={(e) => setLifestyleMedia((s: any) => ({ ...s, title: e.target.value }))}
            placeholder="Section title"
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={lifestyleMedia.description || ""}
            onChange={(e) => setLifestyleMedia((s: any) => ({ ...s, description: e.target.value }))}
            placeholder="Section description"
            rows={3}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CTA Button Text">
            <Input
              value={lifestyleMedia.cta || ""}
              onChange={(e) => setLifestyleMedia((s: any) => ({ ...s, cta: e.target.value }))}
              placeholder="Shop Now"
            />
          </Field>
          <Field label="CTA Link">
            <Input
              value={lifestyleMedia.cta_link || ""}
              onChange={(e) => setLifestyleMedia((s: any) => ({ ...s, cta_link: e.target.value }))}
              placeholder="/shop"
            />
          </Field>
        </div>
      </SectionCard>

      {/* Before / After */}
      <SectionCard icon={ArrowLeftRight} title="Before / After">
        <Field label="Title">
          <Input
            value={beforeAfter.title || ""}
            onChange={(e) => setBeforeAfter((s: any) => ({ ...s, title: e.target.value }))}
            placeholder="Section title"
          />
        </Field>
        <Field label="Subtitle">
          <Input
            value={beforeAfter.subtitle || ""}
            onChange={(e) => setBeforeAfter((s: any) => ({ ...s, subtitle: e.target.value }))}
            placeholder="Section subtitle"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Before Label">
            <Input
              value={beforeAfter.before_label || ""}
              onChange={(e) => setBeforeAfter((s: any) => ({ ...s, before_label: e.target.value }))}
              placeholder="Before"
            />
          </Field>
          <Field label="After Label">
            <Input
              value={beforeAfter.after_label || ""}
              onChange={(e) => setBeforeAfter((s: any) => ({ ...s, after_label: e.target.value }))}
              placeholder="After"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ImageUpload
            label="Before Image"
            value={beforeAfter.before_image || ""}
            onChange={(url) => setBeforeAfter((s: any) => ({ ...s, before_image: url }))}
          />
          <ImageUpload
            label="After Image"
            value={beforeAfter.after_image || ""}
            onChange={(url) => setBeforeAfter((s: any) => ({ ...s, after_image: url }))}
          />
        </div>
      </SectionCard>

      {/* FAQ */}
      <SectionCard icon={HelpCircle} title="FAQ">
        <Field label="Title">
          <Input
            value={faqData.title || ""}
            onChange={(e) => setFaqData((s: any) => ({ ...s, title: e.target.value }))}
            placeholder="FAQ title"
          />
        </Field>
        <Field label="Subtitle">
          <Input
            value={faqData.subtitle || ""}
            onChange={(e) => setFaqData((s: any) => ({ ...s, subtitle: e.target.value }))}
            placeholder="FAQ subtitle"
          />
        </Field>
        <Field label="Contact Text">
          <Input
            value={faqData.contact_text || ""}
            onChange={(e) => setFaqData((s: any) => ({ ...s, contact_text: e.target.value }))}
            placeholder="Contact text"
          />
        </Field>
        <Repeater
          label="FAQ Items"
          value={faqData.items || []}
          onChange={(items) => setFaqData((s: any) => ({ ...s, items }))}
          defaultItem={() => ({ question: "", answer: "" })}
          renderItem={(item, _idx, update) => (
            <div className="space-y-2">
              <Field label="Question">
                <Input
                  value={item.question || ""}
                  onChange={(e) => update("question", e.target.value)}
                  placeholder="Question"
                />
              </Field>
              <Field label="Answer">
                <Textarea
                  value={item.answer || ""}
                  onChange={(e) => update("answer", e.target.value)}
                  placeholder="Answer"
                  rows={2}
                />
              </Field>
            </div>
          )}
        />
      </SectionCard>
    </div>
  );
};

export default AdminHomePage;
