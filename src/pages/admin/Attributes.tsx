import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { useColorTaxonomy, useLengthTaxonomy, useSaveColorTaxonomy, useSaveLengthTaxonomy, TaxColor, TaxLength } from "@/hooks/useProductTaxonomy";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const uid = () => Math.random().toString(36).slice(2, 9);

/* ── Color Row ── */
const ColorRow = ({ item, locale, onSave, onDelete }: {
  item: TaxColor; locale: "he" | "ar";
  onSave: (v: TaxColor) => Promise<void>; onDelete: () => void;
}) => {
  const isNew = !item.label_he && !item.label_ar;
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);

  const label = locale === "he" ? item.label_he : item.label_ar;
  const placeholder = locale === "he" ? "שם הצבע" : "اسم اللون";

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg">
        <div className="w-6 h-6 rounded-full border border-gray-200 shrink-0" style={{ background: item.hex }} />
        <span className="flex-1 text-sm font-medium text-gray-800">{label || <span className="text-gray-300 italic">—</span>}</span>
        <span className="text-xs text-gray-300 font-mono w-20">{item.hex}</span>
        <button onClick={() => { setDraft(item); setEditing(true); }} className="text-gray-400 hover:text-gray-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
      {/* Color picker swatch */}
      <div className="relative shrink-0 w-8 h-8 rounded-full border-2 border-white ring-1 ring-gray-300 overflow-hidden cursor-pointer" style={{ background: draft.hex }}>
        <input
          type="color"
          value={draft.hex}
          onChange={(e) => setDraft(p => ({ ...p, hex: e.target.value }))}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          title="Pick color"
        />
      </div>

      {/* Label field (HE or AR based on locale) */}
      {locale === "he" ? (
        <Input value={draft.label_he} onChange={(e) => setDraft(p => ({ ...p, label_he: e.target.value }))} placeholder={placeholder} className="flex-1 h-8 text-sm" autoFocus={isNew} />
      ) : (
        <Input value={draft.label_ar} onChange={(e) => setDraft(p => ({ ...p, label_ar: e.target.value }))} placeholder={placeholder} className="flex-1 h-8 text-sm" dir="rtl" autoFocus={isNew} />
      )}

      {/* Hex text input */}
      <Input
        value={draft.hex}
        onChange={(e) => {
          const val = e.target.value;
          setDraft(p => ({ ...p, hex: val }));
        }}
        placeholder="#cccccc"
        className="w-24 h-8 text-xs font-mono"
        maxLength={7}
      />

      <button onClick={handleSave} disabled={saving} className="text-green-600 hover:text-green-800 disabled:opacity-40 shrink-0">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={() => { if (isNew) { onDelete(); } else { setDraft(item); setEditing(false); } }} className="text-gray-400 hover:text-gray-600 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/* ── Length Row ── */
const LengthRow = ({ item, locale, onSave, onDelete }: {
  item: TaxLength; locale: "he" | "ar";
  onSave: (v: TaxLength) => Promise<void>; onDelete: () => void;
}) => {
  const isNew = !item.label_he && !item.label_ar;
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);

  const label = locale === "he" ? item.label_he : item.label_ar;
  const placeholder = locale === "he" ? "שם האורך" : "اسم الطول";

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg">
        <span className="flex-1 text-sm font-medium text-gray-800">{label || <span className="text-gray-300 italic">—</span>}</span>
        <span className="text-xs text-gray-400 font-mono w-16">{item.value}</span>
        <button onClick={() => { setDraft(item); setEditing(true); }} className="text-gray-400 hover:text-gray-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
      {locale === "he" ? (
        <Input value={draft.label_he} onChange={(e) => setDraft(p => ({ ...p, label_he: e.target.value }))} placeholder={placeholder} className="flex-1 h-8 text-sm" autoFocus={isNew} />
      ) : (
        <Input value={draft.label_ar} onChange={(e) => setDraft(p => ({ ...p, label_ar: e.target.value }))} placeholder={placeholder} className="flex-1 h-8 text-sm" dir="rtl" autoFocus={isNew} />
      )}
      <Input value={draft.value} onChange={(e) => setDraft(p => ({ ...p, value: e.target.value }))} placeholder="e.g. 2m" className="w-24 h-8 text-xs" />
      <button onClick={handleSave} disabled={saving} className="text-green-600 hover:text-green-800 disabled:opacity-40 shrink-0">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={() => { if (isNew) { onDelete(); } else { setDraft(item); setEditing(false); } }} className="text-gray-400 hover:text-gray-600 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/* ── Main page ── */
const AdminAttributes = () => {
  const { toast } = useToast();
  const { locale } = useAdminLanguage();
  const { data: colors = [], isLoading: cLoading } = useColorTaxonomy();
  const { data: lengths = [], isLoading: lLoading } = useLengthTaxonomy();
  const saveColors = useSaveColorTaxonomy();
  const saveLengths = useSaveLengthTaxonomy();

  // Local lists for unsaved add/delete (row edits save immediately via onSave)
  const [localColors, setLocalColors] = useState<TaxColor[] | null>(null);
  const [localLengths, setLocalLengths] = useState<TaxLength[] | null>(null);

  const activeColors = localColors ?? colors;
  const activeLengths = localLengths ?? lengths;

  // Called when a row's ✓ is clicked — saves the whole list immediately
  const handleSaveColor = async (idx: number, v: TaxColor) => {
    const updated = activeColors.map((x, i) => i === idx ? v : x);
    try {
      await saveColors.mutateAsync(updated);
      setLocalColors(null); // let query take over
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message, variant: "destructive" });
    }
  };

  const handleSaveLength = async (idx: number, v: TaxLength) => {
    const updated = activeLengths.map((x, i) => i === idx ? v : x);
    try {
      await saveLengths.mutateAsync(updated);
      setLocalLengths(null);
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message, variant: "destructive" });
    }
  };

  const handleDeleteColor = async (idx: number) => {
    const updated = activeColors.filter((_, i) => i !== idx);
    try {
      await saveColors.mutateAsync(updated);
      setLocalColors(null);
    } catch (e: any) {
      // Optimistic: update local anyway
      setLocalColors(updated);
      toast({ title: "Save failed", description: e?.message, variant: "destructive" });
    }
  };

  const handleDeleteLength = async (idx: number) => {
    const updated = activeLengths.filter((_, i) => i !== idx);
    try {
      await saveLengths.mutateAsync(updated);
      setLocalLengths(null);
    } catch (e: any) {
      setLocalLengths(updated);
      toast({ title: "Save failed", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attributes</h1>
        <p className="text-gray-500 text-sm mt-1">Manage global colors and lengths used across products</p>
      </div>

      {/* Colors */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Colors</h2>
          <Button variant="outline" size="sm" onClick={() => setLocalColors([...activeColors, { id: uid(), label_he: "", label_ar: "", hex: "#3b82f6" }])}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Color
          </Button>
        </div>
        {cLoading ? <p className="text-gray-400 text-sm">Loading...</p> : (
          <div className="space-y-2">
            {activeColors.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No colors defined yet</p>}
            {activeColors.map((c, idx) => (
              <ColorRow
                key={c.id}
                item={c}
                locale={locale}
                onSave={(v) => handleSaveColor(idx, v)}
                onDelete={() => handleDeleteColor(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lengths */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Lengths (אורך)</h2>
          <Button variant="outline" size="sm" onClick={() => setLocalLengths([...activeLengths, { id: uid(), label_he: "", label_ar: "", value: "" }])}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Length
          </Button>
        </div>
        {lLoading ? <p className="text-gray-400 text-sm">Loading...</p> : (
          <div className="space-y-2">
            {activeLengths.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No lengths defined yet</p>}
            {activeLengths.map((l, idx) => (
              <LengthRow
                key={l.id}
                item={l}
                locale={locale}
                onSave={(v) => handleSaveLength(idx, v)}
                onDelete={() => handleDeleteLength(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttributes;
