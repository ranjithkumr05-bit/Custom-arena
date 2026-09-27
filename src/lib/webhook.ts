/**
 * Outbound automation dispatch (n8n, Make, Zapier, anything).
 *
 * - HMAC-SHA256 signature so the receiver can verify the payload is ours
 * - Exponential backoff retry
 * - Hard timeout; never blocks or fails the buyer's request
 */
import { createHmac } from "crypto";

const SECRET = process.env.WEBHOOK_SECRET ?? "";

export function sign(body: string) {
  if (!SECRET) return "";
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

export interface DispatchResult {
  sent: boolean;
  status?: number;
  attempts: number;
  reason?: string;
}

export async function dispatch(
  event: string,
  data: unknown,
  { retries = 2, timeoutMs = 5000 } = {}
): Promise<DispatchResult> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return { sent: false, attempts: 0, reason: "N8N_WEBHOOK_URL not set" };

  const body = JSON.stringify({
    event,
    sentAt: new Date().toISOString(),
    data,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-CA-Event": event,
  };
  const sig = sign(body);
  if (sig) headers["X-CA-Signature"] = `sha256=${sig}`;

  let lastReason = "";
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return { sent: true, status: res.status, attempts: attempt };
      lastReason = `HTTP ${res.status}`;
      // 4xx other than 429 will not succeed on retry.
      if (res.status < 500 && res.status !== 429) {
        return { sent: false, status: res.status, attempts: attempt, reason: lastReason };
      }
    } catch (e) {
      lastReason = e instanceof Error ? e.message : String(e);
    }
    if (attempt <= retries) {
      await new Promise((r) => setTimeout(r, 250 * 2 ** (attempt - 1)));
    }
  }
  return { sent: false, attempts: retries + 1, reason: lastReason };
}
