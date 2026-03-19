import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Loader2, Save, Globe, Shield, Building2, MessageSquare, Smartphone, Send, CheckCircle2, XCircle, Mail } from "lucide-react";
import { useShippingSettings, useSaveShippingSettings, DEFAULT_SHIPPING } from "@/hooks/useShippingSettings";
import type { ShippingSettings } from "@/hooks/useShippingSettings";
import {
  useBankSettings, useSmsSettings, useSmsMessages, useSaveSetting, sendSms,
  DEFAULT_SMS_MESSAGES,
  type BankSettings, type SmsSettings, type SmsMessages,
} from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";

const ZONES = [
  { key: "north" as const, label: "North", labelHe: "צפון", labelAr: "شمال" },
  { key: "center" as const, label: "Center", labelHe: "מרכז", labelAr: "مركاز" },
  { key: "south" as const, label: "South", labelHe: "דרום", labelAr: "جنوب" },
  { key: "jerusalem" as const, label: "Jerusalem", labelHe: "ירושלים", labelAr: "القدس" },
];

const STATUS_KEYS = [
  { key: "order_received", label: "Order Received (on receipt submit)" },
  { key: "waiting_approval", label: "מחכה אישור" },
  { key: "in_process", label: "בתהליך" },
  { key: "in_delivery", label: "יצא למשלוח" },
  { key: "not_approved", label: "לא אושרה" },
  { key: "cancelled", label: "בוטלה" },
];

type Tab = "shipping" | "bank" | "sms" | "messages" | "email" | "general" | "roles";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
    {children}
  </div>
);

const TInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
);

const AdminSettings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("shipping");

  /* Shipping */
  const { data: dbShipping, isLoading: shippingLoading } = useShippingSettings();
  const saveShipping = useSaveShippingSettings();
  const [shipping, setShipping] = useState<ShippingSettings>(DEFAULT_SHIPPING);
  useEffect(() => { if (dbShipping) setShipping(dbShipping); }, [dbShipping]);

  /* Bank */
  const { data: dbBank } = useBankSettings();
  const saveBank = useSaveSetting("bank");
  const [bank, setBank] = useState<BankSettings>({ bank_name: "", account_name: "", account_number: "", branch_number: "", bank_code: "" });
  useEffect(() => { if (dbBank) setBank(dbBank); }, [dbBank]);

  /* SMS credentials */
  const { data: dbSms } = useSmsSettings();
  const saveSms = useSaveSetting("sms");
  const [sms, setSms] = useState<SmsSettings>({ user: "", token: "", source: "", admin_phone: "", enabled: true });
  useEffect(() => { if (dbSms) setSms(dbSms); }, [dbSms]);

  const [testPhone, setTestPhone] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "ok" | "fail">("idle");

  const handleTestSms = async () => {
    if (!testPhone.trim()) return;
    setTestStatus("sending");
    const ok = await sendSms(testPhone, `✅ SMS test from AMG Admin — 019 API is working!`);
    setTestStatus(ok ? "ok" : "fail");
    setTimeout(() => setTestStatus("idle"), 4000);
  };

  /* SMS messages */
  const { data: dbMsgs } = useSmsMessages();
  const saveMsgs = useSaveSetting("sms_messages");
  const [msgs, setMsgs] = useState<SmsMessages | null>(null);
  useEffect(() => { if (dbMsgs) setMsgs(dbMsgs); }, [dbMsgs]);

  /* Email */
  const { data: dbEmail } = useQuery({ queryKey: ["app_settings", "email"], queryFn: async () => { const { data } = await (supabase as any).from("app_settings").select("value").eq("key", "email").maybeSingle(); return data?.value ?? {}; } });
  const saveEmail = useSaveSetting("email");
  const [emailSettings, setEmailSettings] = useState({ admin_email: "", from_email: "", resend_api_key: "", enabled: false });
  useEffect(() => { if (dbEmail) setEmailSettings(prev => ({ ...prev, ...dbEmail })); }, [dbEmail]);
  const patchEmail = (p: any) => setEmailSettings(prev => ({ ...prev, ...p }));

  const setMsg = (key: string, locale: "he" | "ar" | "admin", val: string) => {
    setMsgs(prev => {
      if (!prev) return prev;
      if (key === "admin_new_order") return { ...prev, admin_new_order: val };
      const cur = (prev as any)[key] || {};
      return { ...prev, [key]: { ...cur, [locale]: val } };
    });
  };

  const handleSave = async (tab: Tab) => {
    try {
      if (tab === "shipping") await saveShipping.mutateAsync(shipping);
      else if (tab === "bank") await saveBank.mutateAsync(bank);
      else if (tab === "sms") await saveSms.mutateAsync(sms);
      else if (tab === "messages" && msgs) await saveMsgs.mutateAsync(msgs);
      else if (tab === "email") await saveEmail.mutateAsync(emailSettings);
      toast({ title: "Saved successfully" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const isPending = saveShipping.isPending || saveBank.isPending || saveSms.isPending || saveMsgs.isPending || saveEmail.isPending;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "shipping", label: "Shipping", icon: <Truck className="w-4 h-4" /> },
    { id: "bank", label: "Bank Details", icon: <Building2 className="w-4 h-4" /> },
    { id: "sms", label: "SMS", icon: <Smartphone className="w-4 h-4" /> },
    { id: "messages", label: "Messages", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
    { id: "general", label: "General", icon: <Globe className="w-4 h-4" /> },
    { id: "roles", label: "Roles", icon: <Shield className="w-4 h-4" /> },
  ];

  const SaveBtn = ({ tab }: { tab: Tab }) => (
    <button onClick={() => handleSave(tab)} disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      Save
    </button>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeTab === tab.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Shipping ── */}
      {activeTab === "shipping" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-base font-semibold">Shipping Zones</h2>
          {shippingLoading ? (
            <div className="flex items-center gap-2 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading…</span></div>
          ) : (<>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold (₪)</label>
              <input type="number" min={0} value={shipping.threshold}
                onChange={e => setShipping(p => ({ ...p, threshold: Number(e.target.value) }))}
                className="w-40 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {ZONES.map(zone => (
                <div key={zone.key} className="flex items-center justify-between px-4 py-3 bg-white">
                  <div>
                    <p className="text-sm font-medium">{zone.label}</p>
                    <p className="text-xs text-gray-400">{zone.labelHe} / {zone.labelAr}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-400">₪</span>
                    <input type="number" min={0} value={shipping.zones[zone.key]}
                      onChange={e => setShipping(p => ({ ...p, zones: { ...p.zones, [zone.key]: Number(e.target.value) } }))}
                      className="w-24 h-8 px-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                </div>
              ))}
            </div>
            <SaveBtn tab="shipping" />
          </>)}
        </div>
      )}

      {/* ── Bank Details ── */}
      {activeTab === "bank" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold">Bank Transfer Details</h2>
            <p className="text-xs text-gray-400 mt-1">Shown to customers on the checkout payment step</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bank Name"><TInput value={bank.bank_name} onChange={v => setBank(p => ({ ...p, bank_name: v }))} placeholder="בנק הפועלים" /></Field>
            <Field label="Account Name"><TInput value={bank.account_name} onChange={v => setBank(p => ({ ...p, account_name: v }))} placeholder="AMG Pergola LTD" /></Field>
            <Field label="Account Number"><TInput value={bank.account_number} onChange={v => setBank(p => ({ ...p, account_number: v }))} placeholder="12345678" /></Field>
            <Field label="Branch Number"><TInput value={bank.branch_number} onChange={v => setBank(p => ({ ...p, branch_number: v }))} placeholder="123" /></Field>
            <Field label="Bank Code"><TInput value={bank.bank_code} onChange={v => setBank(p => ({ ...p, bank_code: v }))} placeholder="12" /></Field>
          </div>
          <SaveBtn tab="bank" />
        </div>
      )}

      {/* ── SMS ── */}
      {activeTab === "sms" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold">019 SMS API Settings</h2>
            <p className="text-xs text-gray-400 mt-1">Credentials for sending SMS notifications via 019</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700">SMS Enabled</span>
            <button onClick={() => setSms(p => ({ ...p, enabled: !p.enabled }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${sms.enabled ? "bg-gray-900" : "bg-gray-300"}`}>
              <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                style={{ left: sms.enabled ? "calc(100% - 18px)" : "2px" }} />
            </button>
            <span className={`text-xs font-medium ${sms.enabled ? "text-green-600" : "text-gray-400"}`}>
              {sms.enabled ? "Active" : "Disabled"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Username (SMSUSER)"><TInput value={sms.user} onChange={v => setSms(p => ({ ...p, user: v }))} placeholder="morshed" /></Field>
            <Field label="Source Phone (SMSSOURCE)"><TInput value={sms.source} onChange={v => setSms(p => ({ ...p, source: v }))} placeholder="0525143581" /></Field>
            <Field label="Admin Phone (receives order alerts)"><TInput value={sms.admin_phone} onChange={v => setSms(p => ({ ...p, admin_phone: v }))} placeholder="0525143281" /></Field>
          </div>
          <Field label="Token (SMSTOKEN)">
            <textarea value={sms.token} onChange={e => setSms(p => ({ ...p, token: e.target.value }))} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
              placeholder="JWT token..." />
          </Field>
          <SaveBtn tab="sms" />

          {/* Test SMS */}
          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-semibold text-gray-700 mb-1">Send Test SMS</p>
            <p className="text-xs text-gray-400 mb-3">Send a test message to verify the API is working correctly</p>
            <div className="flex gap-2">
              <input
                type="tel"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                className="flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <button
                onClick={handleTestSms}
                disabled={!testPhone.trim() || testStatus === "sending"}
                className="flex items-center gap-2 px-4 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {testStatus === "sending" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : testStatus === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : testStatus === "fail" ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {testStatus === "sending" ? "Sending…" : testStatus === "ok" ? "Sent!" : testStatus === "fail" ? "Failed" : "Send Test"}
              </button>
            </div>
            {testStatus === "ok" && <p className="text-xs text-green-600 mt-1.5">✓ Message sent successfully to {testPhone}</p>}
            {testStatus === "fail" && <p className="text-xs text-red-500 mt-1.5">✗ Failed — check your credentials and deploy the edge function</p>}
          </div>
        </div>
      )}

      {/* ── SMS Messages ── */}
      {activeTab === "messages" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold">SMS Message Templates</h2>
              <p className="text-xs text-gray-400 mt-1">
                Variables:{" "}
                {["{name}", "{order_number}", "{phone}", "{total}", "{shipping}", "{order_link}", "{invoice_link}"].map(v => (
                  <code key={v} className="bg-gray-100 px-1 rounded text-[11px] me-1">{v}</code>
                ))}
              </p>
            </div>
            <button
              onClick={() => { setMsgs(DEFAULT_SMS_MESSAGES); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              ↺ Reset to defaults
            </button>
          </div>

          {msgs ? (
            <div className="space-y-4">
              {/* Admin alert */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Admin New Order Alert</p>
                  <p className="text-xs text-gray-400">Sent to admin phone when new order is submitted</p>
                </div>
                <Field label="Message">
                  <textarea rows={5} value={msgs.admin_new_order} onChange={e => setMsg("admin_new_order", "admin", e.target.value)} placeholder="הזמנה חדשה! ..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-y font-mono" />
                </Field>
              </div>

              {STATUS_KEYS.map(({ key, label }) => {
                const entry = (msgs as any)[key] as { he: string; ar: string } | undefined;
                if (!entry || typeof entry !== "object") return null;
                return (
                  <div key={key} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      {key === "in_process" && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          + <code>{"{invoice_link}"}</code> — קישור לחשבונית
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="עברית (HE)">
                        <textarea value={entry.he} onChange={e => setMsg(key, "he", e.target.value)} rows={5} dir="rtl"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-y font-mono" />
                      </Field>
                      <Field label="عربي (AR)">
                        <textarea value={entry.ar} onChange={e => setMsg(key, "ar", e.target.value)} rows={5} dir="rtl"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-y font-mono" />
                      </Field>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading…</span></div>
          )}
          <SaveBtn tab="messages" />
        </div>
      )}

      {/* ── Email ── */}
      {activeTab === "email" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold">Email Settings (Resend)</h2>
            <p className="text-xs text-gray-400 mt-1">Used to receive contact form submissions. Get a free API key at <a href="https://resend.com" target="_blank" className="underline">resend.com</a></p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Email Notifications Enabled</span>
            <button onClick={() => patchEmail({ enabled: !emailSettings.enabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${emailSettings.enabled ? "bg-gray-900" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${emailSettings.enabled ? "translate-x-5" : ""}`} />
            </button>
          </div>

          <Field label="Admin Email (where to receive contact submissions)">
            <TInput value={emailSettings.admin_email} onChange={v => patchEmail({ admin_email: v })} placeholder="admin@yourcompany.com" />
          </Field>
          <Field label="From Email (sender — must be verified in Resend)">
            <TInput value={emailSettings.from_email} onChange={v => patchEmail({ from_email: v })} placeholder="noreply@yourdomain.com" />
          </Field>
          <Field label="Resend API Key">
            <TInput value={emailSettings.resend_api_key} onChange={v => patchEmail({ resend_api_key: v })} placeholder="re_..." />
          </Field>

          <SaveBtn tab="email" />
        </div>
      )}

      {/* ── General ── */}
      {activeTab === "general" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold mb-4">Languages</h2>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div><p className="text-sm font-medium">Hebrew</p><p className="text-xs text-gray-400">he</p></div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Default</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div><p className="text-sm font-medium">Arabic</p><p className="text-xs text-gray-400">ar</p></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Roles ── */}
      {activeTab === "roles" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold mb-4">User Roles</h2>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {[
              { role: "Admin", desc: "Full access to all admin features" },
              { role: "Worker", desc: "Orders and Inventory only" },
              { role: "Customer", desc: "Frontend only — account, orders, addresses" },
            ].map(r => (
              <div key={r.role} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-medium">{r.role}</p>
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
