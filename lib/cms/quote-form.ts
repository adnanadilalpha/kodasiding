import type {
  QuoteAttachmentFileTypeId,
  QuoteFormFieldDef,
  QuoteFormSettings,
  QuoteFormFieldsLegacy,
} from "@/lib/cms/types";

/** Catalog of attachment types admins can enable. */
export const QUOTE_FILE_TYPE_OPTIONS = [
  {
    id: "pdf" as const,
    label: "PDF",
    extensions: [".pdf"],
    mime: ["application/pdf"],
  },
  {
    id: "jpg" as const,
    label: "JPG",
    extensions: [".jpg", ".jpeg"],
    mime: ["image/jpeg"],
  },
  {
    id: "png" as const,
    label: "PNG",
    extensions: [".png"],
    mime: ["image/png"],
  },
  {
    id: "webp" as const,
    label: "WEBP",
    extensions: [".webp"],
    mime: ["image/webp"],
  },
  {
    id: "heic" as const,
    label: "HEIC",
    extensions: [".heic", ".heif"],
    mime: ["image/heic", "image/heif"],
  },
  {
    id: "doc" as const,
    label: "Word",
    extensions: [".doc", ".docx"],
    mime: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  {
    id: "xls" as const,
    label: "Excel",
    extensions: [".xls", ".xlsx"],
    mime: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  {
    id: "txt" as const,
    label: "Text",
    extensions: [".txt"],
    mime: ["text/plain"],
  },
] as const;

export type QuoteFileTypeOption = (typeof QUOTE_FILE_TYPE_OPTIONS)[number];

export const DEFAULT_ATTACHMENT_TYPES: QuoteAttachmentFileTypeId[] = [
  "pdf",
  "jpg",
  "png",
  "webp",
  "heic",
];

const CORE_DEFAULTS: Omit<QuoteFormFieldDef, "id">[] = [
  {
    kind: "full_name",
    label: "Full Name",
    required: true,
    width: "full",
  },
  {
    kind: "email",
    label: "Email Address",
    required: true,
    width: "half",
  },
  {
    kind: "phone",
    label: "Phone Number",
    required: false,
    width: "half",
  },
  {
    kind: "city",
    label: "City",
    required: false,
    width: "half",
  },
  {
    kind: "state",
    label: "State",
    required: false,
    width: "half",
  },
  {
    kind: "message",
    label: "Message",
    required: false,
    width: "full",
  },
  {
    kind: "attachment",
    label: "Attachment",
    required: false,
    width: "full",
  },
];

export function defaultQuoteFormSettings(): QuoteFormSettings {
  return {
    title: "Request a quote",
    submit_label: "Submit Request",
    upload_label: "Upload file here",
    allowed_file_types: [...DEFAULT_ATTACHMENT_TYPES],
    fields: CORE_DEFAULTS.map((field) => ({
      ...field,
      id: field.kind,
    })),
  };
}

function isLegacyFields(fields: unknown): fields is QuoteFormFieldsLegacy {
  return (
    !!fields &&
    typeof fields === "object" &&
    !Array.isArray(fields) &&
    "full_name" in fields
  );
}

/** Normalize legacy object-shaped fields into the ordered array format. */
export function normalizeQuoteFormSettings(
  raw:
    | {
        title?: string;
        submit_label?: string;
        upload_label?: string;
        allowed_file_types?: string[];
        fields?: QuoteFormFieldDef[] | QuoteFormFieldsLegacy;
      }
    | null
    | undefined,
): QuoteFormSettings {
  const defaults = defaultQuoteFormSettings();
  if (!raw) return defaults;

  const title = String(raw.title ?? defaults.title).trim() || defaults.title;
  const submit_label =
    String(raw.submit_label ?? defaults.submit_label).trim() ||
    defaults.submit_label;
  const upload_label =
    String(
      raw.upload_label ??
        (isLegacyFields(raw.fields) ? raw.fields.upload_label : "") ??
        defaults.upload_label,
    ).trim() || defaults.upload_label;

  let allowed_file_types = Array.isArray(raw.allowed_file_types)
    ? raw.allowed_file_types.filter((id): id is QuoteAttachmentFileTypeId =>
        QUOTE_FILE_TYPE_OPTIONS.some((opt) => opt.id === id),
      )
    : [...DEFAULT_ATTACHMENT_TYPES];
  if (allowed_file_types.length === 0) {
    allowed_file_types = [...DEFAULT_ATTACHMENT_TYPES];
  }

  let fields: QuoteFormFieldDef[];
  if (Array.isArray(raw.fields) && raw.fields.length > 0) {
    fields = raw.fields
      .map((field, index) => normalizeFieldDef(field, index))
      .filter((f): f is QuoteFormFieldDef => Boolean(f));
  } else if (isLegacyFields(raw.fields)) {
    const legacy = raw.fields;
    fields = CORE_DEFAULTS.map((core) => {
      const labelKey = core.kind as keyof QuoteFormFieldsLegacy;
      const label =
        core.kind === "attachment"
          ? "Attachment"
          : String(legacy[labelKey] ?? core.label).trim() || core.label;
      return {
        id: core.kind,
        kind: core.kind,
        label,
        required: core.required,
        width: core.width,
      } satisfies QuoteFormFieldDef;
    });
  } else {
    fields = defaults.fields;
  }

  // Ensure required core fields exist.
  for (const locked of ["full_name", "email"] as const) {
    if (!fields.some((f) => f.kind === locked)) {
      const core = CORE_DEFAULTS.find((c) => c.kind === locked)!;
      fields.unshift({ ...core, id: locked });
    }
  }

  return {
    title,
    submit_label,
    upload_label,
    allowed_file_types,
    fields,
  };
}

function normalizeFieldDef(
  field: Partial<QuoteFormFieldDef>,
  index: number,
): QuoteFormFieldDef | null {
  const kind = field.kind;
  if (!kind) return null;

  if (kind === "custom") {
    return {
      id: String(field.id || `custom_${index}`),
      kind: "custom",
      label: String(field.label ?? "Custom field").trim() || "Custom field",
      required: Boolean(field.required),
      width: field.width === "half" ? "half" : "full",
      input: field.input === "textarea" ? "textarea" : "text",
    };
  }

  const known = CORE_DEFAULTS.find((c) => c.kind === kind);
  if (!known) return null;

  return {
    id: String(field.id || kind),
    kind,
    label:
      kind === "attachment"
        ? "Attachment"
        : String(field.label ?? known.label).trim() || known.label,
    required: kind === "full_name" || kind === "email" ? true : Boolean(field.required),
    width: field.width === "half" ? "half" : known.width,
  };
}

export function isQuoteFieldRemovable(field: QuoteFormFieldDef) {
  return field.kind !== "full_name" && field.kind !== "email";
}

export function missingCoreKinds(fields: QuoteFormFieldDef[]) {
  const present = new Set(fields.map((f) => f.kind));
  return CORE_DEFAULTS.filter((c) => c.kind !== "custom" && !present.has(c.kind));
}

export function createCoreField(
  kind: Exclude<QuoteFormFieldDef["kind"], "custom">,
): QuoteFormFieldDef {
  const core = CORE_DEFAULTS.find((c) => c.kind === kind)!;
  return { ...core, id: `${kind}_${Date.now()}` };
}

export function createCustomField(): QuoteFormFieldDef {
  return {
    id: `custom_${crypto.randomUUID()}`,
    kind: "custom",
    label: "New field",
    required: false,
    width: "full",
    input: "text",
  };
}

export function acceptAttrForTypes(types: QuoteAttachmentFileTypeId[]) {
  const opts = QUOTE_FILE_TYPE_OPTIONS.filter((o) => types.includes(o.id));
  const parts = [
    ...opts.flatMap((o) => o.extensions),
    ...opts.flatMap((o) => o.mime),
  ];
  return parts.join(",");
}

export function mimeSetForTypes(types: QuoteAttachmentFileTypeId[]) {
  return new Set<string>(
    QUOTE_FILE_TYPE_OPTIONS.filter((o) => types.includes(o.id)).flatMap(
      (o) => [...o.mime],
    ),
  );
}

/** Accept when MIME matches, or when MIME is blank and the extension matches. */
export function isAllowedAttachmentFile(
  file: { name: string; type: string },
  types: QuoteAttachmentFileTypeId[],
) {
  const allowed = mimeSetForTypes(types);
  if (file.type) return allowed.has(file.type);
  const ext = `.${(file.name.split(".").pop() ?? "").toLowerCase()}`;
  return QUOTE_FILE_TYPE_OPTIONS.filter((o) => types.includes(o.id)).some(
    (o) => (o.extensions as readonly string[]).includes(ext),
  );
}

export function humanFileTypesLabel(types: QuoteAttachmentFileTypeId[]) {
  const labels = QUOTE_FILE_TYPE_OPTIONS.filter((o) =>
    types.includes(o.id),
  ).map((o) => o.label);
  if (labels.length === 0) return "No file types";
  if (labels.length <= 3) return labels.join(", ");
  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2} more`;
}

/** Group consecutive half-width fields into rows for the public form. */
export function groupQuoteFields(
  fields: QuoteFormFieldDef[],
): QuoteFormFieldDef[][] {
  const rows: QuoteFormFieldDef[][] = [];
  let i = 0;
  while (i < fields.length) {
    const field = fields[i]!;
    if (
      field.width === "half" &&
      fields[i + 1]?.width === "half"
    ) {
      rows.push([field, fields[i + 1]!]);
      i += 2;
    } else {
      rows.push([field]);
      i += 1;
    }
  }
  return rows;
}
