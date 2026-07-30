"use client";

import Link from "next/link";
import {
  useApproveEvent,
  usePendingEvents,
  useRejectEvent,
} from "@/hooks/use-events";
import { formatEventDate, statusLabel } from "@/utils/format";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BackLink } from "@/components/layout/back-button";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export default function AdminDashboardPage() {
  const { data, isLoading } = usePendingEvents();
  const approve = useApproveEvent();
  const reject = useRejectEvent();

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
        <BackLink href="/" label="Home" />
        <h1 className="font-display mt-4 text-3xl font-extrabold text-ink">
          Admin dashboard
        </h1>
        <p className="mt-2 text-sm text-muted">
          Review organizer submissions before they go live.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/analytics"
            className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-ink hover:border-accent/40"
          >
            Analytics
          </Link>
          <Link
            href="/admin/users"
            className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-ink hover:border-accent/40"
          >
            Users
          </Link>
          <Link
            href="/admin/coupons"
            className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-ink hover:border-accent/40"
          >
            Coupons
          </Link>
          <Link href="/events" className="text-sm font-semibold text-accent self-center">
            View public catalog
          </Link>
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">
              Pending approvals
            </h2>
          </div>

          {isLoading && (
            <p className="mt-6 text-sm text-muted">Loading queue…</p>
          )}

          <div className="mt-6 space-y-3">
            {(data ?? []).map((event) => (
              <article
                key={event.id}
                className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-surface/80 p-4 md:flex-row md:items-center md:justify-between md:p-5"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-ink">
                      {event.title}
                    </h3>
                    <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
                      {statusLabel(event.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {event.category} · {formatEventDate(event.startsAt)} ·{" "}
                    {event.city}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={approve.isPending}
                    onClick={() => approve.mutate(event.id)}
                    className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={reject.isPending}
                    onClick={() => reject.mutate(event.id)}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}

            {!isLoading && (data?.length ?? 0) === 0 && (
              <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
                <p className="font-display text-xl font-semibold text-ink">
                  Queue clear
                </p>
                <p className="mt-2 text-sm text-muted">
                  No events waiting for approval.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
