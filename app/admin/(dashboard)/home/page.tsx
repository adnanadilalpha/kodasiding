import {
  saveHomeCtas,
  saveHomeHero,
  saveHomePageSeo,
} from "@/lib/cms/actions";
import { getMediaMap } from "@/lib/cms/media";
import { LANDING_FALLBACKS, jewelFallback } from "@/lib/cms/landing-fallbacks";
import {
  DEFAULT_HOME_PAGE_SEO,
  mergePageSeo,
} from "@/lib/cms/page-seo-defaults";
import { createClient } from "@/lib/supabase/server";
import type { HomeWhyKoda, PageHome } from "@/lib/cms/types";
import { HomeProfilesEditor } from "@/components/admin/home-profiles-editor";
import {
  InstallCoverageEditor,
  InstallHeroEditor,
} from "@/components/admin/installation-editor";
import { MediaField } from "@/components/admin/media-field";
import { PageSeoEditor } from "@/components/admin/page-seo-editor";
import { PartnersEditor } from "@/components/admin/partners-editor";
import { SectionShell } from "@/components/admin/section-shell";
import { WhyKodaEditor } from "@/components/admin/why-koda-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { FIND_DEALER_HREF, PROFILES_HREF } from "@/lib/cms/nav-slots";
import { RichTextField } from "@/components/admin/rich-text-field";

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
  ]);

  const page = home as PageHome;
  const why = page.why_koda as HomeWhyKoda;
  const partnerRows = partners ?? [];
  const jewelRows = jewels ?? [];

  const pageSeo = mergePageSeo(DEFAULT_HOME_PAGE_SEO, page.seo);
  const installSection = page.videos_section;
  const media = await getMediaMap([
    page.hero.image_media_id,
    why.image_media_id,
    ...(why.features ?? []).map((f) => f.image_media_id ?? null),
    page.ctas.quote.image_media_id,
    page.ctas.dealer.image_media_id,
    ...partnerRows.map((p) => p.logo_media_id),
    ...jewelRows.map((j) => j.image_media_id),
    installSection?.hero_image_media_id ?? null,
    pageSeo.og_image_media_id,
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
              <div className="flex w-full flex-col gap-5">
                <div className="flex min-w-0 flex-col gap-5">
                  <FieldGroup title="Copy">
                    <Field label="Headline">
                      <RichTextField
                        name="hero_headline"
                        defaultValue={page.hero.headline}
                        placeholder="Siding built to last a lifetime."
                        minHeightClassName="min-h-12"
                      />
                    </Field>
                    <Field label="Subheadline">
                      <RichTextField
                        name="hero_subheadline"
                        defaultValue={page.hero.subheadline}
                        placeholder="Enter supporting copy"
                        minHeightClassName="min-h-24"
                      />
                    </Field>
                  </FieldGroup>
                  <FieldGroup title="Call to action">
                    <Field label="Label">
                      <RichTextField
                        name="hero_cta_label"
                        defaultValue={page.hero.cta_label}
                        placeholder="Explore Profiles"
                        minHeightClassName="min-h-12"
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
          id: "installation",
          label: "Installation",
          content: (
            <div className="flex w-full flex-col gap-8">
              <p className="text-sm text-text-primary/50">
                Homeowners who want Koda crews to install. DIY guide is under
                Installation in the sidebar.
              </p>
              <InstallHeroEditor
                headline={installSection?.headline ?? ""}
                body={installSection?.body ?? ""}
                heroServiceLabel={installSection?.hero_service_label ?? ""}
                heroImageId={installSection?.hero_image_media_id ?? null}
                heroImagePath={
                  installSection?.hero_image_media_id
                    ? (media[installSection.hero_image_media_id]?.path ?? null)
                    : null
                }
                diyLinkLabel={installSection?.diy_link_label ?? ""}
                eyebrowPrefix={installSection?.eyebrow_prefix ?? ""}
                heroImageAlt={installSection?.hero_image_alt ?? ""}
              />
              <InstallCoverageEditor
                installRadiusMiles={
                  typeof installSection?.install_radius_miles === "number"
                    ? installSection.install_radius_miles
                    : 60
                }
                citiesIntro={installSection?.cities_intro ?? ""}
                cities={installSection?.cities ?? ""}
                coverageHeading={installSection?.coverage_heading ?? ""}
                townSearchPlaceholder={
                  installSection?.town_search_placeholder ?? ""
                }
                servicesCtaLabel={installSection?.services_cta_label ?? ""}
              />
            </div>
          ),
        },
        {
          id: "ctas",
          label: "Start project",
          content: (
            <form action={saveHomeCtas} className="flex w-full flex-col gap-5">
              <FieldGroup title="Section copy">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Section heading">
                    <RichTextField
                      name="section_heading"
                      defaultValue={
                        page.ctas.section_heading || "Ready to Get Started?"
                      }
                      minHeightClassName="min-h-12"
                    />
                  </Field>
                  <Field label="Quote-only eyebrow">
                    <RichTextField
                      name="quote_only_eyebrow"
                      defaultValue={
                        page.ctas.quote_only_eyebrow || "Start your project"
                      }
                      minHeightClassName="min-h-12"
                    />
                  </Field>
                </div>
                <Field label="Section description">
                  <RichTextField
                    name="section_description"
                    defaultValue={
                      page.ctas.section_description ||
                      "Choose the path that best matches your project."
                    }
                    minHeightClassName="min-h-24"
                  />
                </Field>
              </FieldGroup>
              <div className="grid w-full gap-5 lg:grid-cols-2">
                <FieldGroup title="Quote card">
                  <div className="flex flex-col gap-3.5">
                    <div className="flex min-w-0 flex-col gap-3.5">
                      <Field label="Headline">
                        <RichTextField
                          name="quote_headline"
                          defaultValue={page.ctas.quote.headline}
                          minHeightClassName="min-h-12"
                        />
                      </Field>
                      <Field label="Body">
                        <RichTextField
                          name="quote_body"
                          defaultValue={page.ctas.quote.body}
                          minHeightClassName="min-h-24"
                        />
                      </Field>
                      <Field label="CTA label">
                        <RichTextField
                          name="quote_cta_label"
                          defaultValue={page.ctas.quote.cta_label}
                          minHeightClassName="min-h-12"
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
                  <div className="flex flex-col gap-3.5">
                    <div className="flex min-w-0 flex-col gap-3.5">
                      <Field label="Headline">
                        <RichTextField
                          name="dealer_headline"
                          defaultValue={page.ctas.dealer.headline}
                          minHeightClassName="min-h-12"
                        />
                      </Field>
                      <Field label="Body">
                        <RichTextField
                          name="dealer_body"
                          defaultValue={page.ctas.dealer.body}
                          minHeightClassName="min-h-24"
                        />
                      </Field>
                      <Field label="CTA label">
                        <RichTextField
                          name="dealer_cta_label"
                          defaultValue={page.ctas.dealer.cta_label}
                          minHeightClassName="min-h-12"
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
        {
          id: "seo",
          label: "SEO",
          content: (
            <PageSeoEditor
              seo={pageSeo}
              media={media}
              onSave={saveHomePageSeo}
              hint="Overrides the home page title, description, and social preview. Site-wide defaults still live in Settings → SEO."
            />
          ),
        },
      ]}
    />
  );
}
