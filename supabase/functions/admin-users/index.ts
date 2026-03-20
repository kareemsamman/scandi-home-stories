import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const upsertProfile = async (
  supabaseAdmin: any,
  userId: string,
  firstName: string,
  lastName: string,
  phone: string,
) => {
  const { data: existingProfile, error: lookupError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError && lookupError.code !== "PGRST116") {
    throw lookupError;
  }

  if (existingProfile?.id) {
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ first_name: firstName, last_name: lastName, phone })
      .eq("id", existingProfile.id);
    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await supabaseAdmin
    .from("profiles")
    .insert({ user_id: userId, first_name: firstName, last_name: lastName, phone });
  if (insertError) throw insertError;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({ error: "Missing backend configuration" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (roleError) throw roleError;

    if (!roleData || roleData.length === 0) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    if (req.method === "GET") {
      const {
        data: { users },
        error,
      } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;

      const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] = await Promise.all([
        supabaseAdmin.from("profiles").select("user_id, first_name, last_name, phone"),
        supabaseAdmin.from("user_roles").select("user_id, role"),
      ]);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;

      const enriched = users.map((u: any) => {
        const profile = profiles?.find((p: any) => p.user_id === u.id);
        const userRoles = roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [];

        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          first_name: profile?.first_name || u.user_metadata?.first_name || "",
          last_name: profile?.last_name || u.user_metadata?.last_name || "",
          phone: profile?.phone || u.user_metadata?.phone || u.phone || "",
          roles: userRoles,
        };
      });

      return jsonResponse(enriched);
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { email, password, firstName, lastName, phone, role } = body;

      if (!email || !password) {
        return jsonResponse({ error: "Email and password are required" }, 400);
      }

      const first = firstName || "";
      const last = lastName || "";
      const phoneValue = (phone || "").replace(/\D/g, "");

      // Check email duplicate
      const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const emailTaken = (existingUsers || []).some((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (emailTaken) {
        return jsonResponse({ error: "EMAIL_EXISTS", message: "A user with this email already exists" }, 409);
      }

      // Check phone duplicate (if phone provided)
      if (phoneValue) {
        const intlPhone = phoneValue.startsWith("972") ? phoneValue : phoneValue.startsWith("0") ? "972" + phoneValue.slice(1) : phoneValue;
        const { data: existingProfiles } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .or(`phone.eq.${phoneValue},phone.eq.${intlPhone},phone.eq.+${intlPhone}`);
        if (existingProfiles && existingProfiles.length > 0) {
          return jsonResponse({ error: "PHONE_EXISTS", message: "A user with this phone number already exists" }, 409);
        }
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: first, last_name: last, phone: phoneValue },
      });

      if (createError || !newUser.user) throw createError || new Error("Failed to create user");

      await upsertProfile(supabaseAdmin, newUser.user.id, first, last, phoneValue);

      if (role && role !== "customer") {
        const { error: roleUpsertError } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: newUser.user.id, role }, { onConflict: "user_id,role" });
        if (roleUpsertError) throw roleUpsertError;
      }

      return jsonResponse({ success: true, userId: newUser.user.id });
    }

    if (req.method === "PUT") {
      const body = await req.json();
      const { userId, action, role, firstName, lastName, phone, email, newPassword } = body;

      if (!userId || !action) {
        return jsonResponse({ error: "Missing required fields" }, 400);
      }

      if (action === "delete_user") {
        if (userId === user.id) {
          return jsonResponse({ error: "Cannot delete yourself" }, 400);
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;

        return jsonResponse({ success: true });
      }

      if (action === "update_user") {
        const first = firstName || "";
        const last = lastName || "";
        const phoneValue = phone || "";

        await upsertProfile(supabaseAdmin, userId, first, last, phoneValue);

        const authUpdatePayload: Record<string, unknown> = {
          user_metadata: { first_name: first, last_name: last, phone: phoneValue },
        };

        if (email) authUpdatePayload.email = email;
        if (newPassword) authUpdatePayload.password = newPassword;

        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdatePayload);
        if (updateAuthError) throw updateAuthError;

        return jsonResponse({ success: true });
      }

      if (action === "add_role") {
        const { error: addRoleError } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
        if (addRoleError) throw addRoleError;

        return jsonResponse({ success: true });
      }

      if (action === "remove_role") {
        const { error: removeRoleError } = await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);
        if (removeRoleError) throw removeRoleError;

        return jsonResponse({ success: true });
      }

      return jsonResponse({ error: "Unknown action" }, 400);
    }

    return jsonResponse({ error: "Method not allowed" }, 405);
  } catch (err: any) {
    console.error("admin-users error", err);
    return jsonResponse({ error: err?.message || "Unknown error" }, 500);
  }
});
