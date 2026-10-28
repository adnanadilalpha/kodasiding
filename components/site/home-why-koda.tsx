import Image from "next/image";
import type { HomeWhyKoda, WhyFeature } from "@/lib/cms/types";
import { isSvgMedia } from "@/lib/cms/is-svg-media";

type FeatureCard = WhyFeature & {
  imageUrl: string | null;
};

function FeatureMedia({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  if (isSvgMedia(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 size-full object-cover object-center"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      quality={95}
      sizes="(max-width: 1024px) 100vw, 50vw"
      className="object-cover object-center"
    />
  );
}

function FeatureImageBox({
  imageUrl,
  title,
}: {
  imageUrl: string | null;
  title: string;
}) {
  return (
    <div
      className="relative aspect-4/3 w-full overflow-hidden rounded-tr-[40px] rounded-bl-[40px] bg-bg-secondary sm:aspect-16/10 lg:aspect-4/3 lg:min-h-72"
      aria-hidden={!imageUrl}
    >
      {imageUrl ? (
        <FeatureMedia src={imageUrl} alt={title || "Why Koda"} />
      ) : null}
    </div>
  );
}

function WhyFeatureRow({
  feature,
  index,
}: {
  feature: FeatureCard;
  index: number;
}) {
  const imageFirst = index % 2 === 1;

  const text = (
    <div className="flex flex-col justify-center gap-4 text-text-primary lg:gap-5">
      <h3 className="font-display text-xl leading-tight font-bold uppercase sm:text-2xl lg:text-[1.75rem]">
        {feature.title}
      </h3>
      {feature.body.trim() ? (
        <p className="max-w-md text-base leading-normal text-text-primary/80 lg:text-lg">
          {feature.body}
        </p>
      ) : null}
    </div>
  );

  const media = (
    <FeatureImageBox imageUrl={feature.imageUrl} title={feature.title} />
  );

  return (
    <li className="grid w-full items-center gap-8 lg:grid-cols-2 lg:gap-16">
      {imageFirst ? (
        <>
          <div className="order-2 lg:order-1">{media}</div>
          <div className="order-1 lg:order-2">{text}</div>
        </>
      ) : (
        <>
          <div>{text}</div>
          <div>{media}</div>
        </>
      )}
    </li>
  );
}

export function HomeWhyKodaSection({
  why,
  featureImages,
}: {
  why: HomeWhyKoda;
  featureImages: Record<string, string>;
}) {
  const cards = (why.features ?? [])
    .filter((feature) => feature.title.trim() || feature.body.trim())
    .map((feature) => {
      const imageId = feature.image_media_id ?? null;
      return {
        ...feature,
        imageUrl: (imageId && featureImages[imageId]) || null,
      };
    });

  if (!why.headline.trim() && cards.length === 0) return null;

  return (
    <section
      id="why-koda"
      className="scroll-mt-16 bg-bg-primary py-12 lg:scroll-mt-24 lg:py-24"
    >
      <div className="flex w-full flex-col gap-12 px-page lg:gap-20">
        {(why.headline.trim() || why.body.trim()) && (
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center text-text-primary">
            {why.headline.trim() ? (
              <h2 className="font-display text-[1.75rem] leading-[1.3] font-bold uppercase sm:text-4xl lg:text-5xl">
                {why.headline}
              </h2>
            ) : null}
            {why.body.trim() ? (
              <p className="max-w-2xl text-base leading-[1.4] text-text-primary/75 lg:text-lg">
                {why.body}
              </p>
            ) : null}
          </div>
        )}

        {cards.length > 0 ? (
          <ul className="flex w-full flex-col gap-14 lg:gap-24">
            {cards.map((feature, index) => (
              <WhyFeatureRow
                key={`${feature.title}-${index}`}
                feature={feature}
                index={index}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
