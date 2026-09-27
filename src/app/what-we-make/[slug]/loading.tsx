import { SkHero, SkCardGrid, SkRegion } from "@/components/Skeleton";
import { Wrap } from "@/components/ui";

export default function Loading() {
  return (
    <SkRegion label="Loading category">
      <SkHero />
      <section className="py-14">
        <Wrap>
          <div className="ca-shimmer mb-7 h-6 w-72 rounded bg-sand-100" />
          <SkCardGrid n={6} cols="lg:grid-cols-3" />
        </Wrap>
      </section>
    </SkRegion>
  );
}
