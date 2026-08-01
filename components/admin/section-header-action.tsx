"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const HeaderActionSlotContext = createContext<HTMLElement | null>(null);

/** Portal target + provider for header actions. */
export function SectionPanelChrome({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);

  return (
    <HeaderActionSlotContext.Provider value={slot}>
      <section className="flex min-w-0 flex-1 flex-col self-start overflow-hidden rounded-lg border border-brand-primary/8 bg-bg-secondary/80">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-brand-primary/8 px-5 py-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <h2 className="font-display text-base font-semibold tracking-tight text-brand-primary">
              {title}
            </h2>
            {typeof count === "number" ? (
              <span className="text-sm tabular-nums text-text-primary/40">
                {count}
              </span>
            ) : null}
          </div>
          <div ref={setSlot} className="flex shrink-0 items-center" />
        </div>
        <div className="p-5">{children}</div>
      </section>
    </HeaderActionSlotContext.Provider>
  );
}

/** Place Add (or other) actions next to the section title. */
export function SectionHeaderAction({ children }: { children: ReactNode }) {
  const slot = useContext(HeaderActionSlotContext);
  if (!slot) return null;
  return createPortal(children, slot);
}
