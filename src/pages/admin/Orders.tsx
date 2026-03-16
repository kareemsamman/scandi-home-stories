import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Package, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrders, type DbOrderItem } from "@/hooks/useDbData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const AdminOrders = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useOrders();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orders"] }); toast({ title: "Status updated" }); },
  });

  const filtered = orders.filter((o) => filterStatus === "all" || o.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} orders total</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <p className="text-gray-400">Loading...</p> : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isExpanded = expanded === order.id;
            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : order.id)}>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-gray-900 font-semibold">{order.order_number}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs">
                      {order.first_name} {order.last_name} · {order.email} · {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-gray-900 font-semibold">₪{Number(order.total).toLocaleString()}</p>
                    <p className="text-gray-400 text-xs">{order.order_items?.length || 0} items</p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Customer</p>
                        <p className="text-gray-900">{order.first_name} {order.last_name}</p>
                        <p className="text-gray-500">{order.email}</p>
                        <p className="text-gray-500">{order.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Shipping</p>
                        <p className="text-gray-900">{order.city}</p>
                        <p className="text-gray-500">{order.address}</p>
                        {order.apartment && <p className="text-gray-500">{order.apartment}</p>}
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-2">Items</p>
                      <div className="space-y-2">
                        {(order.order_items || []).map((item: DbOrderItem) => (
                          <div key={item.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white border border-gray-100">
                            {item.product_image && <img src={item.product_image} alt="" className="w-10 h-10 rounded object-cover" />}
                            <div className="flex-1">
                              <p className="text-gray-900 text-sm">{item.product_name}</p>
                              <p className="text-gray-400 text-xs">
                                {item.size && `Size: ${item.size}`}
                                {item.color_name && ` · Color: ${item.color_name}`}
                              </p>
                            </div>
                            <p className="text-gray-600 text-sm">×{item.quantity}</p>
                            <p className="text-gray-900 font-medium text-sm">₪{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">Status:</span>
                        <Select value={order.status} onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v })}>
                          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {order.discount_code && (
                        <p className="text-gray-400 text-xs">Discount: {order.discount_code} (-₪{order.discount_amount})</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
