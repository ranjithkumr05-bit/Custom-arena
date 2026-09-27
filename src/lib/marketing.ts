/**
 * Marketing attribution.
 *
 * The question a manufacturer running ads cannot usually answer is: "which
 * spend produced which enquiry?" Page-level analytics tells you a campaign
 * got 400 clicks. It does not tell you that CA-2609-0009 — a 960-piece
 * enquiry — came from it.
 *
 * So attribution is captured in the browser, carried on the RFQ, and stored
 * on the row itself. It then shows up next to the money in the admin, which
 * is the only place it is actually useful.
 *
 * FIRST-TOUCH is kept as well as last-touch. A buyer typically discovers you
 * on a search ad, leaves, and returns directly a week later to enquire.
 * Last-touch alone credits that order to "direct" and you switch off the ad
 * that actually produced it.
 */

export interface Attribution {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  referrer: string;
  landing: string;
  clickId: string;
  device: string;
  firstSeen: string;
  touches: number;
}

const KEY = "ca_attr";

export const EMPTY: Attribution = {
  source: "", medium: "", campaign: "", term: "", content: "",
  referrer: "", landing: "", clickId: "", device: "", firstSeen: "", touches: 0,
};

/** Classify a referrer when no UTM tags are present. */
function classifyReferrer(ref: string): { source: string; medium: string } {
  if (!ref) return { source: "direct", medium: "none" };
  let host = "";
  try { host = new URL(ref).hostname.replace(/^www\./, ""); } catch { return { source: "direct", medium: "none" }; }

  const engines = ["google.", "bing.", "duckduckgo.", "yahoo.", "yandex.", "ecosia."];
  if (engines.some((e) => host.includes(e))) return { source: host, medium: "organic" };

  const social: Record<string, string> = {
    "facebook.com": "facebook", "m.facebook.com": "facebook", "l.facebook.com": "facebook",
    "instagram.com": "instagram", "l.instagram.com": "instagram",
    "linkedin.com": "linkedin", "lnkd.in": "linkedin",
    "youtube.com": "youtube", "t.co": "twitter", "x.com": "twitter",
    "pinterest.com": "pinterest",
  };
  if (social[host]) return { source: social[host], medium: "social" };

  // WhatsApp and other messengers arrive with no referrer on most clients,
  // which is exactly why the wa= tag exists on our own share links.
  if (host.includes("whatsapp")) return { source: "whatsapp", medium: "messaging" };

  return { source: host, medium: "referral" };
}

function device(): string {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

/**
 * Read the current URL, merge with anything stored, persist and return.
 * Call once per page load.
 */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY;

  let stored: Attribution = EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) stored = { ...EMPTY, ...JSON.parse(raw) };
  } catch { /* private mode, quota — attribution is not worth throwing over */ }

  const q = new URLSearchParams(window.location.search);
  const get = (k: string) => (q.get(k) ?? "").slice(0, 120);

  const gclid = get("gclid");
  const fbclid = get("fbclid");
  const msclkid = get("msclkid");
  const clickId = gclid ? `gclid:${gclid}` : fbclid ? `fbclid:${fbclid}` : msclkid ? `msclkid:${msclkid}` : "";

  let source = get("utm_source");
  let medium = get("utm_medium");

  // A click ID with no UTM tags still tells us it was paid.
  if (!source && gclid) { source = "google"; medium = "cpc"; }
  if (!source && fbclid) { source = "facebook"; medium = "paid_social"; }
  if (!source && msclkid) { source = "bing"; medium = "cpc"; }

  const isNewTouch = !!source || !stored.firstSeen;

  if (!source) {
    const c = classifyReferrer(document.referrer);
    // Only overwrite a stored campaign with "direct" if nothing is stored.
    if (!stored.source || c.medium !== "none") {
      source = c.source;
      medium = c.medium;
    } else {
      source = stored.source;
      medium = stored.medium;
    }
  }

  const next: Attribution = {
    // First touch wins for campaign identity; it is the click you paid for.
    source: stored.source && !get("utm_source") && !clickId ? stored.source : source,
    medium: stored.medium && !get("utm_medium") && !clickId ? stored.medium : medium,
    campaign: get("utm_campaign") || stored.campaign,
    term: get("utm_term") || stored.term,
    content: get("utm_content") || stored.content,
    referrer: stored.referrer || document.referrer.slice(0, 300),
    landing: stored.landing || (window.location.pathname + window.location.search).slice(0, 300),
    clickId: clickId || stored.clickId,
    device: device(),
    firstSeen: stored.firstSeen || new Date().toISOString(),
    touches: (stored.touches || 0) + (isNewTouch ? 1 : 0),
  };

  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export function readAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Human label for the admin. */
export function attributionLabel(a: Partial<Attribution>) {
  if (!a.source) return "unknown";
  const base = a.medium && a.medium !== "none" ? `${a.source} / ${a.medium}` : a.source;
  return a.campaign ? `${base} · ${a.campaign}` : base;
}

/** Paid sources are worth separating — they have a cost attached. */
export function isPaid(a: Partial<Attribution>) {
  const m = (a.medium ?? "").toLowerCase();
  return ["cpc", "ppc", "paid_social", "paidsocial", "display", "paid"].includes(m) || !!a.clickId;
}
