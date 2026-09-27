"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROCESS, stageIndexFor } from "@/lib/content";
import { STATUS_LABEL, type Rfq, type Status } from "@/lib/rfq";
import { inr } from "@/lib/pricing";
import { BackBarUI } from "./BackBar";
import { Notice, Wrap } from "./ui";
import EmptyState from "./EmptyState";

const field =
  "min-h-[48px] w-full rounded-md border border-sand-200 px-4 text-[16px] focus:border-navy-600 focus:outline-none focus:ring-[3px] focus:ring-navy-600/12";

export default function Portal({ signedIn, orders }: { signedIn: boolean; orders: Rfq[] }) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [openRef, setOpenRef] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true); setDemoCode(null);
    const r = await fetch("/api/portal", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(j.error ?? "Something went wrong"); return; }
    if (j.demoCode) setDemoCode(j.demoCode);
    setStep("code");
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    const r = await fetch("/api/portal", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", phone, code }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(j.error ?? "Could not verify"); return; }
    router.refresh();
  }

  async function signOut() {
    await fetch("/api/portal", { method: "DELETE" });
    router.refresh();
  }

  /* ---------------- signed out ---------------- */
  if (!signedIn) {
    return (
      <>
        <BackBarUI href="/" label="Home" here="My Orders" />
        <section className="py-14 lg:py-16">
          <Wrap className="max-w-[560px]">
            <h1 className="mb-3 text-[clamp(28px,4vw,40px)]">My orders</h1>
            <p className="mb-8 text-[16.5px] leading-relaxed text-ink-500">
              There is nothing to sign up for. If you have sent us an enquiry,
              you already have an account — it is your phone number. Enter it
              and we will send a one-time code.
            </p>

            {step === "phone" ? (
              <form onSubmit={requestCode} className="rounded-2xl border border-sand-200 bg-white p-6 shadow-md">
                <label className="mb-1.5 block text-[13px] font-semibold text-navy-800">
                  Phone number you enquired from
                </label>
                <input
                  type="tel" inputMode="tel" value={phone} autoFocus
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  className={`${field} mb-3`}
                />
                {err && (
                  <p className="mb-3 rounded-md border border-[#e5b4a2] bg-[#fdefe9] px-3.5 py-2.5 text-[13.5px] font-medium text-[#a6431f]">
                    {err}
                  </p>
                )}
                <button type="submit" disabled={busy}
                  className="min-h-[48px] w-full rounded-md bg-navy-800 text-[15px] font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60">
                  {busy ? "Sending…" : "Send me a code"}
                </button>
              </form>
            ) : (
              <form onSubmit={submitCode} className="rounded-2xl border border-sand-200 bg-white p-6 shadow-md">
                <label className="mb-1.5 block text-[13px] font-semibold text-navy-800">
                  6-digit code
                </label>
                <input
                  inputMode="numeric" maxLength={6} value={code} autoFocus
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className={`${field} mb-3 text-center text-[26px] font-bold tracking-[0.4em]`}
                />
                {demoCode && (
                  <div className="mb-3 rounded-md border border-[#e0b84a] bg-[#fff4d6] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#7a5a0b]">
                    <strong>Demo mode.</strong> No automation is connected, so
                    the code is shown here instead of being sent:{" "}
                    <b className="text-[15px] tracking-wider">{demoCode}</b>
                    <br />
                    With n8n wired up it goes to the buyer on WhatsApp and never
                    appears in this response.
                  </div>
                )}
                {err && (
                  <p className="mb-3 rounded-md border border-[#e5b4a2] bg-[#fdefe9] px-3.5 py-2.5 text-[13.5px] font-medium text-[#a6431f]">
                    {err}
                  </p>
                )}
                <button type="submit" disabled={busy || code.length !== 6}
                  className="mb-2.5 min-h-[48px] w-full rounded-md bg-navy-800 text-[15px] font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60">
                  {busy ? "Checking…" : "Sign in"}
                </button>
                <button type="button" onClick={() => { setStep("phone"); setErr(""); setCode(""); }}
                  className="w-full text-[13.5px] font-medium text-ink-400 underline underline-offset-2 hover:text-navy-800">
                  Use a different number
                </button>
              </form>
            )}

            <div className="mt-6 space-y-3">
              <Notice>
                We never say whether a number is in our system before you verify
                it. Otherwise anyone could type numbers in and map out our
                customer list.
              </Notice>
              <p className="text-[14px] leading-relaxed text-ink-500">
                Haven&apos;t enquired yet?{" "}
                <Link href="/quote" className="font-semibold text-navy-800 underline decoration-gold-500 underline-offset-4">
                  Build a quote
                </Link>{" "}
                — no account needed for that either. Or just check one order by{" "}
                <Link href="/track" className="font-semibold text-navy-800 underline decoration-gold-500 underline-offset-4">
                  reference number
                </Link>.
              </p>
            </div>
          </Wrap>
        </section>
      </>
    );
  }

  /* ---------------- signed in ---------------- */
  const open = orders.filter((o) => !["closed", "lost"].includes(o.status));
  const pieces = orders.reduce((a, o) => a + o.qty, 0);

  return (
    <>
      <BackBarUI href="/" label="Home" here="My Orders" />
      <section className="py-12 lg:py-14">
        <Wrap>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[clamp(26px,3.6vw,36px)]">My orders</h1>
              <p className="mt-1 text-[14.5px] text-ink-500">
                {orders.length} enquir{orders.length === 1 ? "y" : "ies"} · {open.length} open ·{" "}
                {pieces.toLocaleString("en-IN")} pieces total
              </p>
            </div>
            <button onClick={signOut}
              className="min-h-[40px] rounded-md border border-sand-200 px-4 text-[13.5px] font-semibold text-ink-500 hover:border-ink-400">
              Sign out
            </button>
          </div>

          {orders.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              body="No enquiries are recorded against this number. If you enquired from a different phone, sign out and try that one."
              action={{ href: "/quote", label: "Build a quote" }}
            />
          ) : (
            <div className="grid gap-3">
              {orders.map((o) => {
                const isOpen = openRef === o.ref;
                const stage = stageIndexFor(o.status);
                return (
                  <div key={o.ref}
                    className={`overflow-hidden rounded-2xl border bg-white transition ${isOpen ? "border-navy-600 shadow-md" : "border-sand-200"}`}>
                    <button onClick={() => setOpenRef(isOpen ? null : o.ref)}
                      className="w-full px-5 py-4 text-left">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="text-[14px] font-bold text-navy-800">{o.ref}</span>
                        <span className="rounded-full bg-gold-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#8a6d1f]">
                          {STATUS_LABEL[o.status as Status]}
                        </span>
                        <span className="ml-auto text-[15px] font-semibold text-navy-800">{o.qty} pcs</span>
                      </div>
                      <div className="mt-1 text-[13px] text-ink-400">
                        {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}{(o.lines ?? []).length} item{(o.lines ?? []).length === 1 ? "" : "s"}
                        {o.est_low > 0 && ` · est ${inr(o.est_low)}–${inr(o.est_high)}`}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-sand-100 p-5">
                        <div className="mb-5 grid gap-2">
                          {(o.lines ?? []).map((l, i) => (
                            <div key={i} className="rounded-lg bg-sand-50 p-3.5">
                              <div className="flex flex-wrap justify-between gap-2">
                                <span className="text-[14px] font-semibold text-navy-800">
                                  {l.product} · {l.fabric}
                                  {l.colour && <span className="ml-2 font-normal text-ink-400">{l.colour}</span>}
                                </span>
                                <span className="text-[14px] font-semibold text-navy-800">{l.qty} pcs</span>
                              </div>
                              <div className="mt-1 text-[12.5px] text-ink-500">
                                {l.decoration !== "none" ? `${l.decoration} × ${l.positions}` : "No branding"}
                              </div>
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {Object.entries(l.sizes).filter(([, v]) => v > 0).map(([k, v]) => (
                                  <span key={k} className="rounded bg-white px-1.5 py-0.5 text-[11.5px] font-medium text-navy-800">
                                    {k}:{v}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mb-5">
                          <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-gold-500">Progress</div>
                          <div className="flex flex-wrap gap-1">
                            {PROCESS.map((s, i) => (
                              <span key={s.slug} title={s.title}
                                className={`h-1.5 flex-1 rounded-full ${i <= stage ? "bg-navy-800" : "bg-sand-200"}`} />
                            ))}
                          </div>
                          <div className="mt-1.5 text-[12.5px] text-ink-400">
                            {stage >= 0 ? PROCESS[stage].title : "Not yet in production"}
                          </div>
                        </div>

                        <Link href={`/quote?reorder=${o.ref}`}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-gold-500 px-5 text-[14.5px] font-bold text-navy-900 transition hover:bg-gold-400">
                          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 3-6.7L3 8m0 0V3m0 5h5" />
                          </svg>
                          Reorder this
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Wrap>
      </section>
    </>
  );
}
