"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveKodaVentCta,
  saveKodaVentDocument,
  saveKodaVentHero,
  saveKodaVentInstalled,
  saveKodaVentInstallation,
  saveKodaVentProductDesign,
  saveKodaVentSeo,
} from "@/lib/cms/actions";
import type {
  DocumentRow,
  KodaVentAnnotation,
  KodaVentInstallMethod,
  KodaVentInstallStep,
  KodaVentRetailerLink,
  MediaAsset,
  PageKodaVent,
} from "@/lib/cms/types";
import { MediaField } from "@/components/admin/media-field";
import { PageSeoEditor } from "@/components/admin/page-seo-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextArea, TextInput } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";
import { plainTextFromRich } from "@/lib/cms/sanitize-rich-text";
import { RichTextField } from "@/components/admin/rich-text-field";

function VisibilityToggle({
  name = "visible",
  defaultChecked,
  label = "Show section on public page",
}: {
  name?: string;
  defaultChecked: boolean;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-text-primary">
      <input
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={defaultChecked}
        className="size-4 rounded border-brand-primary/30"
      />
      {label}
    </label>
  );
}

function LockedHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 truncate font-mono text-xs text-text-primary/40">
      {children}
    </p>
  );
}

export function KodaVentHeroEditor({
  hero,
  media,
}: {
  hero: PageKodaVent["hero"];
  media: Record<string, MediaAsset>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const image = hero.image_media_id ? media[hero.image_media_id] : null;

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          await saveKodaVentHero(fd);
          router.refresh();
        });
      }}
      className="flex w-full flex-col gap-5"
    >
      <VisibilityToggle defaultChecked={hero.visible !== false} />
      <div className="flex flex-col gap-5">
        <FieldGroup title="Copy">
          <Field label="Eyebrow">
            <RichTextField
              name="eyebrow"
              defaultValue={hero.eyebrow}
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Main heading">
            <RichTextField
              name="heading"
              defaultValue={hero.heading}
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Supporting headline">
            <RichTextField
              name="supporting_headline"
              defaultValue={hero.supporting_headline}
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Description">
            <RichTextField
              name="description"
              defaultValue={hero.description}
              minHeightClassName="min-h-24"
            />
          </Field>
        </FieldGroup>
        <FieldGroup title="Calls to action">
          <Field label="Primary CTA label">
            <RichTextField
              name="primary_cta_label"
              defaultValue={hero.primary_cta_label}
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Primary CTA destination">
            <TextInput
              name="primary_cta_href"
              defaultValue={hero.primary_cta_href}
            />
          </Field>
          <Field label="Secondary CTA label">
            <RichTextField
              name="secondary_cta_label"
              defaultValue={hero.secondary_cta_label}
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Secondary CTA destination">
            <TextInput
              name="secondary_cta_href"
              defaultValue={hero.secondary_cta_href}
            />
          </Field>
          <Field label="Image alt text">
            <TextInput name="image_alt" defaultValue={hero.image_alt} />
          </Field>
          <MediaField
            name="image_media_id"
            label="Hero image"
            initialId={hero.image_media_id}
            initialPath={image?.path}
            initialBucket={image?.bucket ?? "media"}
            aspect="square"
          />
        </FieldGroup>
      </div>
      <div className="pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

export function KodaVentProductDesignEditor({
  section,
  media,
}: {
  section: PageKodaVent["product_design"];
  media: Record<string, MediaAsset>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [annotations, setAnnotations] = useState<KodaVentAnnotation[]>(
    section.annotations ?? [],
  );
  const image = section.image_media_id ? media[section.image_media_id] : null;

  function move(index: number, dir: -1 | 1) {
    setAnnotations((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <form
      action={(fd) => {
        fd.set("annotations_json", JSON.stringify(annotations));
        startTransition(async () => {
          await saveKodaVentProductDesign(fd);
          router.refresh();
        });
      }}
      className="flex w-full flex-col gap-5"
    >
      <VisibilityToggle defaultChecked={section.visible !== false} />
      <FieldGroup title="Section copy">
        <Field label="Eyebrow">
          <RichTextField
            name="eyebrow"
            defaultValue={section.eyebrow}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Heading">
          <RichTextField
            name="heading"
            defaultValue={section.heading}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Description">
          <RichTextField
            name="description"
            defaultValue={section.description}
            minHeightClassName="min-h-24"
          />
        </Field>
        <Field label="Image caption">
          <RichTextField
            name="image_caption"
            defaultValue={section.image_caption}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Image alt text">
          <TextInput name="image_alt" defaultValue={section.image_alt} />
        </Field>
        <MediaField
          name="image_media_id"
          label="Packaging / box image"
          initialId={section.image_media_id}
          initialPath={image?.path}
          initialBucket={image?.bucket ?? "media"}
          aspect="square"
        />
        <LockedHint>
          Packaging image appears on the left of Why KodaVent. Benefit reasons
          below become 01 / 02 / 03 on the public page.
        </LockedHint>
      </FieldGroup>

      <FieldGroup title="Benefit reasons">
        <div className="flex flex-col gap-4">
          {annotations.map((annotation, index) => (
            <div
              key={annotation.id}
              className="rounded-md border border-brand-primary/10 bg-bg-secondary/40 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-brand-primary">
                  Reason {String(index + 1).padStart(2, "0")}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => move(index, -1)}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => move(index, 1)}
                  >
                    Down
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setAnnotations((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title">
                  <RichTextField
                    value={annotation.title}
                    onValueChange={(html) =>
                      setAnnotations((prev) =>
                        prev.map((a, i) =>
                          i === index ? { ...a, title: html } : a,
                        ),
                      )
                    }
                    minHeightClassName="min-h-12"
                  />
                </Field>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={annotation.visible}
                    onChange={(e) =>
                      setAnnotations((prev) =>
                        prev.map((a, i) =>
                          i === index
                            ? { ...a, visible: e.target.checked }
                            : a,
                        ),
                      )
                    }
                    className="size-4 rounded border-brand-primary/30"
                  />
                  Visible
                </label>
                <Field label="Description">
                  <RichTextField
                    value={annotation.description}
                    onValueChange={(html) =>
                      setAnnotations((prev) =>
                        prev.map((a, i) =>
                          i === index
                            ? { ...a, description: html }
                            : a,
                        ),
                      )
                    }
                    minHeightClassName="min-h-24"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="X %">
                    <TextInput
                      type="number"
                      min={0}
                      max={100}
                      value={annotation.x}
                      onChange={(e) =>
                        setAnnotations((prev) =>
                          prev.map((a, i) =>
                            i === index
                              ? { ...a, x: Number(e.target.value) }
                              : a,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Y %">
                    <TextInput
                      type="number"
                      min={0}
                      max={100}
                      value={annotation.y}
                      onChange={(e) =>
                        setAnnotations((prev) =>
                          prev.map((a, i) =>
                            i === index
                              ? { ...a, y: Number(e.target.value) }
                              : a,
                          ),
                        )
                      }
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setAnnotations((prev) => [
                  ...prev,
                  {
                    id: `ann-${Date.now()}`,
                    title: "",
                    description: "",
                    x: 50,
                    y: 50,
                    visible: true,
                  },
                ])
              }
            >
              Add annotation
            </Button>
          </div>
        </div>
      </FieldGroup>

      <div className="pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

export function KodaVentInstalledEditor({
  section,
  media,
}: {
  section: PageKodaVent["installed"];
  media: Record<string, MediaAsset>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const image = section.image_media_id ? media[section.image_media_id] : null;

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          await saveKodaVentInstalled(fd);
          router.refresh();
        });
      }}
      className="flex w-full flex-col gap-5"
    >
      <VisibilityToggle defaultChecked={section.visible !== false} />
      <FieldGroup title="See it installed">
        <Field label="Eyebrow">
          <RichTextField
            name="eyebrow"
            defaultValue={section.eyebrow}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Heading">
          <RichTextField
            name="heading"
            defaultValue={section.heading}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Description">
          <RichTextField
            name="description"
            defaultValue={section.description}
            minHeightClassName="min-h-24"
          />
        </Field>
        <Field label="Photo badge">
          <RichTextField
            name="badge_label"
            defaultValue={section.badge_label}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Caption">
          <RichTextField
            name="caption"
            defaultValue={section.caption}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Figure title">
          <RichTextField
            name="figure_title"
            defaultValue={section.figure_title}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Traits (one per line)">
          <TextArea
            name="traits"
            rows={4}
            defaultValue={(section.traits ?? []).join("\n")}
            placeholder={"Quiet\nSquare\nScaled to the siding"}
          />
        </Field>
        <Field label="Image alt text">
          <TextInput name="image_alt" defaultValue={section.image_alt} />
        </Field>
        <MediaField
          name="image_media_id"
          label="Installation photograph"
          initialId={section.image_media_id}
          initialPath={image?.path}
          initialBucket={image?.bucket ?? "media"}
          aspect="wide"
        />
      </FieldGroup>
      <div className="pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function PdfUploadField({
  docKey,
  title,
  currentPath,
}: {
  docKey: string;
  title: string;
  currentPath: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(
    currentPath ? "PDF on file" : null,
  );
  const [uploading, setUploading] = useState(false);

  async function onChange(file: File | null) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setStatus("Only PDF files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus("PDF must be under 10MB.");
      return;
    }
    setUploading(true);
    setStatus("Uploading…");
    try {
      const supabase = createClient();
      const path = `${docKey}-${Date.now()}.pdf`;
      const { error } = await supabase.storage.from("documents").upload(path, file, {
        contentType: "application/pdf",
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const fd = new FormData();
      fd.set("key", docKey);
      fd.set("title", title);
      fd.set("storage_path", path);
      fd.set("bucket", "documents");
      await saveKodaVentDocument(fd);
      setStatus("PDF ready");
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept="application/pdf"
        disabled={uploading}
        onChange={(e) => void onChange(e.target.files?.[0] ?? null)}
        className="text-sm"
      />
      {status ? (
        <p className="text-xs text-text-secondary">{status}</p>
      ) : null}
      {currentPath ? (
        <LockedHint>{currentPath}</LockedHint>
      ) : null}
    </div>
  );
}

export function KodaVentInstallationEditor({
  section,
  media,
  documents,
}: {
  section: PageKodaVent["installation"];
  media: Record<string, MediaAsset>;
  documents: DocumentRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [methods, setMethods] = useState<KodaVentInstallMethod[]>(
    section.methods ?? [],
  );
  const [activeMethodId, setActiveMethodId] = useState(
    methods[0]?.id ?? "",
  );

  const activeMethod = useMemo(
    () => methods.find((m) => m.id === activeMethodId) ?? methods[0],
    [methods, activeMethodId],
  );

  function updateMethod(
    methodId: string,
    patch: Partial<KodaVentInstallMethod>,
  ) {
    setMethods((prev) =>
      prev.map((m) => (m.id === methodId ? { ...m, ...patch } : m)),
    );
  }

  function updateStep(
    methodId: string,
    stepIndex: number,
    patch: Partial<KodaVentInstallStep>,
  ) {
    setMethods((prev) =>
      prev.map((m) => {
        if (m.id !== methodId) return m;
        const steps = m.steps.map((s, i) =>
          i === stepIndex ? { ...s, ...patch } : s,
        );
        return { ...m, steps };
      }),
    );
  }

  function moveStep(methodId: string, index: number, dir: -1 | 1) {
    setMethods((prev) =>
      prev.map((m) => {
        if (m.id !== methodId) return m;
        const steps = [...m.steps];
        const target = index + dir;
        if (target < 0 || target >= steps.length) return m;
        [steps[index], steps[target]] = [steps[target], steps[index]];
        return { ...m, steps };
      }),
    );
  }

  function addStep(methodId: string) {
    setMethods((prev) =>
      prev.map((m) => {
        if (m.id !== methodId) return m;
        const n = m.steps.length + 1;
        return {
          ...m,
          steps: [
            ...m.steps,
            {
              id: `${m.id}-step-${Date.now()}`,
              number: String(n).padStart(2, "0"),
              title: "",
              description: "",
              image_media_id: null,
              image_alt: "",
              visible: true,
            },
          ],
        };
      }),
    );
  }

  function removeStep(methodId: string, index: number) {
    setMethods((prev) =>
      prev.map((m) => {
        if (m.id !== methodId) return m;
        return { ...m, steps: m.steps.filter((_, i) => i !== index) };
      }),
    );
  }

  return (
    <form
      action={(fd) => {
        fd.set("methods_json", JSON.stringify(methods));
        startTransition(async () => {
          await saveKodaVentInstallation(fd);
          router.refresh();
        });
      }}
      className="flex w-full flex-col gap-5"
    >
      <VisibilityToggle defaultChecked={section.visible !== false} />
      <FieldGroup title="Section copy">
        <Field label="Eyebrow">
          <RichTextField
            name="eyebrow"
            defaultValue={section.eyebrow}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Heading">
          <RichTextField
            name="heading"
            defaultValue={section.heading}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Description">
          <RichTextField
            name="description"
            defaultValue={section.description}
            minHeightClassName="min-h-24"
          />
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap gap-2">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => setActiveMethodId(method.id)}
            className={`rounded-md px-3 py-2 text-sm ${
              method.id === activeMethod?.id
                ? "bg-brand-primary text-text-inverse"
                : "bg-bg-secondary text-brand-primary"
            }`}
          >
            {plainTextFromRich(method.tab_label) || method.id}
          </button>
        ))}
      </div>

      {activeMethod ? (
        <FieldGroup title={plainTextFromRich(activeMethod.tab_label) || "Method"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tab label">
              <RichTextField
                value={activeMethod.tab_label}
                onValueChange={(html) =>
                  updateMethod(activeMethod.id, { tab_label: html })
                }
                minHeightClassName="min-h-12"
              />
            </Field>
            <Field label="Method heading">
              <RichTextField
                value={activeMethod.heading}
                onValueChange={(html) =>
                  updateMethod(activeMethod.id, { heading: html })
                }
                minHeightClassName="min-h-12"
              />
            </Field>
          </div>
          <Field label="Introduction">
            <RichTextField
              value={activeMethod.intro}
              onValueChange={(html) =>
                updateMethod(activeMethod.id, { intro: html })
              }
              minHeightClassName="min-h-24"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activeMethod.visible}
              onChange={(e) =>
                updateMethod(activeMethod.id, { visible: e.target.checked })
              }
              className="size-4 rounded border-brand-primary/30"
            />
            Method visible
          </label>
          <Field label="PDF link label">
            <RichTextField
              value={activeMethod.pdf_link_label ?? ""}
              onValueChange={(html) =>
                updateMethod(activeMethod.id, {
                  pdf_link_label: html,
                })
              }
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Downloadable PDF">
            <PdfUploadField
              docKey={activeMethod.pdf_document_key}
              title={
                activeMethod.id === "retrofit"
                  ? "KodaVent Retrofit Guide"
                  : "KodaVent New Construction Guide"
              }
              currentPath={
                documents.find((d) => d.key === activeMethod.pdf_document_key)
                  ?.storage_path ?? ""
              }
            />
          </Field>

          <div className="mt-4 flex flex-col gap-4">
            <p className="text-sm font-medium text-brand-primary">Steps</p>
            {activeMethod.steps.map((step, index) => {
              const stepMedia = step.image_media_id
                ? media[step.image_media_id]
                : null;
              return (
                <div
                  key={step.id}
                  className="rounded-md border border-brand-primary/10 bg-bg-secondary/40 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-brand-primary">
                      Step {step.number || index + 1}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(activeMethod.id, index, -1)}
                      >
                        Up
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(activeMethod.id, index, 1)}
                      >
                        Down
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeStep(activeMethod.id, index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Number">
                      <TextInput
                        value={step.number}
                        onChange={(e) =>
                          updateStep(activeMethod.id, index, {
                            number: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <label className="flex items-end gap-2 pb-2 text-sm">
                      <input
                        type="checkbox"
                        checked={step.visible}
                        onChange={(e) =>
                          updateStep(activeMethod.id, index, {
                            visible: e.target.checked,
                          })
                        }
                        className="size-4 rounded border-brand-primary/30"
                      />
                      Visible
                    </label>
                    <Field label="Title">
                      <RichTextField
                        value={step.title}
                        onValueChange={(html) =>
                          updateStep(activeMethod.id, index, {
                            title: html,
                          })
                        }
                        minHeightClassName="min-h-12"
                      />
                    </Field>
                    <Field label="Illustration alt text">
                      <TextInput
                        value={step.image_alt}
                        onChange={(e) =>
                          updateStep(activeMethod.id, index, {
                            image_alt: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Description">
                        <RichTextField
                          value={step.description}
                          onValueChange={(html) =>
                            updateStep(activeMethod.id, index, {
                              description: html,
                            })
                          }
                          minHeightClassName="min-h-24"
                        />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <MediaField
                        name={`step_image_${step.id}`}
                        label="Step illustration"
                        initialId={step.image_media_id}
                        initialPath={stepMedia?.path}
                        initialBucket={stepMedia?.bucket ?? "media"}
                        aspect="square"
                        onIdChange={(id) =>
                          updateStep(activeMethod.id, index, {
                            image_media_id: id,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addStep(activeMethod.id)}
              >
                Add step
              </Button>
            </div>
          </div>
        </FieldGroup>
      ) : null}

      <div className="pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

export function KodaVentCtaEditor({ cta }: { cta: PageKodaVent["cta"] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [retailers, setRetailers] = useState<KodaVentRetailerLink[]>(
    cta.retailers ?? [],
  );

  return (
    <form
      action={(fd) => {
        fd.set("retailers_json", JSON.stringify(retailers));
        startTransition(async () => {
          await saveKodaVentCta(fd);
          router.refresh();
        });
      }}
      className="flex w-full flex-col gap-5"
    >
      <VisibilityToggle defaultChecked={cta.visible !== false} />
      <FieldGroup title="Order Now">
        <Field label="Eyebrow">
          <RichTextField
            name="eyebrow"
            defaultValue={cta.eyebrow}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Heading">
          <RichTextField
            name="heading"
            defaultValue={cta.heading}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Description">
          <RichTextField
            name="description"
            defaultValue={cta.description}
            minHeightClassName="min-h-24"
          />
        </Field>
        <Field label="Installation guides link label">
          <RichTextField
            name="guides_link_label"
            defaultValue={cta.guides_link_label}
            minHeightClassName="min-h-12"
          />
          <LockedHint>Link target is fixed to #installation.</LockedHint>
        </Field>
        <Field label="Retailer “coming soon” label">
          <RichTextField
            name="coming_soon_label"
            defaultValue={cta.coming_soon_label}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Fallback CTA label">
          <RichTextField
            name="cta_label"
            defaultValue={cta.cta_label}
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Fallback CTA destination">
          <TextInput name="cta_href" defaultValue={cta.cta_href} />
          <LockedHint>
            Used only when no retailer links are set. Prefer retailer rows below
            for Amazon and other stores.
          </LockedHint>
        </Field>
      </FieldGroup>

      <FieldGroup title="Retailer links">
        <div className="flex flex-col gap-4">
          {retailers.map((retailer, index) => (
            <div
              key={retailer.id}
              className="rounded-md border border-brand-primary/10 bg-bg-secondary/40 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-brand-primary">
                  Retailer {index + 1}
                </p>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    setRetailers((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Label">
                  <RichTextField
                    value={retailer.label}
                    onValueChange={(html) =>
                      setRetailers((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, label: html } : r,
                        ),
                      )
                    }
                    minHeightClassName="min-h-12"
                  />
                </Field>
                <Field label="URL (blank = Coming soon)">
                  <TextInput
                    value={retailer.href}
                    onChange={(e) =>
                      setRetailers((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, href: e.target.value } : r,
                        ),
                      )
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setRetailers((prev) => [
                ...prev,
                {
                  id: `retailer-${prev.length + 1}`,
                  label: "Retailer",
                  href: "",
                  visible: true,
                },
              ])
            }
          >
            Add retailer
          </Button>
        </div>
      </FieldGroup>
      <div className="pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

export function KodaVentSeoEditor({
  seo,
  media,
}: {
  seo: PageKodaVent["seo"];
  media: Record<string, MediaAsset>;
}) {
  return <PageSeoEditor seo={seo} media={media} onSave={saveKodaVentSeo} />;
}
