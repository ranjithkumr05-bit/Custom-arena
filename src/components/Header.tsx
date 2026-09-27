"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Btn, Wrap } from "./ui";
import CommandPalette from "./CommandPalette";
import Logo from "./Logo";
import AccountMenu from "./AccountMenu";

export interface NavCat { slug: string; title: string; hero: string; count: number }

/**
 * Six flat nav items forced the desktop nav behind a hamburger until 1280px,
 * which left 1024–1279px laptops staring at a burger beside 400px of empty
 * space. Grouping into four items with dropdowns lets the full nav show from
 * 1024px, and gives the 8 categories somewhere to actually surface.
 */
const GROUPS = [
  {
    label: "How We Work",
    items: [
      { href: "/process", label: "In-house process", desc: "Six stages, one roof" },
      { href: "/fabrics", label: "Fabrics & branding", desc: "Knits and the five print methods" },
      { href: "/pricing", label: "How pricing works", desc: "The actual costing formula" },
      { href: "/work", label: "Our work", desc: "Production photography" },
    ],
  },
  {
    label: "Learn",
    items: [
      { href: "/guides", label: "Guides", desc: "GSM, printing, size curves, MOQ" },
      { href: "/glossary", label: "Glossary", desc: "58 terms in plain English" },
    ],
  },
];

export default function Header({ nav = [] }: { nav?: NavCat[] }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const path = usePathname();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); setMenu(null); }, [path]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(null); };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onKey); };
  }, []);

  const on = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-sand-200 bg-white/92 backdrop-blur-md backdrop-saturate-150">
      <Wrap className="relative flex h-[72px] items-center gap-4" >
        <Link href="/" aria-label="CustomWear home" className="flex min-h-[44px] min-w-[44px] shrink-0 items-center px-3">
          <Logo size={40} />
        </Link>

        <div ref={barRef} className="ml-auto hidden items-center gap-1 lg:flex">
          {/* --- mega menu --- */}
          <div className="relative">
            <button
              onClick={() => setMenu(menu === "make" ? null : "make")}
              aria-expanded={menu === "make"}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[14px] font-medium transition ${
                on("/what-we-make") || menu === "make" ? "text-navy-800" : "text-ink-500 hover:text-navy-800"
              }`}
            >
              What We Make
              <svg viewBox="0 0 24 24" className={`size-3.5 transition ${menu === "make" ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {menu === "make" && (
              <div className="absolute left-1/2 top-[calc(100%+10px)] w-[min(860px,88vw)] -translate-x-1/2 rounded-2xl border border-sand-200 bg-white p-4 shadow-2xl">
                <div className="grid grid-cols-4 gap-2.5">
                  {nav.map((c) => (
                    <Link key={c.slug} href={`/what-we-make/${c.slug}`}
                      className="group rounded-xl p-2 transition hover:bg-sand-50">
                      <span className="relative mb-2 block aspect-[16/10] overflow-hidden rounded-lg bg-sand-100">
                        <Image src={c.hero} alt="" fill sizes="200px"
                          className="object-cover transition duration-500 group-hover:scale-105" />
                      </span>
                      <span className="block text-[13px] font-semibold leading-snug text-navy-800">{c.title}</span>
                      <span className="block text-[11.5px] text-ink-400">{c.count} types</span>
                    </Link>
                  ))}
                </div>
                <Link href="/what-we-make"
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-sand-50 py-2.5 text-[13.5px] font-semibold text-navy-800 hover:bg-sand-100">
                  See all categories
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

          {/* --- grouped dropdowns --- */}
          {GROUPS.map((g) => (
            <div key={g.label} className="relative">
              <button
                onClick={() => setMenu(menu === g.label ? null : g.label)}
                aria-expanded={menu === g.label}
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[14px] font-medium transition ${
                  g.items.some((i) => on(i.href)) || menu === g.label ? "text-navy-800" : "text-ink-500 hover:text-navy-800"
                }`}
              >
                {g.label}
                <svg viewBox="0 0 24 24" className={`size-3.5 transition ${menu === g.label ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {menu === g.label && (
                <div className="absolute left-0 top-[calc(100%+10px)] w-[300px] rounded-xl border border-sand-200 bg-white p-1.5 shadow-2xl">
                  {g.items.map((i) => (
                    <Link key={i.href} href={i.href} className="block rounded-lg px-3 py-2.5 transition hover:bg-sand-50">
                      <span className="block text-[14px] font-semibold text-navy-800">{i.label}</span>
                      <span className="block text-[12.5px] text-ink-400">{i.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Link href="/about"
            className={`rounded-md px-3 py-2 text-[14px] font-medium transition ${
              on("/about") ? "text-navy-800" : "text-ink-500 hover:text-navy-800"
            }`}>
            About
          </Link>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:ml-3">
          <CommandPalette />
          <AccountMenu />
          <Btn href="/quote" variant="navy" className="shrink-0 min-w-[44px] px-3 text-[14px] sm:px-5 sm:text-[14.5px]">
            <span className="sm:hidden">Quote</span>
            <span className="hidden sm:inline">Get a Quote</span>
          </Btn>
          <button onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}
            className="grid size-11 shrink-0 place-items-center rounded-md border border-sand-200 lg:hidden">
            <span className="relative block h-0.5 w-[18px] bg-navy-800 before:absolute before:-top-1.5 before:left-0 before:h-0.5 before:w-[18px] before:bg-navy-800 before:content-[''] after:absolute after:top-1.5 after:left-0 after:h-0.5 after:w-[18px] after:bg-navy-800 after:content-['']" />
          </button>
        </div>

        {/* --- mobile --- */}
        {open && (
          <div className="absolute inset-x-0 top-[72px] max-h-[calc(100vh-72px)] overflow-y-auto border-b border-sand-200 bg-white px-6 pb-5 pt-3 shadow-lg lg:hidden">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-500">What we make</div>
            <div className="mb-4 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              {nav.map((c) => (
                <Link key={c.slug} href={`/what-we-make/${c.slug}`}
                  className="flex items-center gap-2.5 rounded-lg border border-sand-200 p-2">
                  <span className="relative size-10 shrink-0 overflow-hidden rounded bg-sand-100">
                    <Image src={c.hero} alt="" fill sizes="40px" className="object-cover" />
                  </span>
                  <span className="min-w-0 text-[12.5px] font-semibold leading-tight text-navy-800">{c.title}</span>
                </Link>
              ))}
            </div>

            {GROUPS.map((g) => (
              <div key={g.label} className="mb-3">
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-500">{g.label}</div>
                {g.items.map((i) => (
                  <Link key={i.href} href={i.href}
                    className="block border-b border-sand-100 py-2.5 text-[14.5px] font-medium text-navy-800">
                    {i.label}
                  </Link>
                ))}
              </div>
            ))}

            {[
              { href: "/about", label: "About" },
              { href: "/my-orders", label: "Sign in / My orders" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                className="block border-b border-sand-100 py-2.5 text-[14.5px] font-medium text-navy-800">
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </Wrap>
    </header>
  );
}
