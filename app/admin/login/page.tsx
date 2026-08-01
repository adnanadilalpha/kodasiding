import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md rounded-lg border border-brand-primary/10 bg-bg-secondary p-8 shadow-sm">
        <p className="font-display text-2xl font-bold tracking-wide text-brand-primary uppercase">
          Koda CMS
        </p>
        <p className="mt-2 text-sm text-text-primary/70">
          Sign in with the email and password set by an owner. No public signup.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="text-sm">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
