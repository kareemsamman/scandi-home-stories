import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { LocaleProvider, LocaleRedirect } from "./i18n/LocaleContext";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CheckoutThankYou from "./pages/CheckoutThankYou";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import CompleteRegistration from "./pages/CompleteRegistration";
import ResetPassword from "./pages/ResetPassword";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import OrderDetail from "./pages/OrderDetail";
import InvoicePage from "./pages/Invoice";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPages from "./pages/admin/Pages";
import AdminCategories from "./pages/admin/Categories";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminOrderDetail from "./pages/admin/OrderDetail";
import AdminInventory from "./pages/admin/Inventory";
import AdminHeroSlides from "./pages/admin/HeroSlides";
import AdminHomePage from "./pages/admin/HomePage";
import AdminAboutPage from "./pages/admin/AboutPage";
import AdminContactPage from "./pages/admin/ContactPage";
import AdminUsers from "./pages/admin/Users";
import AdminSettings from "./pages/admin/Settings";
import AdminSiteContent from "./pages/admin/SiteContent";
import ProductEdit from "./pages/admin/ProductEdit";
import AdminAttributes from "./pages/admin/Attributes";
import AdminCoupons from "./pages/admin/Coupons";
import AdminMarketing from "./pages/admin/Marketing";
import AdminLegalPages from "./pages/admin/LegalPages";
import AdminNotFoundPage from "./pages/admin/NotFoundPage";
import LegalPage from "./pages/LegalPage";
import PaymentLink from "./pages/PaymentLink";

const queryClient = new QueryClient();

const LocaleRoutes = () => (
  <LocaleProvider>
    <ScrollToTop />
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
  </LocaleProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
