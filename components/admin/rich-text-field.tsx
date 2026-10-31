"use client";

import { useEffect, useId, useRef, useState } from "react";
import { sanitizeRichText } from "@/lib/cms/sanitize-rich-text";

type Props = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  minHeightClassName?: string;
};

function ToolbarButton({
  label,
  active,
  onMouseDown,
  children,
}: {
  label: string;
  active?: boolean;
  onMouseDown: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown();
      }}
      className={`inline-flex size-8 items-center justify-center rounded-md text-sm transition ${
        active
          ? "bg-brand-primary text-text-inverse"
          : "text-text-primary/70 hover:bg-brand-primary/8 hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextField({
  name,
  defaultValue = "",
  placeholder = "",
  minHeightClassName = "min-h-24",
}: Props) {
  const editorId = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);
  const [value, setValue] = useState(() => sanitizeRichText(defaultValue));
  const [active, setActive] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  useEffect(() => {
    if (!editorRef.current || seeded.current) return;
    editorRef.current.innerHTML = sanitizeRichText(defaultValue);
    seeded.current = true;
  }, [defaultValue]);

  useEffect(() => {
    const next = sanitizeRichText(defaultValue);
    setValue(next);
    if (
      editorRef.current &&
      document.activeElement !== editorRef.current &&
      seeded.current
    ) {
      editorRef.current.innerHTML = next;
    }
  }, [defaultValue]);

  function syncFromEditor() {
    const el = editorRef.current;
    if (!el) return;
    setValue(sanitizeRichText(el.innerHTML));
    updateActiveStates();
  }

  function updateActiveStates() {
    try {
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
      });
    } catch {
      // queryCommandState can throw when the selection is outside the editor
    }
  }

  function run(command: "bold" | "italic" | "underline") {
    editorRef.current?.focus();
    document.execCommand(command, false);
    syncFromEditor();
  }

  const isEmpty = !value.replace(/<br\s*\/?>/gi, "").trim();

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-md border border-brand-primary/12 bg-bg-primary">
      <div className="flex items-center gap-0.5 border-b border-brand-primary/10 bg-bg-secondary/60 px-1.5 py-1">
        <ToolbarButton
          label="Bold"
          active={active.bold}
          onMouseDown={() => run("bold")}
        >
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={active.italic}
          onMouseDown={() => run("italic")}
        >
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={active.underline}
          onMouseDown={() => run("underline")}
        >
          <span className="underline">U</span>
        </ToolbarButton>
      </div>

      <div className="relative">
        {isEmpty ? (
          <p
            className={`pointer-events-none absolute inset-0 px-3 py-2.5 text-base leading-snug text-text-primary/35 ${minHeightClassName}`}
          >
            {placeholder}
          </p>
        ) : null}
        <div
          id={editorId}
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          className={`w-full px-3 py-2.5 text-base leading-snug text-text-primary outline-none [&_em]:italic [&_strong]:font-bold [&_u]:underline ${minHeightClassName}`}
          onInput={syncFromEditor}
          onKeyUp={updateActiveStates}
          onMouseUp={updateActiveStates}
          onBlur={syncFromEditor}
        />
      </div>

      <input type="hidden" name={name} value={value} readOnly />
    </div>
  );
}
