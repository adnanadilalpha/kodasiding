import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AdminUser = {
  user_id: string;
  email: string;
  role: "owner" | "editor";
};

export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: existing } = await supabase
    .from("admin_users")
    .select("user_id, email, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return existing as AdminUser;
  }

  const { data: claimed, error } = await supabase.rpc("claim_admin_access");
  if (error || !claimed) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id, email, role")
    .eq("user_id", user.id)
    .single();

  if (!admin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  return admin as AdminUser;
}

export async function requireOwner(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "owner") {
    redirect("/admin?error=forbidden");
  }
  return admin;
}
