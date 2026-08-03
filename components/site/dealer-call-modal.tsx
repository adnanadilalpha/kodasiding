"use client";

import { useEffect, useId, useRef, useState } from "react";
import { lockBodyScroll } from "@/lib/dom/lock-body-scroll";
import { phoneHref } from "@/lib/cms/dealer-geo";

function prefersPhoneDialer() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPod|Windows Phone/i.test(ua)) return true;
  // iPadOS 13+ reports as Mac — treat coarse pointer + touch as dialer-capable.
  if (
    /iPad/i.test(ua) ||
    (navigator.maxTouchPoints > 1 && /Mac/i.test(ua))
  ) {
    return true;
  }
  return (
    navigator.maxTouchPoints > 0 &&
    window.matchMedia("(max-width: 768px)").matches
  );
}

export function DealerCallModal({
  dealerName,
  phone,
  onClose,
}: {
  dealerName: string;
  phone: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const tel = phoneHref(phone);
  const [entered, setEntered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsPhone(prefersPhoneDialer());
    const unlock = lockBodyScroll();
    const id = requestAnimationFrame(() => setEntered(true));
    return () => {
      unlock();
      cancelAnimationFrame(id);
      if (copyTimerRef.current != null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(phone.trim());
      setCopied(true);
      if (copyTimerRef.current != null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-60 flex items-center justify-center bg-brand-primary-active/55 p-4 backdrop-blur-[2px] transition-opacity duration-300 sm:p-8 ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-md origin-center rounded-lg bg-white shadow-lg transition duration-300 ease-out ${
          entered
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-[0.98] opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center text-text-primary"
          aria-label="Close"
        >
          <span className="relative block size-4" aria-hidden>
            <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rotate-45 bg-current" />
            <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 -rotate-45 bg-current" />
          </span>
        </button>

        <div className="flex flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-12">
          <p className="text-[11px] tracking-[0.075em] text-[#8a8d86] uppercase">
            Call dealer
          </p>
          <h2
            id={titleId}
            className="mt-2 font-display text-xl font-bold text-brand-primary uppercase"
          >
            {dealerName}
          </h2>
          <p
            className="mt-6 font-display text-3xl font-bold tracking-wide text-text-primary tabular-nums sm:text-4xl"
          >
            {isPhone && tel ? (
              <a href={tel} className="text-inherit no-underline">
                {phone}
              </a>
            ) : (
              phone
            )}
          </p>
          <p className="mt-3 max-w-xs text-sm text-[#6b6858]">
            {isPhone
              ? "Tap Call to open your phone dialer with this number."
              : "Copy the number to call from your phone."}
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            {tel && isPhone ? (
              <a
                href={tel}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-brand-primary px-8 font-display text-sm tracking-[0.04em] text-text-inverse uppercase transition hover:bg-brand-primary-active sm:flex-none"
              >
                Call
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => void copyNumber()}
              className={`inline-flex h-12 flex-1 items-center justify-center rounded-md px-8 font-display text-sm tracking-[0.04em] uppercase transition sm:flex-none ${
                isPhone
                  ? "border border-border-strong bg-bg-primary text-brand-primary hover:bg-bg-secondary"
                  : "bg-brand-primary text-text-inverse hover:bg-brand-primary-active"
              }`}
            >
              {copied ? "Copied" : "Copy number"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
