import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard } from "lucide-react";

export const AdminTopBar = () => {
  const { isAdmin, loading } = useAuth();

  if (loading || !isAdmin) return null;

  return (
    <div className="bg-[hsl(var(--dark))] text-white text-xs h-8 flex items-center px-4 justify-between z-[100] relative" dir="ltr">
      <div className="flex items-center gap-3">
        <Link to="/admin" className="flex items-center gap-1.5 hover:text-white/80 transition-colors font-medium">
          <LayoutDashboard className="w-3.5 h-3.5" />
          Admin Dashboard
        </Link>
      </div>
      <div className="text-white/50">AMG Admin</div>
    </div>
  );
};
