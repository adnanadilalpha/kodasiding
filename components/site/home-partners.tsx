import Image from "next/image";
import type { Partner } from "@/lib/cms/types";

export function HomePartnersSection({
  title,
  partners,
  logos,
}: {
  title: string;
  partners: Partner[];
  logos: Record<string, string | null>;
}) {
  if (!partners.length) return null;

  const track = [...partners, ...partners];

  return (
    <section className="border-y border-brand-primary/13 bg-bg-primary py-12 lg:py-10">
      <div className="flex flex-col items-center gap-6 lg:gap-8">
        <h2 className="px-page text-center text-xl font-bold text-brand-primary/80 uppercase sm:text-2xl lg:text-3xl">
          {title}
        </h2>
        <div className="relative w-full overflow-hidden">
          <div className="partners-marquee flex w-max items-center gap-16 px-10">
            {track.map((partner, i) => {
              const src = partner.logo_media_id
                ? logos[partner.logo_media_id]
                : null;
              return (
                <div
                  key={`${partner.id}-${i}`}
                  className="flex shrink-0 items-center justify-center gap-2 px-4 opacity-70"
                >
                  {src ? (
                    <Image
                      src={src}
                      alt={partner.name}
                      width={140}
                      height={28}
                      className="h-5.5 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-base font-bold tracking-wide text-brand-primary uppercase">
                      {partner.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-bg-primary to-transparent sm:w-37.5" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-bg-primary to-transparent sm:w-37.5" />
        </div>
      </div>
    </section>
  );
}
