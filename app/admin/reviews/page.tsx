import { listAdminReviews } from "@/lib/data/admin";
import { ReviewActions } from "@/components/admin/admin-controls";

export default async function AdminReviews() {
  const reviews = await listAdminReviews();
  return (
    <div>
      <h1 className="display-lg !text-4xl mb-6">Reviews</h1>
      <div className="space-y-3">
        {reviews.map((r) => (
          <article key={r.id} className="rounded-[var(--radius-card)] bg-paper p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div><p className="font-semibold">{r.product}</p>
                <p className="text-sm" aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} {r.verified && <span className="chip ml-2">Verified purchase</span>} <span className="chip ml-1">{r.approved ? "Published" : "Pending"}</span></p></div>
              <ReviewActions id={r.id} approved={r.approved} />
            </div>
            {r.body && <p className="mt-3 text-sm">{r.body}</p>}
            <p className="mt-2 text-xs text-mist">{new Date(r.createdAt).toLocaleDateString("en-ZA")}</p>
          </article>))}
        {reviews.length === 0 && <p className="rounded-[var(--radius-card)] bg-paper p-8 text-center text-mist">No reviews yet.</p>}
      </div>
    </div>
  );
}
