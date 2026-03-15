import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Create the admin user
  const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: "kareem@amgpergola.com",
    password: "Kareem@112233",
    email_confirm: true,
    user_metadata: { first_name: "Kareem", last_name: "Admin" },
  });

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Assign admin role
  const { error: roleError } = await supabaseAdmin
    .from("user_roles")
    .update({ role: "admin" })
    .eq("user_id", user.user.id);

  if (roleError) {
    // If update failed (trigger already inserted 'customer'), try upsert
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.user.id, role: "admin" }, { onConflict: "user_id,role" });
  }

  return new Response(
    JSON.stringify({ success: true, email: "kareem@amgpergola.com", userId: user.user.id }),
    { headers: { "Content-Type": "application/json" } }
  );
});
