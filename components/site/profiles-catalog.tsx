"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import type { PageProfiles, Profile } from "@/lib/cms/types";
import { isSvgMedia } from "@/lib/cms/is-svg-media";
import { lockBodyScroll } from "@/lib/dom/lock-body-scroll";
import { useQuote } from "@/components/site/quote-provider";

type ProfileTileData = Profile & {
  imageUrl: string | null;
  diagramUrl: string | null;
};

function ProfileMedia({
  src,
  alt,
  sizes,
  quality,
  priority = false,
  className = "object-contain",
}: {
  src: string;
  alt: string;
  sizes: string;
  quality?: number;
  priority?: boolean;
  className?: string;
}) {
  if (isSvgMedia(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 size-full ${className}`}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={className}
    />
  );
}

function hasDetails(profile: ProfileTileData) {
  return Boolean(
    profile.exposure?.trim() ||
      profile.face_width?.trim() ||
      profile.depth?.trim() ||
      profile.description?.trim() ||
      profile.diagramUrl,
  );
}

function SpecCell({ label, value }: { label: string; value?: string | null }) {
  const text = value?.trim();
  if (!text) return null;
  return (
    <div className="min-w-0">
      <p className="text-base leading-none text-text-secondary">{label}</p>
      <p className="mt-2 text-base text-text-primary">{text}</p>
    </div>
  );
}

function ProfileDetailModal({
  profile,
  onClose,
}: {
  profile: ProfileTileData;
  onClose: () => void;
}) {
  const titleId = useId();
  const [entered, setEntered] = useState(false);
  const hasDiagram = Boolean(profile.diagramUrl);
  const description = profile.description?.trim() ?? "";
  const hasSpecs = Boolean(
    profile.exposure?.trim() ||
      profile.face_width?.trim() ||
      profile.depth?.trim(),
  );

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
        className={`relative w-full origin-center rounded-lg bg-white shadow-lg transition duration-300 ease-out ${
          hasDiagram ? "max-w-231" : "max-w-3xl"
        } ${
          entered
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-[0.98] opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center text-text-primary sm:top-6 sm:right-6 sm:size-6 lg:top-7 lg:right-8 lg:size-7"
          aria-label="Close"
        >
          <span
            className="relative block size-4 sm:size-3.5 lg:size-4"
            aria-hidden
          >
            <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rotate-45 bg-current" />
            <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 -rotate-45 bg-current" />
          </span>
        </button>

        <div
          className={`px-6 py-10 sm:px-10 sm:py-12 lg:px-12 ${
            hasDiagram
              ? "lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-12"
              : ""
          }`}
        >
          <div className="flex min-w-0 flex-col gap-8 self-start">
            <h2
              id={titleId}
              className="font-display pr-10 text-2xl font-bold whitespace-nowrap text-brand-primary uppercase sm:text-[28px]"
            >
              {profile.name}
            </h2>

            {hasSpecs ? (
              <div className="grid grid-cols-3 gap-x-6 gap-y-6">
                <SpecCell label="Coverage" value={profile.exposure} />
                <SpecCell label="Height" value={profile.face_width} />
                <SpecCell label="Depth" value={profile.depth} />
              </div>
            ) : null}

            {description ? (
              <p className="text-base leading-relaxed text-text-secondary lg:max-w-prose">
                {description}
              </p>
            ) : null}
          </div>

          {hasDiagram && profile.diagramUrl ? (
            <div className="relative mt-8 flex h-52 w-full items-center justify-center sm:h-64 lg:mt-0 lg:h-full lg:min-h-72">
              <div className="relative h-52 w-full sm:h-64 lg:h-72">
                <ProfileMedia
                  src={profile.diagramUrl}
                  alt={`${profile.name} cross-section diagram`}
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  className="object-contain object-center"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProfileTile({
  profile,
  onLearnMore,
  priority = false,
}: {
  profile: ProfileTileData;
  onLearnMore: () => void;
  priority?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const canLearnMore = hasDetails(profile);

  return (
    <article className="flex h-full min-h-52 flex-col gap-4 rounded-lg bg-white p-4 sm:min-h-58.75">
      <div
        className="relative min-h-36 flex-1 sm:min-h-43"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="absolute inset-0">
          {profile.imageUrl ? (
            <ProfileMedia
              src={profile.imageUrl}
              alt={profile.name}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 360px"
              quality={95}
              priority={priority}
            />
          ) : (
            <div
              className="size-full rounded-md bg-linear-to-br from-bg-secondary to-bg-secondary/40"
              aria-hidden
            />
          )}
        </div>

        {canLearnMore ? (
          <button
            type="button"
            onClick={onLearnMore}
            className={`absolute inset-0 z-10 flex items-center justify-center transition duration-200 lg:bg-brand-primary-active/55 ${
              hovered ? "lg:opacity-100" : "lg:opacity-0"
            }`}
            aria-label={`Learn more about ${profile.name}`}
          >
            {/* Label only on desktop hover; mobile/tablet tap opens modal directly */}
            <span className="hidden rounded-md bg-accent-warm px-5 py-2.5 text-sm text-text-primary lg:inline-flex">
              Learn more
            </span>
          </button>
        ) : null}
      </div>

      <h3 className="text-sm font-bold text-text-primary">{profile.name}</h3>
      {profile.description?.trim() ? (
        <p className="sr-only">{profile.description.trim()}</p>
      ) : null}
    </article>
  );
}

function ProfileSheet({
  headline,
  helper,
  profiles,
  onLearnMore,
  priorityCount = 0,
}: {
  headline: string;
  helper: string;
  profiles: ProfileTileData[];
  onLearnMore: (profile: ProfileTileData) => void;
  /** First N tiles are above-the-fold — eager-load for LCP. */
  priorityCount?: number;
}) {
  if (profiles.length === 0) return null;

  return (
    <section className="flex w-full flex-col items-center gap-8 lg:gap-12">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-2xl font-bold text-text-primary uppercase sm:text-[30px] sm:leading-9.75">
          {headline}
        </h2>
        {helper ? (
          <p className="text-sm leading-tight text-[#6b6858] sm:text-right">
            {helper}
          </p>
        ) : null}
      </div>

      <ul className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5 lg:gap-8">
        {profiles.map((profile, index) => (
          <li key={profile.id} className="min-w-0">
            <ProfileTile
              profile={profile}
              onLearnMore={() => onLearnMore(profile)}
              priority={index < priorityCount}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProfilesCatalog({
  page,
  horizontal,
  vertical,
  universal,
}: {
  page: PageProfiles;
  horizontal: ProfileTileData[];
  vertical: ProfileTileData[];
  universal: ProfileTileData[];
}) {
  const { openQuote } = useQuote();
  const [selected, setSelected] = useState<ProfileTileData | null>(null);
  const quoteLabel = page.quote_cta_label || "Request a quote";

  return (
    <div className="flex flex-col gap-16 px-page pt-28 pb-16 sm:pt-36 sm:pb-20 lg:gap-24 lg:pt-41 lg:pb-24">
      <header className="flex w-full flex-col gap-3">
        <h1 className="font-display text-3xl font-bold tracking-wide text-brand-primary uppercase sm:text-4xl lg:text-5xl">
          Profiles
        </h1>
        <p className="max-w-2xl text-base text-text-primary/70 sm:text-lg">
          Explore Koda horizontal, vertical, and universal fiberglass siding
          profiles.
        </p>
      </header>

      <ProfileSheet
        headline={page.horizontal.headline || "Horizontal profiles"}
        helper={page.horizontal.helper || "Open a profile to learn more"}
        profiles={horizontal}
        onLearnMore={setSelected}
        priorityCount={5}
      />
      <ProfileSheet
        headline={page.vertical.headline || "Vertical profiles"}
        helper={page.vertical.helper || "Open a profile to learn more"}
        profiles={vertical}
        onLearnMore={setSelected}
      />
      <ProfileSheet
        headline={page.universal?.headline || "Universal profiles"}
        helper={page.universal?.helper || "Open a profile to learn more"}
        profiles={universal}
        onLearnMore={setSelected}
      />

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={openQuote}
          className="rounded-md border border-transparent bg-accent-warm px-8 py-3 font-display text-sm tracking-[0.04em] text-text-primary uppercase"
        >
          {quoteLabel}
        </button>
      </div>

      {selected ? (
        <ProfileDetailModal
          profile={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
