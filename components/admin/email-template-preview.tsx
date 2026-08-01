"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildQuoteNotificationEmail,
  buildTestEmail,
} from "@/lib/email/templates";

const SAMPLE = {
  full_name: "Alex Kim",
  email: "alex.kim@gmail.com",
  phone: "(555) 014-2201",
  city: "Denver",
  state: "CO",
  message:
    "Looking for a quote on vertical siding for a new build. About 2,400 sq ft of exterior.",
  has_attachment: true,
  attachment_filename: "site-plan.pdf",
};

export function EmailTemplatePreview() {
  const [kind, setKind] = useState<"quote" | "test">("quote");
  const [logoSrc, setLogoSrc] = useState("/brand/logo-email-white.png");

  useEffect(() => {
    setLogoSrc(`${window.location.origin}/brand/logo-email-white.png`);
  }, []);

  const html = useMemo(() => {
    if (kind === "test") return buildTestEmail({ logoSrc }).html;
    return buildQuoteNotificationEmail(SAMPLE, { logoSrc }).html;
  }, [kind, logoSrc]);

  return (
    <div className="rounded-xl border border-brand-primary/8 bg-bg-primary/80 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            Email template preview
          </h2>
          <p className="mt-1 text-sm text-text-primary/55">
            Approximate look of messages sent from Email setup.
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-brand-primary/10 bg-bg-secondary p-1">
          {(
            [
              { id: "quote", label: "Quote email" },
              { id: "test", label: "Test email" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setKind(tab.id)}
              className={`rounded px-3 py-1.5 text-sm transition ${
                kind === tab.id
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-primary/55 hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <iframe
        title="Email template preview"
        srcDoc={html}
        className="h-140 w-full rounded-lg border border-brand-primary/8 bg-white"
      />
    </div>
  );
}
