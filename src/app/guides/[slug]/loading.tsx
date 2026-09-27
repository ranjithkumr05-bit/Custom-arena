import { Sk, SkText, SkRegion } from "@/components/Skeleton";
import { Wrap } from "@/components/ui";

export default function Loading() {
  return (
    <SkRegion label="Loading guide">
      <article className="py-14">
        <Wrap className="max-w-[820px]">
          <Sk className="mb-5 h-3 w-40" />
          <Sk className="mb-4 h-10 w-full" />
          <Sk className="mb-8 h-5 w-4/5" />
          <Sk className="mb-10 h-28 rounded-2xl" />
          <div className="space-y-7">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <Sk className="mb-3 h-6 w-1/2" />
                <SkText lines={4} />
              </div>
            ))}
          </div>
        </Wrap>
      </article>
    </SkRegion>
  );
}
