import { Sk, SkRows, SkRegion } from "@/components/Skeleton";

export default function Loading() {
  return (
    <SkRegion label="Loading operations dashboard">
      <div className="min-h-screen bg-sand-50">
        <div className="border-b border-sand-200 bg-white px-6 py-3.5">
          <Sk className="h-8 w-48" />
        </div>
        <div className="mx-auto max-w-[1320px] px-6 py-6">
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <Sk key={i} className="h-[86px] rounded-2xl" />)}
          </div>
          <SkRows n={6} />
        </div>
      </div>
    </SkRegion>
  );
}
