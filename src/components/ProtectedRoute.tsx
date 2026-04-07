import { useRef } from "react";
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
  const wasAuthed = useRef(false);

  // Track if user was ever authenticated — prevents unmounting children
  // during auth session refresh (e.g. when switching browser tabs)
  if (user && rolesLoaded) wasAuthed.current = true;

  // First load only — show spinner until auth resolves
  if (loading && !wasAuthed.current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user && !loading) {
    const currentPath = location.pathname + location.search;
    const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
    return <Navigate to={loginUrl} replace />;
  }

  // User is authenticated but roles haven't loaded yet from DB — wait (first time only)
  if (!rolesLoaded && !wasAuthed.current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requiredRole && rolesLoaded) {
    const hasAccess = roles.includes("admin") || roles.includes(requiredRole);
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
