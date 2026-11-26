import { saveAboutPage, saveAboutPageSeo } from "@/lib/cms/actions";
import { getMediaMap } from "@/lib/cms/media";
import {
  DEFAULT_ABOUT_PAGE_SEO,
  mergeAboutPage,
  mergePageSeo,
  mergePagesSeoBag,
} from "@/lib/cms/page-seo-defaults";
import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/cms/types";
import { PageSeoEditor } from "@/components/admin/page-seo-editor";
import { RichTextField } from "@/components/admin/rich-text-field";
import { SectionShell } from "@/components/admin/section-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextArea, TextInput } from "@/components/ui/field";

export default async function ContactAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: sectionParam } = await searchParams;
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("pages_seo")
    .eq("id", 1)
    .single();

  const pagesSeo = mergePagesSeoBag(
    (settings as SiteSettings | null)?.pages_seo,
  );
  const about = mergeAboutPage(pagesSeo.about);
  const pageSeo = mergePageSeo(DEFAULT_ABOUT_PAGE_SEO, pagesSeo.about_seo);
  const media = await getMediaMap([pageSeo.og_image_media_id]);

  return (
    <SectionShell
      title="Contact"
      defaultSectionId={sectionParam}
      sections={[
        {
          id: "page",
          label: "Page",
          content: (
            <form action={saveAboutPage} className="flex w-full flex-col gap-5">
              <div className="grid w-full gap-5 lg:grid-cols-2 lg:items-start">
                <FieldGroup title="Intro" className="min-w-0 w-full">
                  <Field label="Eyebrow">
                    <RichTextField
                      name="eyebrow"
                      defaultValue={about.eyebrow}
                    />
                  </Field>
                  <Field label="Heading">
                    <RichTextField
                      name="heading"
                      defaultValue={about.heading}
                    />
                  </Field>
                  <Field label="Paragraph">
                    <RichTextField
                      name="body"
                      defaultValue={about.body}
                      minHeightClassName="min-h-36"
                    />
                  </Field>
                </FieldGroup>
                <FieldGroup title="Business details" className="min-w-0 w-full">
                  <Field label="Address">
                    <TextArea
                      name="address"
                      defaultValue={about.address}
                      rows={4}
                      placeholder="Street, city, state, ZIP"
                    />
                  </Field>
                  <Field label="Phone">
                    <TextInput
                      name="phone"
                      defaultValue={about.phone}
                      placeholder="(402) 000-0000"
                    />
                  </Field>
                  <Field label="Email">
                    <TextInput
                      name="email"
                      type="email"
                      defaultValue={about.email}
                      placeholder="hello@kodasiding.com"
                    />
                  </Field>
                  <p className="text-sm text-text-primary/45">
                    Shown beside the intro on the Contact page. The form sits on
                    the right and emails the inbox set under Email setup.
                  </p>
                </FieldGroup>
              </div>
              <FieldGroup title="Form" columns={2} className="min-w-0 w-full">
                <Field label="Form heading">
                  <TextInput
                    name="form_heading"
                    defaultValue={about.form_heading}
                  />
                </Field>
                <Field label="Name label">
                  <TextInput
                    name="name_label"
                    defaultValue={about.name_label}
                  />
                </Field>
                <Field label="Email label">
                  <TextInput
                    name="email_label"
                    defaultValue={about.email_label}
                  />
                </Field>
                <Field label="Message label">
                  <TextInput
                    name="message_label"
                    defaultValue={about.message_label}
                  />
                </Field>
                <Field label="Button">
                  <TextInput
                    name="submit_label"
                    defaultValue={about.submit_label}
                  />
                </Field>
                <Field label="Success message">
                  <TextInput
                    name="success_message"
                    defaultValue={about.success_message}
                  />
                </Field>
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
            <PageSeoEditor
              seo={pageSeo}
              media={media}
              onSave={saveAboutPageSeo}
              hint="Controls the public Contact page at /about."
            />
          ),
        },
      ]}
    />
  );
}
