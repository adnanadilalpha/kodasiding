"use client";

import { useEffect, useId, useRef, useState } from "react";
import { sanitizeRichText } from "@/lib/cms/sanitize-rich-text";

type Props = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  minHeightClassName?: string;
};

type FormatState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  small: boolean;
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

function selectionInside(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return null;
  return { selection, range };
}

function wrapSelection(tagName: "small") {
  const editor = document.activeElement as HTMLElement | null;
  if (!editor?.isContentEditable) return;
  const ctx = selectionInside(editor);
  if (!ctx) return;
  const { selection, range } = ctx;

  const existing = closestTag(range.commonAncestorContainer, tagName);
  if (existing && editor.contains(existing)) {
    unwrap(existing);
  } else if (range.collapsed) {
    const el = document.createElement(tagName);
    el.appendChild(document.createTextNode("\u200b"));
    range.insertNode(el);
    range.setStart(el.firstChild!, 1);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    const el = document.createElement(tagName);
    try {
      range.surroundContents(el);
    } catch {
      const fragment = range.extractContents();
      el.appendChild(fragment);
      range.insertNode(el);
    }
    selection.removeAllRanges();
    const next = document.createRange();
    next.selectNodeContents(el);
    selection.addRange(next);
  }
}

function closestTag(node: Node, tagName: string): HTMLElement | null {
  let current: Node | null = node;
  while (current && current.nodeType !== Node.ELEMENT_NODE) {
    current = current.parentNode;
  }
  return (current as Element | null)?.closest(tagName) as HTMLElement | null;
}

function unwrap(el: HTMLElement) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

function transformSelectionCase(mode: "upper" | "lower" | "title") {
  const editor = document.activeElement as HTMLElement | null;
  if (!editor?.isContentEditable) return;
  const ctx = selectionInside(editor);
  if (!ctx) return;
  const { selection, range } = ctx;
  if (range.collapsed) return;

  const text = range.toString();
  if (!text) return;

  let next = text;
  if (mode === "upper") next = text.toUpperCase();
  else if (mode === "lower") next = text.toLowerCase();
  else {
    next = text.replace(
      /\w\S*/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    );
  }

  range.deleteContents();
  range.insertNode(document.createTextNode(next));
  selection.removeAllRanges();
  const after = document.createRange();
  after.selectNodeContents(editor);
  after.collapse(false);
  selection.addRange(after);
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
  const [active, setActive] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    small: false,
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
      const selection = window.getSelection();
      const node = selection?.anchorNode ?? null;
      const inSmall = Boolean(
        node && editorRef.current && closestTag(node, "small"),
      );
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        small: inSmall,
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

  function runSmall() {
    editorRef.current?.focus();
    wrapSelection("small");
    syncFromEditor();
  }

  function runCase(mode: "upper" | "lower" | "title") {
    editorRef.current?.focus();
    transformSelectionCase(mode);
    syncFromEditor();
  }

  const isEmpty = !value.replace(/<br\s*\/?>/gi, "").trim();

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-md border border-brand-primary/12 bg-bg-primary">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-brand-primary/10 bg-bg-secondary/60 px-1.5 py-1">
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
        <ToolbarButton
          label="Smaller text"
          active={active.small}
          onMouseDown={runSmall}
        >
          <span className="text-[0.7rem] font-semibold">S</span>
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-brand-primary/15" aria-hidden />
        <ToolbarButton
          label="Title Case"
          onMouseDown={() => runCase("title")}
        >
          <span className="text-[0.65rem] font-semibold tracking-tight">
            Aa
          </span>
        </ToolbarButton>
        <ToolbarButton
          label="UPPERCASE"
          onMouseDown={() => runCase("upper")}
        >
          <span className="text-[0.65rem] font-semibold tracking-tight">
            AA
          </span>
        </ToolbarButton>
        <ToolbarButton
          label="lowercase"
          onMouseDown={() => runCase("lower")}
        >
          <span className="text-[0.65rem] font-semibold tracking-tight">
            aa
          </span>
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
          className={`w-full px-3 py-2.5 text-base leading-snug text-text-primary outline-none [&_em]:italic [&_strong]:font-bold [&_u]:underline [&_small]:text-[0.85em] ${minHeightClassName}`}
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
