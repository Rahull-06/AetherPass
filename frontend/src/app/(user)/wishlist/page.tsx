"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BackLink } from "@/components/layout/back-button";
import { RequireAuth } from "@/components/auth/require-auth";
import { EventCard } from "@/features/events/event-card";
import { useWishlist } from "@/hooks/use-wishlist";

export default function WishlistPage() {
  return (
    <RequireAuth>
      <WishlistContent />
    </RequireAuth>
  );
}

function WishlistContent() {
  const { data, isLoading, isError } = useWishlist();

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
        <BackLink href="/events" label="Events" />
        <h1 className="font-display mt-4 text-3xl font-extrabold text-ink">
          Wishlist
        </h1>
        <p className="mt-2 text-sm text-muted">Shows you saved for later.</p>

        {isLoading && <p className="mt-8 text-sm text-muted">Loading…</p>}
        {isError && (
          <p className="mt-8 text-sm text-highlight">Could not load wishlist.</p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {!isLoading && (data?.length ?? 0) === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <p className="font-display text-xl font-bold text-ink">No saves yet</p>
            <Link href="/events" className="mt-3 inline-block text-sm font-bold text-accent">
              Browse events
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
