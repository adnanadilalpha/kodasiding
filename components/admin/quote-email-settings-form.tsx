"use client";

import { FormEvent, useMemo, useState } from "react";
import { IconEye, IconEyeOff, IconSend } from "@tabler/icons-react";
import {
  saveQuoteEmailSettings,
  testQuoteEmailSettings,
} from "@/lib/cms/actions";
import {
  applyMailPreset,
  detectMailPreset,
  type MailPreset,
} from "@/lib/email/mail-presets";
import type { QuoteEmailSettings } from "@/lib/cms/types";
import { Button } from "@/components/ui/button";

type Props = {
  initial: QuoteEmailSettings;
  hasSavedPassword: boolean;
};

type Busy = "save" | "test" | null;

const PRESET_OPTIONS: { id: MailPreset; label: string; hint: string }[] = [
  { id: "gmail", label: "Gmail", hint: "Use a Google App Password" },
  { id: "outlook", label: "Outlook", hint: "Microsoft / Office 365" },
  { id: "yahoo", label: "Yahoo", hint: "Use a Yahoo App Password" },
  { id: "other", label: "Other", hint: "Custom mail server" },
];

const inputClass =
  "w-full rounded-md border border-brand-primary/12 bg-bg-primary px-3 py-2.5 text-base leading-snug text-text-primary outline-none transition placeholder:text-text-primary/35 focus:border-brand-primary/35";

export function QuoteEmailSettingsForm({
  initial,
  hasSavedPassword,
}: Props) {
  const [values, setValues] = useState<QuoteEmailSettings>({
    ...initial,
    provider: "smtp",
    smtp_pass: "",
  });
  const [preset, setPreset] = useState<MailPreset>(
    detectMailPreset(initial.smtp_host),
  );
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);

  const help = useMemo(() => {
    if (preset === "gmail") {
      return (
        <>
          For Gmail: turn on 2-Step Verification, then create an{" "}
          <a
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-primary underline"
          >
            App Password
          </a>{" "}
          and paste it below (not your normal Gmail password).
        </>
      );
    }
    if (preset === "outlook") {
      return (
        <>
          Use your Microsoft email and password. If login fails, create an{" "}
          <a
            href="https://account.microsoft.com/security"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-primary underline"
          >
            app password
          </a>{" "}
          in your Microsoft security settings.
        </>
      );
    }
    if (preset === "yahoo") {
      return (
        <>
          Create a Yahoo{" "}
          <a
            href="https://login.yahoo.com/account/security"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-primary underline"
          >
            App Password
          </a>{" "}
          and paste it below.
        </>
      );
    }
    return (
      <>
        For custom / hosting email: fill your email and password above, then enter
        the SMTP host, port, and SSL setting from your provider (cPanel, hosting
        panel, etc.). Host and port alone are not enough.
      </>
    );
  }, [preset]);

  function selectPreset(next: MailPreset) {
    setPreset(next);
    setValues((current) => applyMailPreset(next, current));
  }

  function update<K extends keyof QuoteEmailSettings>(
    key: K,
    value: QuoteEmailSettings[K],
  ) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === "from_email" && typeof value === "string") {
        next.smtp_user = value;
        if (!current.to_email.trim()) {
          next.to_email = value;
        }
      }
      return next;
    });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setBusy("save");
    try {
      const keepExistingPassword =
        !values.smtp_pass.trim() && hasSavedPassword;
      const result = await saveQuoteEmailSettings(
        {
          ...values,
          provider: "smtp",
          smtp_user: values.smtp_user.trim() || values.from_email.trim(),
        },
        { keepExistingPassword },
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Email settings saved.");
      if (!keepExistingPassword) {
        setValues((current) => ({ ...current, smtp_pass: "" }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setBusy(null);
    }
  }

  async function onTest() {
    setMessage(null);
    setError(null);
    setBusy("test");
    try {
      const keepExistingPassword =
        !values.smtp_pass.trim() && hasSavedPassword;
      const result = await testQuoteEmailSettings(
        {
          ...values,
          provider: "smtp",
          enabled: true,
          smtp_user: values.smtp_user.trim() || values.from_email.trim(),
        },
        { keepExistingPassword },
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(
        "Test email sent. Check the delivery inbox (and spam folder).",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test email failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-w-0 w-full overflow-hidden rounded-xl border border-brand-primary/8 bg-bg-primary/80 p-4 sm:p-6">
      <h2 className="text-base font-semibold text-text-primary">
        Connect your email
      </h2>
      <p className="mt-1 mb-4 text-sm text-text-primary/55">
        Use your own mailbox (Gmail, Outlook, Yahoo, or hosting email). No
        third-party email platform required.
      </p>

      {busy === "test" ? (
        <div className="mb-4 rounded-md border border-brand-primary/10 bg-bg-secondary px-3 py-2 text-sm text-text-primary">
          Sending test email… this can take up to 20 seconds.
        </div>
      ) : null}
      {message ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm wrap-break-word text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm wrap-break-word text-red-700">
          {error}
        </div>
      ) : null}

      <form className="flex w-full min-w-0 flex-col gap-5" onSubmit={onSave}>
        <div className="min-w-0">
          <p className="mb-2 text-sm text-text-primary/70">
            1. Which email do you use?
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PRESET_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => selectPreset(option.id)}
                className={`rounded-lg border px-3 py-3 text-left transition ${
                  preset === option.id
                    ? "border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/20"
                    : "border-brand-primary/10 bg-bg-primary hover:bg-bg-secondary"
                }`}
              >
                <span className="block text-sm font-semibold text-text-primary">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-text-primary/50">
                  {option.hint}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm wrap-break-word text-text-primary/55">
            {help}
          </p>
        </div>

        <label className="flex items-start gap-2.5 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={values.enabled}
            onChange={(e) => update("enabled", e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-brand-primary/20"
          />
          <span>Send me an email when someone requests a quote</span>
        </label>

        <div className="grid w-full gap-4 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-sm text-text-primary/70">
              2. Your email address
            </span>
            <input
              type="email"
              value={values.from_email}
              onChange={(e) => update("from_email", e.target.value)}
              placeholder="you@gmail.com"
              required={values.enabled}
              className={inputClass}
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-sm text-text-primary/70">
              3. Password
              {hasSavedPassword ? (
                <span className="text-text-primary/45">
                  {" "}
                  (leave blank to keep saved)
                </span>
              ) : null}
            </span>
            <div className="relative min-w-0">
              <input
                type={showPass ? "text" : "password"}
                value={values.smtp_pass}
                onChange={(e) => update("smtp_pass", e.target.value)}
                placeholder={
                  hasSavedPassword
                    ? "••••••••••••"
                    : preset === "gmail" || preset === "yahoo"
                      ? "App Password"
                      : preset === "other"
                        ? "Mailbox / SMTP password"
                        : "Email password"
                }
                autoComplete="new-password"
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-text-primary/45 hover:bg-bg-secondary"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? (
                  <IconEyeOff size={18} stroke={1.5} />
                ) : (
                  <IconEye size={18} stroke={1.5} />
                )}
              </button>
            </div>
          </label>
        </div>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-sm text-text-primary/70">
            4. Where should quote requests go?
          </span>
          <input
            type="email"
            value={values.to_email}
            onChange={(e) => update("to_email", e.target.value)}
            placeholder="sales@company.com"
            required={values.enabled}
            className={inputClass}
          />
          <span className="text-xs text-text-primary/45">
            Can be the same as your email, or a different inbox for the team.
          </span>
        </label>

        {preset === "other" ? (
          <div className="grid w-full gap-4 rounded-lg border border-brand-primary/8 bg-bg-secondary p-4 sm:grid-cols-2">
            <p className="text-sm text-text-primary/70 sm:col-span-2">
              5. Mail server (from your email host)
            </p>
            <p className="-mt-2 text-xs text-text-primary/45 sm:col-span-2">
              These settings only appear for Other. Gmail / Outlook / Yahoo fill
              them automatically. You still need steps 2–4 above.
            </p>
            <label className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm text-text-primary/70">
                Mail server host
              </span>
              <input
                type="text"
                value={values.smtp_host}
                onChange={(e) => update("smtp_host", e.target.value)}
                placeholder="mail.yourdomain.com"
                className={inputClass}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm text-text-primary/70">Port</span>
              <input
                type="number"
                value={values.smtp_port}
                onChange={(e) =>
                  update("smtp_port", Number(e.target.value) || 587)
                }
                className={inputClass}
              />
            </label>
            <label className="flex items-start gap-2.5 text-sm text-text-primary sm:items-center sm:self-end sm:pb-2.5">
              <input
                type="checkbox"
                checked={values.smtp_secure}
                onChange={(e) => update("smtp_secure", e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-brand-primary/20 sm:mt-0"
              />
              <span>Use SSL (usually port 465)</span>
            </label>
          </div>
        ) : null}

        <label className="flex items-start gap-2.5 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={values.reply_to_submitter}
            onChange={(e) => update("reply_to_submitter", e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-brand-primary/20"
          />
          <span>
            When I hit reply on the team email, answer the website visitor
          </span>
        </label>

        <label className="flex items-start gap-2.5 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={values.send_lead_confirmation}
            onChange={(e) => update("send_lead_confirmation", e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-brand-primary/20"
          />
          <span>
            Also email the person who submitted the form (confirmation)
          </span>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="submit"
            disabled={busy !== null}
            className="w-full sm:w-auto"
          >
            {busy === "save" ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy !== null}
            onClick={() => void onTest()}
            className="w-full gap-2 sm:w-auto"
          >
            <IconSend size={16} stroke={1.5} />
            {busy === "test" ? "Sending…" : "Send test email"}
          </Button>
        </div>
      </form>
    </div>
  );
}
