import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { createContext, useContext } from "react";

// Safe wrapper: if AuthProvider is missing, return null gracefully
function useSafeAuth() {
  try {
    // Dynamic import to avoid circular issues
    const { useAuth } = require("@/hooks/useAuth");
    return useAuth();
  } catch {
    return { isAdmin: false, isWorker: false, loading: true };
  }
}

export const AdminTopBar = () => {
  const { isAdmin, isWorker, loading } = useSafeAuth();

  if (loading || (!isAdmin && !isWorker)) return null;

  const label = isAdmin ? "Admin Dashboard" : "Worker Dashboard";
  const path = isAdmin ? "/admin" : "/admin/orders";

  return (
    <div className="bg-[hsl(var(--dark))] text-white text-xs h-8 flex items-center px-4 justify-between z-[100] relative" dir="ltr">
      <div className="flex items-center gap-3">
        <Link to={path} className="flex items-center gap-1.5 hover:text-white/80 transition-colors font-medium">
          <LayoutDashboard className="w-3.5 h-3.5" />
          {label}
        </Link>
      </div>
      <div className="text-white/50">AMG Admin</div>
    </div>
  );
};
