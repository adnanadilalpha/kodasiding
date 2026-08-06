"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDealer, upsertDealer } from "@/lib/cms/actions";
import { SectionHeaderAction } from "@/components/admin/section-header-action";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

export type DealerItem = {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  postal: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  website: string;
  is_published: boolean;
};

function DealerFields({ dealer }: { dealer?: DealerItem }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <FieldGroup title="Contact" columns={2}>
        <Field label="Name">
          <TextInput
            name="name"
            required
            defaultValue={dealer?.name}
            placeholder="Enter name"
          />
        </Field>
        <Field label="Phone">
          <TextInput
            name="phone"
            defaultValue={dealer?.phone}
            placeholder="Enter phone"
          />
        </Field>
        <div className="min-w-0 sm:col-span-2">
          <Field label="Website">
            <TextInput
              name="website"
              type="url"
              defaultValue={dealer?.website}
              placeholder="https://…"
            />
            <p className="mt-1 text-xs text-text-primary/45">
              External https:// URL only — not site paths like /profiles.
            </p>
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup title="Location" columns={2}>
        <div className="min-w-0 sm:col-span-2">
          <Field label="Address">
            <TextInput
              name="address"
              defaultValue={dealer?.address}
              placeholder="Enter address"
            />
          </Field>
        </div>
        <Field label="City">
          <TextInput
            name="city"
            defaultValue={dealer?.city}
            placeholder="Enter city"
          />
        </Field>
        <Field label="Region / State">
          <TextInput
            name="region"
            defaultValue={dealer?.region}
            placeholder="WA"
          />
        </Field>
        <Field label="Postal">
          <TextInput
            name="postal"
            defaultValue={dealer?.postal}
            placeholder="98134"
          />
        </Field>
        <Field label="Lat">
          <TextInput
            name="lat"
            type="number"
            step="any"
            defaultValue={dealer?.lat ?? ""}
          />
        </Field>
        <Field label="Lng">
          <TextInput
            name="lng"
            type="number"
            step="any"
            defaultValue={dealer?.lng ?? ""}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-text-secondary sm:col-span-2">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={dealer?.is_published ?? true}
          />
          Published
        </label>
      </FieldGroup>
    </div>
  );
}

export function DealersEditor({ dealers }: { dealers: DealerItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const editing = dealers.find((d) => d.id === editId) ?? null;

  function refresh() {
    router.refresh();
  }

  function onAdd(formData: FormData) {
    startTransition(async () => {
      await upsertDealer(formData);
      setAddOpen(false);
      refresh();
    });
  }

  function onEdit(formData: FormData) {
    startTransition(async () => {
      await upsertDealer(formData);
      setEditId(null);
      refresh();
    });
  }

  function onDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deleteDealer(fd);
      refresh();
    });
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <SectionHeaderAction>
        <Button size="sm" type="button" onClick={() => setAddOpen(true)}>
          Add dealer
        </Button>
      </SectionHeaderAction>

      {dealers.length === 0 ? (
        <div className="rounded-[9px] border border-brand-primary/8 bg-bg-primary/80 px-4 py-8 text-center text-sm text-text-primary/45">
          No dealers yet.
        </div>
      ) : (
        <ul className="flex w-full flex-col gap-2.5">
          {dealers.map((dealer) => (
            <li
              key={dealer.id}
              className="flex flex-col gap-3 rounded-[9px] border border-brand-primary/8 bg-bg-primary/80 px-3.5 py-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-base font-semibold text-brand-primary">
                  {dealer.name}
                </p>
                <p className="mt-0.5 truncate text-sm text-text-primary/45">
                  {[dealer.city, dealer.region].filter(Boolean).join(", ") ||
                    "No location"}
                  {dealer.phone ? ` · ${dealer.phone}` : ""}
                  {dealer.is_published ? "" : " · Draft"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditId(dealer.id)}
                  className="text-sm text-brand-primary/70 transition hover:text-brand-primary"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onDelete(dealer.id)}
                  className="text-sm text-[#ff383c] transition hover:opacity-80"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add dealer"
        description="Contact and location for the dealer map."
        size="lg"
      >
        <form action={onAdd} className="flex flex-col gap-5">
          <DealerFields />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add dealer"}
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
        title="Edit dealer"
        size="lg"
      >
        {editing ? (
          <form action={onEdit} className="flex flex-col gap-5">
            <input type="hidden" name="id" value={editing.id} />
            <DealerFields dealer={editing} />
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
