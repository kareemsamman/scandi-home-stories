import { useState, useEffect } from "react";
import { Truck, Loader2, Save, Globe, Shield, Building2, MessageSquare, Smartphone, Send, CheckCircle2, XCircle, ShoppingCart, MessageCircle, Trash2, AlertTriangle, Percent, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adjustInventory } from "@/hooks/useOrders";
import { useShippingSettings, useSaveShippingSettings, DEFAULT_SHIPPING } from "@/hooks/useShippingSettings";
import type { ShippingSettings } from "@/hooks/useShippingSettings";
import {
  useBankSettings, useSmsSettings, useSmsMessages, useSaveSetting, sendSms,
  useAdminOrderSettings, useWhatsappSettings, useVatSettings, type VatSettings, DEFAULT_VAT_SETTINGS,
  useTranzilaSettings, type TranzilaSettings, DEFAULT_TRANZILA,
  DEFAULT_SMS_MESSAGES,
  type BankSettings, type SmsSettings, type SmsMessages, type AdminOrderSettings, type WhatsappSettings,
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
  { key: "pergola_admin_new", label: "🏗 פרגולה — התראה לאדמין" },
  { key: "pergola_customer_response", label: "🏗 פרגולה — תשובה ללקוח" },
];

type Tab = "shipping" | "bank" | "sms" | "messages" | "general" | "roles" | "orders" | "whatsapp" | "vat" | "tranzila";

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

  /* Admin Orders */
  const { data: dbAdminOrders } = useAdminOrderSettings();
  const saveAdminOrders = useSaveSetting("admin_orders");
  const [adminOrders, setAdminOrders] = useState<AdminOrderSettings>({ enabled: false });
  useEffect(() => { if (dbAdminOrders) setAdminOrders(dbAdminOrders); }, [dbAdminOrders]);

  /* Tranzila */
  const { data: dbTranzila } = useTranzilaSettings();
  const saveTranzila = useSaveSetting("tranzila");
  const [tranzila, setTranzila] = useState<TranzilaSettings>(DEFAULT_TRANZILA);
  useEffect(() => { if (dbTranzila) setTranzila(dbTranzila); }, [dbTranzila]);

  /* VAT */
  const { data: dbVat } = useVatSettings();
  const saveVat = useSaveSetting("vat");
  const [vat, setVat] = useState<VatSettings>(DEFAULT_VAT_SETTINGS);
  useEffect(() => { if (dbVat) setVat(dbVat); }, [dbVat]);

  /* WhatsApp */
  const { data: dbWhatsapp } = useWhatsappSettings();
  const saveWhatsapp = useSaveSetting("whatsapp");
  const [whatsapp, setWhatsapp] = useState<WhatsappSettings>({ phone: "", enabled: false });
  useEffect(() => { if (dbWhatsapp) setWhatsapp(dbWhatsapp); }, [dbWhatsapp]);

  /* Delete all orders */
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteAllStatus, setDeleteAllStatus] = useState<"idle" | "deleting" | "done">("idle");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleDeleteAllOrders = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleteAllStatus("deleting");
    try {
      // Fetch all orders with items to restore inventory
      const { data: orders } = await (supabase as any).from("orders").select("id, status, order_items(product_id, quantity)");
      if (orders) {
        const cancelStatuses = ["not_approved", "cancelled"];
        for (const order of orders) {
          if (!cancelStatuses.includes(order.status)) {
            const items = ((order.order_items as any[]) || []).map((i: any) => ({
              productId: i.product_id || undefined,
              quantity: i.quantity,
            }));
            await adjustInventory(items, 1);
          }
        }
      }
      // Delete all orders
      const { error } = await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      setDeleteAllStatus("done");
      toast({ title: "כל ההזמנות נמחקו והמלאי שוחזר" });
      setTimeout(() => { setShowDeleteAll(false); setDeleteAllStatus("idle"); setDeleteConfirmText(""); }, 2000);
    } catch {
      toast({ title: "מחיקה נכשלה", variant: "destructive" });
      setDeleteAllStatus("idle");
    }
  };

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

  const setMsg = (key: string, locale: "he" | "ar" | "admin", val: string) => {
    setMsgs(prev => {
      if (!prev) return prev;
      if (key === "admin_new_order") return { ...prev, admin_new_order: val };
      if (key === "share_cart") return { ...prev, share_cart: val };
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
      else if (tab === "orders") await saveAdminOrders.mutateAsync(adminOrders);
      else if (tab === "whatsapp") await saveWhatsapp.mutateAsync(whatsapp);
      else if (tab === "vat") await saveVat.mutateAsync(vat);
      else if (tab === "tranzila") await saveTranzila.mutateAsync(tranzila);
      toast({ title: "Saved successfully" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const isPending = saveShipping.isPending || saveBank.isPending || saveSms.isPending || saveMsgs.isPending || saveAdminOrders.isPending || saveWhatsapp.isPending || saveVat.isPending || saveTranzila.isPending;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "shipping", label: "Shipping", icon: <Truck className="w-4 h-4" /> },
    { id: "bank", label: "Bank Details", icon: <Building2 className="w-4 h-4" /> },
    { id: "sms", label: "SMS", icon: <Smartphone className="w-4 h-4" /> },
    { id: "messages", label: "Messages", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "general", label: "General", icon: <Globe className="w-4 h-4" /> },
    { id: "roles", label: "Roles", icon: <Shield className="w-4 h-4" /> },
    { id: "orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" /> },
    { id: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="w-4 h-4" /> },
    { id: "vat", label: "VAT / מע\"מ", icon: <Percent className="w-4 h-4" /> },
    { id: "tranzila", label: "Tranzila", icon: <CreditCard className="w-4 h-4" /> },
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

      <div className="border-b border-gray-200">
        <div className="flex flex-wrap gap-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeTab === tab.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {tab.icon}<span className="hidden sm:inline">{tab.label}</span>
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

              {/* Share cart message */}
              <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Send Cart to Customer</p>
                  <p className="text-xs text-gray-400">
                    Sent to customer phone when admin shares a cart. Variable: <code className="bg-gray-100 px-1 rounded text-[11px]">{"{link}"}</code>
                  </p>
                </div>
                <Field label="Message">
                  <textarea rows={5} value={msgs.share_cart ?? ""} onChange={e => setMsg("share_cart", "admin", e.target.value)} dir="rtl"
                    placeholder="שלום! 🛒 AMG פרגולה הכינו עבורך עגלת קנייה: {link}"
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

      {/* ── WhatsApp ── */}
      {activeTab === "whatsapp" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 32 32" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.004 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.347.627 4.64 1.813 6.64L2.667 29.333l6.907-1.787A13.267 13.267 0 0 0 16.004 29.333c7.36 0 13.33-5.973 13.33-13.333S23.363 2.667 16.004 2.667Zm0 24c-2.107 0-4.16-.56-5.96-1.627l-.427-.253-4.093 1.067 1.093-3.973-.28-.44A10.64 10.64 0 0 1 5.333 16c0-5.88 4.787-10.667 10.667-10.667S26.667 10.12 26.667 16 21.88 26.667 16.004 26.667Zm5.853-7.987c-.32-.16-1.893-.933-2.187-1.04-.293-.107-.507-.16-.72.16-.213.32-.827 1.04-.987 1.24-.16.2-.32.213-.64.053-.32-.16-1.347-.493-2.56-1.573-.947-.84-1.587-1.88-1.773-2.2-.187-.32-.02-.493.14-.653.147-.147.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.733-.987-2.373-.26-.627-.52-.533-.72-.547l-.613-.013c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667s1.147 3.093 1.307 3.307c.16.213 2.253 3.44 5.453 4.827.76.333 1.36.533 1.827.68.76.24 1.453.213 2 .133.613-.093 1.893-.773 2.16-1.52.267-.747.267-1.387.187-1.52-.08-.133-.293-.213-.613-.373Z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold">WhatsApp Button</h2>
              <p className="text-xs text-gray-400 mt-0.5">כפתור WhatsApp צף בפינה שמאל-תחתון של האתר</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-800">הצג כפתור WhatsApp</p>
              <p className="text-xs text-gray-400 mt-0.5">הפעל או כבה את הכפתור באתר</p>
            </div>
            <button
              onClick={() => setWhatsapp(p => ({ ...p, enabled: !p.enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${whatsapp.enabled ? "bg-[#25D366]" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${whatsapp.enabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>

          <Field label="מספר WhatsApp (פורמט: 0501234567 או 972501234567)">
            <TInput
              value={whatsapp.phone}
              onChange={v => setWhatsapp(p => ({ ...p, phone: v }))}
              placeholder="0501234567"
            />
          </Field>

          {whatsapp.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              <span>קישור:</span>
              <span className="font-mono text-green-700 break-all">
                https://wa.me/{whatsapp.phone.replace(/[\s\-\+\(\)]/g, "").replace(/^0/, "972")}
              </span>
            </div>
          )}

          <SaveBtn tab="whatsapp" />
        </div>
      )}

      {/* ── Orders ── */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold">Admin Order Creation</h2>
            <p className="text-xs text-gray-400 mt-1">When enabled, admins can create orders on behalf of customers directly from the checkout — with optional email and a "Pay Later" option.</p>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-800">Enable Admin Order Creation</p>
              <p className="text-xs text-gray-400 mt-0.5">Admins can place orders for customers with "Pay Later" (unpaid)</p>
            </div>
            <button
              onClick={() => setAdminOrders(p => ({ ...p, enabled: !p.enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${adminOrders.enabled ? "bg-gray-900" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${adminOrders.enabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
          <SaveBtn tab="orders" />

          {/* Danger zone — Delete all orders */}
          <div className="border-t border-red-200 pt-6 mt-6">
            <div className="border border-red-200 rounded-xl p-5 bg-red-50/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-800">Delete All Orders</p>
                  <p className="text-xs text-red-500 mt-0.5">מחק את כל ההזמנות במערכת. המלאי ישוחזר אוטומטית.</p>
                </div>
              </div>
              <p className="text-xs text-red-600 mb-3">פעולה זו בלתי הפיכה. כל ההזמנות יימחקו לצמיתות.</p>
              <button
                onClick={() => setShowDeleteAll(true)}
                className="flex items-center gap-2 h-9 px-4 text-sm font-semibold text-red-600 hover:text-white bg-white hover:bg-red-500 border border-red-300 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                מחק את כל ההזמנות
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VAT ── */}
      {activeTab === "vat" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold">VAT Settings / מע"מ</h2>
            <p className="text-xs text-gray-400 mt-1">ضريبة القيمة المضافة — تُضاف فوق سعر المنتج في السلة والدفع والفاتورة</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-800">تفعيل الضريبة</p>
              <p className="text-xs text-gray-400 mt-0.5">عند التفعيل، يتم إضافة الضريبة على المجموع الفرعي بعد الخصم</p>
            </div>
            <button
              onClick={() => setVat(p => ({ ...p, enabled: !p.enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${vat.enabled ? "bg-gray-900" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${vat.enabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>

          {vat.enabled && (
            <Field label="نسبة الضريبة (%)">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={vat.rate}
                onChange={e => setVat(p => ({ ...p, rate: Number(e.target.value) }))}
                className="w-32 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <p className="text-xs text-gray-400 mt-1">مثال: 18 = 18% ضريبة القيمة المضافة</p>
            </Field>
          )}

          <SaveBtn tab="vat" />
        </div>
      )}

      {/* ── Tranzila ── */}
      {activeTab === "tranzila" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Tranzila Payment Gateway</h2>
              <p className="text-xs text-gray-400 mt-0.5">بوابة الدفع عبر بطاقات الائتمان والتحويل البنكي</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-800">تفعيل Tranzila</p>
              <p className="text-xs text-gray-400 mt-0.5">عند التفعيل، يتم عرض نموذج الدفع في صفحة الدفع</p>
            </div>
            <button
              onClick={() => setTranzila(p => ({ ...p, enabled: !p.enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${tranzila.enabled ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${tranzila.enabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>

          <Field label="Terminal Name (اسم المحطة)">
            <TInput value={tranzila.terminal_name} onChange={v => setTranzila(p => ({ ...p, terminal_name: v }))} placeholder="your_terminal" />
          </Field>

          <Field label="Terminal Password (كلمة مرور المحطة)">
            <TInput value={tranzila.terminal_password} onChange={v => setTranzila(p => ({ ...p, terminal_password: v }))} placeholder="••••••" />
          </Field>

          <Field label="App Key (مفتاح التطبيق)">
            <TInput value={tranzila.app_key} onChange={v => setTranzila(p => ({ ...p, app_key: v }))} placeholder="app_key_..." />
          </Field>

          <Field label="Secret Key (المفتاح السري)">
            <TInput value={tranzila.secret_key} onChange={v => setTranzila(p => ({ ...p, secret_key: v }))} placeholder="secret_..." />
          </Field>

          {tranzila.terminal_name && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              <span>iframe URL:</span>
              <span className="font-mono text-blue-600 break-all">
                https://direct.tranzila.com/{tranzila.terminal_name}/iframenew.php
              </span>
            </div>
          )}

          <SaveBtn tab="tranzila" />
        </div>
      )}

      {/* ── Delete all orders confirmation modal ── */}
      {showDeleteAll && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { if (deleteAllStatus !== "deleting") { setShowDeleteAll(false); setDeleteConfirmText(""); } }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">מחיקת כל ההזמנות</p>
                <p className="text-xs text-gray-500">פעולה זו בלתי הפיכה</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">כל ההזמנות יימחקו לצמיתות. המלאי ישוחזר אוטומטית. רק הזמנות יימחקו — מוצרים, קטגוריות ומשתמשים לא יושפעו.</p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">הקלד DELETE לאישור:</label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-300"
                disabled={deleteAllStatus === "deleting"}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAllOrders}
                disabled={deleteConfirmText !== "DELETE" || deleteAllStatus === "deleting"}
                className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteAllStatus === "deleting" ? <><Loader2 className="w-4 h-4 animate-spin" /> מוחק…</> : deleteAllStatus === "done" ? "✓ נמחק!" : "מחק הכל"}
              </button>
              <button
                onClick={() => { setShowDeleteAll(false); setDeleteConfirmText(""); }}
                disabled={deleteAllStatus === "deleting"}
                className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
