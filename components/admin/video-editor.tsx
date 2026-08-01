"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteVideo, upsertVideo } from "@/lib/cms/actions";
import { publicMediaUrl } from "@/lib/cms/urls";
import { MediaField } from "@/components/admin/media-field";
import { SectionHeaderAction } from "@/components/admin/section-header-action";
import { VideoSourceField } from "@/components/admin/video-source-field";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, Select, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

export type VideoRow = {
  id: string;
  title: string;
  orientation: "horizontal" | "vertical";
  thumbnail_media_id: string | null;
  video_url: string;
  sort_order: number;
  is_published: boolean;
  thumbPath?: string | null;
  thumbBucket?: string;
};

function VideoFormFields({ video }: { video?: VideoRow }) {
  return (
    <div className="flex flex-col gap-5">
      <FieldGroup title="Details" columns={2}>
        <Field label="Title">
          <TextInput
            name="title"
            required
            defaultValue={video?.title ?? ""}
            placeholder="Horizontal Siding Installation"
          />
        </Field>
        <Field label="Orientation">
          <Select
            name="orientation"
            defaultValue={video?.orientation ?? "horizontal"}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </Select>
        </Field>
        <Field label="Sort">
          <TextInput
            name="sort_order"
            type="number"
            defaultValue={video?.sort_order ?? 0}
          />
        </Field>
        <label className="flex items-end gap-2 pb-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={video?.is_published ?? true}
          />
          Published
        </label>
      </FieldGroup>
      <FieldGroup title="Source">
        <VideoSourceField initialUrl={video?.video_url ?? ""} />
      </FieldGroup>
      <FieldGroup title="Thumbnail">
        <MediaField
          name="thumbnail_media_id"
          label="Preview image"
          compact
          initialId={video?.thumbnail_media_id}
          initialPath={video?.thumbPath}
          initialBucket={video?.thumbBucket ?? "media"}
        />
      </FieldGroup>
    </div>
  );
}

export function VideoEditorList({
  videos,
  /** When another Save CTA is on the same screen, demote Add to accent */
  addVariant = "primary",
}: {
  videos: VideoRow[];
  addVariant?: "primary" | "accent";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const editing = videos.find((v) => v.id === editId) ?? null;

  function refresh() {
    router.refresh();
  }

  function onAdd(formData: FormData) {
    startTransition(async () => {
      await upsertVideo(formData);
      setAddOpen(false);
      refresh();
    });
  }

  function onEdit(formData: FormData) {
    startTransition(async () => {
      await upsertVideo(formData);
      setEditId(null);
      refresh();
    });
  }

  function onDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deleteVideo(fd);
      refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeaderAction>
        <Button
          size="sm"
          type="button"
          variant={addVariant}
          onClick={() => setAddOpen(true)}
        >
          Add video
        </Button>
      </SectionHeaderAction>

      {videos.length === 0 ? (
        <div className="rounded-[9px] border border-brand-primary/8 bg-bg-primary/80 px-4 py-8 text-center text-sm text-text-primary/45">
          No videos yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {videos.map((video) => {
            const src = video.thumbPath
              ? publicMediaUrl(video.thumbPath, video.thumbBucket ?? "media")
              : null;
            return (
              <li
                key={video.id}
                className="flex flex-wrap items-center gap-4 rounded-[9px] border border-brand-primary/8 bg-bg-primary/80 px-3.5 py-3"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-bg-secondary/60">
                  {src ? (
                    <Image
                      src={src}
                      alt={video.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-semibold text-brand-primary">
                    {video.title}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-text-primary/45">
                    {video.orientation}
                    {video.is_published ? "" : " · Draft"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditId(video.id)}
                    className="text-sm text-brand-primary/70 transition hover:text-brand-primary"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onDelete(video.id)}
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
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add video"
        description="Title, source, and thumbnail."
        size="lg"
      >
        <form action={onAdd} className="flex flex-col gap-5">
          <VideoFormFields />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add video"}
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
        title="Edit video"
        size="lg"
      >
        {editing ? (
          <form action={onEdit} className="flex flex-col gap-5">
            <input type="hidden" name="id" value={editing.id} />
            <VideoFormFields video={editing} />
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
