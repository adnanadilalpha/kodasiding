"use client";

import imageCompression from "browser-image-compression";
import Image from "next/image";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { registerMediaAsset } from "@/lib/cms/actions";
import { publicMediaUrl } from "@/lib/cms/urls";

const MAX_BYTES = 800_000;

type Props = {
  name: string;
  label: string;
  hint?: string;
  initialId?: string | null;
  initialPath?: string | null;
  initialBucket?: string;
  aspect?: "video" | "square" | "wide";
  /** Match sibling column height in side-by-side layouts. */
  compact?: boolean;
};

export function MediaField({
  name,
  label,
  hint,
  initialId = null,
  initialPath = null,
  initialBucket = "media",
  aspect = "video",
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mediaId, setMediaId] = useState(initialId ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialPath ? publicMediaUrl(initialPath, initialBucket) : null,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fillSibling = compact && aspect !== "square";

  async function onFileChange(file: File | null) {
    if (!file) return;
    setLoading(true);
    setStatus("Compressing…");

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 2000,
        useWebWorker: true,
        fileType: "image/webp",
      });

      if (compressed.size > MAX_BYTES) {
        setStatus("Still too large after compression (max ~800KB).");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const path = `${Date.now()}-${crypto.randomUUID()}.webp`;
      setStatus("Uploading…");

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, compressed, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const bitmap = await createImageBitmap(compressed);
      const asset = await registerMediaAsset({
        path,
        bucket: "media",
        alt: label,
        width: bitmap.width,
        height: bitmap.height,
        bytes: compressed.size,
        mime_type: "image/webp",
      });
      bitmap.close();

      setMediaId(asset.id);
      setPreviewUrl(publicMediaUrl(path, "media"));
      setStatus("Ready");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setMediaId("");
    setPreviewUrl(null);
    setStatus(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const frameClass = fillSibling
    ? "absolute inset-0 overflow-hidden rounded-[4.5px] border border-dashed border-brand-primary/15 bg-bg-primary"
    : aspect === "square"
      ? "relative aspect-square w-full max-w-56 overflow-hidden rounded-[4.5px] border border-dashed border-brand-primary/15 bg-bg-primary"
      : "relative aspect-video w-full max-h-72 overflow-hidden rounded-[4.5px] border border-dashed border-brand-primary/15 bg-bg-primary";

  return (
    <div
      className={
        fillSibling
          ? "flex h-full min-h-48 flex-col gap-2.5"
          : "flex flex-col gap-2.5"
      }
    >
      <div className="flex shrink-0 items-baseline justify-between gap-3">
        <p className="text-sm leading-none text-text-secondary">{label}</p>
        {hint ? (
          <p className="text-[11px] text-text-primary/40">{hint}</p>
        ) : null}
      </div>

      <input type="hidden" name={name} value={mediaId} />

      <div
        className={
          fillSibling
            ? "relative min-h-48 w-full flex-1"
            : undefined
        }
      >
        <div className={frameClass}>
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 560px"
            />
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-2.25 text-center transition hover:bg-brand-primary/3"
            >
              <p className="text-xs leading-none text-brand-primary/60">
                No image
              </p>
              <p className="text-xs leading-none text-[#8a8d86]">
                JPG · PNG · WebP
              </p>
              <span className="text-base leading-none font-bold text-text-primary uppercase">
                {loading ? "Uploading…" : "upload"}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {previewUrl ? (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-medium text-text-inverse transition hover:bg-brand-primary-active disabled:opacity-50"
            >
              {loading ? "…" : "Replace"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={clear}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-brand-primary/60 transition hover:bg-brand-primary/5"
            >
              Remove
            </button>
          </>
        ) : null}
        {status ? (
          <span className="text-[11px] text-text-primary/45">{status}</span>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
