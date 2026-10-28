"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveHomeWhyKoda,
  saveHomeWhyKodaFeatureImage,
} from "@/lib/cms/actions";
import type { HomeWhyKoda, WhyFeature } from "@/lib/cms/types";
import { MediaField } from "@/components/admin/media-field";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextArea, TextInput } from "@/components/ui/field";

const DEFAULT_SLOT_COUNT = 8;
const MAX_SLOT_COUNT = 24;

type FeatureDraft = {
  key: string;
  number: string;
  title: string;
  body: string;
  image_media_id: string | null;
  imagePath: string | null;
};

function padFeatures(
  features: WhyFeature[],
  media: Record<string, { path: string } | undefined>,
  minCount: number,
): FeatureDraft[] {
  const count = Math.max(minCount, features.length);
  return Array.from({ length: count }, (_, i) => {
    const feature = features[i];
    const imageId = feature?.image_media_id ?? null;
    return {
      key: `card-${i}`,
      number: feature?.number ?? "",
      title: feature?.title ?? "",
      body: feature?.body ?? "",
      image_media_id: imageId,
      imagePath: imageId ? (media[imageId]?.path ?? null) : null,
    };
  });
}

export function WhyKodaEditor({
  why,
  media,
}: {
  why: HomeWhyKoda;
  media: Record<string, { path: string } | undefined>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [imagePending, setImagePending] = useState<number | null>(null);
  const [features, setFeatures] = useState<FeatureDraft[]>(() =>
    padFeatures(why.features ?? [], media, DEFAULT_SLOT_COUNT),
  );
  const imageIdsRef = useRef<(string | null)[]>(
    features.map((f) => f.image_media_id),
  );
  const serverSignature = JSON.stringify(why.features ?? []);

  useEffect(() => {
    const next = padFeatures(why.features ?? [], media, DEFAULT_SLOT_COUNT);
    setFeatures(next);
    imageIdsRef.current = next.map((f) => f.image_media_id);
    // Re-sync after admin save / server refresh only.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- media paths follow feature ids
  }, [serverSignature]);

  function addCard() {
    setFeatures((prev) => {
      if (prev.length >= MAX_SLOT_COUNT) return prev;
      imageIdsRef.current = [...imageIdsRef.current, null];
      return [
        ...prev,
        {
          key: `card-new-${Date.now()}`,
          number: "",
          title: "",
          body: "",
          image_media_id: null,
          imagePath: null,
        },
      ];
    });
  }

  function removeCard(index: number) {
    if (index < DEFAULT_SLOT_COUNT) return;
    setFeatures((prev) => prev.filter((_, i) => i !== index));
    imageIdsRef.current = imageIdsRef.current.filter((_, i) => i !== index);
  }

  function setCardImage(index: number, id: string | null) {
    if (imageIdsRef.current[index] === id) return;
    imageIdsRef.current[index] = id;
    setFeatures((prev) =>
      prev.map((feature, i) =>
        i === index
          ? {
              ...feature,
              image_media_id: id,
              imagePath: id ? (media[id]?.path ?? feature.imagePath) : null,
            }
          : feature,
      ),
    );
    setImagePending(index);
    startTransition(async () => {
      try {
        await saveHomeWhyKodaFeatureImage(index, id);
        router.refresh();
      } finally {
        setImagePending((current) => (current === index ? null : current));
      }
    });
  }

  function onSaveText(formData: FormData) {
    formData.set("feature_count", String(features.length));
    startTransition(async () => {
      await saveHomeWhyKoda(formData);
      router.refresh();
    });
  }

  return (
    <form action={onSaveText} className="flex w-full flex-col gap-5">
      <input type="hidden" name="feature_count" value={features.length} />

      <FieldGroup title="Copy">
        <Field label="Headline">
          <TextInput name="why_headline" defaultValue={why.headline} />
        </Field>
        <Field label="Body (optional)">
          <TextArea name="why_body" rows={2} defaultValue={why.body} />
        </Field>
      </FieldGroup>

      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-brand-primary">
              Cards
            </h3>
            <p className="mt-1 text-sm text-text-primary/45">
              Images save as soon as you upload. Use Save only for text changes.
              Empty cards stay hidden on the site.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addCard}
            disabled={features.length >= MAX_SLOT_COUNT || pending}
          >
            Add card
          </Button>
        </div>

        <div className="flex w-full flex-col gap-4">
          {features.map((feature, i) => (
            <div
              key={feature.key}
              className="grid w-full gap-4 rounded-lg border border-brand-primary/8 bg-bg-secondary/50 p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
            >
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-text-primary">
                    Card {String(i + 1).padStart(2, "0")}
                    {imagePending === i ? (
                      <span className="ml-2 text-xs font-normal text-text-primary/45">
                        Saving image…
                      </span>
                    ) : null}
                  </p>
                  {i >= DEFAULT_SLOT_COUNT ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeCard(i)}
                      disabled={pending}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                <input
                  type="hidden"
                  name={`feature_${i}_number`}
                  value={feature.number || String(i + 1).padStart(2, "0")}
                  readOnly
                />
                <Field label="Title">
                  <TextInput
                    name={`feature_${i}_title`}
                    defaultValue={feature.title}
                    placeholder="Title"
                  />
                </Field>
                <Field label="Body">
                  <TextArea
                    name={`feature_${i}_body`}
                    rows={3}
                    defaultValue={feature.body}
                    placeholder="Short description"
                  />
                </Field>
              </div>
              <MediaField
                name={`feature_${i}_image_media_id`}
                label="Card image"
                compact
                initialId={feature.image_media_id}
                initialPath={feature.imagePath}
                onIdChange={(id) => setCardImage(i, id)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-1">
        <Button type="submit" disabled={pending}>
          {pending && imagePending === null ? "Saving…" : "Save text"}
        </Button>
      </div>
    </form>
  );
}
