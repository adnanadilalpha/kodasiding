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
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextArea, TextInput } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";

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
      <div className="grid gap-5 lg:grid-cols-2">
        <FieldGroup title="Copy">
          <Field label="Eyebrow">
            <TextInput name="eyebrow" defaultValue={hero.eyebrow} />
          </Field>
          <Field label="Main heading">
            <TextInput name="heading" defaultValue={hero.heading} />
          </Field>
          <Field label="Supporting headline">
            <TextInput
              name="supporting_headline"
              defaultValue={hero.supporting_headline}
            />
          </Field>
          <Field label="Description">
            <TextArea
              name="description"
              rows={4}
              defaultValue={hero.description}
            />
          </Field>
        </FieldGroup>
        <FieldGroup title="Image & CTAs">
          <MediaField
            name="image_media_id"
            label="Hero image"
            initialId={hero.image_media_id}
            initialPath={image?.path}
            initialBucket={image?.bucket ?? "media"}
            aspect="square"
          />
          <Field label="Image alt text">
            <TextInput name="image_alt" defaultValue={hero.image_alt} />
          </Field>
          <Field label="Primary CTA label">
            <TextInput
              name="primary_cta_label"
              defaultValue={hero.primary_cta_label}
            />
          </Field>
          <Field label="Primary CTA destination">
            <TextInput
              name="primary_cta_href"
              defaultValue={hero.primary_cta_href}
            />
          </Field>
          <Field label="Secondary CTA label">
            <TextInput
              name="secondary_cta_label"
              defaultValue={hero.secondary_cta_label}
            />
          </Field>
          <Field label="Secondary CTA destination">
            <TextInput
              name="secondary_cta_href"
              defaultValue={hero.secondary_cta_href}
            />
          </Field>
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
        <Field label="Heading">
          <TextInput name="heading" defaultValue={section.heading} />
        </Field>
        <Field label="Description">
          <TextArea
            name="description"
            rows={3}
            defaultValue={section.description}
          />
        </Field>
        <MediaField
          name="image_media_id"
          label="Packaging / box image"
          initialId={section.image_media_id}
          initialPath={image?.path}
          initialBucket={image?.bucket ?? "media"}
          aspect="square"
        />
        <Field label="Image alt text">
          <TextInput name="image_alt" defaultValue={section.image_alt} />
        </Field>
        <LockedHint>
          Public page currently uses the packaged box + exploded product assets.
          Keep this copy simple — no annotation pins on the live page.
        </LockedHint>
      </FieldGroup>

      <FieldGroup title="Annotations (optional / unused on public page)">
        <div className="flex flex-col gap-4">
          {annotations.map((annotation, index) => (
            <div
              key={annotation.id}
              className="rounded-md border border-brand-primary/10 bg-bg-secondary/40 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-brand-primary">
                  Annotation {index + 1}
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
                  <TextInput
                    value={annotation.title}
                    onChange={(e) =>
                      setAnnotations((prev) =>
                        prev.map((a, i) =>
                          i === index ? { ...a, title: e.target.value } : a,
                        ),
                      )
                    }
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
                  <TextArea
                    rows={2}
                    value={annotation.description}
                    onChange={(e) =>
                      setAnnotations((prev) =>
                        prev.map((a, i) =>
                          i === index
                            ? { ...a, description: e.target.value }
                            : a,
                        ),
                      )
                    }
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
  const missingImage = !section.image_media_id;

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
      {missingImage ? (
        <p className="rounded-md bg-accent-warm/30 px-3 py-2 text-sm text-text-primary">
          Upload an installation photograph before publishing this section. The
          public page stays hidden until an image is present.
        </p>
      ) : null}
      <VisibilityToggle
        defaultChecked={section.visible === true}
        label="Show section (requires image)"
      />
      <FieldGroup title="Installed appearance">
        <Field label="Heading">
          <TextInput name="heading" defaultValue={section.heading} />
        </Field>
        <Field label="Description">
          <TextArea
            name="description"
            rows={3}
            defaultValue={section.description}
          />
        </Field>
        <MediaField
          name="image_media_id"
          label="Installation photograph"
          initialId={section.image_media_id}
          initialPath={image?.path}
          initialBucket={image?.bucket ?? "media"}
          aspect="wide"
        />
        <Field label="Image alt text">
          <TextInput name="image_alt" defaultValue={section.image_alt} />
        </Field>
        <Field label="Caption (optional)">
          <TextInput name="caption" defaultValue={section.caption} />
        </Field>
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
        <Field label="Heading">
          <TextInput name="heading" defaultValue={section.heading} />
        </Field>
        <Field label="Description">
          <TextArea
            name="description"
            rows={2}
            defaultValue={section.description}
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
            {method.tab_label || method.id}
          </button>
        ))}
      </div>

      {activeMethod ? (
        <FieldGroup title={activeMethod.tab_label || "Method"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tab label">
              <TextInput
                value={activeMethod.tab_label}
                onChange={(e) =>
                  updateMethod(activeMethod.id, { tab_label: e.target.value })
                }
              />
            </Field>
            <Field label="Method heading">
              <TextInput
                value={activeMethod.heading}
                onChange={(e) =>
                  updateMethod(activeMethod.id, { heading: e.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Introduction">
            <TextArea
              rows={3}
              value={activeMethod.intro}
              onChange={(e) =>
                updateMethod(activeMethod.id, { intro: e.target.value })
              }
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
                      <TextInput
                        value={step.title}
                        onChange={(e) =>
                          updateStep(activeMethod.id, index, {
                            title: e.target.value,
                          })
                        }
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
                        <TextArea
                          rows={3}
                          value={step.description}
                          onChange={(e) =>
                            updateStep(activeMethod.id, index, {
                              description: e.target.value,
                            })
                          }
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
        <Field label="Heading">
          <TextInput name="heading" defaultValue={cta.heading} />
        </Field>
        <Field label="Description">
          <TextArea name="description" rows={3} defaultValue={cta.description} />
        </Field>
        <Field label="Fallback CTA label">
          <TextInput name="cta_label" defaultValue={cta.cta_label} />
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
                  <TextInput
                    value={retailer.label}
                    onChange={(e) =>
                      setRetailers((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, label: e.target.value } : r,
                        ),
                      )
                    }
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const image = seo.og_image_media_id ? media[seo.og_image_media_id] : null;

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          await saveKodaVentSeo(fd);
          router.refresh();
        });
      }}
      className="flex w-full flex-col gap-5"
    >
      <FieldGroup title="SEO & social">
        <Field label="SEO title">
          <TextInput name="title" defaultValue={seo.title} />
        </Field>
        <Field label="Meta description">
          <TextArea name="description" rows={3} defaultValue={seo.description} />
        </Field>
        <Field label="Open Graph title">
          <TextInput name="og_title" defaultValue={seo.og_title} />
        </Field>
        <Field label="Open Graph description">
          <TextArea
            name="og_description"
            rows={3}
            defaultValue={seo.og_description}
          />
        </Field>
        <MediaField
          name="og_image_media_id"
          label="Open Graph image"
          initialId={seo.og_image_media_id}
          initialPath={image?.path}
          initialBucket={image?.bucket ?? "media"}
          aspect="wide"
        />
        <Field label="Canonical path">
          <TextInput name="canonical_path" defaultValue={seo.canonical_path} />
        </Field>
      </FieldGroup>
      <div className="pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
