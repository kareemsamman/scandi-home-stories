import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Package, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrders as useDbOrders, type DbOrder, type DbOrderItem } from "@/hooks/useDbData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  shipped: "bg-purple-500/20 text-purple-400",
  delivered: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const AdminOrders = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useDbOrders();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Status updated" });
    },
  });

  const filtered = orders.filter((o) => filterStatus === "all" || o.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-white/50 text-sm mt-1">{orders.length} orders total</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
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

      {isLoading ? (
        <div className="text-white/50">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isExpanded = expanded === order.id;
            return (
              <div key={order.id} className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : order.id)}>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{order.order_number}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[order.status] || "bg-white/10 text-white/50"}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs">
                      {order.first_name} {order.last_name} · {order.email} · {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-white font-semibold">₪{order.total.toLocaleString()}</p>
                    <p className="text-white/40 text-xs">{order.order_items?.length || 0} items</p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-4 bg-white/[0.02]">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-white/40 text-xs mb-1">Customer</p>
                        <p className="text-white">{order.first_name} {order.last_name}</p>
                        <p className="text-white/60">{order.email}</p>
                        <p className="text-white/60">{order.phone}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-1">Shipping</p>
                        <p className="text-white">{order.city}</p>
                        <p className="text-white/60">{order.address}</p>
                        {order.apartment && <p className="text-white/60">{order.apartment}</p>}
                      </div>
                    </div>

                    <div>
                      <p className="text-white/40 text-xs mb-2">Items</p>
                      <div className="space-y-2">
                        {(order.order_items || []).map((item: DbOrderItem) => (
                          <div key={item.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/5">
                            {item.product_image && <img src={item.product_image} alt="" className="w-10 h-10 rounded object-cover" />}
                            <div className="flex-1">
                              <p className="text-white text-sm">{item.product_name}</p>
                              <p className="text-white/40 text-xs">
                                {item.size && `Size: ${item.size}`}
                                {item.color_name && ` · Color: ${item.color_name}`}
                              </p>
                            </div>
                            <p className="text-white text-sm">×{item.quantity}</p>
                            <p className="text-white font-medium text-sm">₪{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-sm">Status:</span>
                        <Select value={order.status} onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v })}>
                          <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
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
                        <p className="text-white/40 text-xs">Discount: {order.discount_code} (-₪{order.discount_amount})</p>
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
