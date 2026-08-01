"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Max upload size for hosted videos (egress-safe on free plan). Prefer URL when larger. */
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB

type Mode = "url" | "upload";

type Props = {
  name?: string;
  initialUrl?: string;
  initialMode?: Mode;
};

export function VideoSourceField({
  name = "video_url",
  initialUrl = "",
  initialMode,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inferred: Mode =
    initialMode ??
    (initialUrl.includes("/storage/v1/object/public/videos/")
      ? "upload"
      : "url");
  const [mode, setMode] = useState<Mode>(inferred);
  const [url, setUrl] = useState(initialUrl);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFileChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setStatus("Please choose a video file (MP4 or WebM).");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setStatus(
        `File is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max is 25MB — use a URL instead (YouTube/Vimeo/hosted).`,
      );
      return;
    }

    setLoading(true);
    setStatus("Uploading video…");

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from("videos").upload(path, file, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) {
        if (error.message.toLowerCase().includes("bucket") || error.statusCode === "404") {
          throw new Error(
            "Videos bucket is missing. Run supabase/migrations/20260730120000_videos_bucket.sql in the Supabase SQL editor, then retry.",
          );
        }
        throw error;
      }

      const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const publicUrl = `${base}/storage/v1/object/public/videos/${path}`;
      setUrl(publicUrl);
      setStatus("Uploaded");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-full bg-bg-primary p-1">
        {(
          [
            { id: "url", label: "Video URL" },
            { id: "upload", label: "Upload file" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              setMode(opt.id);
              setStatus(null);
            }}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
              mode === opt.id
                ? "bg-brand-primary text-text-inverse shadow-sm"
                : "text-brand-primary/70 hover:text-brand-primary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <input type="hidden" name={name} value={url} />

      {mode === "url" ? (
        <div className="space-y-1.5">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/… or https://…"
            className="w-full rounded-xl border border-brand-primary/12 bg-bg-primary px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-primary/35 focus:border-brand-primary/40"
          />
          <p className="text-xs text-text-primary/45">
            Best for YouTube, Vimeo, or any hosted MP4 — no storage cost.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-text-inverse transition hover:bg-brand-primary-active disabled:opacity-50"
            >
              {loading ? "Uploading…" : url ? "Replace video" : "Choose video"}
            </button>
            {url ? (
              <button
                type="button"
                onClick={() => {
                  setUrl("");
                  setStatus(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="rounded-full px-4 py-2 text-sm text-brand-primary/70 hover:bg-brand-primary/5"
              >
                Clear
              </button>
            ) : null}
          </div>
          <p className="text-xs text-text-primary/45">
            MP4 or WebM only · max 25MB. Larger files should use a URL.
          </p>
          {url ? (
            <p className="truncate font-mono text-[11px] text-brand-primary/60">
              {url}
            </p>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {status ? (
        <p className="text-xs text-text-primary/55">{status}</p>
      ) : null}
    </div>
  );
}
