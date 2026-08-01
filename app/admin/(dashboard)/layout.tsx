import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-bg-primary md:flex-row">
      <AdminSidebar email={admin.email} role={admin.role} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-10 md:px-7 md:py-6 md:pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
