import { saveInstallationPageSeo } from "@/lib/cms/actions";
import { createClient } from "@/lib/supabase/server";
import { getMediaMap } from "@/lib/cms/media";
import {
  DEFAULT_INSTALLATION_PAGE_SEO,
  mergePageSeo,
  mergePagesSeoBag,
} from "@/lib/cms/page-seo-defaults";
import type { PageHome, SiteSettings } from "@/lib/cms/types";
import { SectionShell } from "@/components/admin/section-shell";
import {
  InstallCoverageEditor,
  InstallHeroEditor,
  InstallManualEditor,
} from "@/components/admin/installation-editor";
import { PageSeoEditor } from "@/components/admin/page-seo-editor";
import { VideoEditorList, type VideoRow } from "@/components/admin/video-editor";

export default async function InstallationAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: sectionParam } = await searchParams;
  const supabase = await createClient();
  const [{ data: home }, { data: videos }, { data: doc }, { data: settings }] =
    await Promise.all([
      supabase.from("page_home").select("videos_section").eq("id", 1).single(),
      supabase
        .from("videos")
        .select(
          "id, title, orientation, thumbnail_media_id, video_url, sort_order, is_published",
        )
        .order("sort_order"),
      supabase
        .from("documents")
        .select("key, title, storage_path, bucket")
        .eq("key", "installation_manual")
        .maybeSingle(),
      supabase.from("site_settings").select("pages_seo").eq("id", 1).single(),
    ]);

  const page = home as Pick<PageHome, "videos_section"> | null;
  const section = page?.videos_section;
  const pagesSeo = mergePagesSeoBag(
    (settings as Pick<SiteSettings, "pages_seo"> | null)?.pages_seo,
  );
  const pageSeo = mergePageSeo(
    DEFAULT_INSTALLATION_PAGE_SEO,
    pagesSeo.installation,
  );
  const videoRows = videos ?? [];
  const media = await getMediaMap([
    ...videoRows.map((v) => v.thumbnail_media_id),
    section?.hero_image_media_id ?? null,
    pageSeo.og_image_media_id,
  ]);

  const videoList: VideoRow[] = videoRows.map((v) => ({
    ...v,
    orientation: v.orientation as "horizontal" | "vertical",
    thumbPath: v.thumbnail_media_id
      ? media[v.thumbnail_media_id]?.path
      : null,
    thumbBucket: v.thumbnail_media_id
      ? media[v.thumbnail_media_id]?.bucket
      : "media",
  }));

  return (
    <SectionShell
      title="Installation"
      defaultSectionId={sectionParam}
      sections={[
        {
          id: "hero",
          label: "Hero",
          content: (
            <InstallHeroEditor
              headline={section?.headline ?? ""}
              body={section?.body ?? ""}
              heroServiceLabel={section?.hero_service_label ?? ""}
              heroImageId={section?.hero_image_media_id ?? null}
              heroImagePath={
                section?.hero_image_media_id
                  ? (media[section.hero_image_media_id]?.path ?? null)
                  : null
              }
            />
          ),
        },
        {
          id: "coverage",
          label: "Coverage",
          content: (
            <InstallCoverageEditor
              installRadiusMiles={
                typeof section?.install_radius_miles === "number"
                  ? section.install_radius_miles
                  : 60
              }
              citiesIntro={section?.cities_intro ?? ""}
              cities={section?.cities ?? ""}
            />
          ),
        },
        {
          id: "manual",
          label: "Manual",
          content: (
            <InstallManualEditor
              manualLabel={section?.manual_label ?? ""}
              manualPath={doc?.storage_path ?? ""}
            />
          ),
        },
        {
          id: "videos",
          label: "Videos",
          count: videoList.length,
          content: (
            <div className="flex w-full flex-col gap-3">
              <p className="text-sm text-text-primary/50">
                Videos published here appear on{" "}
                <span className="font-medium text-text-primary">
                  /installation
                </span>
                . Unpublished videos stay hidden on the site.
              </p>
              <VideoEditorList addVariant="accent" videos={videoList} />
            </div>
          ),
        },
        {
          id: "seo",
          label: "SEO",
          content: (
            <PageSeoEditor
              seo={pageSeo}
              media={media}
              onSave={saveInstallationPageSeo}
            />
          ),
        },
      ]}
    />
  );
}
