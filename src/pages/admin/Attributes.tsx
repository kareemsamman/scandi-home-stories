import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { useColorTaxonomy, useLengthTaxonomy, useSaveColorTaxonomy, useSaveLengthTaxonomy, TaxColor, TaxLength } from "@/hooks/useProductTaxonomy";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const uid = () => Math.random().toString(36).slice(2, 9);

/* ── Inline row editor ── */
const ColorRow = ({ item, onSave, onDelete }: {
  item: TaxColor; onSave: (v: TaxColor) => void; onDelete: () => void;
}) => {
  const [editing, setEditing] = useState(!item.label_he);
  const [draft, setDraft] = useState(item);

  if (!editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg">
        <div className="w-6 h-6 rounded-full border border-gray-200 shrink-0" style={{ background: item.hex }} />
        <span className="flex-1 text-sm font-medium text-gray-800">{item.label_he}</span>
        <span className="text-sm text-gray-400 flex-1" dir="rtl">{item.label_ar}</span>
        <span className="text-xs text-gray-300 font-mono w-16">{item.hex}</span>
        <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
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
      <Input value={draft.label_he} onChange={(e) => setDraft(p => ({ ...p, label_he: e.target.value }))} placeholder="שם (עברית)" className="flex-1 h-8 text-sm" />
      <Input value={draft.label_ar} onChange={(e) => setDraft(p => ({ ...p, label_ar: e.target.value }))} placeholder="اسم (عربي)" className="flex-1 h-8 text-sm" dir="rtl" />
      <Input value={draft.hex} onChange={(e) => setDraft(p => ({ ...p, hex: e.target.value }))} placeholder="#cccccc" className="w-24 h-8 text-xs font-mono" />
      <button onClick={() => { onSave(draft); setEditing(false); }} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
      <button onClick={() => { if (!item.label_he) onDelete(); setEditing(false); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
    </div>
  );
};

const LengthRow = ({ item, onSave, onDelete }: {
  item: TaxLength; onSave: (v: TaxLength) => void; onDelete: () => void;
}) => {
  const [editing, setEditing] = useState(!item.label_he);
  const [draft, setDraft] = useState(item);

  if (!editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg">
        <span className="flex-1 text-sm font-medium text-gray-800">{item.label_he}</span>
        <span className="text-sm text-gray-400 flex-1" dir="rtl">{item.label_ar}</span>
        <span className="text-xs text-gray-400 font-mono w-16">{item.value}</span>
        <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
      <Input value={draft.label_he} onChange={(e) => setDraft(p => ({ ...p, label_he: e.target.value }))} placeholder="שם (עברית)" className="flex-1 h-8 text-sm" />
      <Input value={draft.label_ar} onChange={(e) => setDraft(p => ({ ...p, label_ar: e.target.value }))} placeholder="اسم (عربي)" className="flex-1 h-8 text-sm" dir="rtl" />
      <Input value={draft.value} onChange={(e) => setDraft(p => ({ ...p, value: e.target.value }))} placeholder="value (e.g. 2m)" className="w-24 h-8 text-xs" />
      <button onClick={() => { onSave(draft); setEditing(false); }} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
      <button onClick={() => { if (!item.label_he) onDelete(); setEditing(false); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
    </div>
  );
};

const AdminAttributes = () => {
  const { toast } = useToast();
  const { data: colors = [], isLoading: cLoading } = useColorTaxonomy();
  const { data: lengths = [], isLoading: lLoading } = useLengthTaxonomy();
  const saveColors = useSaveColorTaxonomy();
  const saveLengths = useSaveLengthTaxonomy();

  const [localColors, setLocalColors] = useState<TaxColor[] | null>(null);
  const [localLengths, setLocalLengths] = useState<TaxLength[] | null>(null);

  const activeColors = localColors ?? colors;
  const activeLengths = localLengths ?? lengths;

  const handleSaveColors = async () => {
    await saveColors.mutateAsync(activeColors);
    setLocalColors(null);
    toast({ title: "Colors saved" });
  };

  const handleSaveLengths = async () => {
    await saveLengths.mutateAsync(activeLengths);
    setLocalLengths(null);
    toast({ title: "Lengths saved" });
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
