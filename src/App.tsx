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
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import OrderDetail from "./pages/OrderDetail";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";

const queryClient = new QueryClient();

const LocaleRoutes = () => (
  <LocaleProvider>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/shop" element={<Products />} />
      <Route path="/product/:slug" element={<ProductDetail />} />
      <Route path="/about" element={<About />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/checkout/thank-you" element={<CheckoutThankYou />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/account" element={<Account />} />
      <Route path="/account/order/:orderId" element={<OrderDetail />} />
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
            {/* Admin routes — English, no locale prefix */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin" redirectTo="/he/login">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              {/* Future admin pages will be nested here */}
            </Route>
            <Route path="/:locale/*" element={<LocaleRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
