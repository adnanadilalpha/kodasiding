import { createServiceClient } from "@/lib/supabase/admin";
import {
  humanFileTypesLabel,
  isAllowedAttachmentFile,
  normalizeQuoteFormSettings,
} from "@/lib/cms/quote-form";
import {
  QUOTE_ATTACHMENT_BUCKET,
  QUOTE_ATTACHMENT_MAX_BYTES,
} from "@/lib/quote/constants";
import { notifyQuoteSubmitted } from "@/lib/quote/notify";
import {
  CAPTCHA_FALLBACK_LIMIT,
  QUOTE_RATE_LIMIT_EMAIL,
  QUOTE_RATE_LIMIT_IP,
  verifyRecaptcha,
} from "@/lib/quote/recaptcha";
import { sniffedMatchesAllowed, sniffFileBytes } from "@/lib/quote/sniff-file";
import { validateQuoteEmail } from "@/lib/quote/validate-email";

export const runtime = "nodejs";

function cleanText(value: FormDataEntryValue | null, max = 500) {
  return String(value ?? "")
    .replace(/\0/g, "")
    .trim()
    .slice(0, max);
}

function safeFileName(name: string) {
  return name
    .replace(/[^\w.\-()+ ]+/g, "_")
    .replace(/\s+/g, "-")
    .slice(0, 120);
}

function extensionFor(file: File) {
  const fromName = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase()
    : undefined;
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName;
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/plain": "txt",
    "application/zip": "zip",
    "application/x-zip-compressed": "zip",
  };
  return map[file.type] ?? "bin";
}

function contentTypeFor(file: File) {
  if (file.type) return file.type;
  const ext = extensionFor(file);
  const map: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
    zip: "application/zip",
  };
  return map[ext] ?? "application/pdf";
}

function clientIp(request: Request) {
  // Prefer platform-provided client IP over spoofable X-Forwarded-For first hop.
  const vercel =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim();
  if (vercel) return vercel;
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}

async function captchaFallbackAllowed(
  supabase: ReturnType<typeof createServiceClient>,
  ip: string,
) {
  if (!ip || ip === "unknown") return false;
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("quote_leads")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since)
    .eq("meta->>client_ip", ip)
    .eq("meta->>captcha_fallback", "true");

  if (error) {
    console.error("captcha fallback rate check failed", error);
    return false;
  }
  return (count ?? 0) < CAPTCHA_FALLBACK_LIMIT;
}

async function quoteRateAllowed(
  supabase: ReturnType<typeof createServiceClient>,
  ip: string,
  email: string,
) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  if (!ip || ip === "unknown") return false;

  const { count, error } = await supabase
    .from("quote_leads")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since)
    .eq("meta->>client_ip", ip);
  if (error) {
    console.error("quote IP rate check failed", error);
    return false;
  }
  if ((count ?? 0) >= QUOTE_RATE_LIMIT_IP) return false;

  const { count: emailCount, error: emailError } = await supabase
    .from("quote_leads")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since)
    .ilike("email", email);
  if (emailError) {
    console.error("quote email rate check failed", emailError);
    return false;
  }
  return (emailCount ?? 0) < QUOTE_RATE_LIMIT_EMAIL;
}

function parseCustomFields(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw.trim()) return {} as Record<string, string>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      out[key] = cleanText(String(value ?? ""), 2000);
    }
    return out;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const ip = clientIp(request);

    const fullName = cleanText(formData.get("full_name"), 120);
    const phone = cleanText(formData.get("phone"), 40);
    const city = cleanText(formData.get("city"), 80);
    const state = cleanText(formData.get("state"), 80);
    const message = cleanText(formData.get("message"), 4000);
    const customRaw = parseCustomFields(formData.get("custom_fields"));
    const recaptchaToken = cleanText(formData.get("recaptcha_token"), 4000);
    const wantsFallback = cleanText(formData.get("captcha_fallback"), 8) === "1";
    // Obscure honeypot name — never use "website"/"company" (browsers autofill those).
    const honeypot = cleanText(formData.get("hp_field"), 200);

    if (honeypot) {
      return Response.json(
        { ok: false, error: "Could not submit your request. Please try again." },
        { status: 400 },
      );
    }

    if (!fullName || fullName.length < 2) {
      return Response.json(
        { ok: false, error: "Please enter your full name." },
        { status: 400 },
      );
    }

    const emailCheck = validateQuoteEmail(String(formData.get("email") ?? ""));
    if (!emailCheck.ok) {
      return Response.json(
        { ok: false, error: emailCheck.reason },
        { status: 400 },
      );
    }

    const captcha = await verifyRecaptcha(recaptchaToken, ip);
    let captchaFallback = false;
    const captchaScore: number | null = captcha.ok ? (captcha.score ?? null) : null;

    if (!captcha.ok) {
      // Fallback only for true provider outages — never empty token or missing config.
      const canFallback = wantsFallback && captcha.code === "unavailable";

      if (!canFallback) {
        return Response.json(
          { ok: false, error: captcha.reason },
          { status: 400 },
        );
      }

      const supabaseProbe = createServiceClient();
      const allowed = await captchaFallbackAllowed(supabaseProbe, ip);
      if (!allowed) {
        return Response.json(
          {
            ok: false,
            error:
              "Spam protection is temporarily unavailable. Please try again later.",
          },
          { status: 429 },
        );
      }
      captchaFallback = true;
    }

    const supabase = createServiceClient();

    const rateOk = await quoteRateAllowed(supabase, ip, emailCheck.email);
    if (!rateOk) {
      return Response.json(
        {
          ok: false,
          error: "Too many requests. Please try again later.",
        },
        { status: 429 },
      );
    }

    const { data: settingsRow } = await supabase
      .from("site_settings")
      .select("quote_form")
      .eq("id", 1)
      .maybeSingle();
    const quoteForm = normalizeQuoteFormSettings(settingsRow?.quote_form);
    const hasKind = (kind: string) =>
      quoteForm.fields.some((f) => f.kind === kind);

    for (const field of quoteForm.fields) {
      if (field.kind === "custom" && field.required) {
        if (!customRaw[field.id]?.trim()) {
          return Response.json(
            { ok: false, error: `Please fill in ${field.label}.` },
            { status: 400 },
          );
        }
      }
      if (
        field.required &&
        (field.kind === "phone" ||
          field.kind === "city" ||
          field.kind === "state" ||
          field.kind === "message")
      ) {
        const value =
          field.kind === "phone"
            ? phone
            : field.kind === "city"
              ? city
              : field.kind === "state"
                ? state
                : message;
        if (!value) {
          return Response.json(
            { ok: false, error: `Please fill in ${field.label}.` },
            { status: 400 },
          );
        }
      }
    }

    const customFields = quoteForm.fields
      .filter((f) => f.kind === "custom")
      .map((f) => ({
        id: f.id,
        label: f.label,
        value: customRaw[f.id] ?? "",
      }));

    const attachment = formData.get("attachment");
    let attachmentPath = "";
    const attachmentField = quoteForm.fields.find((f) => f.kind === "attachment");
    const typesLabel = humanFileTypesLabel(quoteForm.allowed_file_types);

    if (attachment instanceof File && attachment.size > 0) {
      if (!attachmentField) {
        return Response.json(
          { ok: false, error: "Attachments are not accepted." },
          { status: 400 },
        );
      }
      if (attachment.size > QUOTE_ATTACHMENT_MAX_BYTES) {
        return Response.json(
          { ok: false, error: "Attachment must be 5MB or smaller." },
          { status: 400 },
        );
      }
      if (
        !isAllowedAttachmentFile(attachment, quoteForm.allowed_file_types)
      ) {
        return Response.json(
          {
            ok: false,
            error: `Attachment must be one of: ${typesLabel}.`,
          },
          { status: 400 },
        );
      }

      const bytes = new Uint8Array(await attachment.arrayBuffer());
      const sniffed = sniffFileBytes(bytes);
      if (
        !sniffedMatchesAllowed(
          sniffed,
          quoteForm.allowed_file_types,
        )
      ) {
        return Response.json(
          {
            ok: false,
            error: `Attachment must be one of: ${typesLabel}.`,
          },
          { status: 400 },
        );
      }

      const id = crypto.randomUUID();
      const ext = extensionFor(attachment);
      const base = safeFileName(
        attachment.name.replace(/\.[^.]+$/, "") || "attachment",
      );
      attachmentPath = `${id}/${base}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(QUOTE_ATTACHMENT_BUCKET)
        .upload(attachmentPath, bytes, {
          contentType: contentTypeFor(attachment),
          upsert: false,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("quote attachment upload failed", uploadError);
        return Response.json(
          {
            ok: false,
            error: "Could not upload the attachment. Please try again.",
          },
          { status: 500 },
        );
      }
    } else if (attachmentField?.required) {
      return Response.json(
        { ok: false, error: "Please attach a file." },
        { status: 400 },
      );
    }

    const { data: lead, error: insertError } = await supabase
      .from("quote_leads")
      .insert({
        full_name: fullName,
        email: emailCheck.email,
        phone: hasKind("phone") ? phone : "",
        city: hasKind("city") ? city : "",
        state: hasKind("state") ? state : "",
        message: hasKind("message") ? message : "",
        attachment_path: attachmentPath,
        meta: {
          recaptcha_score: captchaScore,
          captcha_fallback: captchaFallback,
          client_ip: ip,
          user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
          email_notification: { status: "pending", provider: null },
          custom_fields: customFields,
        },
      })
      .select(
        "id, full_name, email, phone, city, state, message, attachment_path, created_at",
      )
      .single();

    if (insertError || !lead) {
      console.error("quote lead insert failed", insertError);
      if (attachmentPath) {
        await supabase.storage
          .from(QUOTE_ATTACHMENT_BUCKET)
          .remove([attachmentPath])
          .catch(() => undefined);
      }
      return Response.json(
        { ok: false, error: "Could not save your request. Please try again." },
        { status: 500 },
      );
    }

    await notifyQuoteSubmitted({ lead }).catch((err) => {
      console.error("quote notify failed", err);
    });

    return Response.json({
      ok: true,
      id: lead.id,
    });
  } catch (err) {
    console.error("quote submit error", err);
    return Response.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
