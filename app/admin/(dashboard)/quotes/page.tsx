import { createClient } from "@/lib/supabase/server";
import { normalizeQuoteFormSettings } from "@/lib/cms/quote-form";
import type { SiteSettings } from "@/lib/cms/types";
import { QUOTE_ATTACHMENT_BUCKET } from "@/lib/quote/constants";
import { QuoteFormEditor } from "@/components/admin/quote-form-editor";
import { SectionShell } from "@/components/admin/section-shell";

const SIGNED_URL_TTL_SECONDS = 60 * 5; // 5 minutes

function attachmentLabel(path: string) {
  const name = path.split("/").pop() ?? path;
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: sectionParam } = await searchParams;
  const supabase = await createClient();
  const [{ data: settings }, { data: leads }] = await Promise.all([
    supabase.from("site_settings").select("quote_form").eq("id", 1).single(),
    supabase
      .from("quote_leads")
      .select(
        "id, full_name, email, phone, city, state, message, attachment_path, created_at, meta",
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const quoteForm = normalizeQuoteFormSettings(
    (settings as Pick<SiteSettings, "quote_form"> | null)?.quote_form,
  );

  const leadsWithFiles = await Promise.all(
    (leads ?? []).map(async (lead) => {
      const meta = lead.meta as {
        email_notification?: { status?: string; error?: string | null };
        custom_fields?: { id: string; label: string; value: string }[];
      } | null;
      const notify = meta?.email_notification;
      const emailStatus = notify?.status ?? "pending";
      const emailError = notify?.error ?? null;
      const customFields = Array.isArray(meta?.custom_fields)
        ? meta.custom_fields.filter((f) => f?.value?.trim())
        : [];

      if (!lead.attachment_path) {
        return {
          ...lead,
          customFields,
          fileName: null as string | null,
          viewUrl: null as string | null,
          downloadUrl: null as string | null,
          emailStatus,
          emailError,
        };
      }
      const fileName = attachmentLabel(lead.attachment_path);
      const [{ data: view }, { data: download }] = await Promise.all([
        supabase.storage
          .from(QUOTE_ATTACHMENT_BUCKET)
          .createSignedUrl(lead.attachment_path, SIGNED_URL_TTL_SECONDS),
        supabase.storage
          .from(QUOTE_ATTACHMENT_BUCKET)
          .createSignedUrl(lead.attachment_path, SIGNED_URL_TTL_SECONDS, {
            download: fileName,
          }),
      ]);
      return {
        ...lead,
        customFields,
        fileName,
        viewUrl: view?.signedUrl ?? null,
        downloadUrl: download?.signedUrl ?? null,
        emailStatus,
        emailError,
      };
    }),
  );

  return (
    <SectionShell
      title="Quotes"
      defaultSectionId={sectionParam}
      sections={[
        {
          id: "leads",
          label: "Leads",
          count: leadsWithFiles.length,
          content:
            leadsWithFiles.length === 0 ? (
              <p className="text-sm text-text-primary/55">No leads yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-brand-primary/8 bg-bg-primary/80">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-bg-secondary text-[11px] tracking-wide text-brand-primary/55 uppercase">
                    <tr>
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">City</th>
                      <th className="px-3 py-2">State</th>
                      <th className="px-3 py-2">Message</th>
                      <th className="px-3 py-2">File</th>
                      <th className="px-3 py-2">Notify</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsWithFiles.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-t border-brand-primary/8 align-top"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-text-primary/50">
                          {new Date(lead.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">{lead.full_name}</td>
                        <td className="px-3 py-2">{lead.email}</td>
                        <td className="px-3 py-2">{lead.phone}</td>
                        <td className="px-3 py-2">{lead.city}</td>
                        <td className="px-3 py-2">{lead.state}</td>
                        <td className="max-w-xs px-3 py-2 text-text-primary/75">
                          {lead.message ? <p>{lead.message}</p> : null}
                          {lead.customFields.length > 0 ? (
                            <ul className="mt-1 space-y-0.5 text-xs text-text-primary/55">
                              {lead.customFields.map((field) => (
                                <li key={field.id}>
                                  <span className="font-medium text-text-primary/70">
                                    {field.label}:
                                  </span>{" "}
                                  {field.value}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {!lead.message && lead.customFields.length === 0
                            ? "—"
                            : null}
                        </td>
                        <td className="px-3 py-2">
                          {lead.fileName && (lead.viewUrl || lead.downloadUrl) ? (
                            <div className="flex min-w-36 flex-col gap-1">
                              <span
                                className="max-w-48 truncate text-xs text-text-primary/55"
                                title={lead.fileName}
                              >
                                {lead.fileName}
                              </span>
                              <div className="flex flex-wrap gap-2 text-sm">
                                {lead.viewUrl ? (
                                  <a
                                    href={lead.viewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-brand-primary underline-offset-2 hover:underline"
                                  >
                                    View
                                  </a>
                                ) : null}
                                {lead.downloadUrl ? (
                                  <a
                                    href={lead.downloadUrl}
                                    className="font-medium text-brand-primary underline-offset-2 hover:underline"
                                  >
                                    Download
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          ) : lead.attachment_path ? (
                            <span className="text-text-primary/45">Unavailable</span>
                          ) : (
                            <span className="text-text-primary/45">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {lead.emailStatus === "sent" ? (
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                              Emailed
                            </span>
                          ) : lead.emailStatus === "failed" ? (
                            <span
                              className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                              title={lead.emailError ?? "Email failed"}
                            >
                              Failed
                            </span>
                          ) : lead.emailStatus === "skipped" ? (
                            <span className="rounded-md bg-bg-secondary px-2 py-0.5 text-xs text-text-primary/55">
                              Off
                            </span>
                          ) : (
                            <span className="rounded-md bg-bg-secondary px-2 py-0.5 text-xs text-text-primary/45">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
        },
        {
          id: "form",
          label: "Quote form",
          content: <QuoteFormEditor initial={quoteForm} />,
        },
      ]}
    />
  );
}
