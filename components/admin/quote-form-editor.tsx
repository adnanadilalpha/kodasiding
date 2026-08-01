"use client";

import { useState, useTransition } from "react";
import { IconGripVertical, IconPlus, IconTrash } from "@tabler/icons-react";
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
              className={`flex items-end gap-2 ${
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

              {field.kind === "custom" ? (
                <div className="w-32 shrink-0">
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
                <label className="mb-2.5 flex shrink-0 items-center gap-1.5 text-xs text-text-primary/55">
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
                  className="mb-2.5 rounded-md p-1.5 text-text-primary/40 transition hover:bg-red-50 hover:text-[#ff383c]"
                  aria-label={`Remove ${field.label}`}
                >
                  <IconTrash size={16} stroke={1.5} />
                </button>
              ) : (
                <span className="mb-2.5 w-8 shrink-0" />
              )}
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

      <FieldGroup title="Attachment file types" columns={3}>
        <p className="sm:col-span-3 text-sm text-text-primary/55">
          Choose which file types visitors can upload.
        </p>
        {QUOTE_FILE_TYPE_OPTIONS.map((opt) => {
          const checked = values.allowed_file_types.includes(opt.id);
          return (
            <label
              key={opt.id}
              className="flex items-center gap-2 text-sm text-text-primary"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleFileType(opt.id)}
                className="size-4 rounded border-brand-primary/20"
              />
              <span>
                {opt.label}{" "}
                <span className="text-text-primary/40">
                  {opt.extensions.join(" ")}
                </span>
              </span>
            </label>
          );
        })}
      </FieldGroup>

      <div>
        <Button type="button" disabled={pending} onClick={onSave}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
