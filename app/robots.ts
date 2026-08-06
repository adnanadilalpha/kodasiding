import type { MetadataRoute } from "next";
import { loadSeoContext, resolveSiteUrl } from "@/lib/cms/seo-metadata";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { seo } = await loadSeoContext();
  const base = resolveSiteUrl(seo.site_url);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/unavailable"],
      },
    ],
    sitemap: base ? `${base.origin}/sitemap.xml` : undefined,
    host: base?.host,
  };
}
