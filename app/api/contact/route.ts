import { createServiceClient } from "@/lib/supabase/admin";
import { normalizeQuoteEmailSettings, sendContactMessage } from "@/lib/email/quote-notify";
import { validateQuoteEmail } from "@/lib/quote/validate-email";

export const runtime = "nodejs";

const MIN_AGE_MS = 1500;
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "")
    .replace(/\0/g, "")
    .trim()
    .slice(0, max);
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Message could not be sent." }, { status: 400 });
  }

  const honeypot =
    clean(formData.get("company_website"), 200) ||
    clean(formData.get("fax_number"), 200);
  if (honeypot) {
    return Response.json({ ok: true });
  }

  const started = Number(formData.get("form_started"));
  const age = Date.now() - started;
  const token = clean(formData.get("contact_check"), 20);
  if (
    token !== "koda" ||
    !Number.isFinite(started) ||
    age < MIN_AGE_MS ||
    age > MAX_AGE_MS
  ) {
    return Response.json(
      { error: "Please wait a moment and send again." },
      { status: 400 },
    );
  }

  const name = clean(formData.get("name"), 120);
  const message = clean(formData.get("message"), 4000);
  const emailCheck = validateQuoteEmail(clean(formData.get("email"), 254));
  if (name.length < 2) {
    return Response.json({ error: "Enter your name." }, { status: 400 });
  }
  if (!emailCheck.ok) {
    return Response.json({ error: emailCheck.reason }, { status: 400 });
  }
  if (message.length < 8) {
    return Response.json(
      { error: "Write a short message so we know how to help." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { data: settingsRow } = await supabase
    .from("quote_email_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const delivery = await sendContactMessage(
    normalizeQuoteEmailSettings(settingsRow),
    { name, email: emailCheck.email, message },
  );

  if (delivery.error) {
    return Response.json(
      { error: "Message could not be sent. Please try again later." },
      { status: 503 },
    );
  }

  return Response.json({ ok: true });
}
