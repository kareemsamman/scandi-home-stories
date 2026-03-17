import { useState, useEffect } from "react";
import { Settings, Truck, Loader2, Save, CheckCircle2 } from "lucide-react";
import { useShippingSettings, useSaveShippingSettings, DEFAULT_SHIPPING } from "@/hooks/useShippingSettings";
import type { ShippingSettings } from "@/hooks/useShippingSettings";
import { useToast } from "@/hooks/use-toast";

const ZONES = [
  { key: "north" as const, label: "North", labelHe: "צפון", labelAr: "شمال" },
  { key: "center" as const, label: "Center", labelHe: "מרכז", labelAr: "مركاز" },
  { key: "south" as const, label: "South", labelHe: "דרום", labelAr: "جنوب" },
  { key: "jerusalem" as const, label: "Jerusalem", labelHe: "ירושלים", labelAr: "القدس" },
];

const AdminSettings = () => {
  const { toast } = useToast();
  const { data: dbSettings, isLoading } = useShippingSettings();
  const saveMutation = useSaveShippingSettings();

  const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING);

  useEffect(() => {
    if (dbSettings) setSettings(dbSettings);
  }, [dbSettings]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(settings);
      toast({ title: "Shipping settings saved", description: "Changes are now live." });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Shipping Zones */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Truck className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Shipping Zones</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Free shipping threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Free Shipping Threshold (₪)
              </label>
              <p className="text-xs text-gray-400 mb-2">Orders above this amount get free shipping</p>
              <input
                type="number"
                min={0}
                value={settings.threshold}
                onChange={(e) => setSettings((p) => ({ ...p, threshold: Number(e.target.value) }))}
                className="w-48 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="ms-2 text-sm text-gray-500">₪{settings.threshold.toLocaleString()}</span>
            </div>

            {/* Zone prices */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Shipping Price by Zone</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ZONES.map((zone) => (
                  <div key={zone.key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{zone.label}</p>
                      <p className="text-xs text-gray-500">{zone.labelHe} / {zone.labelAr}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-400">₪</span>
                      <input
                        type="number"
                        min={0}
                        value={settings.zones[zone.key]}
                        onChange={(e) =>
                          setSettings((p) => ({
                            ...p,
                            zones: { ...p.zones, [zone.key]: Number(e.target.value) },
                          }))
                        }
                        className="w-24 h-9 px-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700 space-y-1">
              <p className="font-medium">Current rules:</p>
              <p>• Orders above ₪{settings.threshold.toLocaleString()} → Free shipping</p>
              {ZONES.map((z) => (
                <p key={z.key}>• {z.labelHe} ({z.labelAr}) → ₪{settings.zones[z.key]}</p>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveMutation.isSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Shipping Settings
            </button>
          </div>
        )}
      </div>

      {/* General */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
        </div>
        <p className="text-gray-500 text-sm">Additional site configuration will be available here.</p>
      </div>

      {/* Languages */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Languages</h2>
        <p className="text-gray-500 text-sm mb-4">Supported languages for the website content.</p>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-700">Hebrew (HE)</span>
            <span className="text-xs text-blue-500">Default</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Arabic (AR)</span>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Roles</h2>
        <p className="text-gray-500 text-sm mb-4">User role definitions and permissions.</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
            <span className="text-sm font-medium text-red-700">Admin</span>
            <span className="text-xs text-red-500">Full access to all admin features</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
            <span className="text-sm font-medium text-blue-700">Worker</span>
            <span className="text-xs text-blue-500">Orders + Inventory only</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
            <span className="text-sm font-medium text-green-700">Customer</span>
            <span className="text-xs text-green-500">Frontend only (account, orders, addresses)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
