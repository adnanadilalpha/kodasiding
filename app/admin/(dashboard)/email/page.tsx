import { QuoteEmailSettingsForm } from "@/components/admin/quote-email-settings-form";
import { EmailTemplatePreview } from "@/components/admin/email-template-preview";
import { requireOwner } from "@/lib/auth/admin";
import { defaultQuoteEmailSettings } from "@/lib/email/quote-notify";
import type { QuoteEmailSettings } from "@/lib/cms/types";
import { createClient } from "@/lib/supabase/server";

export default async function EmailSetupPage() {
  await requireOwner();
  const supabase = await createClient();
  const { data: emailSettings } = await supabase
    .from("quote_email_settings")
    .select(
      "enabled, provider, to_email, from_email, from_name, reply_to_submitter, send_lead_confirmation, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass",
    )
    .eq("id", 1)
    .maybeSingle();

  const row = emailSettings as
    | (Partial<QuoteEmailSettings> & { smtp_pass?: string })
    | null;

  const settings: QuoteEmailSettings = {
    ...defaultQuoteEmailSettings,
    ...row,
    provider: "smtp",
    resend_api_key: "",
    smtp_pass: "",
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Email setup</h1>
        <p className="mt-1 text-sm text-text-primary/55">
          Connect your own email so quote requests arrive in your inbox.
        </p>
      </div>

      <QuoteEmailSettingsForm
        initial={settings}
        hasSavedPassword={Boolean(row?.smtp_pass)}
      />

      <EmailTemplatePreview />
    </div>
  );
}
