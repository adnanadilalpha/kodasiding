"use client";

import imageCompression from "browser-image-compression";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  cleanupUnreferencedMedia,
  registerMediaAsset,
} from "@/lib/cms/actions";
import { isSvgMedia } from "@/lib/cms/is-svg-media";
import { publicMediaUrl } from "@/lib/cms/urls";

const MAX_RASTER_BYTES = 800_000;
const MAX_SVG_BYTES = 1_500_000;

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/svg+xml,.svg";

type Props = {
  name: string;
  label: string;
  hint?: string;
  initialId?: string | null;
  initialPath?: string | null;
  initialBucket?: string;
  /** Shown when no CMS media is linked (matches public site fallback). */
  fallbackSrc?: string | null;
  aspect?: "video" | "square" | "wide";
  /** Match sibling column height in side-by-side layouts. */
  compact?: boolean;
  /** Fires when the linked media id changes (upload, replace, or clear). */
  onIdChange?: (id: string | null) => void;
};

function isSvgFile(file: File) {
  return (
    file.type === "image/svg+xml" ||
    file.name.toLowerCase().endsWith(".svg")
  );
}

function resolvePreview(
  path: string | null | undefined,
  bucket: string,
  fallback: string | null | undefined,
) {
  if (path) return publicMediaUrl(path, bucket);
  return fallback || null;
}

export function MediaField({
  name,
  label,
  hint,
  initialId = null,
  initialPath = null,
  initialBucket = "media",
  fallbackSrc = null,
  aspect = "video",
  compact = false,
  onIdChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mediaId, setMediaId] = useState(initialId ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(() =>
    resolvePreview(initialPath, initialBucket, fallbackSrc),
  );
  const [previewIsSvg, setPreviewIsSvg] = useState(
    isSvgMedia(initialPath) || isSvgMedia(fallbackSrc),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const usingFallback = Boolean(previewUrl && !mediaId && fallbackSrc);
  const onIdChangeRef = useRef(onIdChange);
  onIdChangeRef.current = onIdChange;

  function commitMediaId(nextId: string) {
    setMediaId(nextId);
    onIdChangeRef.current?.(nextId || null);
  }

  // Keep preview in sync when server props refresh after save / navigation.
  // If the parent echoes a newly uploaded id before it has a storage path,
  // keep the local upload preview instead of wiping it back to fallback/empty.
  useEffect(() => {
    const nextId = initialId ?? "";
    setMediaId(nextId);
    const nextPreview = resolvePreview(initialPath, initialBucket, fallbackSrc);
    if (nextPreview) {
      setPreviewUrl(nextPreview);
      setPreviewIsSvg(isSvgMedia(initialPath) || isSvgMedia(fallbackSrc));
      return;
    }
    if (!nextId) {
      setPreviewUrl(fallbackSrc || null);
      setPreviewIsSvg(isSvgMedia(fallbackSrc));
    }
  }, [initialId, initialPath, initialBucket, fallbackSrc]);

  const fillSibling = compact && aspect !== "square";

  async function onFileChange(file: File | null) {
    if (!file) return;
    setLoading(true);
    setStatus(isSvgFile(file) ? "Preparing SVG…" : "Compressing…");

    const previousId = mediaId;
    const savedId = initialId ?? "";

    try {
      const supabase = createClient();
      let uploadBlob: Blob = file;
      let contentType = file.type || "application/octet-stream";
      let ext = "bin";
      let width: number | null = null;
      let height: number | null = null;

      if (isSvgFile(file)) {
        if (file.size > MAX_SVG_BYTES) {
          setStatus("SVG is too large (max ~1.5MB).");
          setLoading(false);
          return;
        }
        const raw = await file.text();
        // Strip common scriptable vectors before public upload
        if (
          /<script[\s>]/i.test(raw) ||
          /\bon\w+\s*=/i.test(raw) ||
          /javascript:/i.test(raw)
        ) {
          setStatus("SVG contains scripts or event handlers — upload blocked.");
          setLoading(false);
          return;
        }
        contentType = "image/svg+xml";
        ext = "svg";
        uploadBlob = new Blob([raw], { type: "image/svg+xml" });
      } else {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 2000,
          useWebWorker: true,
          fileType: "image/webp",
        });

        if (compressed.size > MAX_RASTER_BYTES) {
          setStatus("Still too large after compression (max ~800KB).");
          setLoading(false);
          return;
        }

        contentType = "image/webp";
        ext = "webp";
        uploadBlob = compressed;
        const bitmap = await createImageBitmap(compressed);
        width = bitmap.width;
        height = bitmap.height;
        bitmap.close();
      }

      const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      setStatus("Uploading…");

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, uploadBlob, {
          contentType,
          cacheControl: "31536000",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const asset = await registerMediaAsset({
        path,
        bucket: "media",
        alt: label,
        width,
        height,
        bytes: uploadBlob.size,
        mime_type: contentType,
      });

      commitMediaId(asset.id);
      setPreviewUrl(publicMediaUrl(path, "media"));
      setPreviewIsSvg(ext === "svg");
      setStatus("Ready");

      // Drop intermediate uploads that never got saved (A→B→C leaves B orphaned).
      // Keep the currently-saved asset until the form saves successfully.
      if (previousId && previousId !== savedId) {
        void cleanupUnreferencedMedia([previousId]);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    const previousId = mediaId;
    const savedId = initialId ?? "";
    commitMediaId("");
    setPreviewUrl(fallbackSrc || null);
    setPreviewIsSvg(isSvgMedia(fallbackSrc));
    setStatus(null);
    if (inputRef.current) inputRef.current.value = "";
    if (previousId && previousId !== savedId) {
      void cleanupUnreferencedMedia([previousId]);
    }
  }

  const frameClass = fillSibling
    ? "absolute inset-0 overflow-hidden rounded-[4.5px] border border-dashed border-brand-primary/15 bg-bg-secondary"
    : aspect === "square"
      ? "relative aspect-square w-full max-w-56 overflow-hidden rounded-[4.5px] border border-dashed border-brand-primary/15 bg-bg-secondary"
      : "relative aspect-video w-full max-h-72 overflow-hidden rounded-[4.5px] border border-dashed border-brand-primary/15 bg-bg-secondary";

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
          fillSibling ? "relative min-h-48 w-full flex-1" : undefined
        }
      >
        <div className={frameClass}>
          {previewUrl ? (
            previewIsSvg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={label}
                className="absolute inset-0 size-full object-contain p-2"
              />
            ) : (
              <Image
                src={previewUrl}
                alt={label}
                fill
                loading="eager"
                className="object-contain p-1"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 560px"
              />
            )
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-2.25 text-center transition hover:bg-brand-primary/3"
            >
              <p className="text-xs leading-none text-brand-primary/60">
                No file
              </p>
              <p className="text-xs leading-none text-[#8a8d86]">
                JPG · PNG · WebP · SVG
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
              {loading ? "…" : usingFallback ? "Replace default" : "Replace"}
            </button>
            {!usingFallback ? (
              <button
                type="button"
                disabled={loading}
                onClick={clear}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-brand-primary/60 transition hover:bg-brand-primary/5"
              >
                Remove
              </button>
            ) : (
              <span className="text-[11px] text-text-primary/40">
                Site default
              </span>
            )}
          </>
        ) : null}
        {status ? (
          <span className="text-[11px] text-text-primary/45">{status}</span>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
