import Image from "next/image";
import type {
  HomeWhyKoda,
  WhyFeature,
  WhyFeatureLayout,
} from "@/lib/cms/types";
import { isSvgMedia } from "@/lib/cms/is-svg-media";
import { richTextHasContent } from "@/lib/cms/sanitize-rich-text";
import { RichText } from "@/components/site/rich-text";

type FeatureCard = WhyFeature & {
  imageUrl: string | null;
  resolvedLayout: WhyFeatureLayout;
};

function resolveLayout(
  layout: WhyFeature["layout"],
  index: number,
): WhyFeatureLayout {
  if (
    layout === "image-right" ||
    layout === "image-left" ||
    layout === "image-top" ||
    layout === "image-bottom"
  ) {
    return layout;
  }
  return index % 2 === 1 ? "image-left" : "image-right";
}

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
  fullWidth = false,
}: {
  imageUrl: string | null;
  title: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-tr-[40px] rounded-bl-[40px] bg-bg-secondary ${
        fullWidth
          ? "aspect-2/1 min-h-56 sm:min-h-72 lg:min-h-96"
          : "aspect-4/3 sm:aspect-16/10 lg:aspect-4/3 lg:min-h-72"
      }`}
      aria-hidden={!imageUrl}
    >
      {imageUrl ? (
        <FeatureMedia src={imageUrl} alt={title || "Why Koda"} />
      ) : null}
    </div>
  );
}

function FeatureText({
  feature,
  centered = false,
}: {
  feature: FeatureCard;
  centered?: boolean;
}) {
  return (
    <div
      className={`flex w-full min-w-0 flex-col justify-center gap-4 text-text-primary lg:gap-5 ${
        centered ? "items-center text-center" : ""
      }`}
    >
      <RichText
        as="div"
        html={feature.title}
        className="font-display text-xl leading-tight font-bold uppercase sm:text-2xl lg:text-[1.75rem]"
      />
      <RichText
        as="p"
        html={feature.body}
        className="w-full text-base leading-normal text-text-primary/80 lg:text-lg"
      />
    </div>
  );
}

function WhyFeatureRow({ feature }: { feature: FeatureCard }) {
  const layout = feature.resolvedLayout;
  const sideMedia = (
    <FeatureImageBox imageUrl={feature.imageUrl} title={feature.title} />
  );
  const fullMedia = (
    <FeatureImageBox
      imageUrl={feature.imageUrl}
      title={feature.title}
      fullWidth
    />
  );

  if (layout === "image-top") {
    return (
      <li className="flex w-full flex-col gap-8 lg:gap-12">
        {fullMedia}
        <FeatureText feature={feature} centered />
      </li>
    );
  }

  if (layout === "image-bottom") {
    return (
      <li className="flex w-full flex-col gap-8 lg:gap-12">
        <FeatureText feature={feature} centered />
        {fullMedia}
      </li>
    );
  }

  if (layout === "image-left") {
    return (
      <li className="grid w-full items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 min-w-0 lg:order-1">{sideMedia}</div>
        <div className="order-1 min-w-0 lg:order-2">
          <FeatureText feature={feature} />
        </div>
      </li>
    );
  }

  return (
    <li className="grid w-full items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <div className="min-w-0">
        <FeatureText feature={feature} />
      </div>
      <div className="min-w-0">{sideMedia}</div>
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
    .filter(
      (feature) =>
        richTextHasContent(feature.title) || richTextHasContent(feature.body),
    )
    .map((feature, index) => {
      const imageId = feature.image_media_id ?? null;
      return {
        ...feature,
        imageUrl: (imageId && featureImages[imageId]) || null,
        resolvedLayout: resolveLayout(feature.layout, index),
      };
    });

  if (!richTextHasContent(why.headline) && cards.length === 0) return null;

  return (
    <section
      id="why-koda"
      className="scroll-mt-16 bg-bg-primary py-12 lg:scroll-mt-24 lg:py-24"
    >
      <div className="flex w-full flex-col gap-12 px-page lg:gap-20">
        {(richTextHasContent(why.headline) || richTextHasContent(why.body)) && (
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center text-text-primary">
            <RichText
              as="div"
              html={why.headline}
              className="font-display text-[1.75rem] leading-[1.3] font-bold uppercase sm:text-4xl lg:text-5xl"
            />
            <RichText
              as="p"
              html={why.body}
              className="max-w-2xl text-base leading-[1.4] text-text-primary/75 lg:text-lg"
            />
          </div>
        )}

        {cards.length > 0 ? (
          <ul className="flex w-full flex-col gap-14 lg:gap-24">
            {cards.map((feature, index) => (
              <WhyFeatureRow
                key={`${feature.title}-${index}`}
                feature={feature}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
