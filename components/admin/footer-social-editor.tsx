"use client";

import { useState } from "react";
import {
  SOCIAL_ICON_OPTIONS,
  getSocialIcon,
  isSocialIconId,
  type SocialIconId,
} from "@/lib/cms/social-icons";
import type { SocialLink } from "@/lib/cms/types";
import { SectionHeaderAction } from "@/components/admin/section-header-action";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

type Draft = {
  label: string;
  href: string;
  icon: SocialIconId;
};

const emptyDraft = (): Draft => ({
  label: "",
  href: "https://",
  icon: "instagram" as SocialIconId,
});

export function FooterSocialEditor({
  initial = [],
}: {
  initial?: SocialLink[];
}) {
  const [items, setItems] = useState<SocialLink[]>(initial);
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  function openAdd() {
    setEditIndex(null);
    setDraft(emptyDraft());
    setOpen(true);
  }

  function openEdit(index: number) {
    const item = items[index];
    if (!item) return;
    setEditIndex(index);
    setDraft({
      label: item.label,
      href: item.href,
      icon: isSocialIconId(item.icon) ? item.icon : "website",
    });
    setOpen(true);
  }

  function commit() {
    const next: SocialLink = {
      label:
        draft.label.trim() ||
        SOCIAL_ICON_OPTIONS.find((o) => o.id === draft.icon)?.label ||
        "Social",
      href: draft.href.trim() || "#",
      icon: draft.icon,
    };
    setItems((prev) => {
      if (editIndex == null) return [...prev, next];
      return prev.map((item, i) => (i === editIndex ? next : item));
    });
    setOpen(false);
  }

  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="hidden"
        name="footer_social"
        value={JSON.stringify(items)}
        readOnly
      />

      <SectionHeaderAction>
        <Button size="sm" type="button" variant="accent" onClick={openAdd}>
          Add social
        </Button>
      </SectionHeaderAction>

      {items.length === 0 ? (
        <div className="rounded-[9px] border border-brand-primary/8 bg-bg-secondary/40 px-4 py-8 text-center text-sm text-text-primary/45">
          No social links yet.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => {
            const Icon = getSocialIcon(item.icon);
            return (
              <li
                key={`${item.icon}-${item.href}-${index}`}
                className="flex items-center gap-3 rounded-[9px] border border-brand-primary/8 bg-bg-secondary/40 px-3 py-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-bg-primary text-brand-primary">
                  <Icon size={20} stroke={1.5} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-brand-primary">
                    {item.label}
                  </p>
                  <p className="truncate text-xs text-text-primary/45">
                    {item.href}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(index)}
                    className="text-sm text-brand-primary/70 transition hover:text-brand-primary"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-sm text-[#ff383c] transition hover:opacity-80"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editIndex == null ? "Add social link" : "Edit social link"}
        description="Choose an icon, then set the label and URL."
        size="lg"
      >
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2.5 text-sm leading-none text-text-secondary">
              Icon
            </p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {SOCIAL_ICON_OPTIONS.map((option) => {
                const selected = draft.icon === option.id;
                const Icon = option.Icon;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          icon: option.id,
                          label: d.label || option.label,
                        }))
                      }
                      className={`flex w-full flex-col items-center gap-1.5 rounded-[9px] border px-2 py-3 transition ${
                        selected
                          ? "border-brand-primary bg-brand-primary text-text-inverse"
                          : "border-brand-primary/10 bg-bg-secondary text-brand-primary hover:border-brand-primary/25"
                      }`}
                    >
                      <Icon size={20} stroke={1.5} aria-hidden />
                      <span className="truncate text-[11px] leading-tight">
                        {option.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label">
              <TextInput
                value={draft.label}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, label: e.target.value }))
                }
                placeholder="Instagram"
              />
            </Field>
            <Field label="URL">
              <TextInput
                value={draft.href}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, href: e.target.value }))
                }
                placeholder="https://instagram.com/…"
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={commit}>
              {editIndex == null ? "Add" : "Update"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
