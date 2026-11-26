"use client";

import { useEffect, useRef, useState } from "react";
import { RichText } from "@/components/site/rich-text";
import type { AboutPageCopy } from "@/lib/cms/types";

function telHref(phone: string) {
  const compact = phone.replace(/[^\d+]/g, "");
  return compact ? `tel:${compact}` : "";
}

export function AboutContact({ copy }: { copy: AboutPageCopy }) {
  const startedRef = useRef<HTMLInputElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
    if (tokenRef.current) tokenRef.current.value = "koda";
  }, []);

  const address = copy.address.trim();
  const phone = copy.phone.trim();
  const email = copy.email.trim();
  const phoneLink = telHref(phone);
  const hasDetails = Boolean(address || phone || email);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: new FormData(form),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Message could not be sent.");
        return;
      }
      form.reset();
      if (startedRef.current) startedRef.current.value = String(Date.now());
      if (tokenRef.current) tokenRef.current.value = "koda";
      setStatus("sent");
    } catch {
      setStatus("error");
      setError("Message could not be sent.");
    }
  }

  return (
    <section className="bg-bg-primary">
      <div className="mx-auto grid w-full max-w-8xl gap-12 px-page py-16 lg:grid-cols-12 lg:gap-10 lg:py-24 xl:max-w-8xl xl:gap-14">
        <div className="min-w-0 lg:col-span-4">
          <p className="text-xs font-semibold tracking-widest text-brand-primary uppercase">
            <RichText html={copy.eyebrow} as="span" />
          </p>
          <h1 className="font-heading mt-4 text-4xl leading-none text-text-primary lg:text-6xl">
            <RichText html={copy.heading} as="span" />
          </h1>
          <RichText
            html={copy.body}
            className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary"
          />
        </div>

        {hasDetails ? (
          <aside className="min-w-0 lg:col-span-3">
            <p className="text-xs font-semibold tracking-widest text-brand-primary uppercase">
              Business
            </p>
            <address className="mt-5 flex flex-col gap-6 text-base leading-relaxed text-text-primary not-italic">
              {address ? (
                <div>
                  <p className="text-xs tracking-[0.14em] text-text-secondary uppercase">
                    Address
                  </p>
                  <p className="mt-2 whitespace-pre-line">{address}</p>
                </div>
              ) : null}
              {email ? (
                <div>
                  <p className="text-xs tracking-[0.14em] text-text-secondary uppercase">
                    Email
                  </p>
                  <a
                    href={`mailto:${email}`}
                    className="mt-2 inline-block transition hover:text-brand-primary"
                  >
                    {email}
                  </a>
                </div>
              ) : null}
              {phoneLink ? (
                <div>
                  <p className="text-xs tracking-[0.14em] text-text-secondary uppercase">
                    Phone
                  </p>
                  <a
                    href={phoneLink}
                    className="mt-2 inline-block transition hover:text-brand-primary"
                  >
                    {phone}
                  </a>
                </div>
              ) : null}
            </address>
          </aside>
        ) : null}

        <div className="min-w-0 lg:col-span-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <h2 className="font-heading text-2xl text-text-primary">
              <RichText html={copy.form_heading} as="span" />
            </h2>
            <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
              {copy.name_label}
              <input
                name="name"
                required
                autoComplete="name"
                maxLength={120}
                className="h-12 border border-brand-primary/15 bg-bg-secondary px-4 text-base text-text-primary outline-none focus:border-brand-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
              {copy.email_label}
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                maxLength={254}
                className="h-12 border border-brand-primary/15 bg-bg-secondary px-4 text-base text-text-primary outline-none focus:border-brand-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
              {copy.message_label}
              <textarea
                name="message"
                required
                rows={6}
                maxLength={4000}
                className="border border-brand-primary/15 bg-bg-secondary px-4 py-3 text-base text-text-primary outline-none focus:border-brand-primary"
              />
            </label>

            <div
              className="absolute left-[-9999px] h-px w-px overflow-hidden"
              aria-hidden="true"
            >
              <label>
                Company website
                <input
                  name="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                  defaultValue=""
                />
              </label>
              <label>
                Fax
                <input
                  name="fax_number"
                  tabIndex={-1}
                  autoComplete="off"
                  defaultValue=""
                />
              </label>
            </div>
            <input
              ref={startedRef}
              type="hidden"
              name="form_started"
              defaultValue=""
            />
            <input
              ref={tokenRef}
              type="hidden"
              name="contact_check"
              defaultValue=""
            />

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                type="submit"
                disabled={status === "sending"}
                className="bg-accent-warm px-8 py-3 text-sm font-semibold text-text-primary hover:opacity-90 disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : copy.submit_label}
              </button>
              {status === "sent" ? (
                <p className="text-sm text-brand-primary">
                  {copy.success_message}
                </p>
              ) : null}
              {status === "error" ? (
                <p className="text-sm text-text-primary">{error}</p>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
