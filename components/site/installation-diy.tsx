"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useId, useState } from "react";
import type { HomeVideosSection, Video } from "@/lib/cms/types";
import {
  MANUAL_CHAPTERS,
  MANUAL_PAGES,
  type ManualChapterId,
} from "@/lib/cms/installation-defaults";
import { resolveInstallTownPoints } from "@/lib/cms/install-service-geo";
import { useQuote } from "@/components/site/quote-provider";
import { lockBodyScroll } from "@/lib/dom/lock-body-scroll";
import { trackAnalyticsEvent } from "@/lib/analytics/track-client";
import {
  isDirectVideoUrl,
  parseVimeoId,
  parseYoutubeId,
  vimeoEmbedUrl,
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
} from "@/lib/cms/video-url";

const InstallServiceAreaMap = dynamic(
  () =>
    import("@/components/site/install-service-area-map").then(
      (m) => m.InstallServiceAreaMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center bg-[#c8dff0] text-xs font-medium tracking-wide text-brand-primary/50 uppercase sm:h-72 lg:h-80">
        Loading map…
      </div>
    ),
  },
);

function splitParagraphs(body: string) {
  return String(body ?? "")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitCities(cities: string) {
  return String(cities ?? "")
    .split(/\s*[·•|]\s*|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function InstallationDiyPage({
  section,
  videos,
  thumbs,
  manualUrl,
  heroImageUrl,
  serviceArea = "Omaha & surrounding areas",
}: {
  section: HomeVideosSection;
  videos: Video[];
  thumbs: Record<string, string | null>;
  manualUrl: string | null;
  heroImageUrl: string;
  serviceArea?: string;
}) {
  const { openQuote } = useQuote();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] =
    useState<ManualChapterId>("overview");
  const paragraphs = splitParagraphs(section.body);
  const cities = splitCities(section.cities ?? "");
  const townPoints = resolveInstallTownPoints(cities);
  const radiusMiles =
    typeof section.install_radius_miles === "number" &&
    section.install_radius_miles > 0
      ? section.install_radius_miles
      : 60;
  const coverageIntro =
    section.cities_intro?.trim() ||
    "Green circle = where Koda crews install. Tap a pin or type your town.";
  const [townQuery, setTownQuery] = useState("");
  const townMatches = (() => {
    const q = townQuery.trim().toLowerCase();
    if (!q) return [];
    return cities.filter((city) => city.toLowerCase().includes(q));
  })();
  const exactTownMatch =
    townMatches.find(
      (city) => city.toLowerCase() === townQuery.trim().toLowerCase(),
    ) ?? (townMatches.length === 1 ? townMatches[0] : null);

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

  const activeVideo = activeVideoId
    ? (videos.find((v) => v.id === activeVideoId) ?? null)
    : null;

  return (
    <>
      <section className="relative isolate flex min-h-140 flex-col overflow-x-hidden pt-24 sm:min-h-160 lg:min-h-dvh lg:pt-28">
        <Image
          src={heroImageUrl}
          alt="Koda Siding crew installing fiberglass siding"
          fill
          quality={90}
          priority
          sizes="100vw"
          className="object-cover object-[68%_center] sm:object-[60%_center] lg:object-[55%_center]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-r from-brand-primary-active/50 via-brand-primary-active/10 to-transparent lg:via-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-brand-primary-active/45 via-transparent to-brand-primary-active/20"
        />

        <div className="relative z-1 flex flex-1 flex-col justify-end px-page pb-8 pt-10 sm:pb-12 lg:justify-center lg:py-16">
          <div className="install-hero-rise w-full max-w-md bg-brand-primary-active/72 p-7 text-text-inverse backdrop-blur-lg sm:max-w-xl sm:p-9 lg:max-w-150 lg:p-11">
            <header className="flex flex-col gap-3.5">
              {serviceArea ? (
                <p className="text-xs font-bold tracking-[0.16em] text-accent-warm uppercase">
                  Local install · {serviceArea}
                </p>
              ) : null}
              <h1 className="font-display text-[1.85rem] leading-[1.08] font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.65rem] lg:leading-[1.05]">
                {section.headline}
              </h1>
            </header>

            {paragraphs[0] ? (
              <p className="mt-5 text-sm leading-relaxed text-text-inverse/80 sm:text-base lg:text-lg">
                {paragraphs[0]}
              </p>
            ) : null}

            {manualUrl ? (
              <div className="mt-6 sm:mt-7">
                <a
                  href={manualUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    void trackAnalyticsEvent("manual_download", {
                      label: section.manual_label || "Installation manual",
                    })
                  }
                  className="inline-flex items-center justify-center rounded-md bg-text-inverse px-6 py-3 text-sm text-brand-primary transition hover:bg-accent-warm sm:px-7 sm:py-3.5 sm:text-base"
                >
                  {section.manual_label}
                </a>
              </div>
            ) : null}

            {cities.length === 0 ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    void trackAnalyticsEvent("cta_click", {
                      label: "Request install quote",
                      metadata: { placement: "installation-hero" },
                    });
                    openQuote();
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-text-inverse/35 px-5 py-2.5 text-sm text-text-inverse transition hover:border-text-inverse hover:bg-text-inverse/10 sm:px-6 sm:py-3"
                >
                  Request install quote
                </button>
              </div>
            ) : null}
          </div>

          {/* Coverage map + town check — single quote CTA */}
          {cities.length > 0 ? (
            <aside className="install-hero-rise install-hero-rise-delay-2 mt-8 w-full max-w-md self-end overflow-hidden bg-bg-primary/95 backdrop-blur-md lg:absolute lg:right-page lg:bottom-8 lg:mt-0 lg:max-w-105">
              {townPoints.length > 0 ? (
                <InstallServiceAreaMap
                  points={townPoints}
                  selectedName={exactTownMatch}
                  onSelectTown={setTownQuery}
                  radiusMiles={radiusMiles}
                />
              ) : null}

              <div className="border-l-4 border-accent-warm p-3.5 text-brand-primary sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-bold tracking-[0.14em] text-brand-primary/50 uppercase">
                      {radiusMiles} mi · {serviceArea}
                    </p>
                    <h2 className="mt-0.5 font-display text-base leading-tight font-bold tracking-tight sm:text-lg">
                      Do we install near you?
                    </h2>
                  </div>
                </div>

                <label className="mt-2.5 block">
                  <span className="sr-only">Your town</span>
                  <input
                    type="search"
                    value={townQuery}
                    onChange={(e) => setTownQuery(e.target.value)}
                    placeholder="Type a town, or tap a pin…"
                    autoComplete="address-level2"
                    className="w-full rounded-md border border-brand-primary/15 bg-bg-secondary px-3 py-2 text-sm text-brand-primary outline-none placeholder:text-brand-primary/35 focus:border-brand-primary/45"
                  />
                </label>

                {townQuery.trim() ? (
                  <div
                    className={`mt-2 rounded-md px-2.5 py-1.5 text-xs leading-snug sm:text-sm ${
                      exactTownMatch
                        ? "bg-accent-warm/35 text-brand-primary"
                        : "bg-bg-secondary text-brand-primary/75"
                    }`}
                    role="status"
                  >
                    {exactTownMatch ? (
                      <p>
                        <span className="font-bold">Yes.</span> We install in{" "}
                        {exactTownMatch}.
                      </p>
                    ) : townMatches.length > 0 ? (
                      <p>
                        Did you mean{" "}
                        {townMatches.slice(0, 3).map((city, i) => (
                          <span key={city}>
                            {i > 0 ? ", " : ""}
                            <button
                              type="button"
                              onClick={() => setTownQuery(city)}
                              className="font-medium underline underline-offset-2"
                            >
                              {city}
                            </button>
                          </span>
                        ))}
                        ?
                      </p>
                    ) : (
                      <p>
                        Not listed — still ask. We cover towns inside the{" "}
                        {radiusMiles}-mile radius.
                      </p>
                    )}
                  </div>
                ) : coverageIntro ? (
                  <p className="mt-2 text-xs leading-relaxed text-brand-primary/55">
                    {coverageIntro}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    void trackAnalyticsEvent("cta_click", {
                      label: exactTownMatch
                        ? `Request quote for ${exactTownMatch}`
                        : "Request install quote",
                      metadata: {
                        placement: "installation-hero-coverage",
                        town: exactTownMatch || townQuery.trim() || "",
                      },
                    });
                    openQuote();
                  }}
                  className="mt-2.5 inline-flex w-full items-center justify-center rounded-md bg-brand-primary px-4 py-2.5 text-sm text-text-inverse transition hover:bg-brand-primary-active"
                >
                  {exactTownMatch
                    ? `Request quote · ${exactTownMatch}`
                    : "Request install quote"}
                </button>
              </div>
            </aside>
          ) : null}
        </div>
      </section>

      {paragraphs.length > 1 ? (
        <section className="border-b border-brand-primary/8 bg-bg-primary">
          <div className="mx-auto max-w-7xl px-page py-10 sm:py-12 lg:py-14 xl:max-w-8xl">
            <div className="flex max-w-3xl flex-col gap-3.5">
              {paragraphs.slice(1).map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="text-base leading-relaxed text-text-primary/75"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
      ) : null}

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
              <p className="text-xs tracking-[0.16em] text-text-secondary uppercase">
                Videos
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-primary sm:text-4xl">
                Watch the install
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
            <p className="text-xs tracking-[0.14em] text-text-secondary uppercase">
              Available in {serviceArea}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-brand-primary">
              Prefer we install it?
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void trackAnalyticsEvent("cta_click", {
                label: "Request install quote",
                metadata: { placement: "installation-manual-footer" },
              });
              openQuote();
            }}
            className="inline-flex w-fit items-center justify-center rounded-md bg-brand-primary px-8 py-3 text-base text-text-inverse transition hover:bg-brand-primary-active"
          >
            Request install quote
          </button>
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
