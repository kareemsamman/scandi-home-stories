import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "worker";
  redirectTo?: string;
}

export const ProtectedRoute = ({ children, requiredRole, redirectTo = "/login" }: ProtectedRouteProps) => {
  const { user, loading, roles, rolesLoaded } = useAuth();
  const location = useLocation();

  // Still loading auth session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    // Preserve the current path so login can redirect back
    const currentPath = location.pathname + location.search;
    const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
    return <Navigate to={loginUrl} replace />;
  }

  // User is authenticated but roles haven't loaded yet from DB — wait
  if (!rolesLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requiredRole) {
    const hasAccess = roles.includes("admin") || roles.includes(requiredRole);
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
