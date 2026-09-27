"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "./kit/overlays";
import { Avatar, Spinner } from "./kit/controls";

/**
 * Account control.
 *
 * "My Orders" was the wrong label — to a first-time visitor it names
 * something they do not have, so it reads as an error. But "Register" would
 * be worse: it promises a signup form that does not exist, and adds a barrier
 * in front of a site whose entire pitch is that quoting is frictionless.
 *
 * The honest fix is a control that states what it DOES, and changes with
 * state:
 *
 *   signed out -> "Sign in"   + a menu that explains there is nothing to
 *                               register for, and points first-timers at the
 *                               quote builder
 *   signed in  -> avatar      + orders, reorder, sign out
 *
 * That removes the confusion without inventing a registration step.
 */

interface Order { ref: string; status: string; qty: number }

export default function AccountMenu() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "out" | "in">("loading");
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/portal")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        if (j?.ok && j.signedIn) {
          setPhone(j.phone ?? "");
          setOrders(j.orders ?? []);
          setState("in");
        } else setState("out");
      })
      .catch(() => alive && setState("out"));
    return () => { alive = false; };
  }, []);

  async function signOut() {
    await fetch("/api/portal", { method: "DELETE" });
    setState("out");
    setOrders([]);
    router.refresh();
  }

  const open = orders.filter((o) => !["closed", "lost"].includes(o.status)).length;

  if (state === "loading") {
    return (
      <span className="inline-flex size-[44px] shrink-0 items-center justify-center rounded-md border border-sand-200 text-ink-400 sm:w-[92px]">
        <Spinner size={15} label="Checking sign-in" />
      </span>
    );
  }

  /* ---------------- signed out ---------------- */
  if (state === "out") {
    return (
      <Menu
        width={288}
        header={
          <p className="text-[12.5px] leading-relaxed text-ink-500">
            <b className="text-navy-800">Nothing to register for.</b> If you have
            sent us an enquiry you already have an account — it is your phone
            number.
          </p>
        }
        items={[
          {
            label: "Sign in with your phone",
            href: "/my-orders",
            hint: "One-time code, no password",
            icon: (
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" />
              </svg>
            ),
          },
          {
            label: "Track one order",
            href: "/track",
            hint: "Reference + phone last 4",
            icon: (
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
            ),
          },
          { label: "New here", separatorBefore: true },
          {
            label: "Get a quote",
            href: "/quote",
            hint: "No account needed",
            icon: (
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
              </svg>
            ),
          },
        ]}
        trigger={({ open: isOpen, toggle, ref }) => (
          <button
            ref={ref}
            onClick={toggle}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            /* Never hidden. A returning buyer's only reason to come back is
               their orders — burying that behind the burger on the device most
               of them use is the wrong trade. Icon-only under 640px, icon plus
               label above it. */
            className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-md border px-2.5 text-[14.5px] font-semibold transition sm:px-3.5 ${
              isOpen ? "border-navy-600 text-navy-800" : "border-sand-200 text-navy-800 hover:border-navy-600"
            }`}
            title="Sign in to see your orders"
          >
            <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
            <span className="hidden sm:inline">Sign in</span>
          </button>
        )}
      />
    );
  }

  /* ---------------- signed in ---------------- */
  return (
    <Menu
      width={276}
      header={
        <div className="flex items-center gap-2.5">
          <Avatar name={phone} size={36} />
          <span className="min-w-0">
            <span className="block text-[13.5px] font-semibold text-navy-800">
              ••••• {phone.slice(-5)}
            </span>
            <span className="block text-[11.5px] text-ink-400">
              {orders.length} enquir{orders.length === 1 ? "y" : "ies"} · {open} open
            </span>
          </span>
        </div>
      }
      items={[
        {
          label: "My orders",
          href: "/my-orders",
          hint: open ? `${open} in progress` : "View all",
          icon: (
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5h16v14H4zM4 10h16M9 15h6" />
            </svg>
          ),
        },
        ...(orders[0]
          ? [{
              label: `Reorder ${orders[0].ref}`,
              href: `/quote?reorder=${orders[0].ref}`,
              hint: `${orders[0].qty} pieces, same spec`,
              icon: (
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8m0 0V3m0 5h5" />
                </svg>
              ),
            }]
          : []),
        {
          label: "New quote",
          href: "/quote",
          icon: (
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          ),
        },
        {
          label: "Sign out",
          onSelect: signOut,
          danger: true,
          separatorBefore: true,
          icon: (
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          ),
        },
      ]}
      trigger={({ open: isOpen, toggle, ref }) => (
        <button
          ref={ref}
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label="Account menu"
          className={`relative grid size-[44px] shrink-0 place-items-center rounded-full border transition ${
            isOpen ? "border-navy-600" : "border-sand-200 hover:border-navy-600"
          }`}
        >
          <Avatar name={phone} size={32} />
          {open > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-[18px] place-items-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-900">
              {open}
            </span>
          )}
        </button>
      )}
    />
  );
}
