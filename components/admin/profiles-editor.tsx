"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteProfile,
  saveProfilesSection,
  upsertProfile,
} from "@/lib/cms/actions";
import { isSvgMedia } from "@/lib/cms/is-svg-media";
import { publicMediaUrl } from "@/lib/cms/urls";
import { MediaField } from "@/components/admin/media-field";
import { SectionHeaderAction } from "@/components/admin/section-header-action";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextArea, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

function Thumb({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) {
  const className = "max-h-20 w-auto object-contain";
  if (isSvgMedia(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" width={width} height={height} className={className} />
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      className={className}
    />
  );
}

export type ProfileItem = {
  id: string;
  slug: string;
  name: string;
  reveal: string;
  orientation: string;
  description: string;
  hover_copy: string;
  exposure: string;
  face_width: string;
  depth: string;
  install: string;
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

type SheetOrientation = "horizontal" | "vertical" | "universal";
type FormTab = "tile" | "details";

function ProfileTileForm({
  profile,
  orientation,
  nextSort,
}: {
  profile?: ProfileItem;
  orientation: SheetOrientation;
  nextSort: number;
}) {
  const [tab, setTab] = useState<FormTab>("tile");
  const namePlaceholder =
    orientation === "horizontal"
      ? 'H4 3" Double Lap'
      : orientation === "vertical"
        ? 'V4 7" V Groove'
        : "U1 Edge Trim";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 rounded-md border border-brand-primary/10 bg-bg-secondary p-1">
        {(
          [
            { id: "tile", label: "Tile" },
            { id: "details", label: "Details" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded px-3 py-1.5 text-sm transition ${
              tab === item.id
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-primary/55 hover:text-text-primary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={tab === "tile" ? "flex flex-col gap-5" : "hidden"}>
        <FieldGroup title="Tile" columns={2}>
          <Field label="Label">
            <TextInput
              name="name"
              required
              defaultValue={profile?.name}
              placeholder={namePlaceholder}
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

        <FieldGroup title="3D cutout">
          <MediaField
            name="image_media_id"
            label="Cutout"
            hint="JPG · PNG · WebP · SVG · Shown on the profile tile"
            compact
            initialId={profile?.image_media_id}
            initialPath={profile?.imagePath}
          />
        </FieldGroup>
      </div>

      <div className={tab === "details" ? "flex flex-col gap-5" : "hidden"}>
        <FieldGroup title="Specs" columns={3}>
          <Field label="Face width">
            <TextInput
              name="face_width"
              defaultValue={profile?.face_width}
              placeholder='3 1/2"'
            />
          </Field>
          <Field label="Depth">
            <TextInput
              name="depth"
              defaultValue={profile?.depth}
              placeholder='7/16"'
            />
          </Field>
          <Field label="Install">
            <TextInput
              name="install"
              defaultValue={profile?.install}
              placeholder="Starter Profile"
            />
          </Field>
        </FieldGroup>

        <input type="hidden" name="exposure" value={profile?.exposure ?? ""} />

        <FieldGroup title="Description">
          <Field label="Description">
            <TextArea
              name="description"
              rows={4}
              defaultValue={profile?.description}
              placeholder="Shown in the Learn more modal"
            />
          </Field>
        </FieldGroup>

        <FieldGroup title="Cross-section">
          <MediaField
            name="diagram_media_id"
            label="Diagram"
            hint="JPG · PNG · WebP · SVG · Shown in the Learn more modal"
            compact
            initialId={profile?.diagram_media_id}
            initialPath={profile?.diagramPath}
          />
        </FieldGroup>
      </div>

      <input type="hidden" name="orientation" value={orientation} />
      <input type="hidden" name="reveal" value={profile?.reveal ?? ""} />
      <input type="hidden" name="hover_copy" value={profile?.hover_copy ?? ""} />

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
}: {
  orientation: SheetOrientation;
  sheet: SheetCopy;
  profiles: ProfileItem[];
  showCtas?: boolean;
  quoteCtaLabel?: string;
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
                  : orientation === "vertical"
                    ? "Vertical profiles"
                    : "Universal profiles"
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

        {showCtas ? (
          <FieldGroup title="Page CTAs">
            <Field label="Quote button">
              <TextInput
                name="quote_cta_label"
                defaultValue={quoteCtaLabel}
                placeholder="Request a quote"
              />
            </Field>
          </FieldGroup>
        ) : null}

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
                return (
                  <li
                    key={profile.id}
                    className="flex flex-col overflow-hidden rounded-[9px] border border-brand-primary/8 bg-bg-primary/80"
                  >
                    <button
                      type="button"
                      onClick={() => setEditId(profile.id)}
                      className="flex h-28 items-center justify-center bg-bg-secondary px-3 py-3 transition hover:bg-bg-secondary/80"
                    >
                      {cutout ? (
                        <Thumb src={cutout} width={72} height={88} />
                      ) : (
                        <span className="text-xs text-text-primary/30">
                          No cutout
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
        description="Tile shows the cutout; Details holds specs, description, and cross-section."
        size="lg"
      >
        <form action={onAdd} className="flex flex-col gap-5">
          <ProfileTileForm
            key="add"
            orientation={orientation}
            nextSort={nextSort}
          />
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
        description="Tile shows the cutout; Details holds specs, description, and cross-section."
        size="lg"
      >
        {editing ? (
          <form action={onEdit} className="flex flex-col gap-5">
            <input type="hidden" name="id" value={editing.id} />
            <ProfileTileForm
              key={editing.id}
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
