import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AdminLanguageProvider, useAdminLanguage } from "@/contexts/AdminLanguageContext";
import {
  LayoutDashboard, Users, ShoppingBag, Package, FileText,
  Image, Settings, LogOut, ChevronLeft, ChevronRight, Menu,
  Grid3X3, BarChart3, Home, Layout, Tag, Ticket, Mail,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: any;
  path: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin", roles: ["admin"] },
  { label: "Pages", icon: FileText, path: "/admin/pages", roles: ["admin"] },
  { label: "Categories", icon: Grid3X3, path: "/admin/categories", roles: ["admin"] },
  { label: "Products", icon: Package, path: "/admin/products", roles: ["admin"] },
  { label: "Attributes", icon: Tag, path: "/admin/attributes", roles: ["admin"] },
  { label: "Coupons", icon: Ticket, path: "/admin/coupons", roles: ["admin"] },
  { label: "Marketing", icon: Mail, path: "/admin/marketing", roles: ["admin"] },
  { label: "Orders", icon: ShoppingBag, path: "/admin/orders", roles: ["admin", "worker"] },
  { label: "Inventory", icon: BarChart3, path: "/admin/inventory", roles: ["admin", "worker"] },
  { label: "Hero Slides", icon: Image, path: "/admin/hero-slides", roles: ["admin"] },
  { label: "Header & Footer", icon: Layout, path: "/admin/site-content", roles: ["admin"] },
  { label: "Home Page", icon: Home, path: "/admin/home", roles: ["admin"] },
  { label: "About Page",   icon: FileText, path: "/admin/about",   roles: ["admin"] },
  { label: "Contact Page", icon: Mail,     path: "/admin/contact", roles: ["admin"] },
  { label: "Legal Pages", icon: FileText, path: "/admin/legal", roles: ["admin"] },
  { label: "404 Page", icon: FileText, path: "/admin/404-page", roles: ["admin"] },
  { label: "Users", icon: Users, path: "/admin/users", roles: ["admin"] },
  { label: "Settings", icon: Settings, path: "/admin/settings", roles: ["admin"] },
];

const LanguageSwitcher = () => {
  const { locale, setLocale } = useAdminLanguage();
  return (
    <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
      <button
        onClick={() => setLocale("he")}
        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
          locale === "he" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
        }`}
      >HE</button>
      <button
        onClick={() => setLocale("ar")}
        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
          locale === "ar" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
        }`}
      >AR</button>
    </div>
  );
};

const AdminLayoutInner = () => {
  const { user, profile, roles, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isWorkerOnly = roles.includes("worker") && !roles.includes("admin");

  const visibleNav = navItems.filter((item) =>
    item.roles.some((r) => roles.includes(r as any))
  );

  // Redirect workers from admin-only pages
  useEffect(() => {
    if (!isWorkerOnly) return;
    const workerPaths = ["/admin/orders", "/admin/inventory"];
    const isAllowed = workerPaths.some((p) => location.pathname.startsWith(p));
    if (!isAllowed) {
      navigate("/admin/orders", { replace: true });
    }
  }, [location.pathname, isWorkerOnly, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/he/login");
  };

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <div>
            <span className="text-lg font-bold text-white">{isWorkerOnly ? "Worker Dashboard" : "AMG Admin"}</span>
            <a href="/he" className="block text-[10px] text-white/40 hover:text-white/70 transition-colors mt-0.5">← Back to Website</a>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-white/10 text-white/60 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        {!collapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium text-white truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-white/50 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden" dir="ltr" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 start-0 z-50 w-64 bg-[hsl(var(--dark))] transition-transform md:hidden ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {sidebarContent}
      </aside>

      <aside className={`hidden md:block shrink-0 bg-[hsl(var(--dark))] transition-all ${
        collapsed ? "w-16" : "w-60"
      }`}>
        {sidebarContent}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 md:px-6 shrink-0 gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-700 truncate flex-1 md:flex-none">
            {visibleNav.find((n) => isActive(n.path))?.label || "Dashboard"}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
              {(profile?.first_name?.[0] || user?.email?.[0] || "A").toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto" dir="rtl">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AdminLayout = () => (
  <AdminLanguageProvider>
    <AdminLayoutInner />
  </AdminLanguageProvider>
);

export default AdminLayout;
