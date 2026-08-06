import { absoluteUrl, resolveSiteUrl } from "@/lib/cms/seo-metadata";
import type { SiteSeo } from "@/lib/cms/types";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd({
  seo,
  logoUrl,
}: {
  seo: SiteSeo;
  logoUrl?: string | null;
}) {
  const base = resolveSiteUrl(seo.site_url);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seo.title || "Koda Siding",
    description: seo.description,
    url: base?.origin,
  };
  if (logoUrl) {
    data.logo = logoUrl.startsWith("http")
      ? logoUrl
      : absoluteUrl(base, logoUrl);
  }
  return <JsonLd data={data} />;
}

export function WebSiteJsonLd({ seo }: { seo: SiteSeo }) {
  const base = resolveSiteUrl(seo.site_url);
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: seo.title || "Koda Siding",
        description: seo.description,
        url: base?.origin,
        publisher: {
          "@type": "Organization",
          name: seo.title || "Koda Siding",
        },
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  seo,
  items,
}: {
  seo: SiteSeo;
  items: { name: string; path: string }[];
}) {
  const base = resolveSiteUrl(seo.site_url);
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: absoluteUrl(base, item.path),
        })),
      }}
    />
  );
}
