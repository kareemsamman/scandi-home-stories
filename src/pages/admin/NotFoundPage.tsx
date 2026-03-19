import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Monitor, Smartphone, ImageIcon } from "lucide-react";

const db = supabase as any;

const DEFAULT_IMAGE_DT = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80";
const DEFAULT_IMAGE_MB = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80";

const DEFAULTS: Record<string, { title: string; subtitle: string; btn_home: string; btn_shop: string }> = {
  he: { title: "הדף לא נמצא", subtitle: "הדף שחיפשתם לא קיים. ייתכן שהוסר או שהכתובת שגויה.", btn_home: "חזרה לדף הבית", btn_shop: "לחנות" },
  ar: { title: "الصفحة غير موجودة", subtitle: "الصفحة التي تبحث عنها غير موجودة. ربما تم حذفها أو الرابط خاطئ.", btn_home: "العودة للرئيسية", btn_shop: "المتجر" },
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

const AdminNotFoundPage = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dbData } = useQuery({
    queryKey: ["home_content", "page_404", locale],
    queryFn: async () => {
      const { data } = await db.from("home_content").select("data").eq("section", "page_404").eq("locale", locale).maybeSingle();
      return (data?.data as Record<string, string>) || null;
    },
  });

  const defaults = DEFAULTS[locale] || DEFAULTS["he"];

  const [form, setForm] = useState<Record<string, string> | null>(null);
  const current = form ?? dbData ?? {};

  const val = (key: string, fallback: string) => current[key] ?? dbData?.[key] ?? fallback;
  const set = (key: string, value: string) => setForm(prev => ({ ...(prev ?? dbData ?? {}), [key]: value }));

  const isDirty = form !== null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        image:        val("image", DEFAULT_IMAGE_DT),
        image_mobile: val("image_mobile", DEFAULT_IMAGE_MB),
        title:        val("title", defaults.title),
        subtitle:     val("subtitle", defaults.subtitle),
        btn_home:     val("btn_home", defaults.btn_home),
        btn_shop:     val("btn_shop", defaults.btn_shop),
      };
      const { error } = await db.from("home_content").upsert(
        { section: "page_404", locale, data: payload },
        { onConflict: "section,locale" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home_content", "page_404", locale] });
      setForm(null);
      toast({ title: "Saved successfully" });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">404 Page</h1>
        <p className="text-sm text-gray-500 mt-1">
          Editing in <span className="font-semibold">{locale.toUpperCase()}</span> — switch language via the top bar to edit the other locale.
        </p>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2"><ImageIcon className="w-4 h-4" />Background Images</h2>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Desktop image */}
          <Field label="Desktop Image URL">
            <Input
              value={val("image", DEFAULT_IMAGE_DT)}
              onChange={e => set("image", e.target.value)}
              placeholder="https://..."
              className="h-10 text-xs"
            />
            {val("image", DEFAULT_IMAGE_DT) && (
              <div className="relative rounded-xl overflow-hidden bg-gray-100 h-36 mt-2">
                <div className="absolute top-2 start-2 z-10 flex items-center gap-1 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  <Monitor className="w-3 h-3" /> Desktop
                </div>
                <img src={val("image", DEFAULT_IMAGE_DT)} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </Field>

          {/* Mobile image */}
          <Field label="Mobile Image URL">
            <Input
              value={val("image_mobile", DEFAULT_IMAGE_MB)}
              onChange={e => set("image_mobile", e.target.value)}
              placeholder="https://..."
              className="h-10 text-xs"
            />
            {val("image_mobile", DEFAULT_IMAGE_MB) && (
              <div className="relative rounded-xl overflow-hidden bg-gray-100 h-36 mt-2">
                <div className="absolute top-2 start-2 z-10 flex items-center gap-1 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  <Smartphone className="w-3 h-3" /> Mobile
                </div>
                <img src={val("image_mobile", DEFAULT_IMAGE_MB)} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </Field>
        </div>
      </div>

      {/* Text content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-700">Text Content</h2>

        <Field label="Title">
          <Input
            value={val("title", defaults.title)}
            onChange={e => set("title", e.target.value)}
            dir="rtl"
            className="h-10"
          />
        </Field>

        <Field label="Subtitle / Description">
          <Textarea
            value={val("subtitle", defaults.subtitle)}
            onChange={e => set("subtitle", e.target.value)}
            dir="rtl"
            rows={3}
            className="resize-none"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Home Button Text">
            <Input
              value={val("btn_home", defaults.btn_home)}
              onChange={e => set("btn_home", e.target.value)}
              dir="rtl"
              className="h-10"
            />
          </Field>
          <Field label="Shop Button Text">
            <Input
              value={val("btn_shop", defaults.btn_shop)}
              onChange={e => set("btn_shop", e.target.value)}
              dir="rtl"
              className="h-10"
            />
          </Field>
        </div>
      </div>

      {/* Preview hint */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-500">
        Preview at{" "}
        <a href="/he/not-found-preview" target="_blank" className="underline text-gray-700 font-medium">/he/anything-invalid</a>
        {" "}— type any unknown URL to see the 404 page live.
      </div>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={!isDirty || saveMutation.isPending}
        className="gap-2"
      >
        <Save className="w-4 h-4" />
        Save Changes
      </Button>
    </div>
  );
};

export default AdminNotFoundPage;
