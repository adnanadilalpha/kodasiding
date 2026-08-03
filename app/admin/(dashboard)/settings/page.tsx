import {
  saveFooterSettings,
  saveNavSettings,
  saveSeoSettings,
} from "@/lib/cms/actions";
import { requireAdmin } from "@/lib/auth/admin";
import { getMediaMap } from "@/lib/cms/media";
import {
  FIND_DEALER_HREF,
  FOOTER_LINK_SLOTS,
  NAV_LINK_SLOTS,
  labelsForSlots,
} from "@/lib/cms/nav-slots";
import { createClient } from "@/lib/supabase/server";
import type { SiteSeo, SiteSettings } from "@/lib/cms/types";
import { FooterSocialEditor } from "@/components/admin/footer-social-editor";
import { MediaField } from "@/components/admin/media-field";
import {
  SectionShell,
  type SectionTab,
} from "@/components/admin/section-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextArea, TextInput } from "@/components/ui/field";

const defaultSeo: SiteSeo = {
  title: "Koda Siding",
  title_template: "%s | Koda Siding",
  description:
    "Engineered fiberglass siding with the appearance of wood and performance that lasts a lifetime.",
  site_url: "",
  og_image_media_id: null,
};

function LinkLabelGrid({
  prefix,
  slots,
  labels,
}: {
  prefix: string;
  slots: readonly { href: string; defaultLabel: string }[];
  labels: string[];
}) {
  return (
    <ul className="grid gap-3.5 sm:grid-cols-2">
      {slots.map((slot, i) => (
        <li key={slot.href} className="flex min-w-0 flex-col gap-1.5">
          <Field label="Name">
            <TextInput
              name={`${prefix}_${i}`}
              defaultValue={labels[i] ?? slot.defaultLabel}
              placeholder={slot.defaultLabel}
            />
          </Field>
          <p className="truncate font-mono text-xs text-text-primary/40">
            {slot.href}
          </p>
        </li>
      ))}
    </ul>
  );
}

function LockedHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 truncate font-mono text-xs text-text-primary/40">
      {children}
    </p>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: sectionParam } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const s = settings as SiteSettings;
  const seo: SiteSeo = { ...defaultSeo, ...s.seo };
  const navLabels = labelsForSlots(NAV_LINK_SLOTS, s.nav.links);
  const footerLabels = labelsForSlots(FOOTER_LINK_SLOTS, s.footer.links);
  const media = await getMediaMap([seo.og_image_media_id]);

  const sections: SectionTab[] = [
    {
      id: "navigation",
      label: "Navigation",
      content: (
        <form action={saveNavSettings} className="flex flex-col gap-5">
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-5">
              <FieldGroup title="Brand">
                <Field label="Logo alt text">
                  <TextInput
                    name="logo_alt"
                    defaultValue={s.nav.logo_alt}
                    placeholder="Koda Siding"
                  />
                </Field>
              </FieldGroup>

              <FieldGroup title="Header buttons" columns={2}>
                <div>
                  <Field label="Find dealer">
                    <TextInput
                      name="find_dealer_label"
                      defaultValue={s.nav.find_dealer_label}
                      placeholder="Find a dealer"
                    />
                  </Field>
                  <LockedHint>{FIND_DEALER_HREF}</LockedHint>
                  <label className="mt-3 flex items-start gap-2.5 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      name="show_find_dealer"
                      defaultChecked={s.nav.show_find_dealer === true}
                      className="mt-0.5"
                    />
                    <span>
                      Enable Find a dealer page + nav CTA
                      <span className="mt-0.5 block text-xs text-text-primary/40">
                        Off = /find-dealer is unavailable and nav CTA is hidden.
                      </span>
                    </span>
                  </label>
                </div>
                <div>
                  <Field label="Quote button">
                    <TextInput
                      name="quote_label"
                      defaultValue={s.nav.quote_label}
                      placeholder="Request a quote"
                    />
                  </Field>
                  <LockedHint>Opens quote modal</LockedHint>
                </div>
              </FieldGroup>
            </div>

            <FieldGroup title="Menu names" className="lg:min-h-full">
              <LinkLabelGrid
                prefix="nav_label"
                slots={NAV_LINK_SLOTS}
                labels={navLabels}
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
      id: "footer",
      label: "Footer",
      content: (
        <form action={saveFooterSettings} className="flex flex-col gap-5">
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <FieldGroup title="Copy">
              <Field label="Tagline">
                <TextInput
                  name="footer_tagline"
                  defaultValue={s.footer.tagline}
                  placeholder="Engineered fiberglass siding"
                />
              </Field>
              <Field label="Copyright">
                <TextInput
                  name="footer_copyright"
                  defaultValue={s.footer.copyright}
                  placeholder="© 2026 Koda Siding. All rights reserved."
                />
              </Field>
            </FieldGroup>

            <FieldGroup title="Link names">
              <LinkLabelGrid
                prefix="footer_label"
                slots={FOOTER_LINK_SLOTS}
                labels={footerLabels}
              />
            </FieldGroup>
          </div>

          <FieldGroup title="Social">
            <FooterSocialEditor initial={s.footer.social ?? []} />
          </FieldGroup>

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
        <form action={saveSeoSettings} className="flex flex-col gap-5">
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <FieldGroup title="Search">
              <Field label="Default title">
                <TextInput
                  name="seo_title"
                  defaultValue={seo.title}
                  placeholder="Koda Siding"
                />
              </Field>
              <Field label="Title template">
                <TextInput
                  name="seo_title_template"
                  defaultValue={seo.title_template}
                  placeholder="%s | Koda Siding"
                />
              </Field>
              <p className="text-sm text-text-primary/45">
                Use <code className="text-brand-primary">%s</code> for the page
                title. Maps to Next.js{" "}
                <code className="text-brand-primary">
                  metadata.title.template
                </code>
                .
              </p>
              <Field label="Meta description">
                <TextArea
                  name="seo_description"
                  rows={4}
                  defaultValue={seo.description}
                  placeholder="One or two sentences for search results (~150–160 chars)."
                />
              </Field>
            </FieldGroup>

            <FieldGroup title="Sharing">
              <Field label="Site URL">
                <TextInput
                  name="seo_site_url"
                  defaultValue={seo.site_url}
                  placeholder="https://kodasiding.com"
                />
              </Field>
              <p className="text-sm text-text-primary/45">
                Canonical origin for Open Graph URLs (
                <code className="text-brand-primary">metadataBase</code>).
              </p>
              <MediaField
                name="seo_og_image_media_id"
                label="Social share image"
                hint="Recommended 1200×630. Used for Open Graph / link previews."
                aspect="wide"
                compact
                initialId={seo.og_image_media_id}
                initialPath={
                  seo.og_image_media_id
                    ? media[seo.og_image_media_id]?.path
                    : null
                }
              />
            </FieldGroup>
          </div>

          <div className="pt-1">
            <Button type="submit">Save</Button>
          </div>
        </form>
      ),
    },
  ];

  // Old deep-links to ?section=admins → dedicated page
  const section =
    sectionParam === "admins" ? "navigation" : sectionParam;

  return (
    <SectionShell
      title="Site settings"
      defaultSectionId={section}
      sections={sections}
    />
  );
}
