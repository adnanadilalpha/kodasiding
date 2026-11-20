import Image from "next/image";
import type { KodaVentProductDesign } from "@/lib/cms/types";
import { isSvgMedia } from "@/lib/cms/is-svg-media";

function Media({
  src,
  alt,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
}) {
  if (isSvgMedia(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      className={className}
    />
  );
}

/** Benefit labels used when CMS annotations still hold old feature titles. */
const BENEFIT_COPY = [
  {
    id: "ann-flange",
    title: "Built for water detailing",
    problem: "Exterior penetrations need careful water management.",
    design: "Mounting flange with a documented flashing sequence",
    benefit:
      "Supports a clearly defined install with silicone and overlapping flashing tape — the same logic used at a window opening.",
  },
  {
    id: "ann-seal",
    title: "A cleaner exterior detail",
    problem: "Many exhaust covers look bulky or out of place on the wall.",
    design: "Simple square cover",
    benefit:
      "A quieter wall detail that sits flush with the siding — easy to understand without technical knowledge.",
  },
  {
    id: "ann-retrofit",
    title: "New construction or retrofit",
    problem: "New walls and finished walls need different approaches.",
    design: "Removable mounting flanges",
    benefit:
      "One product with two documented configurations — keep the flange for new construction, or score it off for retrofit.",
  },
] as const;

export function KodaVentProductDesignSection({
  section,
  imageUrl,
  imageAlt,
  caption,
}: {
  section: KodaVentProductDesign;
  imageUrl: string | null;
  imageAlt: string;
  caption: string;
}) {
  if (!section.visible) return null;

  const benefits = BENEFIT_COPY.map((benefit) => {
    const fromCms = (section.annotations ?? []).find((a) => a.id === benefit.id);
    const useCms =
      fromCms?.visible !== false &&
      fromCms?.title &&
      !/mounting flange|sealing detail|retrofit configuration/i.test(
        fromCms.title,
      );
    return {
      ...benefit,
      title: useCms ? fromCms!.title : benefit.title,
      // Prefer structured benefit copy over old feature blurbs.
      body: useCms && fromCms!.description.length > 80
        ? fromCms!.description
        : null,
    };
  });

  return (
    <section
      id="why-kodavent"
      className="scroll-mt-16 bg-brand-primary-active py-20 lg:scroll-mt-24 lg:py-28"
    >
      <div className="flex flex-col gap-14 px-page lg:gap-20">
        <header className="grid gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <p className="text-xs tracking-[0.16em] text-text-inverse/55 uppercase">
              Why KodaVent
            </p>
            <h2 className="mt-4 font-display text-3xl leading-[1.08] font-bold tracking-tight text-text-inverse uppercase sm:text-4xl lg:text-5xl">
              {section.heading}
            </h2>
          </div>
          {section.description ? (
            <p className="max-w-md self-end text-base leading-normal text-text-inverse/75 lg:col-span-5 lg:text-lg">
              {section.description}
            </p>
          ) : null}
        </header>

        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-12">
          <figure className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="relative aspect-square w-full">
              {imageUrl ? (
                <Media
                  src={imageUrl}
                  alt={imageAlt}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-contain drop-shadow-2xl"
                />
              ) : null}
            </div>
            <figcaption className="mt-4 text-xs tracking-[0.14em] text-text-inverse/45 uppercase">
              {caption}
            </figcaption>
          </figure>

          <ol className="flex flex-col gap-10 lg:col-span-7 lg:gap-12">
            {benefits.map((benefit, index) => (
              <li
                key={benefit.id}
                className="border-t border-text-inverse/15 pt-8 first:border-t-0 first:pt-0"
              >
                <p className="font-display text-xs tracking-[0.16em] text-accent-warm uppercase">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 font-display text-xl font-bold tracking-tight text-text-inverse uppercase sm:text-2xl">
                  {benefit.title}
                </h3>
                {benefit.body ? (
                  <p className="mt-4 max-w-xl text-base leading-normal text-text-inverse/75">
                    {benefit.body}
                  </p>
                ) : (
                  <div className="mt-4 flex max-w-xl flex-col gap-3 text-base leading-normal">
                    <p className="text-text-inverse/55">{benefit.problem}</p>
                    <p className="text-text-inverse">
                      <span className="text-accent-warm">Design: </span>
                      {benefit.design}
                    </p>
                    <p className="text-text-inverse/85">{benefit.benefit}</p>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
