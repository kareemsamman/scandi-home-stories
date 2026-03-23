import { useState, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";

interface A11yState {
  fontSize: number;       // 0 = normal, 1 = medium, 2 = large
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
  // More aggressive font scaling
  const sizes = ["100%", "120%", "145%"];
  root.style.setProperty("--a11y-font-scale", sizes[s.fontSize]);
  root.classList.toggle("a11y-high-contrast", s.highContrast);
  root.classList.toggle("a11y-grayscale", s.grayscale);
  root.classList.toggle("a11y-highlight-links", s.highlightLinks);
  root.classList.toggle("a11y-big-cursor", s.bigCursor);
};

// Wheelchair accessibility icon (ISA symbol)
const WheelchairIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="3.5" r="1.75"/>
    <path d="M10 7.5v5.5l2.5 2.5H17v2h-5.2L9 14.7V7.5H10z"/>
    <path d="M9.5 7.5H13l1.5 4H17v2h-3.5L12 9.5H9.5V7.5z"/>
    <path d="M7 17.5A5 5 0 1 0 17 17.5" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round"/>
  </svg>
);

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

  return (
    <>
      {/* Floating trigger button — black circle */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="פתח תפריט נגישות"
        className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-black hover:bg-gray-800 text-white shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center"
      >
        <WheelchairIcon className="w-6 h-6 text-white" />
      </button>

      {/* Panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            className="fixed bottom-20 left-4 z-50 w-72 rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "#111", border: "1px solid #333" }}
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: "#000", borderBottom: "1px solid #333" }}>
              <div className="flex items-center gap-2 text-white">
                <WheelchairIcon className="w-5 h-5" />
                <span className="font-bold text-sm">נגישות</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">

              {/* Font size */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">גודל גופן</p>
                <div className="flex gap-2">
                  {([
                    { lvl: 0, label: "A",   size: "13px" },
                    { lvl: 1, label: "A+",  size: "16px" },
                    { lvl: 2, label: "A++", size: "20px" },
                  ]).map(({ lvl, label, size }) => (
                    <button
                      key={lvl}
                      onClick={() => update({ fontSize: lvl })}
                      style={{ fontSize: size }}
                      className={`flex-1 h-11 rounded-xl font-bold transition-all border-2 ${
                        state.fontSize === lvl
                          ? "border-white bg-white text-black"
                          : "border-gray-600 text-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              {([
                { key: "highContrast",   label: "ניגודיות גבוהה",  icon: "◑" },
                { key: "grayscale",      label: "גווני אפור",       icon: "◐" },
                { key: "highlightLinks", label: "הדגשת קישורים",   icon: "🔗" },
                { key: "bigCursor",      label: "סמן גדול",         icon: "↖" },
              ] as const).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => update({ [key]: !state[key] })}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                    state[key]
                      ? "border-white bg-white/10 text-white"
                      : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${state[key] ? "bg-white" : "bg-gray-600"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-all ${state[key] ? "bg-black left-[18px]" : "bg-gray-300 left-0.5"}`} />
                  </div>
                </button>
              ))}

              {/* Reset */}
              <button
                onClick={reset}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-gray-700 text-xs font-medium text-gray-400 hover:border-gray-500 hover:text-gray-200 transition-colors"
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
