import { SkHero, SkCardGrid, SkRegion } from "@/components/Skeleton";
import { Wrap } from "@/components/ui";

export default function Loading() {
  return (
    <SkRegion label="Loading page">
      <SkHero />
      <section className="py-14">
        <Wrap>
          <div className="ca-shimmer mb-8 h-7 w-64 rounded bg-sand-100" />
          <SkCardGrid n={8} />
        </Wrap>
      </section>
    </SkRegion>
  );
}
