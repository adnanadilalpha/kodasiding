"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KodaVentProductDesign } from "@/lib/cms/types";

function formatIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

/** Dark-stroke drawings for the light diagram stage. */
const FALLBACK_DETAILS: Record<string, string> = {
  "ann-flange": "/kodavent/details/flange.svg",
  "ann-seal": "/kodavent/details/seal.svg",
  "ann-retrofit": "/kodavent/details/retrofit.svg",
};

export function KodaVentProductDesignSection({
  section,
  detailImages = {},
}: {
  section: KodaVentProductDesign;
  detailImages?: Record<string, string | null | undefined>;
  imageUrl?: string | null;
}) {
  const annotations = (section.annotations ?? []).filter((a) => a.visible);
  const [activeId, setActiveId] = useState<string | null>(
    annotations[0]?.id ?? null,
  );
  const [revealed, setRevealed] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const tabsId = useId();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    const reveal = () => {
      if (!cancelled) setRevealed(true);
    };

    if (mq.matches) {
      reveal();
    } else {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            reveal();
            observer?.disconnect();
          }
        },
        { threshold: 0.12 },
      );
      observer.observe(el);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  if (!section.visible) return null;

  const headingLines = section.heading
    .split(/(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const active =
    annotations.find((a) => a.id === activeId) ?? annotations[0] ?? null;
  const activeIndex = Math.max(
    0,
    annotations.findIndex((a) => a.id === active?.id),
  );

  function diagramFor(id: string) {
    return FALLBACK_DETAILS[id] || detailImages[id] || null;
  }

  const activeDiagram = active ? diagramFor(active.id) : null;

  return (
    <section
      ref={sectionRef}
      id="product-design"
      className="scroll-mt-16 bg-bg-primary py-20 lg:scroll-mt-24 lg:py-32"
    >
      <div className="flex flex-col gap-10 px-page lg:gap-12">
        <header className="grid gap-5 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            <p className="text-xs tracking-[0.16em] text-text-secondary uppercase">
              02 / The Design
            </p>
            <h2 className="mt-4 font-display text-3xl leading-[1.08] font-bold tracking-tight text-brand-primary uppercase sm:text-4xl lg:text-5xl xl:text-6xl">
              {headingLines.length > 1 ? (
                headingLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))
              ) : (
                section.heading
              )}
            </h2>
          </div>
          {section.description ? (
            <p className="max-w-md self-end text-base leading-normal text-text-secondary lg:col-span-4 lg:justify-self-end lg:text-lg">
              {section.description}
            </p>
          ) : null}
        </header>

        {/* Quiet chrome — titles only; one active at a time */}
        <div
          role="tablist"
          aria-label="Design details"
          className="flex gap-1 overflow-x-auto border-b border-brand-primary/12 pb-px [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {annotations.map((annotation, index) => {
            const selected = active?.id === annotation.id;
            return (
              <button
                key={annotation.id}
                type="button"
                role="tab"
                id={`${tabsId}-${annotation.id}`}
                aria-selected={selected}
                aria-controls={`${tabsId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(annotation.id)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const dir = e.key === "ArrowRight" ? 1 : -1;
                  const next =
                    (index + dir + annotations.length) % annotations.length;
                  setActiveId(annotations[next]?.id ?? activeId);
                }}
                className={`shrink-0 border-b-2 px-3 py-3 text-left transition focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none sm:px-4 ${
                  selected
                    ? "border-accent-warm text-brand-primary"
                    : "border-transparent text-text-secondary hover:text-brand-primary"
                }`}
              >
                <span
                  className={`font-display text-[0.65rem] tracking-[0.16em] uppercase ${
                    selected ? "text-brand-primary/55" : "text-text-secondary/80"
                  }`}
                >
                  {formatIndex(index)}
                </span>
                <span className="mt-1 block font-display text-sm tracking-[0.04em] uppercase sm:text-base">
                  {annotation.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hierarchy: light diagram (support) → dark copy (primary read) */}
        <div
          role="tabpanel"
          id={`${tabsId}-panel`}
          aria-labelledby={active ? `${tabsId}-${active.id}` : undefined}
          className="grid overflow-hidden border border-brand-primary/10 lg:grid-cols-12"
        >
          <div className="relative flex aspect-square items-center justify-center bg-bg-secondary sm:aspect-4/3 lg:col-span-7 lg:aspect-auto lg:min-h-140">
            {activeDiagram ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={activeDiagram}
                src={activeDiagram}
                alt=""
                width={640}
                height={640}
                className={`relative z-1 size-full max-h-112 max-w-md object-contain p-10 transition duration-500 sm:p-14 ${
                  revealed ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden
              />
            ) : null}
          </div>

          <div className="flex flex-col justify-between gap-8 bg-brand-primary-active px-6 py-8 text-text-inverse sm:px-8 lg:col-span-5 lg:px-10 lg:py-12">
            <div>
              <p className="font-display text-xs tracking-[0.18em] text-accent-warm uppercase">
                Detail {formatIndex(activeIndex)}
                <span className="text-text-inverse/40">
                  {" "}
                  / {formatIndex(Math.max(0, annotations.length - 1))}
                </span>
              </p>
              <h3 className="mt-4 font-display text-2xl leading-[1.12] font-bold tracking-tight text-text-inverse uppercase sm:text-3xl lg:text-4xl">
                {active?.title}
              </h3>
              {active?.description ? (
                <p className="mt-4 max-w-sm text-base leading-normal text-text-inverse/75">
                  {active.description}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Previous detail"
                onClick={() => {
                  const prev =
                    (activeIndex - 1 + annotations.length) % annotations.length;
                  setActiveId(annotations[prev]?.id ?? activeId);
                }}
                className="flex size-10 items-center justify-center border border-text-inverse/25 text-text-inverse transition hover:bg-text-inverse/8 focus-visible:ring-2 focus-visible:ring-accent-warm focus-visible:outline-none"
              >
                <span aria-hidden className="text-lg leading-none">
                  ←
                </span>
              </button>
              <button
                type="button"
                aria-label="Next detail"
                onClick={() => {
                  const next = (activeIndex + 1) % annotations.length;
                  setActiveId(annotations[next]?.id ?? activeId);
                }}
                className="flex size-10 items-center justify-center border border-text-inverse/25 text-text-inverse transition hover:bg-text-inverse/8 focus-visible:ring-2 focus-visible:ring-accent-warm focus-visible:outline-none"
              >
                <span aria-hidden className="text-lg leading-none">
                  →
                </span>
              </button>
              <p className="ml-auto text-xs tracking-[0.14em] text-text-inverse/45 uppercase">
                Installation drawing
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
