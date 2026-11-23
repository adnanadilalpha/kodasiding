"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MediaField } from "@/components/admin/media-field";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextArea, TextInput } from "@/components/ui/field";
import type { MediaAsset, PageSeo } from "@/lib/cms/types";

export function PageSeoEditor({
  seo,
  media,
  onSave,
  hint,
}: {
  seo: PageSeo;
  media: Record<string, MediaAsset>;
  onSave: (formData: FormData) => Promise<void>;
  hint?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const image = seo.og_image_media_id ? media[seo.og_image_media_id] : null;

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          await onSave(fd);
          router.refresh();
        });
      }}
      className="flex w-full flex-col gap-5"
    >
      <FieldGroup title="SEO & social">
        {hint ? (
          <p className="text-sm text-text-primary/50">{hint}</p>
        ) : null}
        <Field label="SEO title">
          <TextInput name="title" defaultValue={seo.title} />
        </Field>
        <Field label="Meta description">
          <TextArea
            name="description"
            rows={3}
            defaultValue={seo.description}
          />
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
