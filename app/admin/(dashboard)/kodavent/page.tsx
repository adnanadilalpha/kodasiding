import { createClient } from "@/lib/supabase/server";
import { getMediaMap } from "@/lib/cms/media";
import { DEFAULT_PAGE_KODAVENT, collectKodaVentMediaIds } from "@/lib/cms/kodavent-defaults";
import type { DocumentRow, PageKodaVent } from "@/lib/cms/types";
import { SectionShell } from "@/components/admin/section-shell";
import {
  KodaVentCtaEditor,
  KodaVentHeroEditor,
  KodaVentInstallationEditor,
  KodaVentProductDesignEditor,
  KodaVentSeoEditor,
} from "@/components/admin/kodavent-editor";

function mergePage(row: PageKodaVent | null): PageKodaVent {
  const base = DEFAULT_PAGE_KODAVENT;
  if (!row) return base;
  return {
    id: row.id ?? 1,
    hero: { ...base.hero, ...row.hero },
    product_design: {
      ...base.product_design,
      ...row.product_design,
      annotations:
        row.product_design?.annotations ?? base.product_design.annotations,
    },
    installed: {
      ...base.installed,
      ...row.installed,
      eyebrow: row.installed?.eyebrow || base.installed.eyebrow,
      badge_label: row.installed?.badge_label || base.installed.badge_label,
      figure_title: row.installed?.figure_title || base.installed.figure_title,
      traits: row.installed?.traits?.length
        ? row.installed.traits
        : base.installed.traits,
    },
    installation: {
      ...base.installation,
      ...row.installation,
      methods: row.installation?.methods ?? base.installation.methods,
    },
    cta: { ...base.cta, ...row.cta },
    seo: { ...base.seo, ...row.seo },
    updated_at: row.updated_at,
  };
}

export default async function KodaVentAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section: sectionParam } = await searchParams;
  const supabase = await createClient();
  const [{ data: pageRow }, { data: docs }] = await Promise.all([
    supabase.from("page_kodavent").select("*").eq("id", 1).single(),
    supabase
      .from("documents")
      .select("id, key, title, storage_path, bucket")
      .in("key", ["kodavent_new_construction", "kodavent_retrofit"]),
  ]);

  const page = mergePage(pageRow as PageKodaVent | null);
  const documents = (docs ?? []) as DocumentRow[];
  const media = await getMediaMap(collectKodaVentMediaIds(page));

  return (
    <SectionShell
      title="KodaVent"
      defaultSectionId={sectionParam}
      sections={[
        {
          id: "hero",
          label: "Hero",
          content: <KodaVentHeroEditor hero={page.hero} media={media} />,
        },
        {
          id: "product-design",
          label: "Why KodaVent",
          content: (
            <KodaVentProductDesignEditor
              section={page.product_design}
              installed={page.installed}
              media={media}
            />
          ),
        },
        {
          id: "installation",
          label: "Installation",
          content: (
            <KodaVentInstallationEditor
              section={page.installation}
              media={media}
              documents={documents}
            />
          ),
        },
        {
          id: "cta",
          label: "Order now",
          content: (
            <KodaVentCtaEditor
              cta={page.cta}
              packaging={page.product_design}
              media={media}
            />
          ),
        },
        {
          id: "seo",
          label: "SEO",
          content: <KodaVentSeoEditor seo={page.seo} media={media} />,
        },
      ]}
    />
  );
}
