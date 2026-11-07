import { Stars } from "./stars";
import { ReviewForm } from "./review-form";
import { getReviews } from "@/lib/reviews";
import { currentUser } from "@/lib/auth";

export async function ReviewsSection({ handle }: { handle: string }) {
  const [{ rows, count, avg, dist }, user] = await Promise.all([getReviews(handle), currentUser()]);
  return (
    <section id="reviews" className="page scroll-mt-32 pt-24">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 className="hd-1">Reviews</h2>
          {count ? (
            <>
              <div className="mt-6 flex items-end gap-3"><span className="text-[48px] font-semibold leading-none tracking-[-0.03em]">{avg.toFixed(1)}</span><div className="pb-1"><Stars value={avg} size={18} /><p className="small">{count} review{count > 1 ? "s" : ""}</p></div></div>
              <ul className="mt-6 space-y-1.5">
                {dist.map((n, i) => (
                  <li key={i} className="flex items-center gap-3 text-[13px]">
                    <span className="w-10">{5 - i} star</span>
                    <span className="h-1.5 flex-1 bg-line"><span className="block h-full bg-black" style={{ width: `${count ? (n / count) * 100 : 0}%` }} /></span>
                    <span className="w-6 text-right text-grey">{n}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="body mt-4">No reviews yet. Be the first to share your experience.</p>}
          <div className="mt-8"><ReviewForm handle={handle} signedIn={!!user} /></div>
        </div>
        <ul className="divide-y divide-line lg:col-span-8">
          {rows.map((r) => (
            <li key={r.id} className="py-6 first:pt-0">
              <div className="flex flex-wrap items-center gap-3"><Stars value={r.rating} /><span className="text-[14px] font-semibold">{r.name}</span>{r.verified && <span className="text-[12px] font-medium text-ok">✓ Verified buyer</span>}<span className="small ml-auto">{r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
              {r.title && <p className="mt-3 text-[15px] font-semibold">{r.title}</p>}
              <p className="body mt-1 whitespace-pre-line">{r.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
