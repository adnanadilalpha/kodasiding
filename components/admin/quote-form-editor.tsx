"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { IconChevronDown, IconGripVertical, IconPlus, IconTrash } from "@tabler/icons-react";
import { saveQuoteFormSettings } from "@/lib/cms/actions";
import {
  QUOTE_FILE_TYPE_OPTIONS,
  createCoreField,
  createCustomField,
  isQuoteFieldRemovable,
  missingCoreKinds,
} from "@/lib/cms/quote-form";
import type {
  QuoteAttachmentFileTypeId,
  QuoteFormFieldDef,
  QuoteFormSettings,
} from "@/lib/cms/types";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, Select, TextInput } from "@/components/ui/field";

const FIELD_META_LABEL: Record<string, string> = {
  full_name: "Full Name",
  email: "Email Address",
  phone: "Phone Number",
  city: "City",
  state: "State",
  message: "Message",
  attachment: "Attachment",
  custom: "Custom field",
};

function FileTypesDropdown({
  selected,
  onToggle,
}: {
  selected: QuoteAttachmentFileTypeId[];
  onToggle: (id: QuoteAttachmentFileTypeId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(160, openUp ? spaceAbove : spaceBelow);

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

  const summary =
    selected.length === 0
      ? "Select file types"
      : selected
          .map(
            (id) =>
              QUOTE_FILE_TYPE_OPTIONS.find((o) => o.id === id)?.label ?? id,
          )
          .join(", ");

  const menu =
    open && menuStyle && mounted ? (
      <div
        ref={menuRef}
        style={menuStyle}
        className="rounded-[9px] border border-brand-primary/10 bg-bg-primary p-2 shadow-lg"
      >
        <div className="flex flex-col gap-0.5">
          {QUOTE_FILE_TYPE_OPTIONS.map((opt) => {
            const checked = selected.includes(opt.id);
            return (
              <label
                key={opt.id}
                className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition ${
                  checked
                    ? "bg-brand-primary/6 text-text-primary"
                    : "text-text-primary/80 hover:bg-bg-secondary"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(opt.id)}
                  className="size-4 rounded border-brand-primary/20"
                />
                <span className="min-w-0 flex-1">
                  {opt.label}{" "}
                  <span className="text-text-primary/40">
                    {opt.extensions.join(" ")}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-1 w-full rounded-md px-2.5 py-2 text-left text-sm text-brand-primary/70 transition hover:bg-bg-secondary hover:text-brand-primary"
        >
          Done
        </button>
      </div>
    ) : null;

  return (
    <div className="relative max-w-md">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-sm transition ${
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

export function QuoteFormEditor({ initial }: { initial: QuoteFormSettings }) {
  const [values, setValues] = useState<QuoteFormSettings>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const missing = missingCoreKinds(values.fields);

  function updateField(id: string, patch: Partial<QuoteFormFieldDef>) {
    setValues((current) => ({
      ...current,
      fields: current.fields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    }));
  }

  function removeField(id: string) {
    setValues((current) => ({
      ...current,
      fields: current.fields.filter((field) => {
        if (field.id !== id) return true;
        return !isQuoteFieldRemovable(field);
      }),
    }));
  }

  function addCore(kind: Exclude<QuoteFormFieldDef["kind"], "custom">) {
    setValues((current) => ({
      ...current,
      fields: [...current.fields, createCoreField(kind)],
    }));
  }

  function addCustom() {
    setValues((current) => ({
      ...current,
      fields: [...current.fields, createCustomField()],
    }));
  }

  function toggleFileType(id: QuoteAttachmentFileTypeId) {
    setValues((current) => {
      const has = current.allowed_file_types.includes(id);
      const next = has
        ? current.allowed_file_types.filter((t) => t !== id)
        : [...current.allowed_file_types, id];
      return {
        ...current,
        allowed_file_types:
          next.length > 0 ? next : current.allowed_file_types,
      };
    });
  }

  function reorder(fromId: string, toId: string) {
    if (fromId === toId) return;
    setValues((current) => {
      const from = current.fields.findIndex((f) => f.id === fromId);
      const to = current.fields.findIndex((f) => f.id === toId);
      if (from < 0 || to < 0) return current;
      const next = [...current.fields];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item!);
      return { ...current, fields: next };
    });
  }

  function onSave() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveQuoteFormSettings(values);
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage("Quote form saved.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <FieldGroup title="Modal" columns={2}>
        <div className="sm:col-span-2">
          <Field label="Title">
            <TextInput
              value={values.title}
              onChange={(e) =>
                setValues((c) => ({ ...c, title: e.target.value }))
              }
              placeholder="Request a quote"
            />
          </Field>
        </div>
        <Field label="Submit button">
          <TextInput
            value={values.submit_label}
            onChange={(e) =>
              setValues((c) => ({ ...c, submit_label: e.target.value }))
            }
            placeholder="Submit Request"
          />
        </Field>
        <Field label="Upload button">
          <TextInput
            value={values.upload_label}
            onChange={(e) =>
              setValues((c) => ({ ...c, upload_label: e.target.value }))
            }
            placeholder="Upload file here"
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Fields" columns={2}>
        <p className="sm:col-span-2 text-sm text-text-primary/55">
          Drag to reorder. Name and email stay required. Attachment name is
          fixed — set allowed file types below.
        </p>

        {values.fields.map((field) => {
          const isAttachment = field.kind === "attachment";
          const isOver = overId === field.id && dragId !== field.id;

          return (
            <div
              key={field.id}
              draggable
              onDragStart={() => setDragId(field.id)}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(field.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) reorder(dragId, field.id);
                setDragId(null);
                setOverId(null);
              }}
              className={`flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2 ${
                isOver ? "rounded-md ring-2 ring-brand-primary/25" : ""
              } ${dragId === field.id ? "opacity-50" : ""} ${
                field.kind === "custom" && field.input === "textarea"
                  ? "sm:col-span-2"
                  : field.width === "full" ||
                      field.kind === "full_name" ||
                      field.kind === "message" ||
                      field.kind === "attachment"
                    ? "sm:col-span-2"
                    : ""
              }`}
            >
              <div className="flex min-w-0 flex-1 items-end gap-2">
                <button
                  type="button"
                  className="mb-2.5 cursor-grab text-text-primary/35 active:cursor-grabbing"
                  aria-label={`Drag ${field.label}`}
                  tabIndex={-1}
                >
                  <IconGripVertical size={18} stroke={1.5} />
                </button>

                <div className="min-w-0 flex-1">
                  {isAttachment ? (
                    <Field label="Attachment">
                      <TextInput value="Attachment" disabled readOnly />
                    </Field>
                  ) : (
                    <Field
                      label={
                        FIELD_META_LABEL[field.kind] ??
                        field.kind.replaceAll("_", " ")
                      }
                    >
                      <TextInput
                        value={field.label}
                        onChange={(e) =>
                          updateField(field.id, { label: e.target.value })
                        }
                        placeholder={
                          FIELD_META_LABEL[field.kind] ?? "Field label"
                        }
                      />
                    </Field>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pl-7 sm:contents sm:pl-0">
                {field.kind === "custom" ? (
                  <div className="w-full max-w-40 shrink-0 sm:w-32">
                    <Field label="Type">
                      <Select
                        value={field.input ?? "text"}
                        onChange={(e) =>
                          updateField(field.id, {
                            input:
                              e.target.value === "textarea"
                                ? "textarea"
                                : "text",
                          })
                        }
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Long text</option>
                      </Select>
                    </Field>
                  </div>
                ) : null}

                {field.kind !== "full_name" && field.kind !== "email" ? (
                  <label className="flex shrink-0 items-center gap-1.5 text-xs text-text-primary/55 sm:mb-2.5">
                    <input
                      type="checkbox"
                      checked={Boolean(field.required)}
                      onChange={(e) =>
                        updateField(field.id, { required: e.target.checked })
                      }
                      className="size-3.5 rounded border-brand-primary/20"
                    />
                    Required
                  </label>
                ) : null}

                {isQuoteFieldRemovable(field) ? (
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="rounded-md p-1.5 text-text-primary/40 transition hover:bg-red-50 hover:text-[#ff383c] sm:mb-2.5"
                    aria-label={`Remove ${field.label}`}
                  >
                    <IconTrash size={16} stroke={1.5} />
                  </button>
                ) : (
                  <span className="hidden w-8 shrink-0 sm:mb-2.5 sm:block" />
                )}
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          {missing.map((core) => (
            <Button
              key={core.kind}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                addCore(
                  core.kind as Exclude<QuoteFormFieldDef["kind"], "custom">,
                )
              }
            >
              <IconPlus size={14} stroke={1.5} className="mr-1" />
              Add {core.label}
            </Button>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={addCustom}>
            <IconPlus size={14} stroke={1.5} className="mr-1" />
            Add custom field
          </Button>
        </div>
      </FieldGroup>

      <FieldGroup title="Attachment file types">
        <p className="text-sm text-text-primary/55">
          Choose which file types visitors can upload.
        </p>
        <FileTypesDropdown
          selected={values.allowed_file_types}
          onToggle={toggleFileType}
        />
      </FieldGroup>

      <div>
        <Button type="button" disabled={pending} onClick={onSave}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
