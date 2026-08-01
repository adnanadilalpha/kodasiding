import Image from "next/image";
import type { HomeVideosSection, Video } from "@/lib/cms/types";
import { safeHref } from "@/lib/cms/safe-href";

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
              const thumb = video.thumbnail_media_id
                ? thumbs[video.thumbnail_media_id]
                : null;
              return (
                <li key={video.id} className="flex flex-col gap-6 lg:gap-8">
                  <h3 className="text-xl leading-[1.1] font-bold text-text-primary sm:text-2xl lg:text-[28px]">
                    {video.title}
                  </h3>
                  <a
                    href={
                      video.video_url
                        ? safeHref(video.video_url, "") || undefined
                        : undefined
                    }
                    target={video.video_url ? "_blank" : undefined}
                    rel={video.video_url ? "noreferrer" : undefined}
                    className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[20px] bg-bg-secondary"
                  >
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                    ) : null}
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
                  </a>
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
    </section>
  );
}
