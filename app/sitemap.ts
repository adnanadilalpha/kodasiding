import type { MetadataRoute } from "next";
import { loadSeoContext, resolveSiteUrl } from "@/lib/cms/seo-metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { seo, showFindDealer } = await loadSeoContext();
  const base = resolveSiteUrl(seo.site_url);
  const origin = base?.origin ?? "";

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: origin ? `${origin}/` : "/",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: origin ? `${origin}/profiles` : "/profiles",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  if (showFindDealer) {
    entries.push({
      url: origin ? `${origin}/find-dealer` : "/find-dealer",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}
