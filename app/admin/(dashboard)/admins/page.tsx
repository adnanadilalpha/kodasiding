import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminsEditor } from "@/components/admin/admins-editor";
import { SectionShell } from "@/components/admin/section-shell";

export default async function AdminsPage() {
  const admin = await requireAdmin();
  if (admin.role !== "owner") {
    redirect("/admin/settings");
  }

  const supabase = await createClient();
  const { data: adminRows } = await supabase
    .from("admin_users")
    .select("user_id, email, role")
    .order("email");

  const admins = adminRows ?? [];

  return (
    <SectionShell
      title="Admins"
      sections={[
        {
          id: "team",
          label: "Team",
          count: admins.length,
          content: (
            <AdminsEditor
              admins={admins}
              currentUserId={admin.user_id}
            />
          ),
        },
      ]}
    />
  );
}
