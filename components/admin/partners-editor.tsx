"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deletePartner,
  saveHomePartnersTitle,
  upsertPartner,
} from "@/lib/cms/actions";
import { publicMediaUrl } from "@/lib/cms/urls";
import { MediaField } from "@/components/admin/media-field";
import { SectionHeaderAction } from "@/components/admin/section-header-action";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

export type PartnerItem = {
  id: string;
  name: string;
  logo_media_id: string | null;
  sort_order: number;
  is_published: boolean;
  logoPath?: string | null;
};

export function PartnersEditor({
  title,
  showPartners,
  partners,
}: {
  title: string;
  showPartners: boolean;
  partners: PartnerItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const editing = partners.find((p) => p.id === editId) ?? null;

  function refresh() {
    router.refresh();
  }

  function onSaveTitle(formData: FormData) {
    startTransition(async () => {
      await saveHomePartnersTitle(formData);
      refresh();
    });
  }

  function onAdd(formData: FormData) {
    startTransition(async () => {
      await upsertPartner(formData);
      setAddOpen(false);
      refresh();
    });
  }

  function onEdit(formData: FormData) {
    startTransition(async () => {
      await upsertPartner(formData);
      setEditId(null);
      refresh();
    });
  }

  function onToggleLive(partner: PartnerItem, live: boolean) {
    const fd = new FormData();
    fd.set("id", partner.id);
    fd.set("logo_media_id", partner.logo_media_id ?? "");
    fd.set("sort_order", String(partner.sort_order));
    if (live) fd.set("is_published", "on");
    startTransition(async () => {
      await upsertPartner(fd);
      refresh();
    });
  }

  function onDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deletePartner(fd);
      refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeaderAction>
        <Button size="sm" type="button" variant="accent" onClick={() => setAddOpen(true)}>
          Add partner
        </Button>
      </SectionHeaderAction>

      <form action={onSaveTitle} className="flex flex-col gap-5">
        <label className="flex items-start gap-2.5 text-sm text-text-secondary">
          <input
            type="checkbox"
            name="show_partners"
            defaultChecked={showPartners}
            className="mt-0.5"
          />
          <span>
            Show partners section on landing page
            <span className="mt-0.5 block text-xs text-text-primary/40">
              Uncheck to hide the trusted partners strip. Takes effect on Save.
            </span>
          </span>
        </label>
        <Field label="Section title">
          <TextInput
            name="partners_title"
            defaultValue={title}
            placeholder="Trusted partners & distributors"
          />
        </Field>

        <div className="flex flex-col gap-3">
          {partners.length === 0 ? (
            <div className="rounded-[9px] border border-brand-primary/8 bg-bg-primary/80 px-4 py-8 text-center">
              <p className="text-sm text-text-primary/45">No partners yet.</p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {partners.map((partner) => {
                const src = partner.logoPath
                  ? publicMediaUrl(partner.logoPath) ?? null
                  : null;
                return (
                  <li
                    key={partner.id}
                    className="flex items-center gap-3 rounded-[9px] border border-brand-primary/8 bg-bg-primary/80 px-3 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => setEditId(partner.id)}
                      className="flex h-12 w-20 shrink-0 items-center justify-center rounded-md bg-bg-secondary/50 px-2 transition hover:bg-bg-secondary/80"
                    >
                      {src ? (
                        <Image
                          src={src}
                          alt={partner.name}
                          width={80}
                          height={48}
                          className="max-h-8 w-auto object-contain"
                        />
                      ) : (
                        <span className="text-xs text-text-primary/35">
                          No logo
                        </span>
                      )}
                    </button>
                    <label className="flex items-center gap-2 text-sm text-text-secondary">
                      <input
                        type="checkbox"
                        checked={partner.is_published}
                        disabled={pending}
                        onChange={(e) =>
                          onToggleLive(partner, e.target.checked)
                        }
                      />
                      Live
                    </label>
                    <div className="ml-auto flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditId(partner.id)}
                        className="text-sm text-brand-primary/70 transition hover:text-brand-primary"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onDelete(partner.id)}
                        className="text-sm text-[#ff383c] transition hover:opacity-80"
                      >
                        Remove
                      </button>
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
        title="Add partner"
        description="Upload a logo for the home marquee."
      >
        <form action={onAdd} className="flex flex-col gap-5">
          <MediaField
            name="logo_media_id"
            label="Logo"
            aspect="square"
            compact
          />
          <input
            type="hidden"
            name="sort_order"
            value={partners.length}
          />
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" name="is_published" defaultChecked />
            Show on site
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add partner"}
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
        title="Edit partner"
        description="Replace the logo or update visibility."
      >
        {editing ? (
          <form action={onEdit} className="flex flex-col gap-5">
            <input type="hidden" name="id" value={editing.id} />
            <input
              type="hidden"
              name="sort_order"
              value={editing.sort_order}
            />
            <MediaField
              key={editing.id}
              name="logo_media_id"
              label="Logo"
              aspect="square"
              compact
              initialId={editing.logo_media_id}
              initialPath={editing.logoPath}
            />
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                name="is_published"
                defaultChecked={editing.is_published}
              />
              Show on site
            </label>
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
