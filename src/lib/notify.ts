/**
 * Notification fan-out.
 *
 * Previously the only outbound path was an n8n webhook. With n8n unset,
 * `dispatch()` returned `{sent:false}` and the enquiry sat silently in the
 * database — the owner only found out on their next visit to /admin.
 *
 * Now every channel is independent and optional. Configure one, two or all
 * three; whatever is set fires, in parallel, and a failure in one never
 * blocks the others or the buyer's request.
 *
 *   WhatsApp   Meta Cloud API      fastest to actually get read in India
 *   Email      Resend HTTP API     a durable record with full detail
 *   n8n        webhook             anything else — Sheets, CRM, Slack
 *
 * All three are plain fetch calls. No SMTP library, no SDK, no new
 * dependency.
 */
import "server-only";
import { dispatch } from "./webhook";
import type { Rfq } from "./rfq";

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export interface ChannelResult {
  channel: string;
  sent: boolean;
  detail?: string;
}

/* ------------------------------------------------------------------ */
/* message bodies                                                      */
/* ------------------------------------------------------------------ */

function summaryLines(r: Rfq) {
  return (r.lines ?? []).map((l) => {
    const sizes = Object.entries(l.sizes)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}:${v}`)
      .join(" ");
    const deco = l.decoration === "none" ? "no branding" : `${l.decoration} x${l.positions}`;
    return `• ${l.qty} x ${l.product} / ${l.fabric}${l.colour ? ` / ${l.colour}` : ""} — ${deco}\n  ${sizes}`;
  });
}

export function whatsappText(r: Rfq, files = 0) {
  const flag = r.priority === "high" ? "🔴 HIGH VALUE" : r.priority === "medium" ? "🟡" : "⚪";
  return [
    `${flag} NEW ENQUIRY — ${r.ref}`,
    "",
    `${r.name}${r.organisation ? ` · ${r.organisation}` : ""}`,
    `${r.phone}${r.city ? ` · ${r.city}` : ""}`,
    r.email || "",
    "",
    `${r.qty} pieces across ${(r.lines ?? []).length} item(s)`,
    ...summaryLines(r),
    "",
    r.est_low ? `Site estimate: ${inr(r.est_low)}–${inr(r.est_high)}` : "",
    r.required_by ? `Needed by: ${r.required_by}` : "",
    files ? `${files} file(s) attached — see admin` : "",
    r.utm_source && r.utm_source !== "direct"
      ? `Source: ${r.utm_source}/${r.utm_medium}${r.utm_campaign ? ` · ${r.utm_campaign}` : ""}`
      : "",
    r.notes ? `\nNotes: ${r.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function emailHtml(r: Rfq, files: { url: string; original_name: string }[], base: string) {
  const rows = (r.lines ?? [])
    .map((l) => {
      const sizes = Object.entries(l.sizes)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `<b>${k}</b> ${v}`)
        .join(" &nbsp; ");
      return `<tr><td style="padding:10px 12px;border-bottom:1px solid #eee">
        <b>${l.qty} × ${l.product}</b> / ${l.fabric}${l.colour ? ` / ${l.colour}` : ""}<br>
        <span style="color:#666;font-size:13px">${l.decoration === "none" ? "No branding" : `${l.decoration} × ${l.positions}`}</span><br>
        <span style="color:#666;font-size:13px">${sizes}</span>
      </td></tr>`;
    })
    .join("");

  const att = files.length
    ? `<p style="margin:18px 0 6px;font-size:13px;color:#666">Attachments (${files.length})</p>` +
      files.map((f) => `<a href="${base}${f.url}" style="display:block;font-size:13px;color:#0b1f3a">${f.original_name}</a>`).join("")
    : "";

  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;color:#0b1f3a">
    <div style="background:#071528;padding:20px 24px;border-radius:12px 12px 0 0">
      <div style="color:#c8a24a;font-size:11px;letter-spacing:2px;text-transform:uppercase">New enquiry</div>
      <div style="color:#fff;font-size:24px;font-weight:700;margin-top:4px">${r.ref}</div>
    </div>
    <div style="border:1px solid #e5e2d8;border-top:0;border-radius:0 0 12px 12px;padding:22px 24px">
      <p style="margin:0 0 4px;font-size:17px;font-weight:600">${r.name}</p>
      <p style="margin:0 0 16px;color:#666;font-size:14px">
        ${r.organisation || r.buyer_type}<br>
        <a href="tel:${r.phone}" style="color:#0b1f3a">${r.phone}</a>
        ${r.email ? ` · <a href="mailto:${r.email}" style="color:#0b1f3a">${r.email}</a>` : ""}
        ${r.city ? ` · ${r.city}` : ""}
      </p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #eee">${rows}</table>
      <p style="margin:16px 0 0;font-size:15px"><b>${r.qty} pieces</b>${
        r.est_low ? ` &nbsp;·&nbsp; site estimate ${inr(r.est_low)}–${inr(r.est_high)}` : ""
      }</p>
      ${r.required_by ? `<p style="margin:4px 0 0;font-size:13px;color:#666">Needed by ${r.required_by}</p>` : ""}
      ${r.notes ? `<p style="margin:14px 0 0;padding:12px;background:#faf9f6;border-radius:8px;font-size:13.5px">${r.notes}</p>` : ""}
      ${att}
      <p style="margin:22px 0 0">
        <a href="${base}/admin" style="display:inline-block;background:#0b1f3a;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Open in admin</a>
        <a href="https://wa.me/${r.phone.replace(/\D/g, "")}" style="display:inline-block;margin-left:8px;color:#1faa52;padding:12px 0;text-decoration:none;font-weight:600;font-size:14px">Reply on WhatsApp</a>
      </p>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ */
/* channels                                                            */
/* ------------------------------------------------------------------ */

async function sendWhatsApp(text: string): Promise<ChannelResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const to = process.env.OWNER_WHATSAPP;
  if (!token || !phoneId || !to) {
    return { channel: "whatsapp", sent: false, detail: "not configured" };
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text.slice(0, 4000) },
      }),
      signal: AbortSignal.timeout(8000),
    });
    return { channel: "whatsapp", sent: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    return { channel: "whatsapp", sent: false, detail: String(e) };
  }
}

async function sendEmail(subject: string, html: string): Promise<ChannelResult> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.OWNER_EMAIL;
  const from = process.env.NOTIFY_FROM;
  if (!key || !to || !from) {
    return { channel: "email", sent: false, detail: "not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: to.split(",").map((s) => s.trim()), subject, html }),
      signal: AbortSignal.timeout(8000),
    });
    return { channel: "email", sent: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    return { channel: "email", sent: false, detail: String(e) };
  }
}

/* ------------------------------------------------------------------ */

export async function notifyNewRfq(
  rfq: Rfq,
  files: { url: string; original_name: string }[] = []
): Promise<ChannelResult[]> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const subject = `${rfq.priority === "high" ? "🔴 " : ""}New enquiry ${rfq.ref} — ${rfq.qty} pcs — ${rfq.name}`;

  // Parallel, so a slow channel does not delay the others.
  const [wa, mail, hook] = await Promise.all([
    sendWhatsApp(whatsappText(rfq, files.length)),
    sendEmail(subject, emailHtml(rfq, files, base)),
    dispatch("rfq.created", { ...rfq, files }),
  ]);

  const results: ChannelResult[] = [
    wa,
    mail,
    { channel: "n8n", sent: hook.sent, detail: hook.reason },
  ];

  // If nothing is configured, say so loudly in the server log rather than
  // failing silently — this is the failure mode that loses enquiries.
  if (!results.some((r) => r.sent)) {
    console.warn(
      `[notify] ${rfq.ref} (${rfq.qty} pcs, ${rfq.priority}) — NO CHANNEL CONFIGURED. ` +
        `Set OWNER_WHATSAPP + WHATSAPP_TOKEN + WHATSAPP_PHONE_ID, or OWNER_EMAIL + RESEND_API_KEY, ` +
        `or N8N_WEBHOOK_URL. The enquiry is saved and visible at /admin.`
    );
  }
  return results;
}
