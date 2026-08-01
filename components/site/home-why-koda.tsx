import Image from "next/image";
import type { HomeWhyKoda } from "@/lib/cms/types";

export function HomeWhyKodaSection({
  why,
  imageUrl,
}: {
  why: HomeWhyKoda;
  imageUrl: string;
}) {
  return (
    <section id="why-koda" className="scroll-mt-16 bg-bg-primary py-12 lg:scroll-mt-24 lg:py-24">
      <div className="grid w-full gap-12 px-page lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-10 lg:gap-12">
          <div className="flex flex-col gap-4 text-text-primary">
            <h2 className="font-display text-[1.75rem] leading-[1.3] font-bold uppercase sm:text-4xl lg:text-5xl">
              {why.headline}
            </h2>
            <p className="text-base leading-[1.4] lg:max-w-xl lg:text-lg">
              {why.body}
            </p>
          </div>
          <ul className="flex flex-col">
            {(why.features ?? []).map((feature) => (
              <li
                key={feature.number + feature.title}
                className="border-t border-[#1e2e28] pt-3 pb-6"
              >
                <div className="flex gap-6">
                  <span className="shrink-0 pt-0.5 text-sm text-text-primary lg:text-base">
                    {feature.number}
                  </span>
                  <div className="flex flex-col gap-3 lg:gap-4">
                    <p className="text-xl leading-none font-bold text-text-primary lg:text-[30px]">
                      {feature.title}
                    </p>
                    <p className="text-base leading-[1.4] text-text-primary lg:text-lg">
                      {feature.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative aspect-4/5 min-h-85 overflow-hidden rounded-lg lg:aspect-auto lg:min-h-168 lg:rounded-lg">
          <Image
            src={imageUrl}
            alt=""
            fill
            quality={95}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  );
}
