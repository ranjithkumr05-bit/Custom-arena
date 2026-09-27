import { SkHero, SkCardGrid, SkRegion } from "@/components/Skeleton";
import { Wrap } from "@/components/ui";

export default function Loading() {
  return (
    <SkRegion label="Loading categories">
      <SkHero />
      <section className="py-14">
        <Wrap><SkCardGrid n={8} cols="lg:grid-cols-2" /></Wrap>
      </section>
    </SkRegion>
  );
}
