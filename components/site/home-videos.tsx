"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import type { HomeVideosSection, Video } from "@/lib/cms/types";
import { lockBodyScroll } from "@/lib/dom/lock-body-scroll";
import {
  isDirectVideoUrl,
  parseVimeoId,
  parseYoutubeId,
  vimeoEmbedUrl,
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
} from "@/lib/cms/video-url";

export function HomeVideosSectionBlock({
  section,
  videos,
  thumbs,
  manualUrl,
}: {
  section: HomeVideosSection;
  videos: Video[];
  thumbs: Record<string, string | null>;
  manualUrl: string | null;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId
    ? (videos.find((v) => v.id === activeId) ?? null)
    : null;

  return (
    <section
      id="installation"
      className="scroll-mt-16 bg-bg-primary py-12 lg:scroll-mt-24 lg:py-24"
    >
      <div
        id="resources"
        className="flex w-full scroll-mt-16 flex-col gap-10 px-page lg:scroll-mt-24 lg:gap-12"
      >
        <div className="flex flex-col gap-4 text-text-primary">
          <h2 className="font-display text-[1.75rem] leading-[1.3] font-bold uppercase sm:text-4xl lg:text-5xl lg:whitespace-nowrap">
            {section.headline}
          </h2>
          <p className="max-w-3xl text-base leading-[1.4] lg:text-lg">
            {section.body}
          </p>
        </div>

        {videos.length ? (
          <ul className="grid gap-10 lg:grid-cols-2 lg:gap-8">
            {videos.map((video) => {
              const cmsThumb = video.thumbnail_media_id
                ? thumbs[video.thumbnail_media_id]
                : null;
              return (
                <li key={video.id} className="flex flex-col gap-6 lg:gap-8">
                  <h3 className="text-xl leading-[1.1] font-bold text-text-primary sm:text-2xl lg:text-[28px]">
                    {video.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveId(video.id)}
                    className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[20px] bg-bg-secondary text-left transition hover:opacity-95"
                    aria-label={`Play ${video.title}`}
                  >
                    <VideoThumbnail
                      video={video}
                      cmsThumb={cmsThumb ?? null}
                    />
                    <span className="relative z-10 flex size-14 items-center justify-center rounded-full bg-white shadow-md sm:size-16 lg:size-18">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/landing/play.svg"
                        alt=""
                        width={24}
                        height={24}
                        className="ml-0.5 size-5 sm:size-6"
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {manualUrl ? (
          <a
            href={manualUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center justify-center rounded-md bg-brand-primary px-8 py-3 text-base text-text-inverse"
          >
            {section.manual_label}
          </a>
        ) : (
          <span className="inline-flex w-fit items-center justify-center rounded-md bg-brand-primary px-8 py-3 text-base text-text-inverse">
            {section.manual_label}
          </span>
        )}
      </div>

      {active ? (
        <VideoPlayerModal video={active} onClose={() => setActiveId(null)} />
      ) : null}
    </section>
  );
}

function VideoThumbnail({
  video,
  cmsThumb,
}: {
  video: Video;
  cmsThumb: string | null;
}) {
  const ytId = parseYoutubeId(video.video_url);
  const direct = isDirectVideoUrl(video.video_url);
  const ytThumb = ytId ? youtubeThumbnailUrl(ytId) : null;
  const imageThumb = cmsThumb || ytThumb;

  if (imageThumb) {
    return (
      <Image
        src={imageThumb}
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
      />
    );
  }

  // No CMS thumb — show first frame of uploaded / direct video
  if (direct && video.video_url) {
    return (
      <video
        src={video.video_url}
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 size-full object-cover"
        aria-hidden
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          try {
            el.currentTime = 0.1;
          } catch {
            // Some browsers block seek until more data loads
          }
        }}
      />
    );
  }

  return null;
}

function VideoPlayerModal({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  const titleId = useId();
  const [entered, setEntered] = useState(false);
  const ytId = parseYoutubeId(video.video_url);
  const vimeoId = parseVimeoId(video.video_url);
  const direct = isDirectVideoUrl(video.video_url);

  useEffect(() => {
    const unlock = lockBodyScroll();
    const id = requestAnimationFrame(() => setEntered(true));
    return () => {
      unlock();
      cancelAnimationFrame(id);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-brand-primary-active/55 p-4 backdrop-blur-[2px] transition-opacity duration-300 sm:p-8 ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-4xl origin-center overflow-hidden rounded-lg bg-brand-primary-active shadow-lg transition duration-300 ease-out ${
          entered
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
          <h2
            id={titleId}
            className="min-w-0 truncate font-display text-sm font-semibold text-text-inverse uppercase sm:text-base"
          >
            {video.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center text-text-inverse"
            aria-label="Close"
          >
            <span className="relative block size-4" aria-hidden>
              <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rotate-45 bg-current" />
              <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 -rotate-45 bg-current" />
            </span>
          </button>
        </div>

        <div className="relative aspect-video w-full bg-black">
          {ytId ? (
            <iframe
              title={video.title}
              src={youtubeEmbedUrl(ytId, true)}
              className="absolute inset-0 size-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : vimeoId ? (
            <iframe
              title={video.title}
              src={vimeoEmbedUrl(vimeoId, true)}
              className="absolute inset-0 size-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : direct && video.video_url ? (
            <video
              src={video.video_url}
              controls
              autoPlay
              playsInline
              className="absolute inset-0 size-full object-contain"
            />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
              Video unavailable
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
