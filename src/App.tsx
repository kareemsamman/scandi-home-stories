import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { LocaleProvider, LocaleRedirect } from "./i18n/LocaleContext";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Critical path: Index page loaded eagerly for fast initial render
import Index from "./pages/Index";

// Lazy-loaded pages — only fetched when navigated to
// Retry wrapper: on chunk-load failure, hard-reload once so the browser fetches fresh assets
const lazyRetry = (factory: () => Promise<any>) =>
  lazy(() =>
    factory().catch((err: any) => {
      const key = "chunk_reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return new Promise(() => {}); // never resolves — page is reloading
      }
      sessionStorage.removeItem(key);
      throw err;
    })
  );

const Catalog = lazyRetry(() => import("./pages/Catalog"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const About = lazy(() => import("./pages/About"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutThankYou = lazy(() => import("./pages/CheckoutThankYou"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const CompleteRegistration = lazy(() => import("./pages/CompleteRegistration"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Signup = lazy(() => import("./pages/Signup"));
const Account = lazy(() => import("./pages/Account"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const InvoicePage = lazy(() => import("./pages/Invoice"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const PaymentLink = lazy(() => import("./pages/PaymentLink"));

// Admin pages — heavy, rarely accessed by regular users
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminPages = lazy(() => import("./pages/admin/Pages"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminOrderDetail = lazy(() => import("./pages/admin/OrderDetail"));
const AdminInventory = lazy(() => import("./pages/admin/Inventory"));
const AdminHeroSlides = lazy(() => import("./pages/admin/HeroSlides"));
const AdminHomePage = lazy(() => import("./pages/admin/HomePage"));
const AdminAboutPage = lazy(() => import("./pages/admin/AboutPage"));
const AdminContactPage = lazy(() => import("./pages/admin/ContactPage"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminSiteContent = lazy(() => import("./pages/admin/SiteContent"));
const ProductEdit = lazy(() => import("./pages/admin/ProductEdit"));
const AdminAttributes = lazy(() => import("./pages/admin/Attributes"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons"));
const AdminMarketing = lazy(() => import("./pages/admin/Marketing"));
const AdminLegalPages = lazy(() => import("./pages/admin/LegalPages"));
const AdminNotFoundPage = lazy(() => import("./pages/admin/NotFoundPage"));

// Lazy-loaded non-critical UI components
const WhatsAppButton = lazy(() => import("./components/WhatsAppButton").then(m => ({ default: m.WhatsAppButton })));
const AccessibilityWidget = lazy(() => import("./components/AccessibilityWidget").then(m => ({ default: m.AccessibilityWidget })));

const queryClient = new QueryClient();

const LocaleRoutes = () => (
  <LocaleProvider>
    <ScrollToTop />
    <Suspense fallback={null}>
      <WhatsAppButton />
      <AccessibilityWidget />
    </Suspense>
    <Suspense fallback={<div className="min-h-screen" />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/shop" element={<Products />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/thank-you" element={<CheckoutThankYou />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/legal/:page" element={<LegalPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/complete-registration" element={<CompleteRegistration />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/account" element={<Account />} />
        <Route path="/account/order/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/invoice/:orderId" element={<InvoicePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </LocaleProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen" />}>
            <Routes>
              <Route path="/" element={<LocaleRedirect />} />
              {/* Admin routes — allow admin + worker roles */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="worker" redirectTo="/he/login">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="pages" element={<AdminPages />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/edit/:productId" element={<ProductEdit />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:orderId" element={<AdminOrderDetail />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="hero-slides" element={<AdminHeroSlides />} />
                <Route path="home" element={<AdminHomePage />} />
                <Route path="about" element={<AdminAboutPage />} />
                <Route path="contact" element={<AdminContactPage />} />
                <Route path="site-content" element={<AdminSiteContent />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="attributes" element={<AdminAttributes />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="marketing" element={<AdminMarketing />} />
                <Route path="legal" element={<AdminLegalPages />} />
                <Route path="404-page" element={<AdminNotFoundPage />} />
              </Route>
              <Route path="/invoice/:orderId" element={<InvoicePage />} />
              <Route path="/:locale/pay/:orderId" element={<PaymentLink />} />
              <Route path="/:locale/complete-registration" element={<CompleteRegistration />} />
              <Route path="/:locale/*" element={<LocaleRoutes />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
