import { useState, useRef, useEffect, useCallback } from "react";
import { loadAllRecords, searchCities, searchStreets } from "@/utils/cityStreetApi";

export interface AddressState {
  city: string;
  street: string;
  houseNumber: string;
  apartment: string;
  citySelected: boolean;
  streetSelected: boolean;
}

export const emptyAddress = (): AddressState => ({
  city: "", street: "", houseNumber: "", apartment: "",
  citySelected: false, streetSelected: false,
});

interface Props {
  value: AddressState;
  onChange: (s: AddressState) => void;
  errors?: Partial<Record<"city" | "street" | "houseNumber", string>>;
  touched?: Partial<Record<"city" | "street" | "houseNumber", boolean>>;
  onBlur?: (field: string) => void;
  /** Staff (admin/worker) can type freely without selecting from dropdown */
  isStaff?: boolean;
  /** Labels object for i18n; falls back to Hebrew defaults */
  labels?: {
    city?: string; street?: string; houseNumber?: string; apartment?: string;
    selectCity?: string; chooseCity?: string;
  };
}

const FloatingInput = ({
  label, value, onChange, onBlur, error, name, type = "text", dir = "rtl",
}: {
  label: string; value: string; onChange: (v: string) => void;
  onBlur?: () => void; error?: string; name: string; type?: string; dir?: string;
}) => (
  <div className="relative">
    <input
      type={type} name={name} value={value} dir={dir}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder=" "
      className={`peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors ${
        error ? "border-red-400" : "border-border"
      }`}
    />
    <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
      {label}
    </label>
    {error && <p className="text-xs text-red-500 mt-1 px-1">{error}</p>}
  </div>
);

const Dropdown = ({ items, onSelect, emptyMsg }: {
  items: string[]; onSelect: (v: string) => void; emptyMsg?: string;
}) => (
  <div className="absolute z-20 top-full mt-1 w-full bg-white border border-border rounded-xl shadow-xl max-h-52 overflow-y-auto">
    {items.length === 0 && emptyMsg ? (
      <p className="px-4 py-3 text-sm text-muted-foreground">{emptyMsg}</p>
    ) : (
      items.map((item, i) => (
        <button
          key={i} type="button"
          className="w-full text-start px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors border-b border-border/40 last:border-0"
          onMouseDown={e => { e.preventDefault(); onSelect(item); }}
        >
          {item}
        </button>
      ))
    )}
  </div>
);

export const AddressFields = ({ value, onChange, errors, touched, onBlur, isStaff, labels }: Props) => {
  const L = {
    city: labels?.city ?? "עיר",
    street: labels?.street ?? "רחוב",
    houseNumber: labels?.houseNumber ?? "מספר",
    apartment: labels?.apartment ?? "דירה (אופציונלי)",
    selectCity: labels?.selectCity ?? "בחר עיר תחילה",
    chooseCity: labels?.chooseCity ?? "בחר עיר",
  };

  const [cityQuery, setCityQuery] = useState(value.city);
  const [streetQuery, setStreetQuery] = useState(value.street);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [streetLoading, setStreetLoading] = useState(false);
  const [showCityDrop, setShowCityDrop] = useState(false);
  const [showStreetDrop, setShowStreetDrop] = useState(false);

  const cityRef = useRef<HTMLDivElement>(null);
  const streetRef = useRef<HTMLDivElement>(null);
  const cityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-load API data on mount
  useEffect(() => { loadAllRecords(); }, []);

  // Sync external value → local query (e.g. when parent fills from saved address)
  useEffect(() => { setCityQuery(value.city); }, [value.city]);
  useEffect(() => { setStreetQuery(value.street); }, [value.street]);

  // City search
  useEffect(() => {
    if (value.citySelected) return;
    if (cityQuery.trim().length < 1) { setCitySuggestions([]); setShowCityDrop(false); return; }
    setCityLoading(true);
    if (cityTimer.current) clearTimeout(cityTimer.current);
    cityTimer.current = setTimeout(async () => {
      const results = await searchCities(cityQuery);
      setCitySuggestions(results);
      setCityLoading(false);
      setShowCityDrop(true);
    }, 150);
    return () => { if (cityTimer.current) clearTimeout(cityTimer.current); };
  }, [cityQuery, value.citySelected]);

  // Street search
  useEffect(() => {
    if (!value.citySelected && !isStaff) return;
    if (value.streetSelected) return;
    if (streetQuery.trim().length < 1) { setStreetSuggestions([]); setShowStreetDrop(false); return; }
    setStreetLoading(true);
    if (streetTimer.current) clearTimeout(streetTimer.current);
    streetTimer.current = setTimeout(async () => {
      const results = await searchStreets(value.city, streetQuery);
      setStreetSuggestions(results);
      setStreetLoading(false);
      setShowStreetDrop(true);
    }, 150);
    return () => { if (streetTimer.current) clearTimeout(streetTimer.current); };
  }, [streetQuery, value.city, value.citySelected, value.streetSelected, isStaff]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCityDrop(false);
      }
      if (streetRef.current && !streetRef.current.contains(e.target as Node)) {
        setShowStreetDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectCity = useCallback((city: string) => {
    setCityQuery(city);
    setCitySuggestions([]);
    setShowCityDrop(false);
    setStreetQuery("");
    setStreetSuggestions([]);
    onChange({ ...value, city, citySelected: true, street: "", streetSelected: false });
  }, [value, onChange]);

  const selectStreet = useCallback((street: string) => {
    setStreetQuery(street);
    setStreetSuggestions([]);
    setShowStreetDrop(false);
    onChange({ ...value, street, streetSelected: true });
  }, [value, onChange]);

  const fieldError = (field: "city" | "street" | "houseNumber") =>
    touched?.[field] ? errors?.[field] : undefined;

  return (
    <div className="space-y-3">
      {/* ── City ── */}
      <div ref={cityRef} className="relative">
        <div className="relative">
          <input
            type="text" name="city" value={cityQuery} dir="rtl"
            placeholder=" "
            onChange={e => {
              setCityQuery(e.target.value);
              onChange({ ...value, city: e.target.value, citySelected: false, street: "", streetSelected: false });
              setStreetQuery("");
            }}
            onBlur={() => { setTimeout(() => setShowCityDrop(false), 150); onBlur?.("city"); }}
            onFocus={() => { if (!value.citySelected && cityQuery.trim().length >= 1) setShowCityDrop(true); }}
            className={`peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors ${
              fieldError("city") ? "border-red-400" : "border-border"
            }`}
          />
          <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
            {L.city}
          </label>
        </div>
        {fieldError("city") && <p className="text-xs text-red-500 mt-1 px-1">{fieldError("city")}</p>}
        {showCityDrop && !value.citySelected && cityQuery.trim().length >= 1 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white border border-border rounded-xl shadow-xl max-h-52 overflow-y-auto">
            {cityLoading ? (
              <div className="p-3 space-y-2">
                {[80, 60, 72].map((w, i) => (
                  <div key={i} className="h-3 rounded-full bg-muted animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : citySuggestions.length > 0 ? (
              citySuggestions.map((city, i) => (
                <button key={i} type="button"
                  className="w-full text-start px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors border-b border-border/40 last:border-0"
                  onMouseDown={e => { e.preventDefault(); selectCity(city); }}
                >
                  {city}
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-muted-foreground">לא נמצאה עיר</p>
            )}
          </div>
        )}
      </div>

      {/* ── Street ── */}
      <div ref={streetRef} className="relative">
        <div className="relative">
          <input
            type="text" name="street" value={streetQuery} dir="rtl"
            placeholder=" "
            onChange={e => {
              setStreetQuery(e.target.value);
              onChange({ ...value, street: e.target.value, streetSelected: false });
              if (!value.citySelected && !isStaff && e.target.value.length > 0) {
                setShowStreetDrop(true); // will show "בחר עיר" prompt
              }
            }}
            onBlur={() => { setTimeout(() => setShowStreetDrop(false), 150); onBlur?.("street"); }}
            onFocus={() => {
              if (!value.citySelected && !isStaff) { setShowStreetDrop(true); return; }
              if (!value.streetSelected && streetQuery.trim().length >= 1) setShowStreetDrop(true);
            }}
            className={`peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors ${
              fieldError("street") ? "border-red-400" : "border-border"
            }`}
          />
          <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
            {L.street}
          </label>
        </div>
        {fieldError("street") && <p className="text-xs text-red-500 mt-1 px-1">{fieldError("street")}</p>}
        {showStreetDrop && !value.streetSelected && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white border border-border rounded-xl shadow-xl max-h-52 overflow-y-auto">
            {!value.citySelected && !isStaff ? (
              <p className="px-4 py-3 text-sm text-amber-600 font-medium">👆 {L.selectCity}</p>
            ) : streetLoading ? (
              <div className="p-3 space-y-2">
                {[80, 60, 72].map((w, i) => (
                  <div key={i} className="h-3 rounded-full bg-muted animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : streetSuggestions.length > 0 ? (
              streetSuggestions.map((street, i) => (
                <button key={i} type="button"
                  className="w-full text-start px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors border-b border-border/40 last:border-0"
                  onMouseDown={e => { e.preventDefault(); selectStreet(street); }}
                >
                  {street}
                </button>
              ))
            ) : streetQuery.trim().length >= 1 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">לא נמצא רחוב</p>
            ) : null}
          </div>
        )}
      </div>

      {/* ── House Number + Apartment ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <input
            type="text" name="houseNumber" value={value.houseNumber} dir="rtl"
            placeholder=" "
            onChange={e => onChange({ ...value, houseNumber: e.target.value })}
            onBlur={() => onBlur?.("houseNumber")}
            className={`peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors ${
              fieldError("houseNumber") ? "border-red-400" : "border-border"
            }`}
          />
          <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
            {L.houseNumber}
          </label>
          {fieldError("houseNumber") && <p className="text-xs text-red-500 mt-1 px-1">{fieldError("houseNumber")}</p>}
        </div>
        <div className="relative">
          <input
            type="text" name="apartment" value={value.apartment} dir="rtl"
            placeholder=" "
            onChange={e => onChange({ ...value, apartment: e.target.value })}
            className="peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors"
          />
          <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
            {L.apartment}
          </label>
        </div>
      </div>
    </div>
  );
};
