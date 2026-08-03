"use client";

import { useEffect, type ReactNode } from "react";
import { lockBodyScroll } from "@/lib/dom/lock-body-scroll";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const unlock = lockBodyScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-brand-primary/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className={`relative z-10 flex max-h-[min(90dvh,880px)] w-full flex-col overflow-hidden rounded-[9px] border border-brand-primary/10 bg-bg-primary shadow-xl ${
          size === "xl"
            ? "max-w-3xl"
            : size === "lg"
              ? "max-w-2xl"
              : "max-w-lg"
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-primary/8 px-5 py-3.5">
          <div className="min-w-0">
            <h2
              id="admin-modal-title"
              className="font-display text-base font-semibold text-brand-primary"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-text-primary/45">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-sm text-text-primary/45 transition hover:text-brand-primary"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 pt-4">{children}</div>
      </div>
    </div>
  );
}
