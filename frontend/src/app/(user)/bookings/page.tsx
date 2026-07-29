"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BackLink } from "@/components/layout/back-button";
import { RequireAuth } from "@/components/auth/require-auth";
import { useMyBookings } from "@/hooks/use-bookings";
import { formatInr } from "@/utils/cn";
import { formatEventDate, statusLabel } from "@/utils/format";

export default function UserBookingsPage() {
  return (
    <RequireAuth>
      <BookingsContent />
    </RequireAuth>
  );
}

function BookingsContent() {
  const { data, isLoading, isError } = useMyBookings();

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
        <BackLink href="/events" label="Events" />
        <h1 className="font-display mt-4 text-3xl font-extrabold text-ink">
          My tickets
        </h1>
        <p className="mt-2 text-sm text-muted">
          Holds, confirmed bookings, and QR ticket codes.
        </p>

        {isLoading && <p className="mt-8 text-sm text-muted">Loading…</p>}
        {isError && (
          <p className="mt-8 text-sm text-highlight">Could not load bookings.</p>
        )}

        <div className="mt-6 space-y-3">
          {(data ?? []).map((b) => (
            <Link
              key={b.id}
              href={`/bookings/${b.id}`}
              className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-accent/40 md:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold text-ink">
                  {b.eventTitle}
                </h2>
                <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent">
                  {statusLabel(b.status)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {b.bookingCode} · {formatEventDate(b.startsAt)}
              </p>
              <p className="mt-2 text-sm font-bold text-ink">
                {formatInr(Number(b.totalAmount))} · {b.seats.length} seat
                {b.seats.length === 1 ? "" : "s"}
              </p>
            </Link>
          ))}

          {!isLoading && (data?.length ?? 0) === 0 && (
            <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
              <p className="font-display text-xl font-bold text-ink">No bookings yet</p>
              <Link href="/events" className="mt-3 inline-block text-sm font-bold text-accent">
                Browse events
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
