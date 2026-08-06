"use client";

import { IconChevronDown } from "@tabler/icons-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

export type SelectMenuOption = {
  value: string;
  label: string;
};

export function SelectMenu({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Select",
  "aria-label": ariaLabel,
  name,
  className = "",
  size = "md",
}: {
  value: string;
  options: readonly SelectMenuOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  name?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const summary = selected?.label ?? placeholder;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }

    function place() {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const gap = 6;
      const viewportPad = 8;
      const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPad;
      const spaceAbove = rect.top - gap - viewportPad;
      const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(120, openUp ? spaceAbove : spaceBelow);

      const style: CSSProperties = {
        position: "fixed",
        zIndex: 80,
        left: Math.max(
          viewportPad,
          Math.min(rect.left, window.innerWidth - rect.width - viewportPad),
        ),
        width: Math.min(rect.width, window.innerWidth - viewportPad * 2),
        maxHeight,
        overflowY: "auto",
      };

      if (openUp) {
        style.bottom = window.innerHeight - rect.top + gap;
      } else {
        style.top = rect.bottom + gap;
      }

      setMenuStyle(style);
    }

    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu =
    open && menuStyle && mounted ? (
      <div
        ref={menuRef}
        id={listId}
        role="listbox"
        style={menuStyle}
        className="rounded-[9px] border border-brand-primary/10 bg-bg-primary p-2 shadow-lg"
      >
        <div className="flex flex-col gap-0.5">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm transition ${
                  isSelected
                    ? "bg-brand-primary text-text-inverse"
                    : "text-text-primary/80 hover:bg-bg-secondary"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <div className={`relative min-w-0 ${className}`}>
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${
          size === "sm" ? "h-9 text-sm" : "h-10 text-base"
        } ${
          open
            ? "border-brand-primary/35 bg-bg-primary text-brand-primary"
            : "border-brand-primary/12 bg-bg-primary text-text-primary hover:border-brand-primary/25"
        }`}
      >
        <span className="truncate">{summary}</span>
        <IconChevronDown
          className={`size-4 shrink-0 opacity-55 transition ${
            open ? "rotate-180" : ""
          }`}
          stroke={1.75}
        />
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
