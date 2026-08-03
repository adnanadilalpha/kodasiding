"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { QUOTE_ATTACHMENT_BUCKET } from "@/lib/quote/constants";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_RE.test(value);
}

async function removeAttachments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
) {
  const unique = [...new Set(paths.map((p) => p.trim()).filter(Boolean))];
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const { error } = await supabase.storage
      .from(QUOTE_ATTACHMENT_BUCKET)
      .remove(chunk);
    if (error) {
      console.error("quote attachment cleanup failed", error.message);
    }
  }
}

export async function deleteQuoteLeads(ids: string[]) {
  try {
    await requireAdmin();
  } catch {
    return { error: "Not authorized." };
  }

  const cleanIds = [...new Set(ids.map((id) => id.trim()).filter(isUuid))];
  if (cleanIds.length === 0) {
    return { error: "No leads selected." };
  }
  if (cleanIds.length > 500) {
    return { error: "Delete at most 500 leads at a time." };
  }

  const supabase = await createClient();
  const { data: rows, error: selectError } = await supabase
    .from("quote_leads")
    .select("id, attachment_path")
    .in("id", cleanIds);

  if (selectError) return { error: selectError.message };

  const paths = (rows ?? [])
    .map((r) => r.attachment_path)
    .filter((p): p is string => Boolean(p?.trim()));

  const { error: deleteError } = await supabase
    .from("quote_leads")
    .delete()
    .in("id", cleanIds);

  if (deleteError) return { error: deleteError.message };

  await removeAttachments(supabase, paths);
  revalidatePath("/admin/quotes");
  return { success: true as const, deleted: cleanIds.length };
}

export async function deleteQuoteLeadsOlderThan(beforeIso: string) {
  try {
    await requireAdmin();
  } catch {
    return { error: "Not authorized." };
  }

  const before = new Date(beforeIso);
  if (Number.isNaN(before.getTime())) {
    return { error: "Invalid date." };
  }

  // Guard: don't wipe everything by accident with a future date
  if (before.getTime() > Date.now()) {
    return { error: "Date must be in the past." };
  }

  const supabase = await createClient();
  const cutoff = before.toISOString();

  // Cap bulk purge per request so we stay responsive
  const { data: rows, error: selectError } = await supabase
    .from("quote_leads")
    .select("id, attachment_path")
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(1000);

  if (selectError) return { error: selectError.message };
  if (!rows?.length) {
    return { success: true as const, deleted: 0, hasMore: false };
  }

  const ids = rows.map((r) => r.id);
  const paths = rows
    .map((r) => r.attachment_path)
    .filter((p): p is string => Boolean(p?.trim()));

  const { error: deleteError } = await supabase
    .from("quote_leads")
    .delete()
    .in("id", ids);

  if (deleteError) return { error: deleteError.message };

  await removeAttachments(supabase, paths);
  revalidatePath("/admin/quotes");

  const hasMore = rows.length === 1000;
  return { success: true as const, deleted: ids.length, hasMore };
}

export async function countQuoteLeadsOlderThan(beforeIso: string) {
  try {
    await requireAdmin();
  } catch {
    return { error: "Not authorized." };
  }

  const before = new Date(beforeIso);
  if (Number.isNaN(before.getTime())) {
    return { error: "Invalid date." };
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("quote_leads")
    .select("id", { count: "exact", head: true })
    .lt("created_at", before.toISOString());

  if (error) return { error: error.message };
  return { count: count ?? 0 };
}

export async function getQuoteLeadAttachmentUrls(path: string) {
  try {
    await requireAdmin();
  } catch {
    return { error: "Not authorized." };
  }

  const clean = path.trim();
  if (!clean) return { error: "No file." };
  // Paths are always `${leadUuid}/${filename}` — reject traversal / absolute
  if (
    clean.includes("..") ||
    clean.startsWith("/") ||
    clean.includes("\\") ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\//i.test(
      clean,
    )
  ) {
    return { error: "Invalid file path." };
  }

  const supabase = await createClient();
  const fileName = clean.split("/").pop() ?? clean;
  const ttl = 60 * 5;

  const [{ data: view, error: viewError }, { data: download, error: dlError }] =
    await Promise.all([
      supabase.storage.from(QUOTE_ATTACHMENT_BUCKET).createSignedUrl(clean, ttl),
      supabase.storage
        .from(QUOTE_ATTACHMENT_BUCKET)
        .createSignedUrl(clean, ttl, { download: fileName }),
    ]);

  if (viewError || dlError) {
    return { error: viewError?.message ?? dlError?.message ?? "Unavailable" };
  }

  return {
    fileName,
    viewUrl: view?.signedUrl ?? null,
    downloadUrl: download?.signedUrl ?? null,
  };
}
