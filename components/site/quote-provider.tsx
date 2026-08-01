"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Script from "next/script";
import type { QuoteFormFieldDef, QuoteFormSettings } from "@/lib/cms/types";
import {
  acceptAttrForTypes,
  groupQuoteFields,
  humanFileTypesLabel,
  isAllowedAttachmentFile,
  normalizeQuoteFormSettings,
} from "@/lib/cms/quote-form";
import {
  QUOTE_ATTACHMENT_MAX_BYTES,
  formatBytes,
} from "@/lib/quote/constants";
import { validateQuoteEmail } from "@/lib/quote/validate-email";

type QuoteContextValue = {
  open: boolean;
  openQuote: () => void;
  closeQuote: () => void;
  form: QuoteFormSettings;
};

type SubmitPhase = "checking" | "uploading" | "sending";
type View = "form" | "submitting" | "success";

const QuoteContext = createContext<QuoteContextValue | null>(null);

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
    };
  }
}

export function QuoteProvider({
  form,
  children,
}: {
  form: QuoteFormSettings;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const normalized = normalizeQuoteFormSettings(form);
  return (
    <QuoteContext.Provider
      value={{
        open,
        openQuote: () => setOpen(true),
        closeQuote: () => setOpen(false),
        form: normalized,
      }}
    >
      {children}
      {open ? <QuoteModal /> : null}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote must be used within QuoteProvider");
  return ctx;
}

const underlineField =
  "w-full border-0 border-b border-border-strong bg-transparent px-1.5 py-2 text-base text-text-primary outline-none focus:border-brand-primary disabled:opacity-50 sm:px-2 sm:py-3";

const labelClass = "text-base leading-none text-text-secondary";

const PHASE_COPY: Record<SubmitPhase, { title: string; detail: string }> = {
  checking: {
    title: "Verifying…",
    detail: "Confirming this request is from a real person.",
  },
  uploading: {
    title: "Uploading file…",
    detail: "Securely attaching your document.",
  },
  sending: {
    title: "Submitting request…",
    detail: "Saving your details for the Koda team.",
  },
};

async function getRecaptchaToken(): Promise<string> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return "";

  await new Promise<void>((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.grecaptcha?.ready) {
        window.grecaptcha.ready(() => resolve());
        return;
      }
      if (Date.now() - started > 10000) {
        reject(new Error("Spam protection failed to load. Please refresh."));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });

  const token = await window.grecaptcha!.execute(siteKey, {
    action: "quote_submit",
  });
  if (!token?.trim()) {
    throw new Error("Spam protection did not return a token.");
  }
  return token;
}

function QuoteModal() {
  const { closeQuote, form } = useQuote();
  const fieldRows = groupQuoteFields(form.fields);
  const acceptAttr = acceptAttrForTypes(form.allowed_file_types);
  const typesLabel = humanFileTypesLabel(form.allowed_file_types);
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [view, setView] = useState<View>("form");
  const [phase, setPhase] = useState<SubmitPhase>("checking");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const busy = view === "submitting";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => setEntered(true));
    return () => {
      document.body.style.overflow = prev;
      cancelAnimationFrame(id);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && view !== "submitting") closeQuote();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeQuote, view]);

  function onPickFile(next: File | null) {
    setError(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (next.size > QUOTE_ATTACHMENT_MAX_BYTES) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setError(
        `Attachment must be ${formatBytes(QUOTE_ATTACHMENT_MAX_BYTES)} or smaller.`,
      );
      return;
    }
    if (!isAllowedAttachmentFile(next, form.allowed_file_types)) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setError(`Attachment must be one of: ${typesLabel}.`);
      return;
    }
    setFile(next);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const fd = new FormData(e.currentTarget);
    const emailCheck = validateQuoteEmail(String(fd.get("email") ?? ""));
    if (!emailCheck.ok) {
      setError(emailCheck.reason);
      return;
    }

    const fullName = String(fd.get("full_name") ?? "").trim();
    if (fullName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    const custom: Record<string, string> = {};
    for (const field of form.fields) {
      if (field.kind === "attachment") {
        if (field.required && !file) {
          setError("Please attach a file.");
          return;
        }
        continue;
      }
      if (field.kind === "custom") {
        custom[field.id] = String(fd.get(`custom_${field.id}`) ?? "").trim();
        if (field.required && !custom[field.id]) {
          setError(`Please fill in ${field.label}.`);
          return;
        }
        continue;
      }
      if (
        field.required &&
        field.kind !== "full_name" &&
        field.kind !== "email"
      ) {
        const value = String(fd.get(field.kind) ?? "").trim();
        if (!value) {
          setError(`Please fill in ${field.label}.`);
          return;
        }
      }
    }
    fd.set("custom_fields", JSON.stringify(custom));

    setView("submitting");
    setPhase("checking");

    try {
      await wait(320);

      let token = "";
      let captchaFallback = false;
      if (siteKey) {
        try {
          token = await getRecaptchaToken();
        } catch {
          captchaFallback = true;
        }
      }

      fd.set("recaptcha_token", token);
      if (captchaFallback) fd.set("captcha_fallback", "1");
      fd.set("email", emailCheck.email);

      if (file) {
        setPhase("uploading");
        await wait(180);
        fd.set("attachment", file);
      } else {
        fd.delete("attachment");
      }

      setPhase("sending");
      const res = await fetch("/api/quote", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not submit your request.");
      }

      await wait(280);
      setView("success");
    } catch (err) {
      setView("form");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function renderField(field: QuoteFormFieldDef) {
    if (field.kind === "attachment") {
      return (
        <div key={field.id} className="flex flex-col gap-3 sm:gap-4">
          <span className={labelClass}>{field.label}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttr}
            className="sr-only"
            disabled={busy}
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex w-fit items-center justify-center rounded-md border border-border-strong bg-bg-primary px-8 py-3 text-base text-brand-primary disabled:opacity-50"
            >
              {file ? "Change file" : form.upload_label || "Upload file here"}
            </button>
            {file ? (
              <p className="max-w-full truncate text-sm text-text-secondary">
                {file.name}{" "}
                <span className="text-text-secondary/70">
                  ({formatBytes(file.size)})
                </span>
              </p>
            ) : (
              <p className="text-sm text-text-secondary/70">
                {form.allowed_file_types.every((t) =>
                  ["pdf", "jpg", "png", "webp", "heic"].includes(t),
                ) && form.allowed_file_types.length <= 5
                  ? "PDF or image"
                  : typesLabel}{" "}
                · max {formatBytes(QUOTE_ATTACHMENT_MAX_BYTES)}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (field.kind === "message" || field.input === "textarea") {
      const name =
        field.kind === "custom" ? `custom_${field.id}` : field.kind;
      return (
        <label key={field.id} className="flex flex-col gap-1">
          <span className={labelClass}>{field.label}</span>
          <textarea
            name={name}
            rows={2}
            required={Boolean(field.required)}
            disabled={busy}
            className={`${underlineField} min-h-11 resize-none sm:min-h-23`}
          />
        </label>
      );
    }

    const name =
      field.kind === "custom" ? `custom_${field.id}` : field.kind;
    const type =
      field.kind === "email" ? "email" : field.kind === "phone" ? "tel" : "text";
    const autoComplete =
      field.kind === "full_name"
        ? "name"
        : field.kind === "email"
          ? "email"
          : field.kind === "phone"
            ? "tel"
            : field.kind === "city"
              ? "address-level2"
              : field.kind === "state"
                ? "address-level1"
                : "off";

    return (
      <label key={field.id} className="flex min-w-0 flex-col gap-1">
        <span className={labelClass}>{field.label}</span>
        <input
          name={name}
          type={type}
          required={Boolean(field.required)}
          autoComplete={autoComplete}
          disabled={busy}
          className={underlineField}
        />
      </label>
    );
  }

  return (
    <>
      {siteKey ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="afterInteractive"
        />
      ) : null}

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-brand-primary-active/55 p-4 backdrop-blur-[2px] transition-opacity duration-300 sm:p-8 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === e.currentTarget && view !== "submitting") closeQuote();
        }}
      >
        <div
          className={`relative w-full max-w-231 origin-center rounded-lg bg-white shadow-lg transition duration-300 ease-out ${
            entered
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-[0.98] opacity-0"
          }`}
        >
          {view !== "submitting" ? (
            <button
              type="button"
              onClick={closeQuote}
              className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center text-text-primary sm:top-6 sm:right-6 sm:size-6 lg:top-7 lg:right-8 lg:size-7"
              aria-label="Close"
            >
              <span
                className="relative block size-4 sm:size-3.5 lg:size-4"
                aria-hidden
              >
                <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rotate-45 bg-current" />
                <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 -rotate-45 bg-current" />
              </span>
            </button>
          ) : null}

          {view === "success" ? (
            <ThankYouPanel titleId={titleId} onClose={closeQuote} />
          ) : null}

          {view === "submitting" ? (
            <SubmittingPanel phase={phase} hasFile={Boolean(file)} />
          ) : null}

          <form
            ref={formRef}
            className={`flex flex-col gap-6 p-6 sm:gap-8 sm:p-12 lg:p-16 ${
              view === "form" ? "" : "hidden"
            }`}
            onSubmit={onSubmit}
            aria-hidden={view !== "form"}
          >
            <div className="flex flex-col gap-6 sm:gap-8">
              <h2
                id={view === "form" ? titleId : undefined}
                className="pr-8 font-sans text-lg leading-none font-extrabold text-[#1a1c18] uppercase sm:text-2xl lg:text-[30px]"
              >
                {form.title}
              </h2>

              <div className="flex flex-col gap-4 sm:gap-6">
                {fieldRows.map((row) =>
                  row.length === 2 ? (
                    <div
                      key={`${row[0]!.id}-${row[1]!.id}`}
                      className="grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-8 sm:gap-y-6"
                    >
                      {row.map((field) => renderField(field))}
                    </div>
                  ) : (
                    renderField(row[0]!)
                  ),
                )}

                {/* Honeypot — leave empty. Avoid names browsers autofill. */}
                <input
                  type="text"
                  name="hp_field"
                  tabIndex={-1}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  defaultValue=""
                  className="absolute left-[-9999px] h-0 w-0 opacity-0"
                  aria-hidden
                />
              </div>
            </div>

            {error ? (
              <p
                role="alert"
                className="quote-alert-in rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-4">
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-brand-primary px-8 py-3 text-base whitespace-nowrap text-text-inverse transition hover:bg-brand-primary-active disabled:opacity-60"
              >
                {form.submit_label}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function SubmittingPanel({
  phase,
  hasFile,
}: {
  phase: SubmitPhase;
  hasFile: boolean;
}) {
  const steps: SubmitPhase[] = hasFile
    ? ["checking", "uploading", "sending"]
    : ["checking", "sending"];
  const copy = PHASE_COPY[phase];
  const activeIndex = steps.indexOf(phase);

  return (
    <div
      className="quote-panel-in flex flex-col items-center gap-8 px-6 py-16 text-center sm:px-12 sm:py-20"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="quote-spinner size-12 rounded-full border-2 border-brand-primary/15 border-t-brand-primary" />
      <div className="flex flex-col gap-2">
        <p className="font-display text-xl font-bold tracking-wide text-brand-primary uppercase">
          {copy.title}
        </p>
        <p className="text-base text-text-secondary">{copy.detail}</p>
      </div>
      <ol className="flex items-center gap-2" aria-hidden>
        {steps.map((step, i) => (
          <li
            key={step}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= activeIndex
                ? "w-8 bg-brand-primary"
                : "w-3 bg-brand-primary/20"
            }`}
          />
        ))}
      </ol>
    </div>
  );
}

function ThankYouPanel({
  titleId,
  onClose,
}: {
  titleId: string;
  onClose: () => void;
}) {
  return (
    <div className="quote-panel-in flex flex-col items-center gap-8 px-6 py-16 text-center sm:px-12 sm:py-20">
      <div className="quote-check-wrap flex size-16 items-center justify-center rounded-full bg-brand-primary/8">
        <svg
          viewBox="0 0 24 24"
          className="size-8 text-brand-primary"
          fill="none"
          aria-hidden
        >
          <path
            className="quote-check-path"
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex max-w-md flex-col gap-3">
        <h2
          id={titleId}
          className="font-display text-2xl font-bold tracking-wide text-brand-primary uppercase sm:text-[30px]"
        >
          Thank you
        </h2>
        <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
          Your quote request is in. A Koda specialist will review the details
          and follow up shortly.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md bg-brand-primary px-8 py-3 text-base text-text-inverse transition hover:bg-brand-primary-active"
      >
        Close
      </button>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
