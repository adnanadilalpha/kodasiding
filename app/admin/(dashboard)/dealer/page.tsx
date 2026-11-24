import {
  saveFindDealerPageCopy,
  saveFindDealerPageSeo,
  saveFindDealerVisibility,
} from "@/lib/cms/actions";
import { getMediaMap } from "@/lib/cms/media";
import { FIND_DEALER_HREF } from "@/lib/cms/nav-slots";
import {
  DEFAULT_FIND_DEALER_PAGE_SEO,
  mergeFindDealerPageCopy,
  mergePageSeo,
  mergePagesSeoBag,
} from "@/lib/cms/page-seo-defaults";
import { createClient } from "@/lib/supabase/server";
import type { PageHome, SiteSettings } from "@/lib/cms/types";
import { DealersEditor } from "@/components/admin/dealers-editor";
import { PageSeoEditor } from "@/components/admin/page-seo-editor";
import { SectionShell } from "@/components/admin/section-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { RichTextField } from "@/components/admin/rich-text-field";

export default async function DealerPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: sectionParam } = await searchParams;
  const supabase = await createClient();
  const [{ data: dealers }, { data: settings }, { data: home }] =
    await Promise.all([
      supabase
        .from("dealers")
        .select(
          "id, name, address, city, region, postal, lat, lng, phone, website, is_published",
        )
        .order("name"),
      supabase
        .from("site_settings")
        .select("nav, pages_seo")
        .eq("id", 1)
        .single(),
      supabase.from("page_home").select("ctas").eq("id", 1).single(),
    ]);

  const site = settings as SiteSettings | null;
  const nav = site?.nav;
  const ctas = (home as PageHome | null)?.ctas;
  const pageSeo = mergePageSeo(
    DEFAULT_FIND_DEALER_PAGE_SEO,
    mergePagesSeoBag(site?.pages_seo).find_dealer,
  );
  const pageCopy = mergeFindDealerPageCopy(
    site?.pages_seo?.find_dealer_copy,
  );
  const media = await getMediaMap([pageSeo.og_image_media_id]);

  return (
    <SectionShell
      title="Find dealer"
      defaultSectionId={sectionParam}
      sections={[
        {
          id: "visibility",
          label: "Landing page",
          content: (
            <form
              action={saveFindDealerVisibility}
              className="flex w-full flex-col gap-5"
            >
              <FieldGroup title="Show find dealer">
                <label className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    name="show_find_dealer"
                    defaultChecked={nav?.show_find_dealer === true}
                    className="mt-0.5"
                  />
                  <span>
                    Enable Find a dealer page + nav button
                    <span className="mt-0.5 block font-mono text-xs text-text-primary/40">
                      {FIND_DEALER_HREF}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-primary/40">
                      Off = page returns 404 and nav CTA is hidden.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    name="show_dealer"
                    defaultChecked={ctas?.show_dealer === true}
                    className="mt-0.5"
                  />
                  <span>
                    Home “Find a dealer” card
                    <span className="mt-0.5 block text-xs text-text-primary/40">
                      Keep off until you have real dealers. Takes effect on Save.
                    </span>
                  </span>
                </label>
              </FieldGroup>
              <div className="pt-1">
                <Button type="submit">Save</Button>
              </div>
            </form>
          ),
        },
        {
          id: "copy",
          label: "Page copy",
          content: (
            <form
              action={saveFindDealerPageCopy}
              className="flex w-full flex-col gap-5"
            >
              <FieldGroup title="Search">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="Search placeholder">
                    <RichTextField
                      name="search_placeholder"
                      defaultValue={pageCopy.search_placeholder}
                      minHeightClassName="min-h-12"
                    />
                  </Field>
                  <Field label="Search button label">
                    <RichTextField
                      name="search_button_label"
                      defaultValue={pageCopy.search_button_label}
                      minHeightClassName="min-h-12"
                    />
                  </Field>
                  <Field label="Quick search label">
                    <RichTextField
                      name="quick_search_label"
                      defaultValue={pageCopy.quick_search_label}
                      minHeightClassName="min-h-12"
                    />
                  </Field>
                  <Field label="Empty results message">
                    <RichTextField
                      name="empty_results"
                      defaultValue={pageCopy.empty_results}
                      minHeightClassName="min-h-12"
                    />
                  </Field>
                </div>
              </FieldGroup>
              <FieldGroup title="Dealer card buttons">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="Call label">
                    <RichTextField
                      name="call_label"
                      defaultValue={pageCopy.call_label}
                      minHeightClassName="min-h-12"
                    />
                  </Field>
                  <Field label="Directions label">
                    <RichTextField
                      name="directions_label"
                      defaultValue={pageCopy.directions_label}
                      minHeightClassName="min-h-12"
                    />
                  </Field>
                </div>
              </FieldGroup>
              <div className="pt-1">
                <Button type="submit">Save</Button>
              </div>
            </form>
          ),
        },
        {
          id: "dealers",
          label: "Dealers",
          count: (dealers ?? []).length,
          content: <DealersEditor dealers={dealers ?? []} />,
        },
        {
          id: "seo",
          label: "SEO",
          content: (
            <PageSeoEditor
              seo={pageSeo}
              media={media}
              onSave={saveFindDealerPageSeo}
            />
          ),
        },
      ]}
    />
  );
}
