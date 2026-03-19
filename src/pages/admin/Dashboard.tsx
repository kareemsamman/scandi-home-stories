import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingBag, Package, Users, DollarSign, Clock, AlertTriangle } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  waiting_approval: "מחכה אישור",
  in_process: "בתהליך",
  in_delivery: "יצא למשלוח",
  not_approved: "לא אושרה",
  cancelled: "בוטלה",
  pending: "ממתין",
  confirmed: "אושרה",
  shipped: "נשלחה",
  delivered: "נמסרה",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Orders stats — available to both admin and worker
  const { data: orderStats } = useQuery({
    queryKey: ["dashboard-order-stats"],
    queryFn: async () => {
      const [
        { count: totalOrders },
        { data: recentOrders },
        { data: waitingOrders },
      ] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("id, order_number, first_name, last_name, total, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("orders").select("id, order_number, first_name, last_name, total, created_at").eq("status", "waiting_approval").order("created_at", { ascending: false }),
      ]);
      return { totalOrders: totalOrders || 0, recentOrders: recentOrders || [], waitingOrders: waitingOrders || [] };
    },
  });

  // Admin-only stats
  const { data: adminStats } = useQuery({
    queryKey: ["dashboard-admin-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const [
        { data: revData },
        { count: totalProducts },
        { count: totalUsers },
      ] = await Promise.all([
        supabase.from("orders").select("total, status"),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      const revenue = (revData || []).filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0);
      return { revenue, totalProducts: totalProducts || 0, totalUsers: totalUsers || 0 };
    },
  });

  const workerStatCards = [
    { label: "Total Orders", value: orderStats?.totalOrders || 0, icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
    { label: "Pending Approval", value: orderStats?.waitingOrders?.length || 0, icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
  ];

  const adminStatCards = [
    { label: "Total Orders", value: orderStats?.totalOrders || 0, icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
    { label: "Products", value: adminStats?.totalProducts || 0, icon: Package, color: "text-emerald-600 bg-emerald-50" },
    { label: "Customers", value: adminStats?.totalUsers || 0, icon: Users, color: "text-purple-600 bg-purple-50" },
    { label: "Revenue", value: `₪${(adminStats?.revenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-amber-600 bg-amber-50" },
  ];

  const statCards = isAdmin ? adminStatCards : workerStatCards;

  const statusColors: Record<string, string> = {
    waiting_approval: "bg-amber-100 text-amber-700",
    in_process: "bg-blue-100 text-blue-700",
    in_delivery: "bg-purple-100 text-purple-700",
    not_approved: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>
          {(orderStats?.recentOrders || []).length === 0 ? (
            <p className="text-gray-400 text-sm">No orders yet</p>
          ) : (
            <div className="space-y-3 overflow-y-auto overflow-x-hidden max-h-80">
              {(orderStats?.recentOrders || []).map((order: any) => (
                <div key={order.order_number} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-xs text-gray-400">{order.first_name} {order.last_name}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-semibold text-gray-900">₪{Number(order.total).toLocaleString()}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Pending Actions</h2>
            {(orderStats?.waitingOrders || []).length > 0 && (
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{orderStats!.waitingOrders.length}</span>
            )}
          </div>
          <div className="space-y-2 overflow-y-auto overflow-x-hidden max-h-80">
            {(orderStats?.waitingOrders || []).length === 0 ? (
              <p className="text-gray-400 text-sm">No pending actions</p>
            ) : (
              (orderStats!.waitingOrders as any[]).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">{order.order_number}</p>
                    <p className="text-xs text-amber-700">{order.first_name} {order.last_name}</p>
                  </div>
                  <p className="text-sm font-bold text-amber-800">₪{Number(order.total).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
