import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Package, Users, DollarSign, Clock, AlertTriangle } from "lucide-react";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [
        { count: totalOrders },
        { count: pendingOrders },
        { data: revData },
        { count: totalProducts },
        { count: totalUsers },
        { data: recentOrders },
      ] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("total, status"),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("order_number, first_name, last_name, total, status, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      const revenue = (revData || []).filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0);
      return { totalOrders: totalOrders || 0, pendingOrders: pendingOrders || 0, revenue, totalProducts: totalProducts || 0, totalUsers: totalUsers || 0, recentOrders: recentOrders || [] };
    },
  });

  const statCards = [
    { label: "Total Orders", value: stats?.totalOrders || 0, icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
    { label: "Products", value: stats?.totalProducts || 0, icon: Package, color: "text-emerald-600 bg-emerald-50" },
    { label: "Customers", value: stats?.totalUsers || 0, icon: Users, color: "text-purple-600 bg-purple-50" },
    { label: "Revenue", value: `₪${(stats?.revenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-amber-600 bg-amber-50" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>
          {(stats?.recentOrders || []).length === 0 ? (
            <p className="text-gray-400 text-sm">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {(stats?.recentOrders || []).map((order: any) => (
                <div key={order.order_number} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-xs text-gray-400">{order.first_name} {order.last_name}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-semibold text-gray-900">₪{Number(order.total).toLocaleString()}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Pending Actions</h2>
          </div>
          <div className="space-y-3">
            {(stats?.pendingOrders || 0) > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm text-amber-800">Pending orders awaiting verification</span>
                <span className="text-lg font-bold text-amber-700">{stats?.pendingOrders}</span>
              </div>
            )}
            {(stats?.pendingOrders || 0) === 0 && (
              <p className="text-gray-400 text-sm">No pending actions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
