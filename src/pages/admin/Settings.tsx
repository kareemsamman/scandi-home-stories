import { useState, useEffect } from "react";
import { Truck, Loader2, Save, Globe, Shield } from "lucide-react";
import { useShippingSettings, useSaveShippingSettings, DEFAULT_SHIPPING } from "@/hooks/useShippingSettings";
import type { ShippingSettings } from "@/hooks/useShippingSettings";
import { useToast } from "@/hooks/use-toast";

const ZONES = [
  { key: "north" as const, label: "North", labelHe: "צפון", labelAr: "شمال" },
  { key: "center" as const, label: "Center", labelHe: "מרכז", labelAr: "مركاز" },
  { key: "south" as const, label: "South", labelHe: "דרום", labelAr: "جنوب" },
  { key: "jerusalem" as const, label: "Jerusalem", labelHe: "ירושלים", labelAr: "القדس" },
];

type Tab = "shipping" | "general" | "roles";

const AdminSettings = () => {
  const { toast } = useToast();
  const { data: dbSettings, isLoading } = useShippingSettings();
  const saveMutation = useSaveShippingSettings();
  const [activeTab, setActiveTab] = useState<Tab>("shipping");
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "shipping", label: "Shipping", icon: <Truck className="w-4 h-4" /> },
    { id: "general", label: "General", icon: <Globe className="w-4 h-4" /> },
    { id: "roles", label: "Roles", icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shipping Tab */}
      {activeTab === "shipping" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Shipping Zones</h2>

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
                <p className="text-xs text-gray-400 mb-2">Orders above this amount qualify for free shipping</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={settings.threshold}
                    onChange={(e) => setSettings((p) => ({ ...p, threshold: Number(e.target.value) }))}
                    className="w-40 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  <span className="text-sm text-gray-400">₪{settings.threshold.toLocaleString()}</span>
                </div>
              </div>

              {/* Zone prices */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Zone Prices</p>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                  {ZONES.map((zone) => (
                    <div key={zone.key} className="flex items-center justify-between px-4 py-3 bg-white">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{zone.label}</p>
                        <p className="text-xs text-gray-400">{zone.labelHe} / {zone.labelAr}</p>
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
                          className="w-24 h-8 px-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-900 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
            </div>
          )}
        </div>
      )}

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Languages</h2>
          <p className="text-sm text-gray-500 mb-4">Supported languages for the website content.</p>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Hebrew</p>
                <p className="text-xs text-gray-400">he</p>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Default</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Arabic</p>
                <p className="text-xs text-gray-400">ar</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === "roles" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">User Roles</h2>
          <p className="text-sm text-gray-500 mb-4">Role definitions and access permissions.</p>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {[
              { role: "Admin", desc: "Full access to all admin features" },
              { role: "Worker", desc: "Orders and Inventory only" },
              { role: "Customer", desc: "Frontend only — account, orders, addresses" },
            ].map((r) => (
              <div key={r.role} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-medium text-gray-800">{r.role}</p>
                <p className="text-xs text-gray-400">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
