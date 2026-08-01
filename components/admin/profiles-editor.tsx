"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteProfile,
  saveProfilesSection,
  upsertProfile,
} from "@/lib/cms/actions";
import { publicMediaUrl } from "@/lib/cms/urls";
import { MediaField } from "@/components/admin/media-field";
import { SectionHeaderAction } from "@/components/admin/section-header-action";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextArea, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

export type ProfileItem = {
  id: string;
  slug: string;
  name: string;
  reveal: string;
  orientation: string;
  description: string;
  hover_copy: string;
  image_media_id: string | null;
  diagram_media_id?: string | null;
  sort_order: number;
  is_published: boolean;
  show_on_home: boolean;
  imagePath?: string | null;
  diagramPath?: string | null;
};

export type SheetCopy = {
  headline: string;
  helper: string;
};

function ProfileTileForm({
  profile,
  orientation,
  nextSort,
}: {
  profile?: ProfileItem;
  orientation: "horizontal" | "vertical";
  nextSort: number;
}) {
  return (
    <div className="flex flex-col gap-5">
      <FieldGroup title="Tile" columns={2}>
        <Field label="Label">
          <TextInput
            name="name"
            required
            defaultValue={profile?.name}
            placeholder={
              orientation === "horizontal"
                ? 'H4 3" Double Lap'
                : 'V4 7" V Groove'
            }
          />
        </Field>
        <Field label="Slug">
          <TextInput
            name="slug"
            defaultValue={profile?.slug}
            placeholder="auto from label"
          />
        </Field>
        <Field label="Sort">
          <TextInput
            name="sort_order"
            type="number"
            defaultValue={profile?.sort_order ?? nextSort}
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Hover">
        <Field label="Hover copy">
          <TextArea
            name="hover_copy"
            rows={2}
            defaultValue={profile?.hover_copy}
            placeholder="Shown when visitors hover the tile"
          />
        </Field>
      </FieldGroup>

      <div className="grid gap-5 sm:grid-cols-2 sm:items-stretch">
        <FieldGroup title="3D cutout" className="min-w-0 self-stretch">
          <MediaField
            name="image_media_id"
            label="Cutout image"
            compact
            initialId={profile?.image_media_id}
            initialPath={profile?.imagePath}
          />
        </FieldGroup>
        <FieldGroup title="Diagram" className="min-w-0 self-stretch">
          <MediaField
            name="diagram_media_id"
            label="Cross-section diagram"
            compact
            initialId={profile?.diagram_media_id}
            initialPath={profile?.diagramPath}
          />
        </FieldGroup>
      </div>

      <input type="hidden" name="orientation" value={orientation} />
      <input type="hidden" name="reveal" value={profile?.reveal ?? ""} />
      <input type="hidden" name="description" value={profile?.description ?? ""} />

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={profile?.is_published ?? true}
        />
        Published
      </label>
    </div>
  );
}

export function ProfileSheetEditor({
  orientation,
  sheet,
  profiles,
  showCtas = false,
  quoteCtaLabel = "Request a quote",
  manualCtaLabel = "Download manual",
}: {
  orientation: "horizontal" | "vertical";
  sheet: SheetCopy;
  profiles: ProfileItem[];
  showCtas?: boolean;
  quoteCtaLabel?: string;
  manualCtaLabel?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const editing = profiles.find((p) => p.id === editId) ?? null;
  const nextSort =
    profiles.reduce((max, p) => Math.max(max, p.sort_order), -1) + 1;

  function refresh() {
    router.refresh();
  }

  function onSaveSection(formData: FormData) {
    formData.set("sheet", orientation);
    startTransition(async () => {
      await saveProfilesSection(formData);
      refresh();
    });
  }

  function onAdd(formData: FormData) {
    startTransition(async () => {
      await upsertProfile(formData);
      setAddOpen(false);
      refresh();
    });
  }

  function onEdit(formData: FormData) {
    startTransition(async () => {
      await upsertProfile(formData);
      setEditId(null);
      refresh();
    });
  }

  function onDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deleteProfile(fd);
      refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <form action={onSaveSection} className="flex flex-col gap-5">
        <FieldGroup title="Section header" columns={2}>
          <Field label="Headline">
            <TextInput
              name="headline"
              defaultValue={sheet.headline}
              placeholder={
                orientation === "horizontal"
                  ? "Horizontal profiles"
                  : "Vertical profiles"
              }
            />
          </Field>
          <Field label="Helper">
            <TextInput
              name="helper"
              defaultValue={sheet.helper}
              placeholder="Hover on profile to learn more"
            />
          </Field>
        </FieldGroup>

        <SectionHeaderAction>
          <Button
            size="sm"
            type="button"
            variant="accent"
            onClick={() => setAddOpen(true)}
          >
            Add tile
          </Button>
        </SectionHeaderAction>

        <div className="flex flex-col gap-3">
          {profiles.length === 0 ? (
            <div className="rounded-[9px] border border-brand-primary/8 bg-bg-primary/80 px-4 py-8 text-center text-sm text-text-primary/45">
              No tiles yet.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {profiles.map((profile) => {
                const cutout = profile.imagePath
                  ? publicMediaUrl(profile.imagePath) ?? null
                  : null;
                const diagram = profile.diagramPath
                  ? publicMediaUrl(profile.diagramPath) ?? null
                  : null;
                return (
                  <li
                    key={profile.id}
                    className="flex flex-col overflow-hidden rounded-[9px] border border-brand-primary/8 bg-bg-primary/80"
                  >
                    <button
                      type="button"
                      onClick={() => setEditId(profile.id)}
                      className="flex h-28 items-center justify-center gap-2 bg-white px-3 py-3 transition hover:bg-bg-secondary/40"
                    >
                      {cutout ? (
                        <Image
                          src={cutout}
                          alt=""
                          width={72}
                          height={88}
                          className="max-h-20 w-auto object-contain"
                        />
                      ) : (
                        <span className="text-xs text-text-primary/30">
                          No cutout
                        </span>
                      )}
                      {diagram ? (
                        <Image
                          src={diagram}
                          alt=""
                          width={56}
                          height={88}
                          className="max-h-20 w-auto object-contain"
                        />
                      ) : (
                        <span className="text-xs text-text-primary/30">
                          No diagram
                        </span>
                      )}
                    </button>
                    <div className="flex flex-1 flex-col gap-2 border-t border-brand-primary/8 px-3 py-3">
                      <p className="font-display text-sm font-semibold text-brand-primary">
                        {profile.name}
                      </p>
                      <p className="text-xs text-text-primary/45">
                        {profile.is_published ? "Published" : "Draft"}
                      </p>
                      <div className="mt-auto flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditId(profile.id)}
                          className="text-sm text-brand-primary/70 transition hover:text-brand-primary"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => onDelete(profile.id)}
                          className="text-sm text-[#ff383c] transition hover:opacity-80"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {showCtas ? (
          <FieldGroup title="Bottom actions" columns={2}>
            <Field label="Quote button">
              <TextInput
                name="quote_cta_label"
                defaultValue={quoteCtaLabel}
                placeholder="Request a quote"
              />
            </Field>
            <Field label="Manual button">
              <TextInput
                name="manual_cta_label"
                defaultValue={manualCtaLabel}
                placeholder="Download manual"
              />
            </Field>
          </FieldGroup>
        ) : null}

        <div className="pt-1">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`Add ${orientation} tile`}
        description="Label, cutout, diagram, and hover copy."
        size="lg"
      >
        <form action={onAdd} className="flex flex-col gap-5">
          <ProfileTileForm orientation={orientation} nextSort={nextSort} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add tile"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditId(null)}
        title="Edit tile"
        size="lg"
      >
        {editing ? (
          <form action={onEdit} className="flex flex-col gap-5">
            <input type="hidden" name="id" value={editing.id} />
            <ProfileTileForm
              profile={editing}
              orientation={orientation}
              nextSort={editing.sort_order}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditId(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
