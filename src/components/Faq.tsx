import { Confirm } from "./ui";

export default function Faq({
  items,
}: {
  items: { q: string; a: string; confirm?: boolean }[];
}) {
  return (
    <div className="max-w-[820px]">
      {items.map((f) => (
        <details
          key={f.q}
          className="group border-b border-sand-200 py-[18px]"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[16px] font-semibold text-navy-800 [&::-webkit-details-marker]:hidden">
            <span>
              {f.q}
              {f.confirm && <Confirm />}
            </span>
            <span className="shrink-0 text-[22px] font-normal leading-none text-gold-500">
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">–</span>
            </span>
          </summary>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-500">
            {f.a?.trim()
              ? f.a
              : "To be filled in with your confirmed information. We do not publish a value you have not verified."}
          </p>
        </details>
      ))}
    </div>
  );
}
