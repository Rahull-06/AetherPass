"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BackLink } from "@/components/layout/back-button";
import { useAdminAnalytics } from "@/hooks/use-ops";
import { formatInr } from "@/utils/cn";

export default function AdminAnalyticsPage() {
  const { data, isLoading, isError } = useAdminAnalytics();

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
        <BackLink href="/admin/dashboard" label="Admin" />
        <h1 className="font-display mt-4 text-3xl font-extrabold text-ink">
          Analytics
        </h1>
        <p className="mt-2 text-sm text-muted">
          Platform revenue, tickets, and popular shows.
        </p>

        {isLoading && <p className="mt-8 text-sm text-muted">Loading…</p>}
        {isError && (
          <p className="mt-8 text-sm text-highlight">Could not load analytics.</p>
        )}

        {data && (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Stat label="Users" value={String(data.totalUsers)} />
              <Stat
                label="Events live"
                value={`${data.publishedEvents} / ${data.totalEvents}`}
              />
              <Stat label="Tickets sold" value={String(data.ticketsSold)} />
              <Stat
                label="Confirmed bookings"
                value={String(data.confirmedBookings)}
              />
              <Stat
                label="Revenue"
                value={formatInr(Number(data.totalRevenue))}
              />
            </div>

            <section className="mt-10">
              <h2 className="font-display text-xl font-bold text-ink">
                Popular events
              </h2>
              <ul className="mt-4 space-y-3">
                {data.popularEvents.map((e) => (
                  <li
                    key={e.eventId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-4"
                  >
                    <div>
                      <Link
                        href={`/events/${e.slug}`}
                        className="font-display text-lg font-bold text-ink hover:text-accent"
                      >
                        {e.title}
                      </Link>
                      <p className="mt-1 text-sm text-muted">
                        {e.ticketsSold} tickets · {formatInr(Number(e.revenue))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {data.popularEvents.length === 0 && (
                <p className="mt-4 text-sm text-muted">No sales yet.</p>
              )}
            </section>
          </>
        )}
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-bold tracking-wide text-muted uppercase">
        {label}
      </p>
      <p className="font-display mt-2 text-2xl font-extrabold text-ink">
        {value}
      </p>
    </div>
  );
}
