import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2, ShieldCheck, ShieldX, Search, Plus, X, UserPlus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AdminUser {
  id: string; email: string; created_at: string; last_sign_in_at: string | null;
  first_name: string; last_name: string; phone: string; roles: string[];
}

const ROLES = ["admin", "worker", "customer"] as const;

const AdminUsers = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", role: "customer" });
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", phone: "", newPassword: "" });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await supabase.functions.invoke("admin-users", { method: "GET" });
      if (res.error) throw res.error;
      return res.data as AdminUser[];
    },
    staleTime: 1000 * 60 * 5, // cache for 5 minutes — avoids cold-start on every nav
    gcTime: 1000 * 60 * 10,
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const res = await supabase.functions.invoke("admin-users", {
        method: "POST",
        body: newUser,
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setShowCreate(false);
      setNewUser({ firstName: "", lastName: "", email: "", phone: "", password: "", role: "customer" });
      toast({ title: "User created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, action, role }: { userId: string; action: "add_role" | "remove_role"; role: string }) => {
      const res = await supabase.functions.invoke("admin-users", {
        method: "PUT",
        body: { userId, action, role },
      });
      if (res.error) throw res.error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: "Role updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await supabase.functions.invoke("admin-users", {
        method: "PUT",
        body: { action: "delete_user", userId },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: "User deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser) return;
      const res = await supabase.functions.invoke("admin-users", {
        method: "PUT",
        body: {
          action: "update_user",
          userId: editingUser.id,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone,
          ...(editForm.newPassword ? { newPassword: editForm.newPassword } : {}),
        },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
      toast({ title: "User updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (u: AdminUser) => {
    setEditingUser(u);
    setEditForm({ firstName: u.first_name, lastName: u.last_name, email: u.email, phone: u.phone, newPassword: "" });
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.email.toLowerCase().includes(q) || u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q);
  });

  const SkeletonRow = () => (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-3"><div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-1" /><div className="h-3 w-20 bg-gray-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-4 w-44 bg-gray-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-5 w-24 bg-gray-100 rounded-full animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-6 w-14 bg-gray-100 rounded animate-pulse" /></td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users ({users.length})</h1>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <UserPlus className="w-4 h-4 mr-2" /> Create User
        </Button>
      </div>

      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="First Name" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} />
            <Input placeholder="Last Name" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} autoComplete="off" />
            <Input placeholder="Phone" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} autoComplete="new-password" />
            <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="worker">Worker</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => createUser.mutate()} disabled={createUser.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create
            </Button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-10" autoComplete="off" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-start px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Roles</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Last Sign In</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && [1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
              {!isLoading && filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{u.first_name} {u.last_name}</div>
                    <div className="text-xs text-gray-400">{u.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ROLES.map((role) => {
                        const hasRole = u.roles.includes(role);
                        return (
                          <button
                            key={role}
                            onClick={() => roleMutation.mutate({ userId: u.id, action: hasRole ? "remove_role" : "add_role", role })}
                            disabled={roleMutation.isPending}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              hasRole
                                ? role === "admin" ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : role === "worker" ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                  : "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            }`}
                          >
                            {hasRole ? <ShieldCheck className="w-3 h-3" /> : <ShieldX className="w-3 h-3" />}
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => { if (confirm(`Delete user ${u.email}?`)) deleteMutation.mutate(u.id); }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="First Name" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} autoComplete="off" />
              <Input placeholder="Last Name" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} autoComplete="off" />
            </div>
            <Input placeholder="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} autoComplete="off" />
            <Input placeholder="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} autoComplete="off" />
            <Input placeholder="New Password (leave blank to keep current)" type="password" value={editForm.newPassword} onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })} autoComplete="new-password" />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
