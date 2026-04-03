import { X, Plus, Trash2, Lightbulb, AlertCircle } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { usePergolaEditor, canAddPost, canRemovePost, canTogglePostLight } from "@/stores/usePergolaEditor";
import { usePergolaConfigurator } from "@/stores/usePergolaConfigurator";
import { calcSlatCount, getSlatProfileWidth } from "@/lib/pergolaRules";
import { cmToMm, mmToCm, STANDARD_COLORS, SLAT_COLORS, SANTAF_COLORS, SLAT_SIZES, LIGHTING_TEMPS } from "@/types/pergola";
import type { LightingChoice, SantafChoice, SlatSizeId } from "@/types/pergola";
import { calcPostCount } from "@/lib/pergolaRules";

export const PergolaElementEditor = () => {
  const { selected, select, isAdmin } = usePergolaEditor();
  const { config, specs, setConfig } = usePergolaConfigurator();
  const { t, locale } = useLocale();

  if (!selected || !specs) return null;

  const widthMm = cmToMm(Number(config.widthCm) || 400);
  const lighting = config.lighting || "none";
  const lightingPosts = config.lightingPosts || [];
  const frontCount = specs.frontPostCount;

  const close = () => select(null);

  // ── Post editor ──
  if (selected.type === "front_post" || selected.type === "back_post") {
    const idx = selected.index;
    const isFront = selected.type === "front_post";
    const globalIdx = isFront ? idx : idx + frontCount;
    const hasLight = lightingPosts.includes(globalIdx);
    const lightCheck = canTogglePostLight(lighting as LightingChoice);
    const removeCheck = canRemovePost(widthMm, frontCount, isAdmin);
    const addCheck = canAddPost(widthMm, config.mountType || "wall", frontCount, isAdmin);

    const toggleLight = () => {
      if (!lightCheck.allowed) return;
      const next = hasLight
        ? lightingPosts.filter((i) => i !== globalIdx)
        : [...lightingPosts, globalIdx];
      setConfig({ lightingPosts: next, lightingPosition: "selected_posts" });
    };

    const removePost = () => {
      if (!removeCheck.allowed) return;
      const newCount = frontCount - 1;
      // Rebuild lighting posts indices to stay valid
      const newLp = lightingPosts.filter((i) => i < newCount + specs.backPostCount);
      setConfig({ lightingPosts: newLp });
      // We signal post count change via admin_modified in specs — store override
      // For now, adjust width slightly to force recalc, or use direct override
      close();
    };

    const addPost = () => {
      if (!addCheck.allowed) return;
      close();
    };

    return (
      <Panel onClose={close} title={isFront ? `עמוד קדמי ${idx + 1}` : `עמוד אחורי ${idx + 1}`}>

        {/* Lighting toggle */}
        <div className="space-y-2">
          <Label>תאורה בעמוד</Label>
          {lighting === "none" ? (
            <Blocked reason="יש לבחור סוג תאורה בהגדרות" />
          ) : (
            <div className="flex gap-2">
              <ToggleBtn active={!hasLight} onClick={() => { if (hasLight) toggleLight(); }} label="ללא" />
              {LIGHTING_TEMPS.map((lt) => (
                <ToggleBtn key={lt.id} active={hasLight && lighting === lt.id}
                  onClick={() => { if (!hasLight) toggleLight(); if (lighting !== lt.id) setConfig({ lighting: lt.id as LightingChoice }); }}
                  label={lt.label} dot={`bg-[${lt.color}]`} />
              ))}
            </div>
          )}
        </div>

        {/* Add/Remove post */}
        {isAdmin && (
          <div className="flex gap-2 mt-3">
            <ActionBtn icon={<Trash2 className="w-3.5 h-3.5" />} label="הסר עמוד" onClick={removePost} disabled={!removeCheck.allowed} reason={removeCheck.reason} />
            <ActionBtn icon={<Plus className="w-3.5 h-3.5" />} label="הוסף עמוד" onClick={addPost} disabled={!addCheck.allowed} reason={addCheck.reason} />
          </div>
        )}
      </Panel>
    );
  }

  // ── Roof / Fabric editor ──
  if (selected.type === "roof") {
    return (
      <Panel onClose={close} title="גג / בד">
        <Label>צבע גג / בד</Label>
        <ColorPicker
          value={config.roofColor || "#C0C0C0"}
          colors={STANDARD_COLORS}
          locale={locale}
          onChange={(hex) => setConfig({ roofColor: hex })}
        />
      </Panel>
    );
  }

  // ── Frame editor ──
  if (selected.type === "frame") {
    return (
      <Panel onClose={close} title="מסגרת">
        <Label>צבע מסגרת</Label>
        <ColorPicker
          value={config.frameColor || "#383838"}
          colors={STANDARD_COLORS}
          locale={locale}
          onChange={(hex) => setConfig({ frameColor: hex })}
        />
      </Panel>
    );
  }

  // ── Santaf editor ──
  if (selected.type === "santaf") {
    const isWith = config.santaf === "with";
    return (
      <Panel onClose={close} title="גג סנטף">
        <div className="flex gap-2 mb-3">
          <ToggleBtn active={!isWith} onClick={() => setConfig({ santaf: "without", santafColor: "" })} label="ללא" />
          <ToggleBtn active={isWith} onClick={() => setConfig({ santaf: "with" })} label="עם סנטף" />
        </div>
        {isWith && (
          <>
            <Label>צבע סנטף</Label>
            <ColorPicker
              value={config.santafColor || "#7A8B9A"}
              colors={SANTAF_COLORS}
              locale={locale}
              onChange={(hex) => setConfig({ santafColor: hex })}
            />
          </>
        )}
      </Panel>
    );
  }

  // ── Roof lighting editor ──
  if (selected.type === "roof_lighting") {
    return (
      <Panel onClose={close} title="תאורת גג / היקף">
        {lighting === "none" ? (
          <Blocked reason="יש לבחור סוג תאורה בהגדרות" />
        ) : (
          <div className="flex gap-2">
            <ToggleBtn active={!config.lightingRoof} onClick={() => setConfig({ lightingRoof: false })} label="כבוי" />
            <ToggleBtn active={!!config.lightingRoof} onClick={() => setConfig({ lightingRoof: true })} label="מופעל" dot="bg-yellow-300" />
          </div>
        )}
      </Panel>
    );
  }

  // ── Carrier section editor (per-נשא) ──
  if (selected.type === "carrier") {
    const secIdx = selected.index;
    const { carrierConfigs, setCarrierConfig } = usePergolaConfigurator.getState();
    const sectionCount = carrierConfigs.length;
    const logicalIdx = Math.max(0, Math.min(sectionCount - 1, sectionCount - 1 - secIdx));
    const displayNum = logicalIdx + 1;
    const cc = carrierConfigs[logicalIdx];
    const isFixedSlats = config.pergolaType === "fixed" && config.roofFillMode === "slats";

    if (!isFixedSlats || !cc) {
      // Fallback: just show spacing controls if not fixed slats
      return (
        <Panel onClose={close} title={`חלוקה ${displayNum}`}>
          <Label>מרווח בין קורות חלוקה</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {(["automatic", "dense", "standard", "wide"] as const).map((m) => (
              <ToggleBtn key={m} active={config.spacingMode === m} onClick={() => setConfig({ spacingMode: m })}
                label={m === "automatic" ? "אוטומטי" : m === "dense" ? "צפוף" : m === "standard" ? "רגיל" : "רחב"} />
            ))}
          </div>
        </Panel>
      );
    }

    const gapPresets = [1, 2, 3, 4];
    const secLengthMm = cmToMm(Number(config.lengthCm) || 400);
    const autoSlatCount = calcSlatCount(secLengthMm, cc.slatGapCm * 10, cc.slatSize);
    const secSlatCount = autoSlatCount;

    return (
      <Panel onClose={close} title={`חלוקה ${displayNum} — ${secSlatCount} שלבים`}>
        {/* Read-only info */}
        <div className="text-xs text-gray-500 space-y-1 mb-3">
          <p>{secSlatCount} שלבים &middot; {cc.slatSize} &middot; מרווח {cc.slatGapCm} ס"מ</p>
        </div>

        {/* Lighting — only editable per-section, with color dots */}
        <Label>תאורה בחלוקה</Label>
        <div className="flex gap-1.5">
          <ToggleBtn active={!cc.lightingEnabled} onClick={() => setCarrierConfig(logicalIdx, { lightingEnabled: false, lighting: "none" })} label="ללא" />
          {LIGHTING_TEMPS.map((lt) => (
            <ToggleBtn key={lt.id} active={cc.lightingEnabled && cc.lighting === lt.id}
              onClick={() => setCarrierConfig(logicalIdx, { lightingEnabled: true, lighting: lt.id as LightingChoice })}
              label={lt.label} dotColor={lt.color} />
          ))}
        </div>

        <p className="text-[9px] text-gray-300 mt-3">שינוי גודל, מרווח וצבע — מהפאנל השמאלי (חל על כל החלוקות)</p>
      </Panel>
    );
  }

  // ── Slats editor (fixed pergola) ──
  if (selected.type === "slats") {
    const gapPresets = [1, 2, 3, 4];
    const currentGap = Number(config.slatGapCm) || 3;
    return (
      <Panel onClose={close} title="פרופילים פנימיים / שלבים">
        {/* Roof fill mode toggle */}
        <Label>מצב מילוי גג</Label>
        <div className="flex gap-2 mb-3">
          <ToggleBtn active={config.roofFillMode === "slats"} onClick={() => setConfig({ roofFillMode: "slats", santaf: "without" })} label="פרופילים / שלבים" />
          <ToggleBtn active={config.roofFillMode === "santaf"} onClick={() => setConfig({ roofFillMode: "santaf", santaf: "with" })} label="סנטף בלבד" />
        </div>

        {config.roofFillMode === "slats" && (
          <>
            <Label>גודל פרופיל שלב</Label>
            <div className="flex gap-1.5 mb-3">
              {SLAT_SIZES.map((s) => (
                <ToggleBtn key={s.id} active={(config.slatSize || "20x70") === s.id} onClick={() => setConfig({ slatSize: s.id as SlatSizeId })} label={s.label} />
              ))}
            </div>
            <Label>מרווח בין שלבים (ס"מ)</Label>
            <div className="flex gap-1.5 mb-3">
              {gapPresets.map((g) => (
                <ToggleBtn key={g} active={currentGap === g} onClick={() => setConfig({ slatGapCm: g })} label={`${g} ס"מ`} />
              ))}
            </div>
            {specs && (
              <p className="text-xs text-gray-400">{specs.slatCount} שלבים &middot; מרווח ~{mmToCm(specs.slatGapMm)} ס"מ</p>
            )}
            <div className="mt-3">
              <Label>צבע שלבים</Label>
              <ColorPicker value={config.slatColor || "#383E42"} colors={SLAT_COLORS} locale={locale} onChange={(hex) => setConfig({ slatColor: hex })} />
            </div>
          </>
        )}

        {config.roofFillMode === "santaf" && (
          <div className="mt-2">
            <Label>צבע סנטף</Label>
            <ColorPicker value={config.santafColor || "#7A8B9A"} colors={SANTAF_COLORS} locale={locale} onChange={(hex) => setConfig({ santafColor: hex })} />
          </div>
        )}
      </Panel>
    );
  }

  return null;
};

// ── Sub-components ──

function Panel({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
          <X className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-gray-500 mb-1.5">{children}</p>;
}

function ToggleBtn({ active, onClick, label, dot, dotColor }: { active: boolean; onClick: () => void; label: string; dot?: string; dotColor?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all flex-1 justify-center ${
        active ? "border-gray-900 bg-gray-50 text-gray-900" : "border-gray-100 text-gray-400 hover:border-gray-200"
      }`}
    >
      {(dot || dotColor) && <span className="w-3 h-3 rounded-full shrink-0 border border-gray-200" style={dotColor ? { backgroundColor: dotColor } : undefined} />}
      {label}
    </button>
  );
}

function ColorPicker({ value, colors, locale, onChange }: { value: string; colors: { id: string; name_he: string; name_ar: string; hex: string }[]; locale: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.hex)}
          className={`w-8 h-8 rounded-lg border-2 transition-all ${
            value === c.hex ? "border-gray-900 scale-110 shadow-md" : "border-gray-200 hover:border-gray-400"
          }`}
          style={{ backgroundColor: c.hex }}
          title={locale === "ar" ? c.name_ar : c.name_he}
        />
      ))}
    </div>
  );
}

function Blocked({ reason }: { reason: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {reason}
    </div>
  );
}

function ActionBtn({ icon, label, onClick, disabled, reason }: { icon: React.ReactNode; label: string; onClick: () => void; disabled: boolean; reason?: string }) {
  return (
    <div className="flex-1">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
          disabled
            ? "border-gray-100 text-gray-300 cursor-not-allowed"
            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        }`}
        title={reason}
      >
        {icon}
        {label}
      </button>
      {disabled && reason && <p className="text-[10px] text-gray-300 mt-1 text-center">{reason}</p>}
    </div>
  );
}
