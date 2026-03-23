import { useState, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";

interface A11yState {
  fontSize: number;       // 0 = normal, 1 = +1, 2 = +2
  highContrast: boolean;
  grayscale: boolean;
  highlightLinks: boolean;
  bigCursor: boolean;
}

const DEFAULT: A11yState = {
  fontSize: 0,
  highContrast: false,
  grayscale: false,
  highlightLinks: false,
  bigCursor: false,
};

const STORAGE_KEY = "amg_a11y";

const load = (): A11yState => {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? { ...DEFAULT, ...JSON.parse(s) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
};

const applyToDOM = (s: A11yState) => {
  const root = document.documentElement;
  const sizes = [100, 115, 130];
  root.style.setProperty("--a11y-font-scale", `${sizes[s.fontSize]}%`);
  root.classList.toggle("a11y-high-contrast", s.highContrast);
  root.classList.toggle("a11y-grayscale", s.grayscale);
  root.classList.toggle("a11y-highlight-links", s.highlightLinks);
  root.classList.toggle("a11y-big-cursor", s.bigCursor);
};

export const AccessibilityWidget = () => {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(DEFAULT);

  useEffect(() => {
    const saved = load();
    setState(saved);
    applyToDOM(saved);
  }, []);

  const update = (patch: Partial<A11yState>) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      applyToDOM(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    setState(DEFAULT);
    applyToDOM(DEFAULT);
    localStorage.removeItem(STORAGE_KEY);
  };

  const fontLabels = ["A", "A+", "A++"];

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="פתח תפריט נגישות"
        className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm8 5.5-1 .3-3.5.7L14 12l2 7-1.5.5L12 13l-2.5 6.5L8 19l2-7-1.5-3.5-3.5-.7-1-.3.5-1.5 3.8.75.7.1h6l.7-.1 3.8-.75.5 1.5Z"/>
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Widget panel */}
          <div
            className="fixed bottom-20 left-4 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm8 5.5-1 .3-3.5.7L14 12l2 7-1.5.5L12 13l-2.5 6.5L8 19l2-7-1.5-3.5-3.5-.7-1-.3.5-1.5 3.8.75.7.1h6l.7-.1 3.8-.75.5 1.5Z"/>
                </svg>
                <span className="font-bold text-sm">נגישות</span>
              </div>
              <button onClick={() => setOpen(false)} className="hover:bg-blue-700 rounded-full p-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">

              {/* Font size */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">גודל גופן</p>
                <div className="flex gap-2">
                  {[0, 1, 2].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => update({ fontSize: lvl })}
                      className={`flex-1 h-10 rounded-xl border-2 font-bold transition-all ${
                        state.fontSize === lvl
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                      style={{ fontSize: `${12 + lvl * 2}px` }}
                    >
                      {fontLabels[lvl]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              {([
                { key: "highContrast",   label: "ניגודיות גבוהה",   icon: "◑" },
                { key: "grayscale",      label: "גווני אפור",        icon: "◐" },
                { key: "highlightLinks", label: "הדגשת קישורים",    icon: "🔗" },
                { key: "bigCursor",      label: "סמן גדול",          icon: "↖" },
              ] as const).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => update({ [key]: !state[key] })}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${
                    state[key]
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${state[key] ? "bg-blue-600" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${state[key] ? "left-[18px]" : "left-0.5"}`} />
                  </div>
                </button>
              ))}

              {/* Reset */}
              <button
                onClick={reset}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                איפוס הגדרות
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
