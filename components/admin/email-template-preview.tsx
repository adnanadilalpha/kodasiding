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

/** Preview-only: keep table emails from overflowing the iframe on narrow screens. */
function constrainPreviewHtml(html: string) {
  const style = `<style>
html,body{max-width:100%!important;overflow-x:hidden!important;margin:0!important;}
table{max-width:100%!important;}
td,th,p,a,span{word-break:break-word!important;overflow-wrap:anywhere!important;}
img{max-width:100%!important;height:auto!important;}
</style>`;
  if (html.includes("</head>")) {
    return html.replace("</head>", `${style}</head>`);
  }
  return `${style}${html}`;
}

export function EmailTemplatePreview() {
  const [kind, setKind] = useState<"quote" | "test">("quote");
  const [logoSrc, setLogoSrc] = useState("/brand/logo-email-white.png");

  useEffect(() => {
    setLogoSrc(`${window.location.origin}/brand/logo-email-white.png`);
  }, []);

  const html = useMemo(() => {
    const raw =
      kind === "test"
        ? buildTestEmail({ logoSrc }).html
        : buildQuoteNotificationEmail(SAMPLE, { logoSrc }).html;
    return constrainPreviewHtml(raw);
  }, [kind, logoSrc]);

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-brand-primary/8 bg-bg-primary/80 p-4 sm:p-6">
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary">
            Email template preview
          </h2>
          <p className="mt-1 text-sm text-text-primary/55">
            Approximate look of messages sent from Email setup.
          </p>
        </div>
        <div className="flex w-full gap-1 rounded-md border border-brand-primary/10 bg-bg-secondary p-1 sm:w-auto">
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
              className={`flex-1 rounded px-3 py-1.5 text-sm transition sm:flex-none ${
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
      <div className="min-w-0 w-full overflow-hidden rounded-lg border border-brand-primary/8 bg-bg-primary">
        <iframe
          title="Email template preview"
          srcDoc={html}
          sandbox=""
          className="block h-100 w-full max-w-full border-0 sm:h-140"
        />
      </div>
    </div>
  );
}
