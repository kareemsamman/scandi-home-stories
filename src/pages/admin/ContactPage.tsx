import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Image, X } from "lucide-react";

const db = supabase as any;

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    {children}
  </div>
);

const ImageUpload = ({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `contact/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {value ? (
        <div className="relative">
          <img src={value} alt="" className="w-full h-36 object-cover rounded-lg border border-gray-200" />
          <button type="button" onClick={() => onChange("")} className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">
            <X className="w-3 h-3" />
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="mt-2 w-full text-xs py-1.5 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-50">
            {uploading ? "Uploading..." : "Change"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:bg-gray-50 text-gray-500 disabled:opacity-50">
            <Image className="w-4 h-4" />
            <span className="text-xs">{uploading ? "Uploading..." : "Upload"}</span>
          </button>
          <Input placeholder="Or paste URL..." value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)}
            onBlur={() => { if (pasteUrl.trim()) { onChange(pasteUrl.trim()); setPasteUrl(""); } }}
            className="text-xs h-8"
          />
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = ""; }}
      />
    </div>
  );
};

// ─── AdminContactPage ─────────────────────────────────────────────────────────

const AdminContactPage = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [hero, setHero] = useState({
    title: "", subtitle: "", image: "", image_mobile: "",
  });
  const [details, setDetails] = useState({
    phone: "", email: "", address: "", hours: "", map_embed_url: "",
  });

  const patchHero    = (p: any) => setHero(prev => ({ ...prev, ...p }));
  const patchDetails = (p: any) => setDetails(prev => ({ ...prev, ...p }));

  const { data, isLoading } = useQuery({
    queryKey: ["contact_admin_content", locale],
    queryFn: async () => {
      const { data: rows } = await db
        .from("home_content")
        .select("section, data")
        .eq("locale", locale)
        .in("section", ["contact_hero", "contact_details"]);
      const map: Record<string, any> = {};
      (rows || []).forEach((r: any) => { map[r.section] = r.data; });
      return map;
    },
  });

  useEffect(() => {
    if (!data) return;
    if (data.contact_hero)    setHero(prev    => ({ ...prev,    ...data.contact_hero }));
    if (data.contact_details) setDetails(prev => ({ ...prev, ...data.contact_details }));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rows = [
        { locale, section: "contact_hero",    data: hero },
        { locale, section: "contact_details", data: details },
      ];
      for (const row of rows) {
        const { error } = await db.from("home_content").upsert(row, { onConflict: "locale,section" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact_admin_content", locale] });
      queryClient.invalidateQueries({ queryKey: ["home_content"] });
      toast({ title: "Saved", description: "Contact page updated." });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Page</h1>
          <p className="text-sm text-gray-500 mt-1">Edit hero, contact details and map</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
          {saveMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save</>}
        </Button>
      </div>

      {/* Hero section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Hero Section</h2>

        <div className="grid grid-cols-2 gap-4">
          <ImageUpload label="Background Image — Desktop" value={hero.image} onChange={(url) => patchHero({ image: url })} />
          <ImageUpload label="Background Image — Mobile" value={hero.image_mobile} onChange={(url) => patchHero({ image_mobile: url })} />
        </div>

        <Field label="Subtitle (small text above title)">
          <Input value={hero.subtitle} onChange={e => patchHero({ subtitle: e.target.value })} placeholder="e.g. Contact Us" />
        </Field>
        <Field label="Title">
          <Input value={hero.title} onChange={e => patchHero({ title: e.target.value })} placeholder="Main heading on hero" />
        </Field>
      </div>

      {/* Contact details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Contact Details</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <Input value={details.phone} onChange={e => patchDetails({ phone: e.target.value })} placeholder="052-812-2846" />
          </Field>
          <Field label="Email">
            <Input value={details.email} onChange={e => patchDetails({ email: e.target.value })} placeholder="info@example.com" />
          </Field>
        </div>

        <Field label="Address">
          <Input value={details.address} onChange={e => patchDetails({ address: e.target.value })} placeholder="123 Street, City" />
        </Field>

        <Field label="Working Hours">
          <Input value={details.hours} onChange={e => patchDetails({ hours: e.target.value })} placeholder="Sun–Thu 8:00–17:00" />
        </Field>

        <Field
          label="Google Maps Embed URL"
          hint='Go to Google Maps → Share → Embed a map → copy the src="..." URL only'
        >
          <Textarea
            value={details.map_embed_url}
            onChange={e => patchDetails({ map_embed_url: e.target.value })}
            placeholder="https://www.google.com/maps/embed?pb=..."
            className="text-xs font-mono min-h-[80px] resize-none"
            rows={3}
          />
        </Field>

        {/* Map preview */}
        {details.map_embed_url && (
          <div className="rounded-xl overflow-hidden border border-gray-200 h-48">
            <iframe src={details.map_embed_url} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Map preview" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContactPage;
