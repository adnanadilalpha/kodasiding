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
import type { HomeVideosSection } from "@/lib/cms/types";
import { plainTextFromRich } from "@/lib/cms/sanitize-rich-text";
import { RichTextField } from "@/components/admin/rich-text-field";

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
  diyLinkLabel,
  eyebrowPrefix,
  heroImageAlt,
}: {
  headline: string;
  body: string;
  heroServiceLabel: string;
  heroImageId: string | null;
  heroImagePath: string | null;
  diyLinkLabel?: string;
  eyebrowPrefix?: string;
  heroImageAlt?: string;
}) {
  const { pending, onSave } = useInstallSave();

  function onSaveHero(formData: FormData) {
    formData.set("install_section", "hero");
    // DIY link lives on the home local-install section (secondary CTA).
    formData.set(
      "diy_link_label",
      String(formData.get("diy_link_label") ?? diyLinkLabel ?? ""),
    );
    onSave(formData);
  }

  return (
    <form action={onSaveHero} className="flex w-full flex-col gap-5">
      <div className="flex w-full flex-col gap-5">
        <div className="flex min-w-0 flex-col gap-5">
          <FieldGroup title="Copy">
            <Field label="Eyebrow prefix">
              <RichTextField
                name="eyebrow_prefix"
                defaultValue={
                  eyebrowPrefix || DEFAULT_INSTALLATION_PAGE.eyebrow_prefix || ""
                }
                placeholder="Local install"
                minHeightClassName="min-h-12"
              />
            </Field>
            <Field label="Eyebrow">
              <RichTextField
                name="hero_service_label"
                defaultValue={
                  heroServiceLabel ||
                  DEFAULT_INSTALLATION_PAGE.hero_service_label ||
                  ""
                }
                placeholder="Omaha & surrounding areas"
                minHeightClassName="min-h-12"
              />
            </Field>
            <Field label="Headline">
              <RichTextField
                name="videos_headline"
                defaultValue={headline || DEFAULT_INSTALLATION_PAGE.headline}
                placeholder="Siding Installation in Omaha and Surrounding Areas"
                minHeightClassName="min-h-12"
              />
            </Field>
            <Field label="Body (blank line = new paragraph)">
              <RichTextField
                name="videos_body"
                defaultValue={body || DEFAULT_INSTALLATION_PAGE.body}
                placeholder="Koda Siding installs its own fiberglass siding…"
                minHeightClassName="min-h-28"
              />
            </Field>
            <Field label="DIY link label">
              <RichTextField
                name="diy_link_label"
                defaultValue={
                  diyLinkLabel || DEFAULT_HOME_INSTALL_SERVICES.diy_cta_label
                }
                placeholder="Install it yourself"
                minHeightClassName="min-h-12"
              />
            </Field>
          </FieldGroup>
        </div>
        <FieldGroup title="Media" className="min-w-0">
          <Field label="Hero image alt text">
            <TextInput
              name="hero_image_alt"
              defaultValue={
                heroImageAlt || DEFAULT_INSTALLATION_PAGE.hero_image_alt || ""
              }
              placeholder="Koda Siding crew installing fiberglass siding"
            />
          </Field>
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
  coverageHeading,
  townSearchPlaceholder,
  servicesCtaLabel,
}: {
  installRadiusMiles: number;
  citiesIntro: string;
  cities: string;
  coverageHeading?: string;
  townSearchPlaceholder?: string;
  servicesCtaLabel?: string;
}) {
  const { pending, onSave } = useInstallSave();

  return (
    <form action={onSave} className="flex w-full flex-col gap-5">
      <input type="hidden" name="install_section" value="coverage" />
      <FieldGroup title="Coverage map">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Coverage heading">
            <RichTextField
              name="coverage_heading"
              defaultValue={
                coverageHeading || DEFAULT_INSTALLATION_PAGE.coverage_heading || ""
              }
              placeholder="Do we install near you?"
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Town search placeholder">
            <RichTextField
              name="town_search_placeholder"
              defaultValue={
                townSearchPlaceholder ||
                DEFAULT_INSTALLATION_PAGE.town_search_placeholder ||
                ""
              }
              placeholder="Type a town, or tap a pin…"
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Quote button label">
            <RichTextField
              name="services_cta_label"
              defaultValue={
                servicesCtaLabel ||
                DEFAULT_INSTALLATION_PAGE.services_cta_label ||
                ""
              }
              placeholder="Request install quote"
              minHeightClassName="min-h-12"
            />
          </Field>
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
              <RichTextField
                name="cities_intro"
                defaultValue={
                  citiesIntro || DEFAULT_INSTALLATION_PAGE.cities_intro || ""
                }
                placeholder="Green circle = where Koda crews install…"
                minHeightClassName="min-h-24"
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

export function InstallDiyEditor({
  section,
}: {
  section?: Partial<HomeVideosSection> | null;
}) {
  const { pending, onSave } = useInstallSave();
  const d = DEFAULT_INSTALLATION_PAGE;
  const s = section ?? {};

  return (
    <form action={onSave} className="flex w-full flex-col gap-5">
      <input type="hidden" name="install_section" value="diy" />
      <FieldGroup title="Page header">
        <Field label="Eyebrow">
          <RichTextField
            name="diy_eyebrow"
            defaultValue={s.diy_eyebrow || d.diy_eyebrow || ""}
            placeholder="DIY guide"
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Headline">
          <RichTextField
            name="diy_headline"
            defaultValue={s.diy_headline || d.diy_headline || ""}
            placeholder="Install it yourself"
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Body">
          <RichTextField
            name="diy_body"
            defaultValue={s.diy_body || d.diy_body || ""}
            minHeightClassName="min-h-24"
          />
        </Field>
      </FieldGroup>
      <FieldGroup title="Videos section">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Eyebrow">
            <RichTextField
              name="videos_eyebrow"
              defaultValue={s.videos_eyebrow || d.videos_eyebrow || ""}
              placeholder="Videos"
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Heading">
            <RichTextField
              name="videos_heading"
              defaultValue={s.videos_heading || d.videos_heading || ""}
              placeholder="Watch the install"
              minHeightClassName="min-h-12"
            />
          </Field>
        </div>
      </FieldGroup>
      <FieldGroup title="Local crews footer">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Eyebrow">
            <RichTextField
              name="local_crews_eyebrow"
              defaultValue={
                s.local_crews_eyebrow || d.local_crews_eyebrow || ""
              }
              placeholder="Local crews"
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Heading">
            <RichTextField
              name="local_crews_heading"
              defaultValue={
                s.local_crews_heading || d.local_crews_heading || ""
              }
              placeholder="Prefer we install it?"
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Link label">
            <RichTextField
              name="local_crews_link_label"
              defaultValue={
                s.local_crews_link_label || d.local_crews_link_label || ""
              }
              placeholder="See local install"
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Quote button label">
            <RichTextField
              name="local_crews_cta_label"
              defaultValue={
                s.local_crews_cta_label || d.local_crews_cta_label || ""
              }
              placeholder="Request install quote"
              minHeightClassName="min-h-12"
            />
          </Field>
        </div>
        <p className="mt-2 truncate font-mono text-xs text-text-primary/40">
          Link target is fixed to /#installation.
        </p>
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
          <RichTextField
            name="manual_label"
            defaultValue={
              manualLabel || DEFAULT_INSTALLATION_PAGE.manual_label
            }
            placeholder="Download PDF manual"
            minHeightClassName="min-h-12"
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
                    plainTextFromRich(labelInput?.value ?? manualLabel),
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
            <RichTextField
              name="service_area"
              defaultValue={
                serviceArea || DEFAULT_HOME_INSTALL_SERVICES.service_area
              }
              placeholder="Nebraska"
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Headline">
            <RichTextField
              name="services_headline"
              defaultValue={
                servicesHeadline || DEFAULT_HOME_INSTALL_SERVICES.headline
              }
              placeholder="Installation in Nebraska"
              minHeightClassName="min-h-12"
            />
          </Field>
          <div className="lg:col-span-2">
            <Field label="Body">
              <RichTextField
                name="services_body"
                defaultValue={
                  servicesBody || DEFAULT_HOME_INSTALL_SERVICES.body
                }
                placeholder="Koda Siding ships nationwide…"
                minHeightClassName="min-h-24"
              />
            </Field>
          </div>
          <Field label="Quote CTA label">
            <RichTextField
              name="services_cta_label"
              defaultValue={
                servicesCtaLabel ||
                DEFAULT_HOME_INSTALL_SERVICES.primary_cta_label
              }
              placeholder="Request install quote"
              minHeightClassName="min-h-12"
            />
          </Field>
          <Field label="Installation link label">
            <RichTextField
              name="diy_link_label"
              defaultValue={
                diyLinkLabel || DEFAULT_HOME_INSTALL_SERVICES.diy_cta_label
              }
              placeholder="Install it yourself"
              minHeightClassName="min-h-12"
            />
          </Field>
        </div>
      </FieldGroup>
      <SaveButton pending={pending} />
    </form>
  );
}
