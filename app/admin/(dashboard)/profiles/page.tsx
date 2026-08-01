import { getMediaMap } from "@/lib/cms/media";
import { createClient } from "@/lib/supabase/server";
import type { PageProfiles, ProfileSheetCopy } from "@/lib/cms/types";
import { ProfileSheetEditor } from "@/components/admin/profiles-editor";
import { SectionShell } from "@/components/admin/section-shell";

const defaultSheet = (headline: string): ProfileSheetCopy => ({
  headline,
  helper: "Hover on profile to learn more",
});

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: sectionParam } = await searchParams;
  const supabase = await createClient();
  const [{ data: page }, { data: profiles }] = await Promise.all([
    supabase.from("page_profiles").select("*").eq("id", 1).single(),
    supabase
      .from("profiles")
      .select(
        "id, slug, name, reveal, orientation, description, hover_copy, image_media_id, diagram_media_id, sort_order, is_published, show_on_home",
      )
      .order("sort_order"),
  ]);

  const pageProfiles = page as PageProfiles | null;
  const horizontal = (pageProfiles?.horizontal ??
    defaultSheet("Horizontal profiles")) as ProfileSheetCopy;
  const vertical = (pageProfiles?.vertical ??
    defaultSheet("Vertical profiles")) as ProfileSheetCopy;

  const media = await getMediaMap([
    ...(profiles ?? []).map((p) => p.image_media_id),
    ...(profiles ?? []).map((p) => p.diagram_media_id),
  ]);

  const mapped = (profiles ?? []).map((profile) => ({
    ...profile,
    imagePath: profile.image_media_id
      ? media[profile.image_media_id]?.path
      : null,
    diagramPath: profile.diagram_media_id
      ? media[profile.diagram_media_id]?.path
      : null,
  }));

  const horizontalProfiles = mapped.filter(
    (p) => p.orientation === "horizontal",
  );
  const verticalProfiles = mapped.filter((p) => p.orientation === "vertical");

  return (
    <SectionShell
      title="Profiles"
      defaultSectionId={sectionParam}
      sections={[
        {
          id: "horizontal",
          label: "Horizontal",
          count: horizontalProfiles.length,
          content: (
            <ProfileSheetEditor
              orientation="horizontal"
              sheet={horizontal}
              profiles={horizontalProfiles}
            />
          ),
        },
        {
          id: "vertical",
          label: "Vertical",
          count: verticalProfiles.length,
          content: (
            <ProfileSheetEditor
              orientation="vertical"
              sheet={vertical}
              profiles={verticalProfiles}
              showCtas
              quoteCtaLabel={pageProfiles?.quote_cta_label ?? "Request a quote"}
              manualCtaLabel={
                pageProfiles?.manual_cta_label ?? "Download manual"
              }
            />
          ),
        },
      ]}
    />
  );
}
