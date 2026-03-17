import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { useColorTaxonomy, useLengthTaxonomy, useSaveColorTaxonomy, useSaveLengthTaxonomy, TaxColor, TaxLength } from "@/hooks/useProductTaxonomy";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const uid = () => Math.random().toString(36).slice(2, 9);

const ColorRow = ({ item, locale, onSave, onDelete }: {
  item: TaxColor; locale: "he" | "ar"; onSave: (v: TaxColor) => void; onDelete: () => void;
}) => {
  const isNew = !item.label_he && !item.label_ar;
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState(item);

  const label = locale === "he" ? item.label_he : item.label_ar;
  const placeholder = locale === "he" ? "שם הצבע" : "اسم اللون";

  if (!editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg">
        <div className="w-6 h-6 rounded-full border border-gray-200 shrink-0" style={{ background: item.hex }} />
        <span className="flex-1 text-sm font-medium text-gray-800">{label || <span className="text-gray-300 italic">—</span>}</span>
        <span className="text-xs text-gray-300 font-mono w-16">{item.hex}</span>
        <button onClick={() => { setDraft(item); setEditing(true); }} className="text-gray-400 hover:text-gray-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="w-8 h-8 rounded-full border border-gray-300 shrink-0 relative overflow-hidden cursor-pointer" style={{ background: draft.hex }}>
        <input type="color" value={draft.hex} onChange={(e) => setDraft(p => ({ ...p, hex: e.target.value }))}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
      </div>
      {locale === "he" ? (
        <Input value={draft.label_he} onChange={(e) => setDraft(p => ({ ...p, label_he: e.target.value }))} placeholder={placeholder} className="flex-1 h-8 text-sm" />
      ) : (
        <Input value={draft.label_ar} onChange={(e) => setDraft(p => ({ ...p, label_ar: e.target.value }))} placeholder={placeholder} className="flex-1 h-8 text-sm" dir="rtl" />
      )}
      <Input value={draft.hex} onChange={(e) => setDraft(p => ({ ...p, hex: e.target.value }))} placeholder="#cccccc" className="w-24 h-8 text-xs font-mono" />
      <button onClick={() => { onSave(draft); setEditing(false); }} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
      <button onClick={() => { if (isNew) { onDelete(); } else { setEditing(false); } }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
    </div>
  );
};

const LengthRow = ({ item, locale, onSave, onDelete }: {
  item: TaxLength; locale: "he" | "ar"; onSave: (v: TaxLength) => void; onDelete: () => void;
}) => {
  const isNew = !item.label_he && !item.label_ar;
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState(item);

  const label = locale === "he" ? item.label_he : item.label_ar;
  const placeholder = locale === "he" ? "שם האורך" : "اسم الطول";

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
    <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
      {locale === "he" ? (
        <Input value={draft.label_he} onChange={(e) => setDraft(p => ({ ...p, label_he: e.target.value }))} placeholder={placeholder} className="flex-1 h-8 text-sm" />
      ) : (
        <Input value={draft.label_ar} onChange={(e) => setDraft(p => ({ ...p, label_ar: e.target.value }))} placeholder={placeholder} className="flex-1 h-8 text-sm" dir="rtl" />
      )}
      <Input value={draft.value} onChange={(e) => setDraft(p => ({ ...p, value: e.target.value }))} placeholder="e.g. 2m" className="w-24 h-8 text-xs" />
      <button onClick={() => { onSave(draft); setEditing(false); }} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
      <button onClick={() => { if (isNew) { onDelete(); } else { setEditing(false); } }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
    </div>
  );
};

const AdminAttributes = () => {
  const { toast } = useToast();
  const { locale } = useAdminLanguage();
  const { data: colors = [], isLoading: cLoading } = useColorTaxonomy();
  const { data: lengths = [], isLoading: lLoading } = useLengthTaxonomy();
  const saveColors = useSaveColorTaxonomy();
  const saveLengths = useSaveLengthTaxonomy();

  const [localColors, setLocalColors] = useState<TaxColor[] | null>(null);
  const [localLengths, setLocalLengths] = useState<TaxLength[] | null>(null);

  const activeColors = localColors ?? colors;
  const activeLengths = localLengths ?? lengths;

  const handleSaveColors = async () => {
    try {
      await saveColors.mutateAsync(activeColors);
      setLocalColors(null);
      toast({ title: "Colors saved" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  const handleSaveLengths = async () => {
    try {
      await saveLengths.mutateAsync(activeLengths);
      setLocalLengths(null);
      toast({ title: "Lengths saved" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message ?? "Unknown error", variant: "destructive" });
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocalColors([...activeColors, { id: uid(), label_he: "", label_ar: "", hex: "#cccccc" }])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Color
            </Button>
            <Button size="sm" onClick={handleSaveColors} disabled={saveColors.isPending} className="bg-gray-900 text-white hover:bg-gray-800">
              {saveColors.isPending ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
        {cLoading ? <p className="text-gray-400 text-sm">Loading...</p> : (
          <div className="space-y-2">
            {activeColors.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No colors defined yet</p>}
            {activeColors.map((c, idx) => (
              <ColorRow
                key={c.id}
                item={c}
                locale={locale}
                onSave={(v) => setLocalColors(activeColors.map((x, i) => i === idx ? v : x))}
                onDelete={() => setLocalColors(activeColors.filter((_, i) => i !== idx))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lengths */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Lengths (אורך)</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocalLengths([...activeLengths, { id: uid(), label_he: "", label_ar: "", value: "" }])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Length
            </Button>
            <Button size="sm" onClick={handleSaveLengths} disabled={saveLengths.isPending} className="bg-gray-900 text-white hover:bg-gray-800">
              {saveLengths.isPending ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
        {lLoading ? <p className="text-gray-400 text-sm">Loading...</p> : (
          <div className="space-y-2">
            {activeLengths.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No lengths defined yet</p>}
            {activeLengths.map((l, idx) => (
              <LengthRow
                key={l.id}
                item={l}
                locale={locale}
                onSave={(v) => setLocalLengths(activeLengths.map((x, i) => i === idx ? v : x))}
                onDelete={() => setLocalLengths(activeLengths.filter((_, i) => i !== idx))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttributes;
