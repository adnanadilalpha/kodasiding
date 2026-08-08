import "server-only";
import path from "path";
import nodemailer from "nodemailer";
import type { Attachment } from "nodemailer/lib/mailer";
import type { QuoteEmailSettings } from "@/lib/cms/types";
import {
  buildLeadConfirmationEmail,
  buildQuoteNotificationEmail,
  buildTestEmail,
  EMAIL_LOGO_CID,
  type QuoteMessagePayload,
} from "@/lib/email/templates";
import { assertSafeSmtpHost } from "@/lib/email/smtp-host";
import { decryptSmtpPass } from "@/lib/email/smtp-crypto";

export type { QuoteMessagePayload };

export const defaultQuoteEmailSettings: QuoteEmailSettings = {
  enabled: false,
  provider: "smtp",
  to_email: "",
  from_email: "",
  from_name: "Koda Siding",
  reply_to_submitter: true,
  send_lead_confirmation: true,
  resend_api_key: "",
  smtp_host: "smtp.gmail.com",
  smtp_port: 587,
  smtp_secure: false,
  smtp_user: "",
  smtp_pass: "",
};

const SMTP_TIMEOUT_MS = 20_000;

const EMAIL_LOGO_PATH = path.join(
  process.cwd(),
  "public/brand/logo-email-white.png",
);

export type QuoteMailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type QuoteDeliveryResult = {
  status: "skipped" | "sent" | "failed";
  error?: string;
  attachment_included?: boolean;
  lead_confirmation?: "skipped" | "sent" | "failed";
  lead_confirmation_error?: string;
};

export function normalizeQuoteEmailSettings(
  row: Partial<QuoteEmailSettings> | null | undefined,
): QuoteEmailSettings {
  // Pick only writable columns — never forward generated fields like smtp_pass_set.
  return {
    enabled: Boolean(row?.enabled),
    provider: "smtp",
    to_email: String(row?.to_email ?? defaultQuoteEmailSettings.to_email),
    from_email: String(row?.from_email ?? defaultQuoteEmailSettings.from_email),
    from_name: String(row?.from_name ?? defaultQuoteEmailSettings.from_name),
    reply_to_submitter:
      row?.reply_to_submitter === undefined
        ? defaultQuoteEmailSettings.reply_to_submitter
        : Boolean(row.reply_to_submitter),
    send_lead_confirmation:
      row?.send_lead_confirmation === undefined
        ? defaultQuoteEmailSettings.send_lead_confirmation
        : Boolean(row.send_lead_confirmation),
    resend_api_key: "",
    smtp_host: String(row?.smtp_host ?? defaultQuoteEmailSettings.smtp_host),
    smtp_port: Number(row?.smtp_port ?? defaultQuoteEmailSettings.smtp_port),
    smtp_secure: Boolean(
      row?.smtp_secure ?? defaultQuoteEmailSettings.smtp_secure,
    ),
    smtp_user: String(row?.smtp_user || row?.from_email || ""),
    smtp_pass: String(row?.smtp_pass ?? ""),
  };
}

function formatSmtpError(error: unknown) {
  if (!(error instanceof Error)) return "Failed to send email.";

  const message = error.message || "Failed to send email.";
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: string }).code)
      : "";

  if (
    code === "ETIMEDOUT" ||
    code === "ESOCKET" ||
    message.toLowerCase().includes("timeout")
  ) {
    return "Could not reach the mail server. Check your internet connection, or try again in a moment.";
  }

  if (
    code === "EAUTH" ||
    message.toLowerCase().includes("invalid login") ||
    message.toLowerCase().includes("authentication")
  ) {
    return "Login failed. For Gmail/Yahoo use an App Password (not your normal password). For Outlook, use your Microsoft account password or app password.";
  }

  return "Could not send email. Check your settings and try again.";
}

function createTransport(settings: QuoteEmailSettings) {
  const hostCheck = assertSafeSmtpHost(settings.smtp_host);
  if (!hostCheck.ok) {
    throw new Error(hostCheck.error);
  }

  const port = Number(settings.smtp_port) || 587;
  // Port 465 = implicit TLS; port 587 = plain + STARTTLS. Mixing these hangs/times out.
  const secure = port === 465 ? true : port === 587 ? false : Boolean(settings.smtp_secure);
  const user = (settings.smtp_user || settings.from_email).trim();
  const pass = decryptSmtpPass(settings.smtp_pass).replaceAll(" ", "");

  return nodemailer.createTransport({
    host: hostCheck.host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: {
      user,
      pass,
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });
}

function isSmtpReady(settings: QuoteEmailSettings) {
  const user = (settings.smtp_user || settings.from_email).trim();
  let passOk = false;
  try {
    passOk = Boolean(decryptSmtpPass(settings.smtp_pass).trim());
  } catch {
    passOk = Boolean(settings.smtp_pass.trim());
  }
  return Boolean(
    settings.to_email.trim() &&
      settings.from_email.trim() &&
      settings.smtp_host.trim() &&
      user &&
      passOk,
  );
}

function logoAttachment(): Attachment {
  return {
    filename: "logo-email-white.png",
    path: EMAIL_LOGO_PATH,
    cid: EMAIL_LOGO_CID,
    contentType: "image/png",
    contentDisposition: "inline",
  };
}

/** Keep MIME filenames ASCII-safe so clients treat them as real attachments. */
function safeAttachmentFilename(name: string) {
  const cleaned = name
    .replace(/[^\w.\-()+ ]+/g, "_")
    .replace(/\s+/g, "-")
    .slice(0, 120);
  return cleaned || "attachment";
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
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}

/** Force a real downloadable attachment (not inline / text preview). */
function fileAsMailAttachment(file: QuoteMailAttachment): Attachment {
  const filename = safeAttachmentFilename(file.filename);
  const contentType =
    file.contentType &&
    file.contentType !== "application/octet-stream" &&
    file.contentType !== "text/plain" &&
    file.contentType !== ""
      ? file.contentType
      : guessContentType(filename);

  return {
    filename,
    content: Buffer.isBuffer(file.content)
      ? file.content
      : Buffer.from(file.content),
    contentType,
    contentDisposition: "attachment",
    // Avoid clients guessing charset / treating binary as text.
    contentTransferEncoding: "base64",
  };
}

async function sendViaSmtp(
  settings: QuoteEmailSettings,
  options: {
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
    to?: string;
    attachments?: Attachment[];
  },
): Promise<{ error?: string; success?: boolean }> {
  if (!isSmtpReady(settings) && !options.to) {
    return {
      error:
        "Fill in your email, password, and where messages should be delivered.",
    };
  }

  const to = (options.to || settings.to_email).trim();
  const user = (settings.smtp_user || settings.from_email).trim();
  if (
    !to ||
    !settings.from_email.trim() ||
    !settings.smtp_host.trim() ||
    !user ||
    !settings.smtp_pass.trim()
  ) {
    return {
      error:
        "Fill in your email, password, and where messages should be delivered.",
    };
  }

  try {
    const transport = createTransport(settings);
    const fromName = settings.from_name.trim() || "Koda Siding";

    await transport.sendMail({
      from: `"${fromName}" <${settings.from_email.trim()}>`,
      to,
      replyTo: options.replyTo,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: [logoAttachment(), ...(options.attachments ?? [])],
    });

    return { success: true };
  } catch (error) {
    return { error: formatSmtpError(error) };
  }
}

export async function sendQuoteNotification(
  settings: QuoteEmailSettings,
  payload: QuoteMessagePayload,
  file?: QuoteMailAttachment | null,
): Promise<QuoteDeliveryResult> {
  if (!settings.enabled) {
    return { status: "skipped", lead_confirmation: "skipped" };
  }

  const email = buildQuoteNotificationEmail({
    ...payload,
    has_attachment: Boolean(file) || payload.has_attachment,
    attachment_filename: file
      ? safeAttachmentFilename(file.filename)
      : payload.attachment_filename,
  });

  const attachments = file ? [fileAsMailAttachment(file)] : undefined;

  const result = await sendViaSmtp(settings, {
    subject: email.subject,
    text: email.text,
    html: email.html,
    replyTo: settings.reply_to_submitter ? payload.email : undefined,
    attachments,
  });

  if (result.error) {
    return {
      status: "failed",
      error: result.error,
      attachment_included: Boolean(file),
      lead_confirmation: "skipped",
    };
  }

  let leadConfirmation: QuoteDeliveryResult["lead_confirmation"] = "skipped";
  let leadConfirmationError: string | undefined;

  if (settings.send_lead_confirmation && payload.email.trim()) {
    const confirm = buildLeadConfirmationEmail({
      full_name: payload.full_name,
      has_attachment: Boolean(file) || payload.has_attachment,
    });
    const leadResult = await sendViaSmtp(settings, {
      to: payload.email.trim(),
      subject: confirm.subject,
      text: confirm.text,
      html: confirm.html,
      replyTo: settings.from_email.trim(),
    });
    if (leadResult.error) {
      leadConfirmation = "failed";
      leadConfirmationError = leadResult.error;
      console.error("lead confirmation email failed", leadResult.error);
    } else {
      leadConfirmation = "sent";
    }
  }

  return {
    status: "sent",
    attachment_included: Boolean(file),
    lead_confirmation: leadConfirmation,
    lead_confirmation_error: leadConfirmationError,
  };
}

export async function sendTestQuoteEmail(
  settings: QuoteEmailSettings,
): Promise<{ error?: string; success?: boolean }> {
  const email = buildTestEmail();
  return sendViaSmtp(settings, {
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}
