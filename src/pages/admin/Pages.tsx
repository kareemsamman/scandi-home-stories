import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown, FileText,
  Image, Type, HelpCircle, Megaphone, ShoppingBag, Mail, LayoutGrid, ArrowLeft, Save, X,
} from "lucide-react";

const db = supabase as any;

// ─── Section Type Definitions ───
interface FieldDef {
  key: string; type: "text" | "textarea" | "select" | "repeater";
  label: string; options?: string[]; subfields?: FieldDef[];
}

const SECTION_TYPES: Record<string, { label: string; icon: any; fields: FieldDef[] }> = {
  hero: {
    label: "Hero Banner", icon: Image,
    fields: [
      { key: "title", type: "text", label: "Title" },
      { key: "subtitle", type: "text", label: "Subtitle" },
      { key: "image_desktop", type: "text", label: "Desktop Image URL" },
      { key: "image_mobile", type: "text", label: "Mobile Image URL" },
      { key: "button_text", type: "text", label: "Button Text" },
      { key: "button_link", type: "text", label: "Button Link" },
    ],
  },
  text_image: {
    label: "Text + Image", icon: Type,
    fields: [
      { key: "title", type: "text", label: "Title" },
      { key: "text", type: "textarea", label: "Content" },
      { key: "image_desktop", type: "text", label: "Desktop Image URL" },
      { key: "image_mobile", type: "text", label: "Mobile Image URL" },
    ],
  },
  product_slider: {
    label: "Product Slider", icon: ShoppingBag,
    fields: [
      { key: "title", type: "text", label: "Title" },
      { key: "category_slug", type: "text", label: "Category Slug (empty = featured)" },
      { key: "limit", type: "text", label: "Max Products" },
    ],
  },
  gallery: {
    label: "Gallery", icon: LayoutGrid,
    fields: [
      { key: "title", type: "text", label: "Title" },
      { key: "images", type: "repeater", label: "Images", subfields: [
        { key: "url", type: "text", label: "Image URL" },
        { key: "alt", type: "text", label: "Alt Text" },
      ]},
    ],
  },
  faq: {
    label: "FAQ", icon: HelpCircle,
    fields: [
      { key: "title", type: "text", label: "Title" },
      { key: "items", type: "repeater", label: "Questions", subfields: [
        { key: "question", type: "text", label: "Question" },
        { key: "answer", type: "textarea", label: "Answer" },
      ]},
    ],
  },
  cta_banner: {
    label: "CTA Banner", icon: Megaphone,
    fields: [
      { key: "title", type: "text", label: "Title" },
      { key: "subtitle", type: "text", label: "Subtitle" },
      { key: "button_text", type: "text", label: "Button Text" },
      { key: "button_link", type: "text", label: "Button Link" },
      { key: "background_image", type: "text", label: "Background Image" },
    ],
  },
  contact_form: {
    label: "Contact Form", icon: Mail,
    fields: [
      { key: "title", type: "text", label: "Title" },
      { key: "subtitle", type: "text", label: "Subtitle" },
    ],
  },
};

// ─── Repeater Field ───
const RepeaterField = ({ field, value, onChange }: { field: FieldDef; value: any[]; onChange: (v: any[]) => void }) => {
  const items = value || [];
  const addItem = () => {
    const empty: any = {};
    field.subfields?.forEach((sf) => { empty[sf.key] = ""; });
    onChange([...items, empty]);
  };
  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: string, val: string) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [key]: val };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{field.label}</label>
        <Button size="sm" variant="ghost" onClick={addItem} className="text-blue-600 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">#{i + 1}</span>
            <Button size="sm" variant="ghost" onClick={() => removeItem(i)} className="text-red-500 text-xs h-6 w-6 p-0">
              <X className="w-3 h-3" />
            </Button>
          </div>
          {field.subfields?.map((sf) => (
            <div key={sf.key}>
              <label className="text-xs text-gray-500">{sf.label}</label>
              {sf.type === "textarea" ? (
                <Textarea value={item[sf.key] || ""} onChange={(e) => updateItem(i, sf.key, e.target.value)} rows={2} className="text-sm" />
              ) : (
                <Input value={item[sf.key] || ""} onChange={(e) => updateItem(i, sf.key, e.target.value)} className="text-sm" />
              )}
            </div>
          ))}
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-gray-400">No items yet</p>}
    </div>
  );
};

// ─── Section Editor ───
const SectionEditor = ({
  section, index, total, onUpdate, onRemove, onMove,
}: {
  section: any; index: number; total: number;
  onUpdate: (fields: any) => void; onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const typeDef = SECTION_TYPES[section.type];
  if (!typeDef) return null;
  const Icon = typeDef.icon;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-900 flex-1">{typeDef.label}</span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => onMove(-1)} className="h-7 w-7 p-0">
            <ChevronUp className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" disabled={index === total - 1} onClick={() => onMove(1)} className="h-7 w-7 p-0">
            <ChevronDown className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)} className="h-7 w-7 p-0">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={onRemove} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {typeDef.fields.map((field) => {
            if (field.type === "repeater") {
              return (
                <RepeaterField
                  key={field.key}
                  field={field}
                  value={section.fields?.[field.key] || []}
                  onChange={(v) => onUpdate({ ...section.fields, [field.key]: v })}
                />
              );
            }
            return (
              <div key={field.key}>
                <label className="text-sm font-medium text-gray-700 mb-1 block">{field.label}</label>
                {field.type === "textarea" ? (
                  <Textarea
                    value={section.fields?.[field.key] || ""}
                    onChange={(e) => onUpdate({ ...section.fields, [field.key]: e.target.value })}
                    rows={3}
                  />
                ) : field.type === "select" ? (
                  <Select value={section.fields?.[field.key] || ""} onValueChange={(v) => onUpdate({ ...section.fields, [field.key]: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={section.fields?.[field.key] || ""}
                    onChange={(e) => onUpdate({ ...section.fields, [field.key]: e.target.value })}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Page Editor ───
const PageEditor = ({ page, onBack }: { page: any; onBack: () => void }) => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAddSection, setShowAddSection] = useState(false);

  const { data: trans } = useQuery({
    queryKey: ["page_trans", page.id, locale],
    queryFn: async () => {
      const { data } = await db.from("page_translations").select("*").eq("page_id", page.id).eq("locale", locale).maybeSingle();
      return data || { title: "", sections: [], seo_title: "", seo_description: "" };
    },
  });

  const [title, setTitle] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [sections, setSections] = useState<any[]>([]);
  const hasInitialized = useRef(false);
  const prevPageLocale = useRef(`${page.id}_${locale}`);

  // Reset guard when page or locale changes
  useEffect(() => {
    const key = `${page.id}_${locale}`;
    if (prevPageLocale.current !== key) {
      hasInitialized.current = false;
      prevPageLocale.current = key;
    }
  }, [page.id, locale]);

  // Populate form state once per page+locale context
  useEffect(() => {
    if (!trans || hasInitialized.current) return;
    hasInitialized.current = true;
    setTitle(trans.title || "");
    setSeoTitle(trans.seo_title || "");
    setSeoDesc(trans.seo_description || "");
    setSections(trans.sections || []);
  }, [trans, page.id, locale]);

  const save = useMutation({
    mutationFn: async () => {
      await db.from("page_translations").upsert({
        page_id: page.id, locale, title, sections,
        seo_title: seoTitle, seo_description: seoDesc,
      }, { onConflict: "page_id,locale" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page_trans"] });
      toast({ title: "Page saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addSection = (type: string) => {
    setSections([...sections, { id: crypto.randomUUID(), type, fields: {} }]);
    setShowAddSection(false);
  };

  const removeSection = (i: number) => setSections(sections.filter((_, idx) => idx !== i));

  const moveSection = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const arr = [...sections];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setSections(arr);
  };

  const updateSection = (i: number, fields: any) => {
    const arr = [...sections];
    arr[i] = { ...arr[i], fields };
    setSections(arr);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit: {page.slug}</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
              {locale === "he" ? "Hebrew" : "Arabic"}
            </span>
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="w-4 h-4 mr-2" /> Save Page
        </Button>
      </div>

      {/* Page Meta */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Page Details</h3>
        <Input placeholder="Page Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="SEO Title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          <Input placeholder="SEO Description" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} />
        </div>
      </div>

      {/* Sections Builder */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Sections ({sections.length})</h3>
          <Button size="sm" onClick={() => setShowAddSection(!showAddSection)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> Add Section
          </Button>
        </div>

        {showAddSection && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-3">Choose section type:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(SECTION_TYPES).map(([key, def]) => {
                const Icon = def.icon;
                return (
                  <button
                    key={key}
                    onClick={() => addSection(key)}
                    className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-start"
                  >
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{def.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {sections.map((section, i) => (
          <SectionEditor
            key={section.id}
            section={section}
            index={i}
            total={sections.length}
            onUpdate={(fields) => updateSection(i, fields)}
            onRemove={() => removeSection(i)}
            onMove={(dir) => moveSection(i, dir)}
          />
        ))}

        {sections.length === 0 && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No sections yet. Click "Add Section" to start building.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Page List ───
const AdminPages = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSlug, setNewSlug] = useState("");

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["admin_pages"],
    queryFn: async () => {
      const { data } = await db.from("pages").select("*").order("sort_order");
      return data || [];
    },
  });

  const { data: transMap = new Map() } = useQuery({
    queryKey: ["admin_page_trans_list", locale],
    queryFn: async () => {
      const { data } = await db.from("page_translations").select("*").eq("locale", locale);
      return new Map((data || []).map((t: any) => [t.page_id, t]));
    },
  });

  const createPage = useMutation({
    mutationFn: async () => {
      const { error } = await db.from("pages").insert({ slug: newSlug, sort_order: pages.length + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_pages"] });
      setShowCreate(false); setNewSlug("");
      toast({ title: "Page created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_pages"] }); toast({ title: "Deleted" }); },
  });

  if (editingPage) {
    return <PageEditor page={editingPage} onBack={() => setEditingPage(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
          <p className="text-gray-500 text-sm mt-1">Manage website pages and their content</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> New Page
        </Button>
      </div>

      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Create Page</h3>
          <Input placeholder="Page slug (e.g. privacy-policy)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createPage.mutate()} className="bg-blue-600 hover:bg-blue-700 text-white">Create</Button>
          </div>
        </div>
      )}

      {isLoading ? <p className="text-gray-400">Loading...</p> : (
        <div className="space-y-2">
          {pages.map((page: any) => {
            const trans = transMap.get(page.id);
            return (
              <div key={page.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                <FileText className="w-5 h-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-medium">{trans?.title || page.slug}</h3>
                  <p className="text-gray-400 text-xs">/{page.slug} · {page.status} · {(trans?.sections || []).length} sections</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditingPage(page)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete page "${page.slug}"?`)) deletePage.mutate(page.id); }} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {pages.length === 0 && <p className="text-gray-400 text-center py-8">No pages yet</p>}
        </div>
      )}
    </div>
  );
};

export default AdminPages;
