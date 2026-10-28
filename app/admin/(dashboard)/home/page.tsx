import {
  saveHomeCtas,
  saveHomeHero,
} from "@/lib/cms/actions";
import { getMediaMap } from "@/lib/cms/media";
import { LANDING_FALLBACKS, jewelFallback } from "@/lib/cms/landing-fallbacks";
import { createClient } from "@/lib/supabase/server";
import type { HomeWhyKoda, PageHome } from "@/lib/cms/types";
import { HomeProfilesEditor } from "@/components/admin/home-profiles-editor";
import { MediaField } from "@/components/admin/media-field";
import { PartnersEditor } from "@/components/admin/partners-editor";
import { SectionShell } from "@/components/admin/section-shell";
import { VideosManualEditor } from "@/components/admin/videos-manual-editor";
import { WhyKodaEditor } from "@/components/admin/why-koda-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextArea, TextInput } from "@/components/ui/field";
import { FIND_DEALER_HREF, PROFILES_HREF } from "@/lib/cms/nav-slots";

function LockedHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 truncate font-mono text-xs text-text-primary/40">
      {children}
    </p>
  );
}
export default async function HomeEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: sectionParam } = await searchParams;
  const supabase = await createClient();
  const [
    { data: home },
    { data: settings },
    { data: partners },
    { data: jewels },
    { data: videos },
    { data: doc },
  ] = await Promise.all([
    supabase.from("page_home").select("*").eq("id", 1).single(),
    supabase.from("site_settings").select("partners_title, show_partners").eq("id", 1).single(),
    supabase
      .from("partners")
      .select("id, name, logo_media_id, sort_order, is_published")
      .order("sort_order"),
    supabase
      .from("home_profile_jewels")
      .select("id, name, reveal, image_media_id, sort_order, is_published")
      .order("sort_order"),
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
  ]);

  const page = home as PageHome;
  const why = page.why_koda as HomeWhyKoda;
  const partnerRows = partners ?? [];
  const jewelRows = jewels ?? [];
  const videoRows = videos ?? [];

  const media = await getMediaMap([
    page.hero.image_media_id,
    why.image_media_id,
    ...(why.features ?? []).map((f) => f.image_media_id ?? null),
    page.ctas.quote.image_media_id,
    page.ctas.dealer.image_media_id,
    ...partnerRows.map((p) => p.logo_media_id),
    ...jewelRows.map((j) => j.image_media_id),
    ...videoRows.map((v) => v.thumbnail_media_id),
  ]);

  return (
    <SectionShell
      title="Home"
      defaultSectionId={sectionParam}
      sections={[
        {
          id: "hero",
          label: "Hero",
          content: (
            <form action={saveHomeHero} className="flex w-full flex-col gap-5">
              <div className="grid w-full gap-5 lg:grid-cols-2 lg:items-stretch">
                <div className="flex min-w-0 flex-col gap-5">
                  <FieldGroup title="Copy">
                    <Field label="Headline">
                      <TextInput
                        name="hero_headline"
                        defaultValue={page.hero.headline}
                        placeholder="Siding built to last a lifetime."
                      />
                    </Field>
                    <Field label="Subheadline">
                      <TextArea
                        name="hero_subheadline"
                        rows={3}
                        defaultValue={page.hero.subheadline}
                        placeholder="Enter supporting copy"
                      />
                    </Field>
                  </FieldGroup>
                  <FieldGroup title="Call to action">
                    <Field label="Label">
                      <TextInput
                        name="hero_cta_label"
                        defaultValue={page.hero.cta_label}
                        placeholder="Explore Profiles"
                      />
                    </Field>
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary/70">Link</p>
                      <LockedHint>{PROFILES_HREF}</LockedHint>
                    </div>
                  </FieldGroup>
                </div>
                <FieldGroup title="Media" className="min-w-0 self-stretch">
                  <MediaField
                    name="hero_image_media_id"
                    label="Hero image"
                    compact
                    initialId={page.hero.image_media_id}
                    initialPath={
                      page.hero.image_media_id
                        ? media[page.hero.image_media_id]?.path
                        : null
                    }
                    initialBucket={
                      page.hero.image_media_id
                        ? media[page.hero.image_media_id]?.bucket
                        : "media"
                    }
                    fallbackSrc={LANDING_FALLBACKS.hero}
                  />
                </FieldGroup>
              </div>
              <div className="pt-1">
                <Button type="submit">Save</Button>
              </div>
            </form>
          ),
        },
        {
          id: "partners",
          label: "Partners",
          content: (
            <PartnersEditor
              title={settings?.partners_title ?? ""}
              showPartners={settings?.show_partners !== false}
              partners={partnerRows.map((partner) => ({
                ...partner,
                logoPath: partner.logo_media_id
                  ? media[partner.logo_media_id]?.path
                  : null,
              }))}
            />
          ),
        },
        {
          id: "why-koda",
          label: "Why Koda",
          content: (
            <WhyKodaEditor why={why} media={media} />
          ),
        },
        {
          id: "profiles",
          label: "Profiles",
          content: (
            <HomeProfilesEditor
              teaser={page.profiles_teaser}
              jewels={jewelRows.map((jewel, i) => ({
                ...jewel,
                imagePath: jewel.image_media_id
                  ? media[jewel.image_media_id]?.path
                  : null,
                fallbackSrc: jewelFallback(i),
              }))}
            />
          ),
        },
        {
          id: "videos",
          label: "Videos & manual",
          content: (
            <VideosManualEditor
              headline={page.videos_section.headline}
              body={page.videos_section.body}
              manualLabel={page.videos_section.manual_label}
              manualPath={doc?.storage_path ?? ""}
              videos={videoRows.map((v) => ({
                ...v,
                orientation: v.orientation as "horizontal" | "vertical",
                thumbPath: v.thumbnail_media_id
                  ? media[v.thumbnail_media_id]?.path
                  : null,
                thumbBucket: v.thumbnail_media_id
                  ? media[v.thumbnail_media_id]?.bucket
                  : "media",
              }))}
            />
          ),
        },
        {
          id: "ctas",
          label: "Start project",
          content: (
            <form action={saveHomeCtas} className="flex w-full flex-col gap-5">
              <div className="grid w-full gap-5 lg:grid-cols-2">
                <FieldGroup title="Quote card">
                  <div className="grid gap-3 md:grid-cols-2 md:items-stretch">
                    <div className="flex min-w-0 flex-col gap-3.5">
                      <Field label="Headline">
                        <TextInput
                          name="quote_headline"
                          defaultValue={page.ctas.quote.headline}
                        />
                      </Field>
                      <Field label="Body">
                        <TextArea
                          name="quote_body"
                          rows={2}
                          defaultValue={page.ctas.quote.body}
                        />
                      </Field>
                      <Field label="CTA label">
                        <TextInput
                          name="quote_cta_label"
                          defaultValue={page.ctas.quote.cta_label}
                        />
                      </Field>
                    </div>
                    <MediaField
                      name="quote_image_media_id"
                      label="Image"
                      compact
                      initialId={page.ctas.quote.image_media_id}
                      initialPath={
                        page.ctas.quote.image_media_id
                          ? media[page.ctas.quote.image_media_id]?.path
                          : null
                      }
                      fallbackSrc={LANDING_FALLBACKS.ctaQuote}
                    />
                  </div>
                </FieldGroup>

                <FieldGroup title="Dealer card">
                  <label className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      name="show_dealer"
                      defaultChecked={page.ctas.show_dealer === true}
                      className="mt-0.5"
                    />
                    <span>
                      Show on landing page
                      <span className="mt-0.5 block text-xs text-text-primary/40">
                        Keep off until real dealers are live. Takes effect on Save.
                      </span>
                    </span>
                  </label>
                  <div className="grid gap-3 md:grid-cols-2 md:items-stretch">
                    <div className="flex min-w-0 flex-col gap-3.5">
                      <Field label="Headline">
                        <TextInput
                          name="dealer_headline"
                          defaultValue={page.ctas.dealer.headline}
                        />
                      </Field>
                      <Field label="Body">
                        <TextArea
                          name="dealer_body"
                          rows={2}
                          defaultValue={page.ctas.dealer.body}
                        />
                      </Field>
                      <Field label="CTA label">
                        <TextInput
                          name="dealer_cta_label"
                          defaultValue={page.ctas.dealer.cta_label}
                        />
                      </Field>
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary/70">CTA link</p>
                        <LockedHint>{FIND_DEALER_HREF}</LockedHint>
                      </div>
                    </div>
                    <MediaField
                      name="dealer_image_media_id"
                      label="Image"
                      compact
                      initialId={page.ctas.dealer.image_media_id}
                      initialPath={
                        page.ctas.dealer.image_media_id
                          ? media[page.ctas.dealer.image_media_id]?.path
                          : null
                      }
                      fallbackSrc={LANDING_FALLBACKS.ctaDealer}
                    />
                  </div>
                </FieldGroup>
              </div>
              <div className="pt-1">
                <Button type="submit">Save</Button>
              </div>
            </form>
          ),
        },
      ]}
    />
  );
}
