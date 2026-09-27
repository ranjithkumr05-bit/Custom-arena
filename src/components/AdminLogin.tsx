"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wrap } from "./ui";

export default function AdminLogin() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErr(json.error ?? "Login failed");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <section className="grid min-h-[70vh] place-items-center py-16">
      <Wrap className="max-w-[420px]">
        <form onSubmit={submit} className="rounded-2xl border border-sand-200 bg-white p-8 shadow-md">
          <div className="mb-1 text-[11.5px] font-bold uppercase tracking-[0.12em] text-gold-500">
            Internal
          </div>
          <h1 className="mb-2 text-[26px]">RFQ inbox</h1>
          <p className="mb-6 text-[14px] leading-relaxed text-ink-500">
            Enquiries submitted through the site. Staff access only.
          </p>

          <label className="mb-1 block text-[13px] font-semibold text-navy-800">Password</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
            className="mb-3 min-h-[46px] w-full rounded-md border border-sand-200 px-3.5 text-[15px] focus:border-navy-600 focus:outline-none focus:ring-[3px] focus:ring-navy-600/12"
          />

          {err && (
            <p className="mb-3 rounded-md border border-[#e5b4a2] bg-[#fdefe9] px-3.5 py-2.5 text-[13.5px] font-medium text-[#a6431f]">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="min-h-[46px] w-full rounded-md bg-navy-800 text-[15px] font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60"
          >
            {busy ? "Checking…" : "Sign in"}
          </button>

          <p className="mt-5 rounded-md border border-[#e0b84a] bg-[#fff4d6] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#7a5a0b]">
            <strong>Demo password: tiruppur2026</strong><br />
            Set <code>ADMIN_PASSWORD</code> and <code>ADMIN_SALT</code> in
            <code> .env.local</code> before this goes anywhere public.
          </p>
        </form>
      </Wrap>
    </section>
  );
}
