import { saveFindDealerVisibility } from "@/lib/cms/actions";
import { FIND_DEALER_HREF } from "@/lib/cms/nav-slots";
import { createClient } from "@/lib/supabase/server";
import type { PageHome, SiteSettings } from "@/lib/cms/types";
import { DealersEditor } from "@/components/admin/dealers-editor";
import { SectionShell } from "@/components/admin/section-shell";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

export default async function DealerPage() {
  const supabase = await createClient();
  const [{ data: dealers }, { data: settings }, { data: home }] =
    await Promise.all([
      supabase
        .from("dealers")
        .select(
          "id, name, address, city, region, postal, lat, lng, phone, website, is_published",
        )
        .order("name"),
      supabase.from("site_settings").select("nav").eq("id", 1).single(),
      supabase.from("page_home").select("ctas").eq("id", 1).single(),
    ]);

  const nav = (settings as SiteSettings | null)?.nav;
  const ctas = (home as PageHome | null)?.ctas;

  return (
    <SectionShell
      title="Find dealer"
      sections={[
        {
          id: "visibility",
          label: "Landing page",
          content: (
            <form
              action={saveFindDealerVisibility}
              className="flex flex-col gap-5"
            >
              <FieldGroup title="Show on landing page">
                <label className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    name="show_find_dealer"
                    defaultChecked={nav?.show_find_dealer === true}
                    className="mt-0.5"
                  />
                  <span>
                    Nav “Find a dealer” button
                    <span className="mt-0.5 block font-mono text-xs text-text-primary/40">
                      {FIND_DEALER_HREF}
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
          id: "dealers",
          label: "Dealers",
          count: (dealers ?? []).length,
          content: <DealersEditor dealers={dealers ?? []} />,
        },
      ]}
    />
  );
}
