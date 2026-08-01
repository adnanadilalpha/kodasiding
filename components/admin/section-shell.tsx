"use client";

import { useState, type ReactNode } from "react";
import { SectionPanelChrome } from "@/components/admin/section-header-action";

export type SectionTab = {
  id: string;
  label: string;
  /** Optional count shown next to the section name */
  count?: number;
  content: ReactNode;
};

export function SectionShell({
  title,
  sections,
  defaultSectionId,
}: {
  title: string;
  sections: SectionTab[];
  defaultSectionId?: string;
}) {
  const initial =
    defaultSectionId && sections.some((s) => s.id === defaultSectionId)
      ? defaultSectionId
      : sections[0]?.id;
  const [activeId, setActiveId] = useState(initial);
  const active = sections.find((s) => s.id === activeId) ?? sections[0];

  if (!active) return null;

  return (
    <div className="flex w-full flex-col gap-4">
      <header className="shrink-0">
        <h1 className="font-display text-xl font-semibold tracking-tight text-brand-primary">
          {title}
        </h1>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
        <div className="shrink-0 lg:hidden">
          <nav
            className="flex gap-1 overflow-x-auto rounded-lg border border-brand-primary/8 bg-bg-secondary/80 p-2"
            aria-label={`${title} sections`}
          >
            {sections.map((section, index) => {
              const isActive = section.id === active.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveId(section.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-primary text-text-inverse"
                      : "text-brand-primary/70"
                  }`}
                >
                  <span
                    className={`flex size-5 items-center justify-center rounded-[3px] text-[10px] font-semibold ${
                      isActive
                        ? "bg-white/15"
                        : "bg-bg-primary text-brand-primary/40"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.label}
                  {typeof section.count === "number" ? (
                    <span
                      className={`text-xs tabular-nums ${
                        isActive
                          ? "text-text-inverse/70"
                          : "text-brand-primary/40"
                      }`}
                    >
                      {section.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <aside className="hidden w-44 shrink-0 self-start lg:block">
          <nav
            className="flex w-full flex-col gap-0.5 rounded-lg border border-brand-primary/8 bg-bg-secondary/80 p-2"
            aria-label={`${title} sections`}
          >
            {sections.map((section, index) => {
              const isActive = section.id === active.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveId(section.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition ${
                    isActive
                      ? "bg-brand-primary text-text-inverse"
                      : "text-brand-primary/70 hover:bg-bg-primary/60"
                  }`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-[3px] text-[10px] font-semibold ${
                      isActive
                        ? "bg-white/15 text-text-inverse"
                        : "bg-bg-primary text-brand-primary/40"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm leading-snug font-medium">
                    {section.label}
                  </span>
                  {typeof section.count === "number" ? (
                    <span
                      className={`shrink-0 text-xs tabular-nums ${
                        isActive
                          ? "text-text-inverse/70"
                          : "text-brand-primary/40"
                      }`}
                    >
                      {section.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>

        <SectionPanelChrome
          key={active.id}
          title={active.label}
          count={active.count}
        >
          {active.content}
        </SectionPanelChrome>
      </div>
    </div>
  );
}
