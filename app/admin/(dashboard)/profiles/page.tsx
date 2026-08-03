import { getMediaMap } from "@/lib/cms/media";
import { compareProfiles } from "@/lib/cms/profile-sort";
import { createClient } from "@/lib/supabase/server";
import type { PageProfiles, ProfileSheetCopy } from "@/lib/cms/types";
import { ProfileSheetEditor } from "@/components/admin/profiles-editor";
import { SectionShell } from "@/components/admin/section-shell";

const defaultSheet = (headline: string): ProfileSheetCopy => ({
  headline,
  helper: "Hover on profile to learn more",
});

const PROFILE_SELECT =
  "id, slug, name, reveal, orientation, description, hover_copy, exposure, face_width, depth, install, image_media_id, diagram_media_id, sort_order, is_published, show_on_home";

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: sectionParam } = await searchParams;
  const supabase = await createClient();
  const [{ data: page }, { data: profiles }] = await Promise.all([
    supabase.from("page_profiles").select("*").eq("id", 1).single(),
    supabase.from("profiles").select(PROFILE_SELECT).order("sort_order"),
  ]);

  const pageProfiles = page as PageProfiles | null;
  const horizontal = (pageProfiles?.horizontal ??
    defaultSheet("Horizontal profiles")) as ProfileSheetCopy;
  const vertical = (pageProfiles?.vertical ??
    defaultSheet("Vertical profiles")) as ProfileSheetCopy;
  const universal = (pageProfiles?.universal ??
    defaultSheet("Universal profiles")) as ProfileSheetCopy;

  const media = await getMediaMap([
    ...(profiles ?? []).map((p) => p.image_media_id),
    ...(profiles ?? []).map((p) => p.diagram_media_id),
  ]);

  const mapped = (profiles ?? []).map((profile) => ({
    ...profile,
    exposure: profile.exposure ?? "",
    face_width: profile.face_width ?? "",
    depth: profile.depth ?? "",
    install: profile.install ?? "",
    imagePath: profile.image_media_id
      ? media[profile.image_media_id]?.path
      : null,
    diagramPath: profile.diagram_media_id
      ? media[profile.diagram_media_id]?.path
      : null,
  }));

  const horizontalProfiles = mapped
    .filter((p) => p.orientation === "horizontal")
    .sort(compareProfiles);
  const verticalProfiles = mapped
    .filter((p) => p.orientation === "vertical")
    .sort(compareProfiles);
  const universalProfiles = mapped
    .filter((p) => p.orientation === "universal")
    .sort(compareProfiles);

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
            />
          ),
        },
        {
          id: "universal",
          label: "Universal",
          count: universalProfiles.length,
          content: (
            <ProfileSheetEditor
              orientation="universal"
              sheet={universal}
              profiles={universalProfiles}
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
