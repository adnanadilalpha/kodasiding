import Image from "next/image";
import type {
  HomeWhyKoda,
  WhyFact,
  WhyFeature,
  WhyFeatureLayout,
} from "@/lib/cms/types";
import { isSvgMedia } from "@/lib/cms/is-svg-media";
import { richTextHasContent } from "@/lib/cms/sanitize-rich-text";
import { normalizeWhyFacts } from "@/lib/cms/why-koda-defaults";
import { RichText } from "@/components/site/rich-text";

type FeatureCard = WhyFeature & {
  imageUrl: string | null;
  resolvedLayout: WhyFeatureLayout;
  plainTitle: string;
  anchorId: string;
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

function plainFromHtml(html: string) {
  return String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text: string, index: number) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `why-${base || index}`;
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
        className="w-full max-w-full wrap-break-word font-display text-xl leading-tight font-bold sm:text-2xl lg:text-[1.75rem]"
      />
      <RichText
        as="p"
        html={feature.body}
        className="w-full max-w-full wrap-break-word text-base leading-normal text-text-primary/80 lg:text-lg"
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

  const centeredClass =
    "mx-auto flex w-full scroll-mt-28 flex-col gap-8 lg:max-w-7xl lg:scroll-mt-32 lg:gap-12 xl:max-w-8xl";

  if (layout === "image-top") {
    return (
      <li id={feature.anchorId} className={centeredClass}>
        {fullMedia}
        <FeatureText feature={feature} centered />
      </li>
    );
  }

  if (layout === "image-bottom") {
    return (
      <li id={feature.anchorId} className={centeredClass}>
        <FeatureText feature={feature} centered />
        {fullMedia}
      </li>
    );
  }

  const sideBySideClass =
    "mx-auto grid w-full scroll-mt-28 items-center gap-8 lg:max-w-7xl lg:scroll-mt-32 lg:grid-cols-2 lg:gap-12 xl:max-w-8xl xl:gap-16";

  if (layout === "image-left") {
    return (
      <li id={feature.anchorId} className={sideBySideClass}>
        <div className="order-2 min-w-0 lg:order-1">{sideMedia}</div>
        <div className="order-1 min-w-0 lg:order-2">
          <FeatureText feature={feature} />
        </div>
      </li>
    );
  }

  return (
    <li id={feature.anchorId} className={sideBySideClass}>
      <div className="min-w-0">
        <FeatureText feature={feature} />
      </div>
      <div className="min-w-0">{sideMedia}</div>
    </li>
  );
}

function WhyFactBanner({
  headline,
  body,
  facts,
}: {
  headline: string;
  body: string;
  facts: WhyFact[];
}) {
  const showHeadline = richTextHasContent(headline);
  const showBody = richTextHasContent(body);
  const colCount = Math.min(4, Math.max(1, facts.length));

  return (
    <div className="border-y border-brand-primary/8 bg-bg-secondary">
      <div className="mx-auto w-full max-w-7xl px-page py-16 lg:py-24 xl:max-w-8xl">
        {(showHeadline || showBody) && (
          <header className="mx-auto mb-12 flex max-w-3xl flex-col items-center gap-3 text-center lg:mb-14">
            <span
              aria-hidden
              className="h-1 w-12 rounded-full bg-accent-warm"
            />
            {showHeadline ? (
              <RichText
                as="div"
                html={headline}
                className="font-display text-[1.75rem] leading-[1.1] font-bold tracking-tight text-text-primary sm:text-4xl lg:text-5xl"
              />
            ) : null}
            {showBody ? (
              <RichText
                as="p"
                html={body}
                className="max-w-xl text-base leading-relaxed text-text-primary/60 lg:text-lg"
              />
            ) : null}
          </header>
        )}

        {/* Spec measure line — figures above, details below */}
        <ul
          className={`grid gap-y-12 gap-x-8 sm:gap-y-10 sm:gap-x-10 lg:gap-x-16 xl:gap-x-20 ${
            colCount >= 4
              ? "sm:grid-cols-2 lg:grid-cols-4"
              : colCount === 3
                ? "sm:grid-cols-3"
                : colCount === 2
                  ? "sm:grid-cols-2"
                  : ""
          }`}
        >
          {facts.map((fact, index) => (
            <li
              key={`${fact.value}-${fact.label}-${index}`}
              className="relative flex flex-col items-center text-center"
            >
              {fact.value ? (
                <p className="font-display text-2xl leading-none font-bold tracking-tight whitespace-nowrap text-text-primary sm:text-3xl">
                  {fact.value}
                </p>
              ) : (
                <p
                  className="invisible font-display text-2xl leading-none sm:text-3xl"
                  aria-hidden
                >
                  0
                </p>
              )}

              {/* Marker + line share the same center; negative inset bridges grid gaps */}
              <div className="relative z-1 mt-4 mb-4 flex h-3 w-full items-center justify-center sm:mt-5 sm:mb-5">
                <span
                  aria-hidden
                  className="absolute top-1/2 -right-4 -left-4 hidden h-px -translate-y-1/2 bg-text-primary/10 sm:-right-5 sm:-left-5 sm:block lg:-right-8 lg:-left-8 xl:-right-10 xl:-left-10"
                />
                <span
                  aria-hidden
                  className="absolute top-1/2 -right-4 -left-4 hidden h-0.5 -translate-y-1/2 bg-linear-to-r from-accent-warm/0 via-accent-warm to-accent-warm/0 sm:-right-5 sm:-left-5 sm:block lg:-right-8 lg:-left-8 xl:-right-10 xl:-left-10"
                />
                <span
                  aria-hidden
                  className="relative flex size-3 items-center justify-center"
                >
                  <span className="absolute size-6 rounded-full bg-accent-warm/30" />
                  <span className="absolute size-3 rounded-full bg-accent-warm" />
                </span>
              </div>

              <div className="flex flex-col items-center gap-2.5">
                {fact.label ? (
                  <p className="font-display text-sm font-bold tracking-widest text-text-primary sm:text-base">
                    <RichText html={fact.label} as="span" />
                  </p>
                ) : null}
                {fact.body ? (
                  <p className="max-w-58 text-base leading-relaxed text-text-primary/65 lg:text-lg">
                    <RichText html={fact.body} as="span" />
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
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
      const plainTitle = plainFromHtml(feature.title);
      return {
        ...feature,
        plainTitle,
        anchorId: slugify(plainTitle, index),
        imageUrl: (imageId && featureImages[imageId]) || null,
        resolvedLayout: resolveLayout(feature.layout, index),
      };
    });

  const facts = normalizeWhyFacts(why.facts);
  const hasBanner =
    richTextHasContent(why.headline) ||
    richTextHasContent(why.body) ||
    facts.length > 0;

  if (!hasBanner && cards.length === 0) return null;

  return (
    <section id="why-koda" className="scroll-mt-16 lg:scroll-mt-24">
      {hasBanner ? (
        <WhyFactBanner
          headline={why.headline}
          body={why.body}
          facts={facts}
        />
      ) : null}

      {cards.length > 0 ? (
        <div className="bg-bg-primary py-12 lg:py-24">
          <ul className="flex w-full flex-col gap-14 px-page lg:gap-24">
            {cards.map((feature, index) => (
              <WhyFeatureRow
                key={`${feature.anchorId}-${index}`}
                feature={feature}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
