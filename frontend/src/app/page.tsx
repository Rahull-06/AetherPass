"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { useBrowseEvents } from "@/hooks/use-events";
import { EventCard } from "@/features/events/event-card";
import { EVENT_CATEGORIES } from "@/types/event";

export default function HomePage() {
  const { data } = useBrowseEvents({ page: 0, size: 8 });
  const featured = data?.content?.[0];
  const rest = data?.content?.slice(0, 8) ?? [];

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="flex-1">
        {/* ===== MOBILE (BMS-style) ===== */}
        <div className="md:hidden">
          <section className="bg-panel px-4 pb-6 pt-5 text-white">
            <p className="text-xs font-bold tracking-[0.16em] text-white/60 uppercase">
              Near you
            </p>
            <h1 className="font-display mt-2 text-3xl font-extrabold leading-tight">
              Find a show tonight
            </h1>
            <Link
              href="/events"
              className="mt-4 flex items-center rounded-full bg-white/10 px-4 py-3 text-sm text-white/80 ring-1 ring-white/15"
            >
              Search concerts, comedy, sports…
            </Link>
          </section>

          <section className="px-4 pt-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {EVENT_CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={`/events?category=${c}`}
                  className="shrink-0 rounded-full bg-surface px-3.5 py-1.5 text-xs font-bold text-ink ring-1 ring-border"
                >
                  {c}
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-6 px-4">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="font-display text-lg font-bold text-ink">
                Recommended
              </h2>
              <Link href="/events" className="text-xs font-bold text-accent">
                See all
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
              {rest.map((event) => (
                <EventCard key={event.id} event={event} compact />
              ))}
            </div>
          </section>

          <section className="mt-6 px-4 pb-8">
            <h2 className="font-display text-lg font-bold text-ink">
              All shows
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {rest.map((event) => (
                <EventCard key={`g-${event.id}`} event={event} />
              ))}
            </div>
          </section>
        </div>

        {/* ===== DESKTOP / TABLET ===== */}
        <div className="hidden md:block">
          <section className="relative overflow-hidden bg-panel text-white">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 70% at 80% 30%, rgba(225,29,72,0.35), transparent 50%), linear-gradient(110deg, #0b0f19 0%, #15101c 55%, #0b0f19 100%)",
              }}
            />
            <div className="relative mx-auto grid max-w-6xl gap-10 px-8 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-white/55 uppercase">
                  AetherPass
                </p>
                <h1 className="font-display mt-3 max-w-xl text-5xl font-extrabold leading-[1.05] lg:text-6xl">
                  Book live shows without the hassle
                </h1>
                <p className="mt-4 max-w-lg text-base text-white/75">
                  Concerts, comedy, sports — pick a seat, pay, and get a QR
                  ticket on your phone.
                </p>
                <div className="mt-8 flex gap-3">
                  <Link
                    href="/events"
                    className="inline-flex h-12 items-center rounded-xl bg-accent px-6 text-sm font-bold text-white hover:brightness-110"
                  >
                    Browse events
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex h-12 items-center rounded-xl border border-white/20 px-6 text-sm font-bold text-white hover:bg-white/10"
                  >
                    Create account
                  </Link>
                </div>
              </div>

              {featured && (
                <Link
                  href={`/events/${featured.slug}`}
                  className="rise-in self-center overflow-hidden rounded-2xl ring-1 ring-white/10"
                >
                  <div className="relative aspect-[16/10] bg-black/40 p-6">
                    <p className="text-xs font-bold tracking-wide text-white/60 uppercase">
                      Featured · {featured.category}
                    </p>
                    <p className="font-display mt-3 text-3xl font-extrabold">
                      {featured.title}
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      {featured.venueName}, {featured.city}
                    </p>
                    <p className="mt-6 text-sm font-bold text-white">
                      From ₹{Number(featured.minPrice).toLocaleString("en-IN")} →
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-8 py-12">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-ink">
                  Happening soon
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Fresh listings from organizers near you
                </p>
              </div>
              <Link href="/events" className="text-sm font-bold text-accent">
                View all
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {rest.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
