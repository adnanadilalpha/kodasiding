import { createClient } from "@/lib/supabase/server";
import { normalizeQuoteFormSettings } from "@/lib/cms/quote-form";
import type { SiteSettings } from "@/lib/cms/types";
import {
  fetchQuoteLeadsPage,
  parseQuoteLeadFilters,
} from "@/lib/quote/leads-admin";
import { QuoteFormEditor } from "@/components/admin/quote-form-editor";
import { QuoteLeadsManager } from "@/components/admin/quote-leads-manager";
import { SectionShell } from "@/components/admin/section-shell";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sectionParam = Array.isArray(params.section)
    ? params.section[0]
    : params.section;
  const filters = parseQuoteLeadFilters(params);

  const supabase = await createClient();
  const [{ data: settings }, leadsPage] = await Promise.all([
    supabase.from("site_settings").select("quote_form").eq("id", 1).single(),
    fetchQuoteLeadsPage(supabase, filters),
  ]);

  const quoteForm = normalizeQuoteFormSettings(
    (settings as Pick<SiteSettings, "quote_form"> | null)?.quote_form,
  );

  return (
    <SectionShell
      title="Quotes"
      defaultSectionId={sectionParam}
      sections={[
        {
          id: "leads",
          label: "Leads",
          count: leadsPage.total,
          content: (
            <QuoteLeadsManager
              leads={leadsPage.leads}
              total={leadsPage.total}
              filters={filters}
            />
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
