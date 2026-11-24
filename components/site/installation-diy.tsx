"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { HomeVideosSection, Video } from "@/lib/cms/types";
import {
  MANUAL_CHAPTERS,
  MANUAL_PAGES,
  DEFAULT_INSTALLATION_PAGE,
  type ManualChapterId,
} from "@/lib/cms/installation-defaults";
import { useQuote } from "@/components/site/quote-provider";
import { lockBodyScroll } from "@/lib/dom/lock-body-scroll";
import { trackAnalyticsEvent } from "@/lib/analytics/track-client";
import { RichText } from "@/components/site/rich-text";
import { plainTextFromRich } from "@/lib/cms/sanitize-rich-text";
import {
  isDirectVideoUrl,
  parseVimeoId,
  parseYoutubeId,
  vimeoEmbedUrl,
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
} from "@/lib/cms/video-url";

export function InstallationDiyPage({
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
  const { openQuote } = useQuote();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] =
    useState<ManualChapterId>("overview");

  useEffect(() => {
    const nodes = MANUAL_CHAPTERS.map((c) =>
      document.getElementById(`chapter-${c.id}`),
    ).filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible?.target.id) return;
        const id = visible.target.id.replace(
          "chapter-",
          "",
        ) as ManualChapterId;
        setActiveChapter(id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const d = DEFAULT_INSTALLATION_PAGE;
  const diyEyebrow = section.diy_eyebrow?.trim() || d.diy_eyebrow;
  const diyHeadline = section.diy_headline?.trim() || d.diy_headline;
  const diyBody = section.diy_body?.trim() || d.diy_body;
  const videosEyebrow = section.videos_eyebrow?.trim() || d.videos_eyebrow;
  const videosHeading = section.videos_heading?.trim() || d.videos_heading;
  const crewsEyebrow =
    section.local_crews_eyebrow?.trim() || d.local_crews_eyebrow;
  const crewsHeading =
    section.local_crews_heading?.trim() || d.local_crews_heading;
  const crewsLinkLabel =
    section.local_crews_link_label?.trim() || d.local_crews_link_label;
  const crewsCtaLabel =
    section.local_crews_cta_label?.trim() || d.local_crews_cta_label;

  const activeVideo = activeVideoId
    ? (videos.find((v) => v.id === activeVideoId) ?? null)
    : null;

  return (
    <>
      <section className="bg-brand-primary pt-16 text-text-inverse lg:pt-24">
        <div className="grid lg:grid-cols-2">
          <div className="relative order-1 aspect-video overflow-hidden lg:order-2 lg:aspect-auto lg:min-h-full">
            <Image
              src={MANUAL_PAGES[0].src}
              alt="Koda siding on a finished house, from the installation manual cover"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="origin-top-right scale-150 object-cover object-right"
            />
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 z-1 hidden w-1 bg-accent-warm lg:block"
            />
          </div>
          <div className="order-2 flex flex-col justify-center gap-6 px-page py-10 lg:order-1 lg:py-16">
            <p className="text-xs font-bold tracking-[0.16em] text-accent-warm">
              <RichText html={diyEyebrow} as="span" />
            </p>
            <h1 className="max-w-2xl font-display text-5xl leading-none font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              <RichText html={diyHeadline} as="span" />
            </h1>
            <p className="max-w-md text-base leading-relaxed text-text-inverse/75 lg:text-lg">
              <RichText html={diyBody} as="span" />
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
              {manualUrl ? (
                <a
                  href={manualUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    void trackAnalyticsEvent("manual_download", {
                      label:
                        plainTextFromRich(section.manual_label) ||
                        "Installation manual",
                    })
                  }
                  className="inline-flex items-center justify-center rounded-md bg-accent-warm px-6 py-3 text-sm text-text-primary transition hover:opacity-90 sm:px-7 sm:py-3.5 sm:text-base"
                >
                  <RichText
                    html={section.manual_label || "Download PDF manual"}
                    as="span"
                  />
                </a>
              ) : null}
              <a
                href="#chapter-overview"
                className="text-sm text-text-inverse/80 underline decoration-text-inverse/30 underline-offset-4 transition hover:text-text-inverse hover:decoration-text-inverse"
              >
                Read it on this page
              </a>
            </div>
            <p className="text-xs tracking-[0.14em] text-text-inverse/45">
              {MANUAL_PAGES.length} pages · {MANUAL_CHAPTERS.length} chapters
            </p>
          </div>
        </div>
      </section>

      {/* Sticky chapter jump bar */}
      <nav
        aria-label="Manual chapters"
        className="sticky top-16 z-30 border-b border-brand-primary/10 bg-bg-primary/95 backdrop-blur-md lg:top-24"
      >
        <div className="flex gap-1 overflow-x-auto px-page py-3">
          {MANUAL_CHAPTERS.map((chapter) => {
            const active = chapter.id === activeChapter;
            return (
              <a
                key={chapter.id}
                href={`#chapter-${chapter.id}`}
                className={`shrink-0 rounded-md px-3 py-2 text-xs tracking-[0.08em] uppercase transition sm:text-sm ${
                  active
                    ? "bg-brand-primary text-text-inverse"
                    : "text-brand-primary/70 hover:bg-brand-primary/8 hover:text-brand-primary"
                }`}
              >
                {chapter.label}
              </a>
            );
          })}
        </div>
      </nav>

      {/* Continuous document — one sheet after another */}
      <div className="bg-bg-secondary">
        {MANUAL_PAGES.map((page, index) => {
          const chapterStart =
            index === 0 || MANUAL_PAGES[index - 1].chapter !== page.chapter;
          const chapterLabel =
            MANUAL_CHAPTERS.find((c) => c.id === page.chapter)?.label ?? "";

          return (
            <article
              key={page.id}
              id={chapterStart ? `chapter-${page.chapter}` : undefined}
              className={`scroll-mt-32 border-b border-brand-primary/10 px-page py-12 lg:scroll-mt-40 lg:py-16 ${
                index % 2 === 0 ? "bg-bg-secondary" : "bg-bg-primary"
              }`}
            >
              {chapterStart ? (
                <p className="mb-6 text-xs tracking-[0.16em] text-text-secondary uppercase">
                  {chapterLabel}
                </p>
              ) : null}

              <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-8">
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-white shadow-lg shadow-brand-primary/10">
                    <Image
                      src={page.src}
                      alt={`${page.section} — ${page.title}`}
                      fill
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-contain object-top"
                      priority={index < 2}
                    />
                  </div>
                </div>

                <aside className="flex flex-col gap-4 lg:col-span-4 lg:sticky lg:top-40">
                  <p className="text-xs tracking-[0.16em] text-text-secondary uppercase">
                    {page.section} · Page {page.page} of {MANUAL_PAGES.length}
                  </p>
                  <h2 className="font-display text-2xl leading-tight font-bold tracking-tight text-brand-primary lg:text-3xl">
                    {page.title}
                  </h2>
                  {page.notes.length ? (
                    <ol className="flex flex-col gap-2.5 border-t border-brand-primary/15 pt-4">
                      {page.notes.map((note, i) => (
                        <li
                          key={note}
                          className="flex gap-3 text-sm leading-snug text-text-primary/80"
                        >
                          <span className="shrink-0 font-medium text-brand-primary">
                            {`${String.fromCharCode(97 + i)})`}
                          </span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </aside>
              </div>
            </article>
          );
        })}
      </div>

      {videos.length ? (
        <section className="bg-bg-primary py-16 lg:py-24">
          <div className="flex flex-col gap-10 px-page">
            <header className="max-w-2xl">
              <p className="text-xs tracking-[0.16em] text-text-secondary">
                <RichText html={videosEyebrow} as="span" />
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-primary sm:text-4xl">
                <RichText html={videosHeading} as="span" />
              </h2>
            </header>
            <ul className="grid gap-10 lg:grid-cols-2 lg:gap-8">
              {videos.map((video) => {
                const cmsThumb = video.thumbnail_media_id
                  ? thumbs[video.thumbnail_media_id]
                  : null;
                return (
                  <li key={video.id} className="flex flex-col gap-6">
                    <h3 className="text-xl font-bold text-text-primary sm:text-2xl">
                      {video.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveVideoId(video.id)}
                      className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[20px] bg-bg-secondary text-left transition hover:opacity-95"
                      aria-label={`Play ${video.title}`}
                    >
                      <VideoThumbnail
                        video={video}
                        cmsThumb={cmsThumb ?? null}
                      />
                      <span className="relative z-10 flex size-14 items-center justify-center rounded-full bg-white shadow-md sm:size-16">
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
          </div>
        </section>
      ) : null}

      <section className="bg-bg-secondary py-14 lg:py-16">
        <div className="flex flex-col gap-5 px-page sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.14em] text-text-secondary">
              <RichText html={crewsEyebrow} as="span" />
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-brand-primary">
              <RichText html={crewsHeading} as="span" />
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/#installation"
              className="inline-flex w-fit items-center justify-center rounded-md border border-brand-primary/25 px-6 py-3 text-sm text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/5"
            >
              <RichText html={crewsLinkLabel} as="span" />
            </Link>
            <button
              type="button"
              onClick={() => {
                void trackAnalyticsEvent("cta_click", {
                  label: plainTextFromRich(crewsCtaLabel),
                  metadata: { placement: "installation-manual-footer" },
                });
                openQuote();
              }}
              className="inline-flex w-fit items-center justify-center rounded-md bg-brand-primary px-8 py-3 text-base text-text-inverse transition hover:bg-brand-primary-active"
            >
              <RichText html={crewsCtaLabel} as="span" />
            </button>
          </div>
        </div>
      </section>

      {activeVideo ? (
        <VideoPlayerModal
          video={activeVideo}
          onClose={() => setActiveVideoId(null)}
        />
      ) : null}
    </>
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
        alt={video.title}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
      />
    );
  }

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
          try {
            e.currentTarget.currentTime = 0.1;
          } catch {
            // ignore
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
            className="min-w-0 truncate font-display text-sm font-semibold text-text-inverse sm:text-base"
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
