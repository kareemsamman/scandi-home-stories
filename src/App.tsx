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
const Products = lazyRetry(() => import("./pages/Products"));
const ProductDetail = lazyRetry(() => import("./pages/ProductDetail"));
const About = lazyRetry(() => import("./pages/About"));
const Cart = lazyRetry(() => import("./pages/Cart"));
const Checkout = lazyRetry(() => import("./pages/Checkout"));
const CheckoutThankYou = lazyRetry(() => import("./pages/CheckoutThankYou"));
const Contact = lazyRetry(() => import("./pages/Contact"));
const Login = lazyRetry(() => import("./pages/Login"));
const ForgotPassword = lazyRetry(() => import("./pages/ForgotPassword"));
const CompleteRegistration = lazyRetry(() => import("./pages/CompleteRegistration"));
const ResetPassword = lazyRetry(() => import("./pages/ResetPassword"));
const Signup = lazyRetry(() => import("./pages/Signup"));
const Account = lazyRetry(() => import("./pages/Account"));
const OrderDetail = lazyRetry(() => import("./pages/OrderDetail"));
const InvoicePage = lazyRetry(() => import("./pages/Invoice"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));
const LegalPage = lazyRetry(() => import("./pages/LegalPage"));
const PaymentLink = lazyRetry(() => import("./pages/PaymentLink"));
const PergolaRequest = lazyRetry(() => import("./pages/PergolaRequest"));
const PergolaResponse = lazyRetry(() => import("./pages/PergolaResponse"));

// Admin pages — heavy, rarely accessed by regular users
const AdminLayout = lazyRetry(() => import("./components/AdminLayout"));
const AdminDashboard = lazyRetry(() => import("./pages/admin/Dashboard"));
const AdminPages = lazyRetry(() => import("./pages/admin/Pages"));
const AdminCategories = lazyRetry(() => import("./pages/admin/Categories"));
const AdminProducts = lazyRetry(() => import("./pages/admin/Products"));
const AdminOrders = lazyRetry(() => import("./pages/admin/Orders"));
const AdminOrderDetail = lazyRetry(() => import("./pages/admin/OrderDetail"));
const AdminInventory = lazyRetry(() => import("./pages/admin/Inventory"));
const AdminHeroSlides = lazyRetry(() => import("./pages/admin/HeroSlides"));
const AdminHomePage = lazyRetry(() => import("./pages/admin/HomePage"));
const AdminAboutPage = lazyRetry(() => import("./pages/admin/AboutPage"));
const AdminContactPage = lazyRetry(() => import("./pages/admin/ContactPage"));
const AdminUsers = lazyRetry(() => import("./pages/admin/Users"));
const AdminSettings = lazyRetry(() => import("./pages/admin/Settings"));
const AdminSiteContent = lazyRetry(() => import("./pages/admin/SiteContent"));
const ProductEdit = lazyRetry(() => import("./pages/admin/ProductEdit"));
const AdminAttributes = lazyRetry(() => import("./pages/admin/Attributes"));
const AdminCoupons = lazyRetry(() => import("./pages/admin/Coupons"));
const AdminMarketing = lazyRetry(() => import("./pages/admin/Marketing"));
const AdminLegalPages = lazyRetry(() => import("./pages/admin/LegalPages"));
const AdminNotFoundPage = lazyRetry(() => import("./pages/admin/NotFoundPage"));
const AdminWelcomePopup = lazyRetry(() => import("./pages/admin/WelcomePopup"));
const AdminPergolaRequests = lazyRetry(() => import("./pages/admin/PergolaRequests"));
const AdminPergolaRequestDetail = lazyRetry(() => import("./pages/admin/PergolaRequestDetail"));

// Lazy-loaded non-critical UI components
const WhatsAppButton = lazyRetry(() => import("./components/WhatsAppButton").then(m => ({ default: m.WhatsAppButton })));
const AccessibilityWidget = lazyRetry(() => import("./components/AccessibilityWidget").then(m => ({ default: m.AccessibilityWidget })));

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
        <Route path="/pergola-request" element={<PergolaRequest />} />
        <Route path="/pergola-response/:requestId" element={<PergolaResponse />} />
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
                <Route path="welcome-popup" element={<AdminWelcomePopup />} />
                <Route path="pergola-requests" element={<AdminPergolaRequests />} />
                <Route path="pergola-requests/:requestId" element={<AdminPergolaRequestDetail />} />
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
