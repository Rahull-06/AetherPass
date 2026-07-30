"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEventDetail } from "@/hooks/use-events";
import { useEventReviews, useUpsertReview } from "@/hooks/use-reviews";
import { useToggleWishlist } from "@/hooks/use-wishlist";
import { formatInr } from "@/utils/cn";
import { formatEventDate } from "@/utils/format";
import { useAuth } from "@/providers/auth-provider";
import { BackButton } from "@/components/layout/back-button";

export function EventDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const { data, isLoading, isError } = useEventDetail(slug);
  const { isAuthenticated } = useAuth();
  const reviews = useEventReviews(data?.id ?? 0);
  const upsertReview = useUpsertReview(data?.id ?? 0, slug);
  const toggleWish = useToggleWishlist(data?.id ?? 0, slug);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="h-72 animate-pulse rounded-2xl bg-border/50" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <BackButton href="/events" label="Events" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted" />
        <p className="font-display text-2xl font-bold text-ink">Event not found</p>
        <Link href="/events" className="mt-4 inline-block text-sm font-bold text-accent">
          Browse events
        </Link>
      </div>
    );
  }

  async function onToggleWish() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    await toggleWish.mutateAsync(Boolean(data?.wishlisted));
  }

  async function onSubmitReview() {
    setReviewError(null);
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    try {
      await upsertReview.mutateAsync({
        rating,
        comment: comment.trim() || undefined,
      });
      setComment("");
    } catch {
      setReviewError("Only confirmed ticket holders can review this event.");
    }
  }

  const banner = data.bannerUrl?.trim();

  return (
    <div className="pb-24 md:pb-0">
      <section className="relative overflow-hidden bg-panel text-white">
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 80% at 15% 20%, rgba(225,29,72,0.45), transparent 55%), linear-gradient(120deg, #0b0f19 0%, #1a1020 50%, #0b0f19 100%)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-4 md:px-8 md:pt-6">
          <BackButton href="/events" label="Events" />
          <button
            type="button"
            onClick={() => void onToggleWish()}
            disabled={toggleWish.isPending}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur"
            aria-label={data.wishlisted ? "Remove from wishlist" : "Save to wishlist"}
          >
            {data.wishlisted ? "♥ Saved" : "♡ Save"}
          </button>
        </div>
        <div className="relative mx-auto flex min-h-[38vh] max-w-6xl flex-col justify-end px-4 pb-8 pt-10 md:min-h-[46vh] md:px-8 md:pb-12">
          <p className="text-xs font-bold tracking-[0.16em] text-white/70 uppercase">
            {data.category} · {data.venue.city}
          </p>
          <h1 className="font-display mt-2 max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">
            {data.title}
          </h1>
          <p className="mt-3 text-sm text-white/80 md:text-base">
            {formatEventDate(data.startsAt)}
            {(data.reviewCount ?? 0) > 0 && (
              <span className="ml-3">
                ★ {data.averageRating?.toFixed(1)} · {data.reviewCount} reviews
              </span>
            )}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-8 md:py-12 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">About</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80 md:text-base">
            {data.description || "More details soon."}
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs font-bold tracking-[0.14em] text-accent uppercase">
              Venue
            </p>
            <p className="mt-2 font-display text-lg font-bold text-ink">
              {data.venue.name}
            </p>
            <p className="mt-1 text-sm text-muted">
              {data.venue.addressLine}, {data.venue.city}
              {data.venue.state ? `, ${data.venue.state}` : ""}
            </p>
            {data.organizerCompany && (
              <p className="mt-3 text-sm text-muted">
                By{" "}
                <span className="font-semibold text-ink">
                  {data.organizerCompany}
                </span>
              </p>
            )}
          </div>

          <div className="mt-8">
            <h2 className="font-display text-xl font-bold text-ink">Reviews</h2>
            <ul className="mt-4 space-y-3">
              {(reviews.data ?? []).map((r) => (
                <li key={r.id} className="rounded-xl border border-border bg-surface px-4 py-3">
                  <p className="text-sm font-bold text-ink">
                    {r.userName} · {"★".repeat(r.rating)}
                  </p>
                  {r.comment && (
                    <p className="mt-1 text-sm text-muted">{r.comment}</p>
                  )}
                </li>
              ))}
            </ul>
            {(reviews.data?.length ?? 0) === 0 && (
              <p className="mt-3 text-sm text-muted">No reviews yet.</p>
            )}

            <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
              <p className="text-sm font-bold text-ink">Write a review</p>
              <p className="mt-1 text-xs text-muted">
                Available after a confirmed booking for this event.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={[
                      "rounded-lg px-3 py-1.5 text-sm font-bold",
                      rating === n
                        ? "bg-accent text-white"
                        : "border border-border text-ink",
                    ].join(" ")}
                  >
                    {n}★
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="How was the show?"
                className="mt-3 w-full rounded-xl border border-border bg-chip px-3 py-2 text-sm outline-none focus:border-accent"
              />
              {reviewError && (
                <p className="mt-2 text-xs font-medium text-highlight">{reviewError}</p>
              )}
              <button
                type="button"
                disabled={upsertReview.isPending}
                onClick={() => void onSubmitReview()}
                className="mt-3 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {upsertReview.isPending ? "Saving…" : "Submit review"}
              </button>
            </div>
          </div>

          <div className="mt-6 lg:hidden">
            <h3 className="font-display text-lg font-bold text-ink">Tickets</h3>
            <ul className="mt-3 space-y-2">
              {data.ticketCategories.map((tc) => (
                <li
                  key={tc.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-ink">{tc.name}</p>
                    <p className="text-xs text-muted">{tc.totalSeats} seats</p>
                  </div>
                  <p className="text-sm font-bold text-accent">
                    {formatInr(Number(tc.price))}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-md">
            <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">
              Tickets
            </p>
            <ul className="mt-4 space-y-3">
              {data.ticketCategories.map((tc) => (
                <li
                  key={tc.id}
                  className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-bold text-ink">{tc.name}</p>
                    <p className="text-xs text-muted">
                      {tc.totalSeats} seats
                      {tc.description ? ` · ${tc.description}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-accent">
                    {formatInr(Number(tc.price))}
                  </p>
                </li>
              ))}
            </ul>
            <Link
              href={isAuthenticated ? `/events/${data.slug}/book` : "/login"}
              className="mt-6 flex h-12 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white hover:brightness-110"
            >
              {isAuthenticated ? "Book tickets" : "Sign in to book"}
            </Link>
            <p className="mt-2 text-center text-xs text-muted">
              Seat hold: 5 minutes after selection
            </p>
          </div>
        </aside>
      </section>

      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur-lg md:bottom-0 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-muted">From</p>
            <p className="text-base font-extrabold text-ink">
              {formatInr(Number(data.ticketCategories[0]?.price ?? 0))}
            </p>
          </div>
          <Link
            href={isAuthenticated ? `/events/${data.slug}/book` : "/login"}
            className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white"
          >
            Book
          </Link>
        </div>
      </div>
    </div>
  );
}
