import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!).auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: roleData } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const method = req.method;

    // ─── GET: List all users ───
    if (method === "GET") {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;

      const { data: profiles } = await supabaseAdmin.from("profiles").select("*");
      const { data: roles } = await supabaseAdmin.from("user_roles").select("*");

      const enriched = users.map((u: any) => {
        const profile = profiles?.find((p: any) => p.user_id === u.id);
        const userRoles = roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [];
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          phone: profile?.phone || "",
          roles: userRoles,
        };
      });

      return new Response(JSON.stringify(enriched), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── POST: Create user ───
    if (method === "POST") {
      const body = await req.json();
      const { email, password, firstName, lastName, phone, role } = body;

      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName || "", last_name: lastName || "", phone: phone || "" },
      });

      if (createError) throw createError;

      // The trigger auto-creates profile + customer role.
      // Add extra role if not customer.
      if (role && role !== "customer") {
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: newUser.user.id, role },
          { onConflict: "user_id,role" }
        );
      }

      return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── PUT: Toggle role / Delete user ───
    if (method === "PUT") {
      const body = await req.json();
      const { userId, action, role } = body;

      if (action === "delete_user") {
        if (userId === user.id) {
          return new Response(JSON.stringify({ error: "Cannot delete yourself" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;
      } else if (action === "add_role") {
        await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
      } else if (action === "remove_role") {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── PATCH: Update user profile ───
    if (method === "PATCH") {
      const body = await req.json();
      const { userId, firstName, lastName, phone } = body;

      await supabaseAdmin.from("profiles").update({
        first_name: firstName || "",
        last_name: lastName || "",
        phone: phone || "",
      }).eq("user_id", userId);

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── DELETE: Delete user ───
    if (method === "DELETE") {
      const body = await req.json();
      const { userId } = body;
      if (userId === user.id) {
        return new Response(JSON.stringify({ error: "Cannot delete yourself" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
