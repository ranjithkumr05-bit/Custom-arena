import { Sk, SkRows, SkRegion } from "@/components/Skeleton";
import { Wrap } from "@/components/ui";

export default function Loading() {
  return (
    <SkRegion label="Loading your orders">
      <section className="py-12">
        <Wrap>
          <Sk className="mb-2 h-9 w-52" />
          <Sk className="mb-7 h-4 w-72" />
          <SkRows n={4} />
        </Wrap>
      </section>
    </SkRegion>
  );
}
