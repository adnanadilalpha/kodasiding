import { MAIL_PRESETS } from "@/lib/email/mail-presets";

const PRESET_HOSTS = new Set(
  Object.values(MAIL_PRESETS).map((p) => p.host.toLowerCase()),
);

/** Block obvious SSRF targets (localhost, private IPs, metadata hosts). */
function isBlockedHost(host: string) {
  const h = host.toLowerCase();
  if (!h || h.includes("/") || h.includes("\\")) return true;
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local")) {
    return true;
  }
  if (h === "metadata.google.internal" || h.endsWith(".internal")) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return true;
  if (h.includes(":") || h.startsWith("[")) return true;
  return false;
}

/**
 * Validate SMTP host for owner-configured mail.
 * Preset hosts always allowed; custom hosts must be public DNS names (no private IPs).
 */
export function assertSafeSmtpHost(host: string): {
  ok: true;
  host: string;
} | { ok: false; error: string } {
  const cleaned = host.trim().toLowerCase().replace(/\.$/, "");
  if (!cleaned) {
    return { ok: false, error: "Enter a mail server host." };
  }
  if (cleaned.length > 253) {
    return { ok: false, error: "Mail server host is too long." };
  }
  if (isBlockedHost(cleaned)) {
    return {
      ok: false,
      error: "That mail server host is not allowed.",
    };
  }
  if (PRESET_HOSTS.has(cleaned)) {
    return { ok: true, host: cleaned };
  }
  // Require a dotted public hostname (mail.example.com)
  if (
    !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(
      cleaned,
    )
  ) {
    return {
      ok: false,
      error: "Use a full hostname like mail.yourdomain.com.",
    };
  }
  return { ok: true, host: cleaned };
}
