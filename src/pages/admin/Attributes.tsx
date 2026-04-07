import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X, GripVertical } from "lucide-react";
import { useColorTaxonomy, useLengthTaxonomy, useSaveColorTaxonomy, useSaveLengthTaxonomy, useCustomColorGroups, useSaveCustomColorGroups, useBrandTaxonomy, useSaveBrandTaxonomy, TaxColor, TaxLength, TaxBrand, TaxCustomColorGroup, TaxCustomColor } from "@/hooks/useProductTaxonomy";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableItem = ({ id, children }: { id: string; children: (handleProps: any) => React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? "opacity-50 z-50 relative" : ""}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
};

const uid = () => Math.random().toString(36).slice(2, 9);

/* ── Color Row ── */
const ColorRow = ({ item, locale, onSave, onDelete, dragHandleProps }: {
  item: TaxColor; locale: "he" | "ar";
  onSave: (v: TaxColor) => Promise<void>; onDelete: () => void;
  dragHandleProps?: any;
}) => {
  const isNew = !item.label_he && !item.label_ar;
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);
  const [arTouched, setArTouched] = useState(!!item.label_ar);

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
        <button {...dragHandleProps} className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0"><GripVertical className="w-4 h-4" /></button>
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
      <div className="relative shrink-0 w-8 h-8 rounded-full border-2 border-white ring-1 ring-gray-300 overflow-hidden cursor-pointer" style={{ background: draft.hex }}>
        <input
          type="color"
          value={draft.hex}
          onChange={(e) => setDraft(p => ({ ...p, hex: e.target.value }))}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          title="Pick color"
        />
      </div>
      {locale === "he" ? (
        <Input
          value={draft.label_he}
          onChange={(e) => { const v = e.target.value; setDraft(p => ({ ...p, label_he: v, label_ar: arTouched ? p.label_ar : v })); }}
          placeholder={placeholder} className="flex-1 h-8 text-sm" autoFocus={isNew}
        />
      ) : (
        <Input
          value={draft.label_ar}
          onChange={(e) => { setArTouched(true); setDraft(p => ({ ...p, label_ar: e.target.value })); }}
          placeholder={placeholder} className="flex-1 h-8 text-sm" dir="rtl" autoFocus={isNew}
        />
      )}
      <Input
        value={draft.hex}
        onChange={(e) => setDraft(p => ({ ...p, hex: e.target.value }))}
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
const LengthRow = ({ item, locale, onSave, onDelete, dragHandleProps }: {
  item: TaxLength; locale: "he" | "ar";
  onSave: (v: TaxLength) => Promise<void>; onDelete: () => void;
  dragHandleProps?: any;
}) => {
  const isNew = !item.label_he && !item.label_ar;
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);
  const [arTouched, setArTouched] = useState(!!item.label_ar);

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
        <button {...dragHandleProps} className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0"><GripVertical className="w-4 h-4" /></button>
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
        <Input
          value={draft.label_he}
          onChange={(e) => { const v = e.target.value; setDraft(p => ({ ...p, label_he: v, label_ar: arTouched ? p.label_ar : v })); }}
          placeholder={placeholder} className="flex-1 h-8 text-sm" autoFocus={isNew}
        />
      ) : (
        <Input
          value={draft.label_ar}
          onChange={(e) => { setArTouched(true); setDraft(p => ({ ...p, label_ar: e.target.value })); }}
          placeholder={placeholder} className="flex-1 h-8 text-sm" dir="rtl" autoFocus={isNew}
        />
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

/* ── Brand Row ── */
const BrandRow = ({ item, locale, onSave, onDelete, dragHandleProps }: {
  item: TaxBrand; locale: "he" | "ar";
  onSave: (v: TaxBrand) => Promise<void>; onDelete: () => void;
  dragHandleProps?: any;
}) => {
  const isNew = !item.name_he && !item.name_ar;
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);
  const [arTouched, setArTouched] = useState(!!item.name_ar);

  const label = locale === "he" ? item.name_he : item.name_ar;
  const placeholder = locale === "he" ? "שם המותג" : "اسم العلامة التجارية";

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg">
        <button {...dragHandleProps} className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0"><GripVertical className="w-4 h-4" /></button>
        <span className="flex-1 text-sm font-medium text-gray-800">{label || <span className="text-gray-300 italic">—</span>}</span>
        <button onClick={() => { setDraft(item); setEditing(true); }} className="text-gray-400 hover:text-gray-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
      {locale === "he" ? (
        <Input
          value={draft.name_he}
          onChange={(e) => { const v = e.target.value; setDraft(p => ({ ...p, name_he: v, name_ar: arTouched ? p.name_ar : v })); }}
          placeholder={placeholder} className="flex-1 h-8 text-sm" autoFocus={isNew}
        />
      ) : (
        <Input
          value={draft.name_ar}
          onChange={(e) => { setArTouched(true); setDraft(p => ({ ...p, name_ar: e.target.value })); }}
          placeholder={placeholder} className="flex-1 h-8 text-sm" dir="rtl" autoFocus={isNew}
        />
      )}
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
  const { data: brands = [], isLoading: bLoading } = useBrandTaxonomy();
  const saveColors = useSaveColorTaxonomy();
  const saveLengths = useSaveLengthTaxonomy();
  const saveBrands = useSaveBrandTaxonomy();
  const { data: customGroups = [], isLoading: cgLoading } = useCustomColorGroups();
  const saveCustomGroups = useSaveCustomColorGroups();

  // Local lists for unsaved add/delete (row edits save immediately via onSave)
  const [localColors, setLocalColors] = useState<TaxColor[] | null>(null);
  const [localLengths, setLocalLengths] = useState<TaxLength[] | null>(null);
  const [localBrands, setLocalBrands] = useState<TaxBrand[] | null>(null);
  const [localGroups, setLocalGroups] = useState<TaxCustomColorGroup[] | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [groupSearch, setGroupSearch] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeColors = localColors ?? colors;
  const activeLengths = localLengths ?? lengths;
  const activeBrands = localBrands ?? brands;

  const handleDragColors = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = activeColors.findIndex(c => c.id === active.id);
    const newIdx = activeColors.findIndex(c => c.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(activeColors, oldIdx, newIdx);
    setLocalColors(reordered);
    saveColors.mutate(reordered);
  };

  const handleDragLengths = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = activeLengths.findIndex(l => l.id === active.id);
    const newIdx = activeLengths.findIndex(l => l.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(activeLengths, oldIdx, newIdx);
    setLocalLengths(reordered);
    saveLengths.mutate(reordered);
  };

  const handleDragBrands = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = activeBrands.findIndex(b => b.id === active.id);
    const newIdx = activeBrands.findIndex(b => b.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(activeBrands, oldIdx, newIdx);
    setLocalBrands(reordered);
    saveBrands.mutate(reordered);
  };

  const handleSaveColor = async (idx: number, v: TaxColor) => {
    const updated = activeColors.map((x, i) => i === idx ? v : x);
    try { await saveColors.mutateAsync(updated); setLocalColors(null); }
    catch (e: any) { toast({ title: "Save failed", description: e?.message, variant: "destructive" }); }
  };

  const handleSaveLength = async (idx: number, v: TaxLength) => {
    const updated = activeLengths.map((x, i) => i === idx ? v : x);
    try { await saveLengths.mutateAsync(updated); setLocalLengths(null); }
    catch (e: any) { toast({ title: "Save failed", description: e?.message, variant: "destructive" }); }
  };

  const handleSaveBrand = async (idx: number, v: TaxBrand) => {
    const updated = activeBrands.map((x, i) => i === idx ? v : x);
    try { await saveBrands.mutateAsync(updated); setLocalBrands(null); }
    catch (e: any) { toast({ title: "Save failed", description: e?.message, variant: "destructive" }); }
  };

  const handleDeleteColor = async (idx: number) => {
    const updated = activeColors.filter((_, i) => i !== idx);
    try { await saveColors.mutateAsync(updated); setLocalColors(null); }
    catch (e: any) { setLocalColors(updated); toast({ title: "Save failed", description: e?.message, variant: "destructive" }); }
  };

  const handleDeleteLength = async (idx: number) => {
    const updated = activeLengths.filter((_, i) => i !== idx);
    try { await saveLengths.mutateAsync(updated); setLocalLengths(null); }
    catch (e: any) { setLocalLengths(updated); toast({ title: "Save failed", description: e?.message, variant: "destructive" }); }
  };

  const handleDeleteBrand = async (idx: number) => {
    const updated = activeBrands.filter((_, i) => i !== idx);
    try { await saveBrands.mutateAsync(updated); setLocalBrands(null); }
    catch (e: any) { setLocalBrands(updated); toast({ title: "Save failed", description: e?.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attributes</h1>
        <p className="text-gray-500 text-sm mt-1">Manage global colors, lengths, and brands used across products</p>
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragColors}>
            <SortableContext items={activeColors.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {activeColors.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No colors defined yet</p>}
                {activeColors.map((c, idx) => (
                  <SortableItem key={c.id} id={c.id}>
                    {(handleProps) => <ColorRow item={c} locale={locale} onSave={(v) => handleSaveColor(idx, v)} onDelete={() => handleDeleteColor(idx)} dragHandleProps={handleProps} />}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragLengths}>
            <SortableContext items={activeLengths.map(l => l.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {activeLengths.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No lengths defined yet</p>}
                {activeLengths.map((l, idx) => (
                  <SortableItem key={l.id} id={l.id}>
                    {(handleProps) => <LengthRow item={l} locale={locale} onSave={(v) => handleSaveLength(idx, v)} onDelete={() => handleDeleteLength(idx)} dragHandleProps={handleProps} />}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Brands */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Brands (מותגים)</h2>
          <Button variant="outline" size="sm" onClick={() => setLocalBrands([...activeBrands, { id: uid(), name_he: "", name_ar: "" }])}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Brand
          </Button>
        </div>
        {bLoading ? <p className="text-gray-400 text-sm">Loading...</p> : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragBrands}>
            <SortableContext items={activeBrands.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {activeBrands.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No brands defined yet</p>}
                {activeBrands.map((b, idx) => (
                  <SortableItem key={b.id} id={b.id}>
                    {(handleProps) => <BrandRow item={b} locale={locale} onSave={(v) => handleSaveBrand(idx, v)} onDelete={() => handleDeleteBrand(idx)} dragHandleProps={handleProps} />}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Custom Color Groups */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Custom Color Groups</h2>
            <p className="text-xs text-gray-400 mt-0.5">Color tabs shown in the custom color picker on product pages</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newGroup: TaxCustomColorGroup = { id: uid(), name_he: "", name_ar: "", sort_order: (localGroups ?? customGroups).length, colors: [] };
              const updated = [...(localGroups ?? customGroups), newGroup];
              setLocalGroups(updated);
              setActiveTab(updated.length - 1);
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Group
          </Button>
        </div>

        {cgLoading ? <p className="text-gray-400 text-sm">Loading...</p> : (() => {
          const groups = localGroups ?? customGroups;
          if (groups.length === 0) return <p className="text-gray-400 text-sm text-center py-4">No color groups yet. Click "Add Group" to create one.</p>;

          const safeTab = Math.min(activeTab, groups.length - 1);
          const activeGroup = groups[safeTab];

          const updateGroup = (idx: number, field: keyof TaxCustomColorGroup, value: any) => {
            const updated = groups.map((g, i) => i === idx ? { ...g, [field]: value } : g);
            setLocalGroups(updated);
          };
          const deleteGroup = async (idx: number) => {
            const updated = groups.filter((_, i) => i !== idx);
            try { await saveCustomGroups.mutateAsync(updated); setLocalGroups(null); setActiveTab(0); }
            catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
          };
          const addColor = () => {
            const newColor: TaxCustomColor = { id: uid(), name_he: "", name_ar: "", hex: "#cccccc" };
            updateGroup(safeTab, "colors", [...activeGroup.colors, newColor]);
          };
          const updateColor = (ci: number, field: keyof TaxCustomColor, value: string) => {
            const newColors = activeGroup.colors.map((c, i) => i === ci ? { ...c, [field]: value } : c);
            updateGroup(safeTab, "colors", newColors);
          };
          const deleteColor = (ci: number) => {
            updateGroup(safeTab, "colors", activeGroup.colors.filter((_, i) => i !== ci));
          };
          const saveAll = async () => {
            try { await saveCustomGroups.mutateAsync(groups); setLocalGroups(null); toast({ title: "Saved" }); }
            catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
          };

          const filteredColors = activeGroup.colors.filter(c =>
            !groupSearch || c.name_he.toLowerCase().includes(groupSearch.toLowerCase()) || c.name_ar.toLowerCase().includes(groupSearch.toLowerCase()) || c.hex.includes(groupSearch)
          );

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-1 flex-wrap border-b border-gray-200">
                {groups.map((g, gi) => (
                  <button
                    key={gi}
                    onClick={() => setActiveTab(gi)}
                    className={`px-4 py-2 text-sm border-b-2 transition-colors -mb-px ${safeTab === gi ? "border-gray-900 text-gray-900 font-medium" : "border-transparent text-gray-400 hover:text-gray-700"}`}
                  >
                    {g.name_he || `Group ${gi + 1}`}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Tab Name (Hebrew)</label>
                  <Input value={activeGroup.name_he} onChange={e => updateGroup(safeTab, "name_he", e.target.value)} placeholder="e.g. RAL צבע קוד" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Tab Name (Arabic)</label>
                  <Input value={activeGroup.name_ar} onChange={e => updateGroup(safeTab, "name_ar", e.target.value)} placeholder="e.g. RAL كود اللون" dir="rtl" />
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={groupSearch}
                  onChange={e => setGroupSearch(e.target.value)}
                  placeholder="Search colors in this group..."
                  className="w-full h-9 pl-3 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredColors.map((color, ci) => {
                  const realIdx = activeGroup.colors.indexOf(color);
                  return (
                    <div key={ci} className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                      <div className="relative shrink-0 w-8 h-8 rounded-full border border-gray-200 overflow-hidden cursor-pointer" style={{ background: color.hex }}>
                        <input type="color" value={color.hex} onChange={e => updateColor(realIdx, "hex", e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                      </div>
                      <span className="text-xs text-gray-400 font-mono w-16 shrink-0">{color.hex}</span>
                      <Input value={color.name_he} onChange={e => updateColor(realIdx, "name_he", e.target.value)} placeholder="שם HE" className="flex-1 h-8 text-sm" />
                      <Input value={color.name_ar} onChange={e => updateColor(realIdx, "name_ar", e.target.value)} placeholder="اسم AR" className="flex-1 h-8 text-sm" dir="rtl" />
                      <button onClick={() => deleteColor(realIdx)} className="text-red-400 hover:text-red-600 p-1 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  );
                })}
                {activeGroup.colors.length === 0 && <p className="text-gray-400 text-sm text-center py-3">No colors in this group yet</p>}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addColor}><Plus className="w-3.5 h-3.5 mr-1" /> Add Color</Button>
                  <button onClick={() => deleteGroup(safeTab)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove tab</button>
                </div>
                <Button size="sm" onClick={saveAll} disabled={saveCustomGroups.isPending} className="bg-gray-900 hover:bg-gray-800 text-white">
                  {saveCustomGroups.isPending ? "Saving..." : "Save All Groups"}
                </Button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default AdminAttributes;
