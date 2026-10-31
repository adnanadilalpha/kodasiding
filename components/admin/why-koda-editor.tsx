"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveHomeWhyKoda,
  saveHomeWhyKodaFeatureImage,
  saveHomeWhyKodaFeatureLayout,
} from "@/lib/cms/actions";
import type {
  HomeWhyKoda,
  WhyFeature,
  WhyFeatureLayout,
} from "@/lib/cms/types";
import { MediaField } from "@/components/admin/media-field";
import { RichTextField } from "@/components/admin/rich-text-field";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, Select } from "@/components/ui/field";

const DEFAULT_SLOT_COUNT = 8;
const MAX_SLOT_COUNT = 24;

const LAYOUT_OPTIONS: { value: WhyFeatureLayout; label: string }[] = [
  { value: "image-right", label: "Image right (text left)" },
  { value: "image-left", label: "Image left (text right)" },
  { value: "image-top", label: "Full width — image top, text below" },
  { value: "image-bottom", label: "Full width — text top, image below" },
];

type FeatureDraft = {
  key: string;
  number: string;
  title: string;
  body: string;
  image_media_id: string | null;
  imagePath: string | null;
  layout: WhyFeatureLayout;
};

function defaultLayout(index: number): WhyFeatureLayout {
  return index % 2 === 1 ? "image-left" : "image-right";
}

function resolveLayout(
  layout: WhyFeature["layout"],
  index: number,
): WhyFeatureLayout {
  if (
    layout === "image-right" ||
    layout === "image-left" ||
    layout === "image-top" ||
    layout === "image-bottom"
  ) {
    return layout;
  }
  return defaultLayout(index);
}

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
      layout: resolveLayout(feature?.layout, i),
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
  const layoutsRef = useRef<WhyFeatureLayout[]>(
    features.map((f) => f.layout),
  );
  const serverSignature = JSON.stringify(why.features ?? []);

  useEffect(() => {
    const next = padFeatures(why.features ?? [], media, DEFAULT_SLOT_COUNT);
    setFeatures((prev) => {
      const merged = next.map((serverFeature, i) => ({
        ...serverFeature,
        // Never let an image refresh wipe the user's layout picks.
        layout:
          layoutsRef.current[i] ??
          prev[i]?.layout ??
          serverFeature.layout,
      }));
      layoutsRef.current = merged.map((f) => f.layout);
      return merged;
    });
    imageIdsRef.current = next.map((f) => f.image_media_id);
    // Re-sync after admin save / server refresh only.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- media paths follow feature ids
  }, [serverSignature]);

  function addCard() {
    setFeatures((prev) => {
      if (prev.length >= MAX_SLOT_COUNT) return prev;
      const index = prev.length;
      const layout = defaultLayout(index);
      imageIdsRef.current = [...imageIdsRef.current, null];
      layoutsRef.current = [...layoutsRef.current, layout];
      return [
        ...prev,
        {
          key: `card-new-${Date.now()}`,
          number: "",
          title: "",
          body: "",
          image_media_id: null,
          imagePath: null,
          layout,
        },
      ];
    });
  }

  function removeCard(index: number) {
    if (index < DEFAULT_SLOT_COUNT) return;
    setFeatures((prev) => prev.filter((_, i) => i !== index));
    imageIdsRef.current = imageIdsRef.current.filter((_, i) => i !== index);
    layoutsRef.current = layoutsRef.current.filter((_, i) => i !== index);
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
    const layoutsSnapshot = [...layoutsRef.current];
    setImagePending(index);
    startTransition(async () => {
      try {
        await saveHomeWhyKodaFeatureImage(index, id, layoutsSnapshot);
        router.refresh();
      } finally {
        setImagePending((current) => (current === index ? null : current));
      }
    });
  }

  function setCardLayout(index: number, layout: WhyFeatureLayout) {
    layoutsRef.current[index] = layout;
    setFeatures((prev) =>
      prev.map((feature, i) => (i === index ? { ...feature, layout } : feature)),
    );
    startTransition(async () => {
      await saveHomeWhyKodaFeatureLayout(index, layout);
      router.refresh();
    });
  }

  function onSaveText(formData: FormData) {
    formData.set("feature_count", String(features.length));
    // Ensure submitted layout fields match the live ref (controlled selects).
    layoutsRef.current.forEach((layout, i) => {
      formData.set(`feature_${i}_layout`, layout);
    });
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
          <RichTextField
            name="why_headline"
            defaultValue={why.headline}
            placeholder="Section headline"
            minHeightClassName="min-h-12"
          />
        </Field>
        <Field label="Body (optional)">
          <RichTextField
            name="why_body"
            defaultValue={why.body}
            placeholder="Optional supporting copy"
            minHeightClassName="min-h-20"
          />
        </Field>
      </FieldGroup>

      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-brand-primary">
              Cards
            </h3>
            <p className="mt-1 text-sm text-text-primary/45">
              Images and layout save immediately. Use Save text only for copy
              changes. Empty cards stay hidden on the site.
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
                  <RichTextField
                    name={`feature_${i}_title`}
                    defaultValue={feature.title}
                    placeholder="Title — select text to bold, italic, or underline"
                    minHeightClassName="min-h-12"
                  />
                </Field>
                <Field label="Body">
                  <RichTextField
                    name={`feature_${i}_body`}
                    defaultValue={feature.body}
                    placeholder="Short description — select text to bold, italic, or underline"
                    minHeightClassName="min-h-24"
                  />
                </Field>
                <Field label="Image position">
                  <Select
                    name={`feature_${i}_layout`}
                    value={feature.layout}
                    onChange={(e) =>
                      setCardLayout(i, e.target.value as WhyFeatureLayout)
                    }
                  >
                    {LAYOUT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
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
