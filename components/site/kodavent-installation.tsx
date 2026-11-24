"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type {
  DocumentRow,
  KodaVentInstallMethod,
  KodaVentInstallation,
  MediaAsset,
} from "@/lib/cms/types";
import { isSvgMedia } from "@/lib/cms/is-svg-media";
import { mediaUrlFromMap, publicMediaUrl } from "@/lib/cms/urls";
import {
  DEFAULT_KODAVENT_METHODS,
  DEFAULT_PAGE_KODAVENT,
} from "@/lib/cms/kodavent-defaults";
import { RichText } from "@/components/site/rich-text";
import { plainTextFromRich } from "@/lib/cms/sanitize-rich-text";

export function KodaVentInstallationSection({
  section,
  media,
  documents,
}: {
  section: KodaVentInstallation;
  media: Record<string, MediaAsset>;
  documents: DocumentRow[];
}) {
  const methods = useMemo(
    () => (section.methods ?? []).filter((m) => m.visible),
    [section.methods],
  );

  const tabsId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const [stepIndexByMethod, setStepIndexByMethod] = useState<
    Record<string, number>
  >({});

  const activeMethod =
    methods.find((m) => m.id === methodId) ?? methods[0] ?? null;
  const steps = useMemo(
    () => (activeMethod?.steps ?? []).filter((s) => s.visible),
    [activeMethod],
  );

  const rawStepIndex = activeMethod
    ? (stepIndexByMethod[activeMethod.id] ?? 0)
    : 0;
  const stepIndex =
    steps.length === 0 ? 0 : Math.min(rawStepIndex, steps.length - 1);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    function onKey(e: KeyboardEvent) {
      if (!activeMethod || steps.length === 0) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setStepIndexByMethod((prev) => ({
          ...prev,
          [activeMethod.id]:
            ((prev[activeMethod.id] ?? 0) + 1) % steps.length,
        }));
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setStepIndexByMethod((prev) => {
          const current = prev[activeMethod.id] ?? 0;
          return {
            ...prev,
            [activeMethod.id]:
              current <= 0 ? steps.length - 1 : current - 1,
          };
        });
      }
    }

    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [activeMethod, steps.length]);

  if (!section.visible) return null;
  if (!activeMethod || methods.length === 0) return null;

  const step = steps[stepIndex] ?? steps[0];
  const stepImage = step
    ? mediaUrlFromMap(media, step.image_media_id)
    : null;
  const progress =
    steps.length <= 1 ? 100 : (stepIndex / (steps.length - 1)) * 100;

  const headingHasMarkup = /<[a-z][\s\S]*>/i.test(section.heading);
  const headingLines = headingHasMarkup
    ? []
    : section.heading
    .split(/(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

  function setStepIndex(next: number) {
    if (!activeMethod) return;
    setStepIndexByMethod((prev) => ({
      ...prev,
      [activeMethod.id]: next,
    }));
  }

  function goPrev() {
    if (steps.length === 0) return;
    setStepIndex(stepIndex <= 0 ? steps.length - 1 : stepIndex - 1);
  }
  function goNext() {
    if (steps.length === 0) return;
    setStepIndex(stepIndex >= steps.length - 1 ? 0 : stepIndex + 1);
  }

  return (
    <section
      id="installation"
      className="scroll-mt-16 bg-brand-primary-active py-20 text-text-inverse lg:scroll-mt-24 lg:py-32"
    >
      <div className="flex flex-col gap-12 px-page lg:gap-16">
        <header className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-7">
            <p className="text-xs tracking-[0.16em] text-[#ddddd7]/70">
              <RichText
                html={
                  section.eyebrow?.trim() ||
                  DEFAULT_PAGE_KODAVENT.installation.eyebrow
                }
                as="span"
              />
            </p>
            <h2 className="mt-4 font-display text-[1.85rem] leading-[1.08] font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {headingLines.length > 1 ? (
                headingLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))
              ) : (
                <RichText html={section.heading} as="span" />
              )}
            </h2>
          </div>
          {section.description ? (
            <p className="max-w-md text-base leading-normal text-[#ddddd7] lg:col-span-5 lg:justify-self-end lg:text-lg">
              <RichText html={section.description} as="span" />
            </p>
          ) : null}
        </header>

        <div
          ref={panelRef}
          tabIndex={0}
          className="outline-none focus-visible:ring-2 focus-visible:ring-accent-warm/60"
          aria-label="Installation viewer"
        >
          <div
            role="tablist"
            aria-label="Installation methods"
            className="flex gap-8 border-b border-white/15"
          >
            {methods.map((method) => {
              const selected = method.id === activeMethod.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  role="tab"
                  id={`${tabsId}-${method.id}`}
                  aria-selected={selected}
                  aria-controls={`${tabsId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setMethodId(method.id)}
                  className={`relative pb-4 font-display text-xs tracking-[0.14em] transition focus-visible:outline-none sm:text-sm ${
                    selected
                      ? "text-text-inverse"
                      : "text-text-inverse/45 hover:text-text-inverse/75"
                  }`}
                >
                  <RichText html={method.tab_label} as="span" />
                  <span
                    className={`absolute inset-x-0 -bottom-px h-px transition ${
                      selected ? "bg-accent-warm" : "bg-transparent"
                    }`}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>

          {activeMethod.intro?.trim() ? (
            <p className="mt-6 max-w-3xl text-sm leading-normal text-[#ddddd7]/75 lg:mt-8 lg:text-base">
              <RichText html={activeMethod.intro} as="span" />
            </p>
          ) : null}

          <div
            role="tabpanel"
            id={`${tabsId}-panel`}
            aria-labelledby={`${tabsId}-${activeMethod.id}`}
            className="mt-8 grid gap-0 lg:mt-10 lg:grid-cols-12"
          >
            <div className="relative min-h-100 bg-bg-primary lg:col-span-7 lg:min-h-140">
              {stepImage ? (
                <StepIllustration
                  src={stepImage}
                  alt={
                    plainTextFromRich(step?.image_alt || step?.title) ||
                    "Installation step"
                  }
                  priority={stepIndex === 0}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-text-secondary">
                  Step illustration
                </div>
              )}
            </div>

            <div className="flex min-h-100 flex-col gap-6 bg-brand-primary px-6 py-8 sm:px-8 lg:col-span-5 lg:min-h-140 lg:px-10 lg:py-10">
              <div>
                <p className="text-xs tracking-[0.16em] text-[#ddddd7]/65 uppercase">
                  Step{" "}
                  {step?.number ?? String(stepIndex + 1).padStart(2, "0")} /{" "}
                  {String(steps.length).padStart(2, "0")}
                </p>
                <h3 className="mt-4 font-display text-2xl leading-[1.15] font-bold sm:text-3xl">
                  <RichText html={step?.title} as="span" />
                </h3>
              </div>

              {step?.description ? (
                <p className="flex-1 text-base leading-normal text-[#ddddd7]">
                  <RichText html={step.description} as="span" />
                </p>
              ) : (
                <div className="flex-1" />
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={goPrev}
                  className="rounded-md border border-white/20 px-5 py-3 text-sm text-text-inverse transition hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-accent-warm focus-visible:outline-none"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-md bg-accent-warm px-5 py-3 text-sm text-text-primary transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-accent-warm focus-visible:outline-none"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div
              className="h-px w-full bg-white/15"
              role="presentation"
              aria-hidden
            >
              <div
                className="h-px bg-accent-warm transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <ol className="mt-4 flex flex-wrap gap-x-1 gap-y-2" aria-label="Step progress">
              {steps.map((s, i) => {
                const selected = i === stepIndex;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-label={`Go to step ${s.number || i + 1}: ${plainTextFromRich(s.title)}`}
                      aria-current={selected ? "step" : undefined}
                      onClick={() => setStepIndex(i)}
                      className={`min-w-9 px-2 py-1.5 font-display text-xs tracking-widest uppercase transition focus-visible:ring-2 focus-visible:ring-accent-warm focus-visible:outline-none ${
                        selected
                          ? "text-accent-warm"
                          : "text-text-inverse/35 hover:text-text-inverse/70"
                      }`}
                    >
                      {s.number || String(i + 1).padStart(2, "0")}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <MethodDownloads methods={methods} documents={documents} />
      </div>
    </section>
  );
}

function StepIllustration({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  if (isSvgMedia(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 size-full object-contain p-8 sm:p-12"
        loading={priority ? "eager" : "lazy"}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      quality={90}
      priority={priority}
      sizes="(max-width: 1024px) 100vw, 58vw"
      className="object-contain p-8 sm:p-12"
    />
  );
}

function MethodDownloads({
  methods,
  documents,
}: {
  methods: KodaVentInstallMethod[];
  documents: DocumentRow[];
}) {
  const links = methods
    .map((method) => {
      const doc = documents.find(
        (d) => d.key === method.pdf_document_key && d.storage_path,
      );
      if (!doc) return null;
      const href = publicMediaUrl(doc.storage_path, doc.bucket);
      if (!href) return null;
      return {
        id: method.id,
        href,
        label:
          method.pdf_link_label?.trim() ||
          DEFAULT_KODAVENT_METHODS.find((m) => m.id === method.id)
            ?.pdf_link_label ||
          (method.id === "retrofit"
            ? "Download Retrofit Guide"
            : "Download New Construction Guide"),
      };
    })
    .filter(Boolean) as Array<{ id: string; href: string; label: string }>;

  if (!links.length) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-white/12 pt-8 sm:flex-row sm:gap-8">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 text-sm text-[#ddddd7] underline-offset-4 transition hover:text-text-inverse hover:underline focus-visible:ring-2 focus-visible:ring-accent-warm focus-visible:outline-none"
        >
          <span
            className="inline-block size-3.5 border border-current"
            aria-hidden
          />
          <RichText html={link.label} as="span" />
        </a>
      ))}
    </div>
  );
}
