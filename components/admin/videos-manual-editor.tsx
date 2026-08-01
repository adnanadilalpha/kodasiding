"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveDocument, saveHomeVideosSection } from "@/lib/cms/actions";
import { createClient } from "@/lib/supabase/client";
import { VideoEditorList, type VideoRow } from "@/components/admin/video-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, TextArea, TextInput } from "@/components/ui/field";

const MANUAL_KEY = "installation_manual";

export function VideosManualEditor({
  headline,
  body,
  manualLabel,
  manualPath,
  videos,
}: {
  headline: string;
  body: string;
  manualLabel: string;
  manualPath: string;
  videos: VideoRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function onSaveCopy(formData: FormData) {
    formData.set("manual_document_key", MANUAL_KEY);
    startTransition(async () => {
      await saveHomeVideosSection(formData);
      router.refresh();
    });
  }

  async function onPdfChange(file: File | null, label: string) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadStatus("Only PDF files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus("PDF must be under 10MB.");
      return;
    }

    setUploading(true);
    setUploadStatus("Uploading…");
    try {
      const supabase = createClient();
      const path = `${MANUAL_KEY}-${Date.now()}.pdf`;
      const { error } = await supabase.storage
        .from("documents")
        .upload(path, file, {
          contentType: "application/pdf",
          cacheControl: "31536000",
          upsert: false,
        });
      if (error) throw error;

      const fd = new FormData();
      fd.set("key", MANUAL_KEY);
      fd.set("title", label || "Installation Manual");
      fd.set("storage_path", path);
      fd.set("bucket", "documents");
      await saveDocument(fd);
      setUploadStatus("PDF ready");
      router.refresh();
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form action={onSaveCopy} className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
          <FieldGroup title="Section copy" className="min-w-0 flex-1">
            <Field label="Headline">
              <TextInput
                name="videos_headline"
                defaultValue={headline}
                placeholder="Installation instructions"
              />
            </Field>
            <Field label="Body">
              <TextArea
                name="videos_body"
                rows={2}
                defaultValue={body}
                placeholder="Watch horizontal and vertical install guides, then download the full manual."
              />
            </Field>
          </FieldGroup>

          <FieldGroup title="Manual PDF" className="min-w-0 flex-1">
            <Field label="Button label">
              <TextInput
                name="manual_label"
                defaultValue={manualLabel}
                placeholder="View Manual PDF"
              />
            </Field>
            <div className="flex flex-col gap-2">
              <p className="text-base leading-none text-text-secondary">
                PDF file
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer">
                  <span className="inline-flex items-center justify-center rounded-md border border-brand-primary/12 bg-bg-primary px-4 py-2.5 text-sm text-brand-primary transition hover:bg-bg-secondary">
                    {uploading
                      ? "Uploading…"
                      : manualPath
                        ? "Replace PDF"
                        : "Upload PDF"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    disabled={uploading || pending}
                    className="hidden"
                    onChange={(e) => {
                      const labelInput = e.currentTarget
                        .closest("form")
                        ?.querySelector<HTMLInputElement>(
                          'input[name="manual_label"]',
                        );
                      void onPdfChange(
                        e.target.files?.[0] ?? null,
                        labelInput?.value ?? manualLabel,
                      );
                    }}
                  />
                </label>
                <p className="text-sm text-text-primary/45">
                  {manualPath
                    ? "PDF uploaded · max 10MB"
                    : "No PDF yet · max 10MB"}
                </p>
              </div>
              {uploadStatus ? (
                <p className="text-sm text-text-primary/45">{uploadStatus}</p>
              ) : null}
            </div>
          </FieldGroup>
        </div>

        <div className="pt-1">
          <Button type="submit" disabled={pending || uploading}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>

      <VideoEditorList addVariant="accent" videos={videos} />
    </div>
  );
}
