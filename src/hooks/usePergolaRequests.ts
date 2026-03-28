import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PergolaRequest } from "@/types/pergola";

const db = supabase as any;

// ── Queries ──

export const usePergolaRequests = () =>
  useQuery<PergolaRequest[]>({
    queryKey: ["pergola_requests"],
    queryFn: async () => {
      const { data, error } = await db
        .from("pergola_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const usePergolaRequestById = (id: string) =>
  useQuery<PergolaRequest>({
    queryKey: ["pergola_request", id],
    queryFn: async () => {
      const { data, error } = await db
        .from("pergola_requests")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

// ── Mutations ──

export const useCreatePergolaRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Omit<PergolaRequest, "id" | "created_at" | "updated_at" | "status" | "admin_notes" | "admin_modified_config">) => {
      const { data, error } = await db
        .from("pergola_requests")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return data as PergolaRequest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pergola_requests"] });
    },
  });
};

export const useUpdatePergolaRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<PergolaRequest>) => {
      const { error } = await db
        .from("pergola_requests")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["pergola_requests"] });
      qc.invalidateQueries({ queryKey: ["pergola_request", variables.id] });
    },
  });
};
