import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const db = supabase as any;

export interface SavedAddress {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  street: string;
  houseNumber: string;
  apartment: string;
  isDefault: boolean;
}

const toSaved = (row: any): SavedAddress => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  phone: row.phone,
  city: row.city,
  street: row.street,
  houseNumber: row.house_number,
  apartment: row.apartment || "",
  isDefault: row.is_default,
});

export const useAddresses = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-addresses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from("user_addresses")
        .select("*")
        .eq("user_id", user!.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map(toSaved) as SavedAddress[];
    },
    staleTime: 1000 * 60,
  });
};

export const useAddAddress = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (address: Omit<SavedAddress, "id">) => {
      const { count } = await db
        .from("user_addresses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      const isFirst = (count || 0) === 0;
      const { error } = await db.from("user_addresses").insert({
        user_id: user!.id,
        first_name: address.firstName,
        last_name: address.lastName,
        phone: address.phone,
        city: address.city,
        street: address.street,
        house_number: address.houseNumber,
        apartment: address.apartment || null,
        is_default: isFirst || address.isDefault,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-addresses"] }),
  });
};

export const useUpdateAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SavedAddress> }) => {
      const payload: any = {};
      if (updates.firstName !== undefined) payload.first_name = updates.firstName;
      if (updates.lastName !== undefined) payload.last_name = updates.lastName;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.city !== undefined) payload.city = updates.city;
      if (updates.street !== undefined) payload.street = updates.street;
      if (updates.houseNumber !== undefined) payload.house_number = updates.houseNumber;
      if (updates.apartment !== undefined) payload.apartment = updates.apartment;
      if (updates.isDefault !== undefined) payload.is_default = updates.isDefault;
      const { error } = await db.from("user_addresses").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-addresses"] }),
  });
};

export const useRemoveAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("user_addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-addresses"] }),
  });
};

export const useSetDefaultAddress = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.from("user_addresses").update({ is_default: false }).eq("user_id", user!.id);
      const { error } = await db.from("user_addresses").update({ is_default: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-addresses"] }),
  });
};
