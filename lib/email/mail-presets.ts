import type { QuoteEmailSettings } from "@/lib/cms/types";

export type MailPreset = "gmail" | "outlook" | "yahoo" | "other";

export const MAIL_PRESETS: Record<
  Exclude<MailPreset, "other">,
  { host: string; port: number; secure: boolean; label: string }
> = {
  gmail: {
    label: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
  },
  outlook: {
    label: "Outlook / Microsoft 365",
    host: "smtp.office365.com",
    port: 587,
    secure: false,
  },
  yahoo: {
    label: "Yahoo",
    host: "smtp.mail.yahoo.com",
    port: 587,
    secure: false,
  },
};

export function detectMailPreset(host: string): MailPreset {
  const h = host.trim().toLowerCase();
  if (h.includes("gmail")) return "gmail";
  if (h.includes("office365") || h.includes("outlook")) return "outlook";
  if (h.includes("yahoo")) return "yahoo";
  return "other";
}

export function applyMailPreset(
  preset: MailPreset,
  current: QuoteEmailSettings,
): QuoteEmailSettings {
  if (preset === "other") return { ...current, provider: "smtp" };
  const cfg = MAIL_PRESETS[preset];
  return {
    ...current,
    provider: "smtp",
    smtp_host: cfg.host,
    smtp_port: cfg.port,
    smtp_secure: cfg.secure,
  };
}
