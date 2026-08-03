import type { SupabaseClient } from "@supabase/supabase-js";

export const LEAD_PAGE_SIZES = [10, 25, 50] as const;
export type LeadPageSize = (typeof LEAD_PAGE_SIZES)[number];

export type LeadNotifyFilter = "" | "sent" | "failed" | "skipped" | "pending";
export type LeadFileFilter = "" | "yes" | "no";

export type QuoteLeadFilters = {
  q: string;
  from: string;
  to: string;
  state: string;
  file: LeadFileFilter;
  notify: LeadNotifyFilter;
  page: number;
  pageSize: LeadPageSize;
};

export type QuoteLeadRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  message: string;
  attachment_path: string;
  created_at: string;
  meta: {
    email_notification?: { status?: string; error?: string | null };
    custom_fields?: { id: string; label: string; value: string }[];
  } | null;
};

const DEFAULT_PAGE_SIZE: LeadPageSize = 25;

function clampPageSize(raw: string | undefined): LeadPageSize {
  const n = Number(raw);
  if ((LEAD_PAGE_SIZES as readonly number[]).includes(n)) {
    return n as LeadPageSize;
  }
  return DEFAULT_PAGE_SIZE;
}

function sanitizeIlike(raw: string) {
  return raw
    .trim()
    .slice(0, 120)
    .replace(/[%_,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseQuoteLeadFilters(
  params: Record<string, string | string[] | undefined>,
): QuoteLeadFilters {
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };

  const fileRaw = one("file");
  const file: LeadFileFilter =
    fileRaw === "yes" || fileRaw === "no" ? fileRaw : "";

  const notifyRaw = one("notify");
  const notify: LeadNotifyFilter =
    notifyRaw === "sent" ||
    notifyRaw === "failed" ||
    notifyRaw === "skipped" ||
    notifyRaw === "pending"
      ? notifyRaw
      : "";

  const page = Math.max(1, Number.parseInt(one("page") || "1", 10) || 1);

  return {
    q: sanitizeIlike(one("q")),
    from: one("from").slice(0, 10),
    to: one("to").slice(0, 10),
    state: sanitizeIlike(one("state")).slice(0, 80),
    file,
    notify,
    page,
    pageSize: clampPageSize(one("pageSize")),
  };
}

export function quoteLeadFiltersToSearchParams(
  filters: QuoteLeadFilters,
  extras?: Record<string, string>,
) {
  const params = new URLSearchParams();
  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v) params.set(k, v);
    }
  }
  if (filters.q) params.set("q", filters.q);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.state) params.set("state", filters.state);
  if (filters.file) params.set("file", filters.file);
  if (filters.notify) params.set("notify", filters.notify);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(filters.pageSize));
  }
  return params;
}

function endOfDayIso(dateYmd: string) {
  // Inclusive end of calendar day in UTC (admin date inputs are date-only)
  const d = new Date(`${dateYmd}T23:59:59.999Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function startOfDayIso(dateYmd: string) {
  const d = new Date(`${dateYmd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function ilikePattern(value: string) {
  // PostgREST reserved chars must be double-quoted in .or() filters
  const safe = value.replace(/"/g, "");
  return `"%${safe}%"`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyLeadFilters(query: any, filters: QuoteLeadFilters) {
  let q = query;

  if (filters.q) {
    const term = ilikePattern(filters.q);
    q = q.or(
      [
        `full_name.ilike.${term}`,
        `email.ilike.${term}`,
        `phone.ilike.${term}`,
        `city.ilike.${term}`,
        `state.ilike.${term}`,
        `message.ilike.${term}`,
      ].join(","),
    );
  }

  if (filters.state) {
    q = q.ilike("state", `%${filters.state}%`);
  }

  if (filters.from) {
    const iso = startOfDayIso(filters.from);
    if (iso) q = q.gte("created_at", iso);
  }

  if (filters.to) {
    const iso = endOfDayIso(filters.to);
    if (iso) q = q.lte("created_at", iso);
  }

  if (filters.file === "yes") {
    q = q.neq("attachment_path", "");
  } else if (filters.file === "no") {
    q = q.eq("attachment_path", "");
  }

  if (filters.notify) {
    q = q.contains("meta", {
      email_notification: { status: filters.notify },
    });
  }

  return q;
}

export async function fetchQuoteLeadsPage(
  supabase: SupabaseClient,
  filters: QuoteLeadFilters,
) {
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = supabase
    .from("quote_leads")
    .select(
      "id, full_name, email, phone, city, state, message, attachment_path, created_at, meta",
      { count: "exact" },
    );

  query = applyLeadFilters(query, filters);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    leads: (data ?? []) as QuoteLeadRow[],
    total: count ?? 0,
  };
}

export function leadEmailStatus(lead: QuoteLeadRow) {
  const notify = lead.meta?.email_notification;
  return {
    status: notify?.status ?? "pending",
    error: notify?.error ?? null,
  };
}

export function leadCustomFields(lead: QuoteLeadRow) {
  const fields = lead.meta?.custom_fields;
  if (!Array.isArray(fields)) return [];
  return fields.filter((f) => f?.value?.trim());
}

export function leadHasFile(lead: QuoteLeadRow) {
  return Boolean(lead.attachment_path?.trim());
}
