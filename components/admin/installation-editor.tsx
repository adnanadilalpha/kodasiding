"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveDocument, saveHomeVideosSection } from "@/lib/cms/actions";
import { createClient } from "@/lib/supabase/client";
import { MediaField } from "@/components/admin/media-field";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextArea, TextInput } from "@/components/ui/field";
import {
  DEFAULT_HOME_INSTALL_SERVICES,
  DEFAULT_INSTALLATION_PAGE,
} from "@/lib/cms/installation-defaults";
import { LANDING_FALLBACKS } from "@/lib/cms/landing-fallbacks";

const MANUAL_KEY = "installation_manual";

function SaveButton({
  pending,
  disabled,
}: {
  pending: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="pt-1">
      <Button type="submit" disabled={pending || disabled}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function useInstallSave() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSave(formData: FormData) {
    formData.set("manual_document_key", MANUAL_KEY);
    startTransition(async () => {
      await saveHomeVideosSection(formData);
      router.refresh();
    });
  }

  return { pending, onSave };
}

export function InstallHeroEditor({
  headline,
  body,
  heroServiceLabel,
  heroImageId,
  heroImagePath,
}: {
  headline: string;
  body: string;
  heroServiceLabel: string;
  heroImageId: string | null;
  heroImagePath: string | null;
}) {
  const { pending, onSave } = useInstallSave();

  return (
    <form action={onSave} className="flex w-full flex-col gap-5">
      <input type="hidden" name="install_section" value="hero" />
      <div className="grid w-full gap-5 lg:grid-cols-2 lg:items-stretch">
        <div className="flex min-w-0 flex-col gap-5">
          <FieldGroup title="Copy">
            <Field label="Eyebrow">
              <TextInput
                name="hero_service_label"
                defaultValue={
                  heroServiceLabel ||
                  DEFAULT_INSTALLATION_PAGE.hero_service_label ||
                  ""
                }
                placeholder="Omaha & surrounding areas"
              />
            </Field>
            <Field label="Headline">
              <TextInput
                name="videos_headline"
                defaultValue={headline || DEFAULT_INSTALLATION_PAGE.headline}
                placeholder="Siding Installation in Omaha and Surrounding Areas"
              />
            </Field>
            <Field label="Body (blank line = new paragraph)">
              <TextArea
                name="videos_body"
                rows={8}
                defaultValue={body || DEFAULT_INSTALLATION_PAGE.body}
                placeholder="Koda Siding installs its own fiberglass siding…"
              />
            </Field>
          </FieldGroup>
        </div>
        <FieldGroup title="Media" className="min-w-0 self-stretch">
          <MediaField
            name="hero_image_media_id"
            label="Hero / crew photo"
            compact
            initialId={heroImageId}
            initialPath={heroImagePath}
            fallbackSrc={LANDING_FALLBACKS.installCrew}
          />
        </FieldGroup>
      </div>
      <SaveButton pending={pending} />
    </form>
  );
}

export function InstallCoverageEditor({
  installRadiusMiles,
  citiesIntro,
  cities,
}: {
  installRadiusMiles: number;
  citiesIntro: string;
  cities: string;
}) {
  const { pending, onSave } = useInstallSave();

  return (
    <form action={onSave} className="flex w-full flex-col gap-5">
      <input type="hidden" name="install_section" value="coverage" />
      <FieldGroup title="Coverage map">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Radius (miles)">
            <TextInput
              name="install_radius_miles"
              type="number"
              min={5}
              max={200}
              defaultValue={String(
                installRadiusMiles ||
                  DEFAULT_INSTALLATION_PAGE.install_radius_miles ||
                  60,
              )}
              placeholder="60"
            />
          </Field>
          <div className="lg:col-span-2">
            <Field label="Helper text">
              <TextArea
                name="cities_intro"
                rows={2}
                defaultValue={
                  citiesIntro || DEFAULT_INSTALLATION_PAGE.cities_intro || ""
                }
                placeholder="Green circle = where Koda crews install…"
              />
            </Field>
          </div>
          <div className="lg:col-span-2">
            <Field label="Towns (separate with · )">
              <TextArea
                name="cities"
                rows={3}
                defaultValue={cities || DEFAULT_INSTALLATION_PAGE.cities || ""}
                placeholder="Omaha · Elkhorn · Millard · Bellevue…"
              />
            </Field>
            <p className="mt-1.5 text-xs text-text-primary/45">
              Known metro towns get map pins automatically. Other names still
              work in the town search.
            </p>
          </div>
        </div>
      </FieldGroup>
      <SaveButton pending={pending} />
    </form>
  );
}

export function InstallManualEditor({
  manualLabel,
  manualPath,
}: {
  manualLabel: string;
  manualPath: string;
}) {
  const router = useRouter();
  const { pending, onSave } = useInstallSave();
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onPdfChange(file: File | null, label: string) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadStatus("Only PDF files are allowed.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setUploadStatus("PDF must be under 12MB.");
      return;
    }

    setUploading(true);
    setUploadStatus("Uploading…");
    try {
      const supabase = createClient();
      const path = `${MANUAL_KEY}-${Date.now()}.pdf`;
      const { error } = await supabase.storage
        .from("documents")
        .upload(path, file, {
          contentType: "application/pdf",
          cacheControl: "31536000",
          upsert: false,
        });
      if (error) throw error;

      const fd = new FormData();
      fd.set("key", MANUAL_KEY);
      fd.set("title", label || "Installation Manual");
      fd.set("storage_path", path);
      fd.set("bucket", "documents");
      await saveDocument(fd);
      setUploadStatus("PDF ready");
      router.refresh();
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={onSave} className="flex w-full flex-col gap-5">
      <input type="hidden" name="install_section" value="manual" />
      <FieldGroup title="PDF manual">
        <Field label="Button label">
          <TextInput
            name="manual_label"
            defaultValue={
              manualLabel || DEFAULT_INSTALLATION_PAGE.manual_label
            }
            placeholder="Download PDF manual"
          />
        </Field>
        <div className="flex flex-col gap-2">
          <p className="text-base leading-none text-text-secondary">PDF file</p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer">
              <span className="inline-flex items-center justify-center rounded-md border border-brand-primary/12 bg-bg-primary px-4 py-2.5 text-sm text-brand-primary transition hover:bg-bg-secondary">
                {uploading
                  ? "Uploading…"
                  : manualPath
                    ? "Replace PDF"
                    : "Upload PDF"}
              </span>
              <input
                type="file"
                accept="application/pdf"
                disabled={uploading || pending}
                className="hidden"
                onChange={(e) => {
                  const labelInput = e.currentTarget
                    .closest("form")
                    ?.querySelector<HTMLInputElement>(
                      'input[name="manual_label"]',
                    );
                  void onPdfChange(
                    e.target.files?.[0] ?? null,
                    labelInput?.value ?? manualLabel,
                  );
                }}
              />
            </label>
            <p className="text-sm text-text-primary/45">
              {manualPath
                ? "PDF uploaded · max 12MB"
                : "Site ships a fallback PDF · upload to override · max 12MB"}
            </p>
          </div>
          {uploadStatus ? (
            <p className="text-sm text-text-primary/45">{uploadStatus}</p>
          ) : null}
        </div>
      </FieldGroup>
      <SaveButton pending={pending} disabled={uploading} />
    </form>
  );
}

export function InstallHomeTeaserEditor({
  servicesHeadline,
  servicesBody,
  serviceArea,
  servicesCtaLabel,
  diyLinkLabel,
}: {
  servicesHeadline: string;
  servicesBody: string;
  serviceArea: string;
  servicesCtaLabel: string;
  diyLinkLabel: string;
}) {
  const { pending, onSave } = useInstallSave();

  return (
    <form action={onSave} className="flex w-full flex-col gap-5">
      <input type="hidden" name="install_section" value="home-teaser" />
      <FieldGroup title="Copy">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Service area chip">
            <TextInput
              name="service_area"
              defaultValue={
                serviceArea || DEFAULT_HOME_INSTALL_SERVICES.service_area
              }
              placeholder="Nebraska"
            />
          </Field>
          <Field label="Headline">
            <TextInput
              name="services_headline"
              defaultValue={
                servicesHeadline || DEFAULT_HOME_INSTALL_SERVICES.headline
              }
              placeholder="Installation in Nebraska"
            />
          </Field>
          <div className="lg:col-span-2">
            <Field label="Body">
              <TextArea
                name="services_body"
                rows={3}
                defaultValue={
                  servicesBody || DEFAULT_HOME_INSTALL_SERVICES.body
                }
                placeholder="Koda Siding ships nationwide…"
              />
            </Field>
          </div>
          <Field label="Quote CTA label">
            <TextInput
              name="services_cta_label"
              defaultValue={
                servicesCtaLabel ||
                DEFAULT_HOME_INSTALL_SERVICES.primary_cta_label
              }
              placeholder="Request install quote"
            />
          </Field>
          <Field label="Installation link label">
            <TextInput
              name="diy_link_label"
              defaultValue={
                diyLinkLabel || DEFAULT_HOME_INSTALL_SERVICES.diy_cta_label
              }
              placeholder="Installation"
            />
          </Field>
        </div>
      </FieldGroup>
      <SaveButton pending={pending} />
    </form>
  );
}
