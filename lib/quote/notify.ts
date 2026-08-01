import { createServiceClient } from "@/lib/supabase/admin";
import { QUOTE_ATTACHMENT_BUCKET } from "@/lib/quote/constants";
import {
  normalizeQuoteEmailSettings,
  sendQuoteNotification,
  type QuoteMailAttachment,
} from "@/lib/email/quote-notify";
import type { QuoteLead } from "@/lib/cms/types";

export type QuoteNotificationPayload = {
  lead: Pick<
    QuoteLead,
    | "id"
    | "full_name"
    | "email"
    | "phone"
    | "city"
    | "state"
    | "message"
    | "attachment_path"
    | "created_at"
  >;
};

function attachmentFilename(path: string) {
  const name = path.split("/").pop() ?? "attachment";
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

function guessContentType(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
    zip: "application/zip",
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}

async function loadQuoteAttachment(
  supabase: ReturnType<typeof createServiceClient>,
  path: string,
): Promise<QuoteMailAttachment | null> {
  if (!path.trim()) return null;

  const { data, error } = await supabase.storage
    .from(QUOTE_ATTACHMENT_BUCKET)
    .download(path);

  if (error || !data) {
    console.error("quote attachment download for email failed", error);
    return null;
  }

  const filename = attachmentFilename(path);
  const bytes = new Uint8Array(await data.arrayBuffer());
  if (bytes.byteLength === 0) {
    console.error("quote attachment download returned empty file", path);
    return null;
  }

  // Prefer extension-based MIME — Blob.type from storage is often empty/wrong
  // and can make clients treat the file as plain text.
  return {
    filename,
    content: Buffer.from(bytes),
    contentType: guessContentType(filename),
  };
}

/**
 * Notify the team inbox (with file attachment) and optionally email the lead.
 * Updates lead.meta.email_notification with delivery status.
 */
export async function notifyQuoteSubmitted(
  payload: QuoteNotificationPayload,
): Promise<void> {
  const supabase = createServiceClient();

  const { data: settingsRow } = await supabase
    .from("quote_email_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const settings = normalizeQuoteEmailSettings(settingsRow);
  const file = await loadQuoteAttachment(
    supabase,
    payload.lead.attachment_path,
  );

  if (payload.lead.attachment_path && !file) {
    console.error(
      "quote had attachment_path but file could not be loaded for email",
      payload.lead.attachment_path,
    );
  }

  const delivery = await sendQuoteNotification(
    settings,
    {
      full_name: payload.lead.full_name,
      email: payload.lead.email,
      phone: payload.lead.phone,
      city: payload.lead.city,
      state: payload.lead.state,
      message: payload.lead.message,
      has_attachment: Boolean(file),
      attachment_filename: file?.filename,
    },
    file,
  );

  const { data: existing } = await supabase
    .from("quote_leads")
    .select("meta")
    .eq("id", payload.lead.id)
    .maybeSingle();

  const meta = {
    ...((existing?.meta as Record<string, unknown> | null) ?? {}),
    email_notification: {
      status: delivery.status,
      error: delivery.error ?? null,
      provider: "smtp",
      attachment_included: Boolean(delivery.attachment_included),
      lead_confirmation: delivery.lead_confirmation ?? "skipped",
      lead_confirmation_error: delivery.lead_confirmation_error ?? null,
      at: new Date().toISOString(),
    },
  };

  await supabase
    .from("quote_leads")
    .update({ meta })
    .eq("id", payload.lead.id);
}
