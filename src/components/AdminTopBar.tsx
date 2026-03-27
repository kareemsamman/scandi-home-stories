import { Link } from "react-router-dom";
import { useContext } from "react";
import { LayoutDashboard } from "lucide-react";
import { AuthContext } from "@/hooks/useAuth";

export const AdminTopBar = () => {
  const auth = useContext(AuthContext);

  // If AuthProvider isn't mounted yet, render nothing
  if (!auth) return null;

  const { isAdmin, isWorker, loading } = auth;

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
