import Link from "next/link";
import type { ReactNode } from "react";

export function Wrap({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-gold-500">
      {children}
    </p>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lead,
  dark = false,
  as = "h2",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  dark?: boolean;
  /** Use "h1" when this heading IS the page title. */
  as?: "h1" | "h2";
}) {
  const Heading = as;
  return (
    <div className="mb-11 max-w-[720px]">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading
        className={`text-[clamp(28px,3.6vw,40px)] ${dark ? "text-white" : ""}`}
      >
        {title}
      </Heading>
      {lead && (
        <p
          className={`mt-3.5 text-[17px] leading-relaxed ${
            dark ? "text-[#9fb0c7]" : "text-ink-500"
          }`}
        >
          {lead}
        </p>
      )}
    </div>
  );
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-5 py-3 text-[14.5px] font-semibold min-h-[44px] min-w-[44px] transition active:translate-y-px whitespace-nowrap";

const variants: Record<string, string> = {
  gold: "bg-gold-500 text-navy-900 hover:bg-gold-400",
  navy: "bg-navy-800 text-white hover:bg-navy-700",
  ghost: "border-sand-200 text-navy-800 hover:border-navy-600",
  light: "border-white/30 text-white hover:border-gold-400 hover:text-gold-300",
  wa: "bg-[#1faa52] text-white hover:bg-[#1a9147]",
};

export function Btn({
  href,
  children,
  variant = "navy",
  size = "md",
  className = "",
  external = false,
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants | string;
  size?: "md" | "lg";
  className?: string;
  external?: boolean;
} & Record<string, unknown>) {
  const cls = `${btnBase} ${variants[variant] ?? variants.navy} ${
    size === "lg" ? "px-6 py-3.5 text-[15.5px] min-h-[52px]" : ""
  } ${className}`;

  if (external || href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}

export function Confirm({ label = "confirm" }: { label?: string }) {
  return (
    <span className="ml-1.5 inline-block whitespace-nowrap rounded-full border border-[#e0b84a] bg-[#fff4d6] px-[7px] py-px align-middle text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a5a0b]">
      {label}
    </span>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#e0b84a] bg-[#fff4d6] px-[18px] py-3.5 text-[14px] leading-relaxed text-[#7a5a0b]">
      {children}
    </div>
  );
}

export function Tag({
  children,
  gold = false,
}: {
  children: ReactNode;
  gold?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        gold ? "bg-gold-50 text-[#8a6d1f]" : "bg-sand-100 text-ink-500"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * JSON-LD injection.
 *
 * `JSON.stringify` does NOT escape `<`, so a value containing `</script>`
 * closes the block and everything after it is parsed as HTML. Category and
 * subcategory titles are admin-editable, which makes that a stored XSS path.
 * Escaping the three characters that can terminate or reopen a script
 * context keeps the JSON byte-for-byte valid while making breakout
 * impossible.
 */
function safeJsonLd(data: object) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function Jsonld({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
