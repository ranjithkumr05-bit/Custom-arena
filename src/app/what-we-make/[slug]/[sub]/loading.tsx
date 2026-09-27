import { Sk, SkText, SkRegion } from "@/components/Skeleton";
import { Wrap } from "@/components/ui";

export default function Loading() {
  return (
    <SkRegion label="Loading product">
      <section className="border-b border-sand-200 bg-sand-50">
        <Wrap className="grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-14">
          <div>
            <Sk className="mb-4 h-3 w-64" />
            <Sk className="mb-4 h-9 w-3/4" />
            <SkText lines={2} />
            <div className="mt-5 flex gap-1.5">
              <Sk className="h-6 w-24 rounded-full" />
              <Sk className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-6 flex gap-3">
              <Sk className="h-12 w-44" /><Sk className="h-12 w-36" />
            </div>
          </div>
          <Sk className="aspect-[16/10] rounded-2xl" />
        </Wrap>
      </section>
    </SkRegion>
  );
}
