"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteHomeProfileJewel,
  saveHomeProfilesTeaser,
  upsertHomeProfileJewel,
} from "@/lib/cms/actions";
import { isSvgMedia } from "@/lib/cms/is-svg-media";
import { publicMediaUrl } from "@/lib/cms/urls";
import { MediaField } from "@/components/admin/media-field";
import { SectionHeaderAction } from "@/components/admin/section-header-action";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextArea, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

type Teaser = {
  headline: string;
  body: string;
  cta_label: string;
  cta_href: string;
};

export type HomeJewelItem = {
  id: string;
  name: string;
  reveal: string;
  image_media_id: string | null;
  sort_order: number;
  is_published: boolean;
  imagePath?: string | null;
  fallbackSrc?: string | null;
};

/** Home Profiles section — Figma jewels only (not Profiles page catalog) */
export function HomeProfilesEditor({
  teaser,
  jewels,
}: {
  teaser: Teaser;
  jewels: HomeJewelItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const editing = jewels.find((j) => j.id === editId) ?? null;
  const nextSort =
    jewels.reduce((max, j) => Math.max(max, j.sort_order), -1) + 1;

  function refresh() {
    router.refresh();
  }

  function onSaveCopy(formData: FormData) {
    startTransition(async () => {
      await saveHomeProfilesTeaser(formData);
      refresh();
    });
  }

  function onAdd(formData: FormData) {
    startTransition(async () => {
      await upsertHomeProfileJewel(formData);
      setAddOpen(false);
      refresh();
    });
  }

  function onEdit(formData: FormData) {
    startTransition(async () => {
      await upsertHomeProfileJewel(formData);
      setEditId(null);
      refresh();
    });
  }

  function onDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deleteHomeProfileJewel(fd);
      refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <form action={onSaveCopy} className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <FieldGroup title="Copy" className="min-w-0 flex-1">
            <Field label="Headline">
              <TextInput
                name="profiles_headline"
                defaultValue={teaser.headline}
                placeholder="One System. Multiple Profiles."
              />
            </Field>
            <Field label="Body">
              <TextArea
                name="profiles_body"
                rows={3}
                defaultValue={teaser.body}
                placeholder="Engineered fiberglass geometry double lap, lap, shiplap, and vertical from a single material system."
              />
            </Field>
          </FieldGroup>
          <FieldGroup title="Call to action" className="min-w-0 flex-1">
            <Field label="Label">
              <TextInput
                name="profiles_cta_label"
                defaultValue={teaser.cta_label}
                placeholder="Explore Profiles"
              />
            </Field>
            <Field label="Link">
              <TextInput
                name="profiles_cta_href"
                defaultValue={teaser.cta_href}
                placeholder="/profiles"
              />
            </Field>
          </FieldGroup>
        </div>
        <div className="pt-1">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>

      <SectionHeaderAction>
        <Button size="sm" type="button" variant="accent" onClick={() => setAddOpen(true)}>
          Add jewel
        </Button>
      </SectionHeaderAction>

      <div className="flex flex-col gap-3">
        {jewels.length === 0 ? (
          <div className="rounded-[9px] border border-brand-primary/12 bg-bg-primary px-4 py-8 text-center text-sm text-text-primary/45">
            No jewels yet.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {jewels.map((jewel) => {
              const src =
                (jewel.imagePath
                  ? publicMediaUrl(jewel.imagePath)
                  : null) ||
                jewel.fallbackSrc ||
                null;
              return (
                <li
                  key={jewel.id}
                  className="flex flex-col overflow-hidden rounded-[9px] border border-brand-primary/12 bg-bg-primary shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setEditId(jewel.id)}
                    className="flex h-32 items-center justify-center border-b border-brand-primary/10 bg-bg-secondary px-3 py-4 transition hover:bg-brand-primary/5"
                  >
                    {src ? (
                      isSvgMedia(src) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={jewel.name}
                          width={160}
                          height={96}
                          className="max-h-20 w-auto object-contain"
                        />
                      ) : (
                        <Image
                          src={src}
                          alt={jewel.name}
                          width={160}
                          height={96}
                          className="max-h-20 w-auto object-contain"
                        />
                      )
                    ) : (
                      <span className="rounded-md border border-dashed border-brand-primary/20 bg-bg-primary px-3 py-6 text-xs text-text-primary/40">
                        No cutout
                      </span>
                    )}
                  </button>
                  <div className="flex flex-1 flex-col gap-2 px-3 py-3">
                    <div>
                      <p className="font-display text-sm font-semibold text-brand-primary">
                        {jewel.name}
                      </p>
                      <p className="mt-0.5 text-sm text-text-primary/45">
                        {jewel.reveal || "No reveal"}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditId(jewel.id)}
                        className="text-sm text-brand-primary/70 transition hover:text-brand-primary"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onDelete(jewel.id)}
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

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add profile jewel"
        description="Name, reveal, and cutout for the home row."
        size="lg"
      >
        <form action={onAdd} className="flex flex-col gap-5">
          <JewelForm nextSort={nextSort} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add jewel"}
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
        title="Edit profile jewel"
        description="Name, reveal, and cutout image for the home row."
        size="lg"
      >
        {editing ? (
          <form action={onEdit} className="flex flex-col gap-5">
            <input type="hidden" name="id" value={editing.id} />
            <JewelForm
              key={editing.id}
              jewel={editing}
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

function JewelForm({
  jewel,
  nextSort,
}: {
  jewel?: HomeJewelItem;
  nextSort: number;
}) {
  return (
    <>
      <FieldGroup title="Jewel" columns={2}>
        <Field label="Name">
          <TextInput
            name="name"
            required
            defaultValue={jewel?.name}
            placeholder="Double Lap"
          />
        </Field>
        <Field label="Reveal">
          <TextInput
            name="reveal"
            defaultValue={jewel?.reveal}
            placeholder='3″ / course'
          />
        </Field>
        <Field label="Sort">
          <TextInput
            name="sort_order"
            type="number"
            defaultValue={jewel?.sort_order ?? nextSort}
          />
        </Field>
      </FieldGroup>
      <FieldGroup title="Cutout">
        <MediaField
          name="image_media_id"
          label="Profile cutout"
          hint="JPG · PNG · WebP · SVG"
          compact
          initialId={jewel?.image_media_id}
          initialPath={jewel?.imagePath}
          fallbackSrc={jewel?.fallbackSrc}
        />
      </FieldGroup>
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={jewel?.is_published ?? true}
        />
        Published
      </label>
    </>
  );
}
