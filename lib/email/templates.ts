export type QuoteMessagePayload = {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  message: string;
  has_attachment: boolean;
  /** Display name when a file is attached to the outbound email. */
  attachment_filename?: string;
};

/** Content-ID used when the white logo is attached inline via nodemailer. */
export const EMAIL_LOGO_CID = "koda-logo";

export type EmailTemplateOptions = {
  /** Override logo src (preview). Defaults to cid: attachment for real sends. */
  logoSrc?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Strip CR/LF so values are safe in email subjects/headers. */
export function sanitizeHeaderValue(value: string, max = 200) {
  return value.replace(/[\r\n\0]+/g, " ").trim().slice(0, max);
}

function emailLogoMarkup(logoSrc?: string) {
  const src = logoSrc?.trim() || `cid:${EMAIL_LOGO_CID}`;
  return `
    <img
      src="${escapeHtml(src)}"
      width="140"
      height="38"
      alt="Koda Siding"
      style="display:block;border:0;outline:none;text-decoration:none;height:38px;width:auto;max-width:140px;"
    />
  `;
}

function detailRow(label: string, value: string, last = false) {
  const border = last ? "" : "border-bottom:1px solid #ecebe4;";
  return `
    <tr>
      <td style="padding:13px 0;${border}width:110px;vertical-align:top;">
        <p style="margin:0;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.4;letter-spacing:0.06em;text-transform:uppercase;color:#5f625d;font-weight:600;">
          ${escapeHtml(label)}
        </p>
      </td>
      <td style="padding:13px 0;${border}vertical-align:top;">
        <p style="margin:0;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#101613;">
          ${value}
        </p>
      </td>
    </tr>
  `;
}

function emailShell(options: {
  preheader: string;
  bodyHtml: string;
  footerNote?: string;
  logoSrc?: string;
}) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Koda Siding</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:#ecebe4;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(options.preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ecebe4;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #d9d8d1;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#183f31;padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:22px 28px;">
                    ${emailLogoMarkup(options.logoSrc)}
                  </td>
                </tr>
                <tr>
                  <td style="height:3px;background:#c8b891;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;">
              ${options.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 26px;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;border-top:1px solid #ecebe4;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#5f625d;">
                ${escapeHtml(options.footerNote || "Sent from your Koda Siding website.")}
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;">
          <tr>
            <td align="center" style="padding:18px 8px 0;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#8a8d87;">
                © ${year} Koda Siding Systems
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildQuoteNotificationEmail(
  payload: QuoteMessagePayload,
  options?: EmailTemplateOptions,
) {
  const phone = payload.phone.trim() || "—";
  const city = payload.city.trim() || "—";
  const state = payload.state.trim() || "—";
  const location =
    [payload.city.trim(), payload.state.trim()].filter(Boolean).join(", ") ||
    "—";
  const emailLink = `<a href="mailto:${escapeHtml(payload.email)}" style="color:#183f31;text-decoration:none;font-weight:600;">${escapeHtml(payload.email)}</a>`;
  const phoneLink =
    payload.phone.trim().length > 0
      ? `<a href="tel:${escapeHtml(payload.phone.replaceAll(" ", ""))}" style="color:#101613;text-decoration:none;">${escapeHtml(payload.phone)}</a>`
      : "—";
  const message =
    payload.message.trim() || "(No message included)";
  const attachmentNote = payload.has_attachment
    ? payload.attachment_filename
      ? `${payload.attachment_filename} — attached below`
      : "Attached below in this email"
    : "None";

  const text = [
    "New quote request — Koda Siding",
    "",
    `Name: ${payload.full_name}`,
    `Email: ${payload.email}`,
    `Phone: ${phone}`,
    `Location: ${location}`,
    `Attachment: ${payload.has_attachment ? `${payload.attachment_filename ? `${payload.attachment_filename} — ` : ""}see file attached below` : "None"}`,
    "",
    "Message:",
    message,
    "",
    "—",
    "Sent from your Koda Siding website.",
  ].join("\n");

  const replyHref = `mailto:${escapeHtml(payload.email)}?subject=${encodeURIComponent(`Re: Your Koda Siding quote request`)}`;

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f7f5ec;border:1px solid #ecebe4;border-radius:8px;">
      <tr>
        <td style="padding:6px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${detailRow("Name", escapeHtml(payload.full_name))}
            ${detailRow("Email", emailLink)}
            ${detailRow("Phone", phoneLink)}
            ${detailRow("City", escapeHtml(city))}
            ${detailRow("State", escapeHtml(state))}
            ${detailRow("File", escapeHtml(attachmentNote), true)}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:22px;border:1px solid #ecebe4;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="width:4px;background:#183f31;font-size:0;line-height:0;">&nbsp;</td>
        <td style="padding:18px 20px;background:#ffffff;">
          <p style="margin:0 0 10px;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.4;letter-spacing:0.06em;text-transform:uppercase;color:#5f625d;font-weight:600;">
            Message
          </p>
          <p style="margin:0;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#101613;white-space:pre-wrap;">${escapeHtml(message)}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td height="48" style="height:48px;line-height:48px;font-size:0;">&nbsp;</td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
      <tr>
        <td align="left">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${replyHref}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="10%" stroke="f" fillcolor="#183f31">
            <w:anchorlock/>
            <center style="color:#f7f5ec;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">
              Reply to ${escapeHtml(payload.full_name)}
            </center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-- -->
          <a href="${replyHref}"
             style="display:inline-block;background:#183f31;border-radius:6px;padding:13px 24px;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.2;font-weight:650;color:#f7f5ec !important;text-decoration:none;">
            Reply to ${escapeHtml(payload.full_name)}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
  `;

  const html = emailShell({
    preheader: `New quote request from ${sanitizeHeaderValue(payload.full_name)}${location !== "—" ? ` · ${sanitizeHeaderValue(location)}` : ""}`,
    bodyHtml,
    logoSrc: options?.logoSrc,
  });

  return {
    subject: `New quote request from ${sanitizeHeaderValue(payload.full_name)}${location !== "—" ? ` · ${sanitizeHeaderValue(location)}` : ""}`,
    text,
    html,
  };
}

export function buildTestEmail(options?: EmailTemplateOptions) {
  const text = [
    "Koda Siding — email delivery test",
    "",
    "This is a test message from your website email setup.",
    "If you received this, delivery is working correctly.",
  ].join("\n");

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #ecebe4;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="width:4px;background:#183f31;font-size:0;line-height:0;">&nbsp;</td>
        <td style="padding:20px;background:#f7f5ec;">
          <p style="margin:0 0 6px;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#5f625d;font-weight:600;">
            Status
          </p>
          <p style="margin:0;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.4;color:#101613;font-weight:650;">
            Email delivery verified
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = emailShell({
    preheader: "Your Koda Siding email setup is working.",
    bodyHtml,
    footerNote: "Sent from Email setup in your Koda Siding CMS.",
    logoSrc: options?.logoSrc,
  });

  return {
    subject: "Koda Siding — email delivery test",
    text,
    html,
  };
}

export function buildLeadConfirmationEmail(
  payload: Pick<QuoteMessagePayload, "full_name" | "has_attachment">,
  options?: EmailTemplateOptions,
) {
  const firstName =
    payload.full_name.trim().split(/\s+/)[0] || payload.full_name.trim() || "there";

  const text = [
    `Hi ${firstName},`,
    "",
    "Thanks for requesting a quote from Koda Siding.",
    "We received your details and a specialist will follow up shortly.",
    "",
    payload.has_attachment
      ? "We also received the file you attached with your request."
      : "",
    "",
    "— The Koda Siding team",
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#101613;">
      Hi ${escapeHtml(firstName)},
    </p>
    <p style="margin:0 0 16px;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#101613;">
      Thanks for requesting a quote from Koda Siding. We received your details and a specialist will follow up shortly.
    </p>
    ${
      payload.has_attachment
        ? `<p style="margin:0 0 16px;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#101613;">
      We also received the file you attached with your request.
    </p>`
        : ""
    }
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;border:1px solid #ecebe4;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="width:4px;background:#c8b891;font-size:0;line-height:0;">&nbsp;</td>
        <td style="padding:18px 20px;background:#f7f5ec;">
          <p style="margin:0;font-family:Avenir,'Avenir Next',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#5f625d;">
            No action needed from you right now. If you need to add details, just reply to this email.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = emailShell({
    preheader: "We received your Koda Siding quote request.",
    bodyHtml,
    footerNote: "Sent from Koda Siding after your website quote request.",
    logoSrc: options?.logoSrc,
  });

  return {
    subject: "We received your Koda Siding quote request",
    text,
    html,
  };
}
