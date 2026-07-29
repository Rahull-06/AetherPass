"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useBrowseEvents } from "@/hooks/use-events";
import { EventCard } from "@/features/events/event-card";
import { EVENT_CATEGORIES } from "@/types/event";
import { BackLink } from "@/components/layout/back-button";

export function EventsBrowse() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [submitted, setSubmitted] = useState({ q: "", city: "" });

  const { data, isLoading, isError, error } = useBrowseEvents({
    q: submitted.q || undefined,
    category: activeCategory || undefined,
    city: submitted.city || undefined,
    page: 0,
    size: 12,
  });

  const cities = useMemo(() => {
    const set = new Set(
      (data?.content ?? []).map((e) => e.city).filter(Boolean),
    );
    return Array.from(set).sort();
  }, [data]);

  function setCategoryInUrl(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("category", next);
    else params.delete("category");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted({ q: q.trim(), city: city.trim() });
  }

  function clearFilters() {
    setQ("");
    setCity("");
    setSubmitted({ q: "", city: "" });
    setCategoryInUrl("");
  }

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <BackLink href="/" label="Home" />
      </div>

      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
        <aside className="mb-5 hidden lg:block">
          <form
            onSubmit={applyFilters}
            className="sticky top-24 rounded-2xl border border-border bg-surface p-5 shadow-sm"
          >
            <p className="text-xs font-bold tracking-[0.14em] text-accent uppercase">
              Filters
            </p>
            <label className="mt-4 block text-sm font-semibold text-ink">
              Search
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Artist or show"
                className="mt-1.5 w-full rounded-lg border border-border bg-chip px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-ink">
              Category
              <select
                value={activeCategory}
                onChange={(e) => setCategoryInUrl(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-chip px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="">All</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm font-semibold text-ink">
              City
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                list="event-cities"
                placeholder="Mumbai, Bengaluru"
                className="mt-1.5 w-full rounded-lg border border-border bg-chip px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
              <datalist id="event-cities">
                {cities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-bold text-white"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-border px-3 py-2.5 text-sm font-semibold"
              >
                Clear
              </button>
            </div>
          </form>
        </aside>

        <section>
          <h1 className="font-display text-2xl font-extrabold text-ink md:text-4xl">
            Events
          </h1>
          <p className="mt-1 text-sm text-muted">
            {data ? `${data.totalElements} shows` : "Loading shows…"}
          </p>

          <form onSubmit={applyFilters} className="mt-4 flex gap-2 lg:hidden">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search shows"
              className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white"
            >
              Go
            </button>
          </form>

          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar lg:hidden">
            <Chip
              label="All"
              active={!activeCategory}
              onClick={() => setCategoryInUrl("")}
            />
            {EVENT_CATEGORIES.map((c) => (
              <Chip
                key={c}
                label={c}
                active={activeCategory === c}
                onClick={() => setCategoryInUrl(c)}
              />
            ))}
          </div>

          {isLoading && (
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-xl bg-border/60"
                />
              ))}
            </div>
          )}

          {isError && (
            <p className="mt-6 rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-highlight">
              {(error as Error)?.message ?? "Could not load events."}
            </p>
          )}

          {!isLoading && data && data.content.length === 0 && (
            <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
              <p className="font-display text-xl font-bold text-ink">
                No shows found
              </p>
              <p className="mt-2 text-sm text-muted">
                Try another city or category.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-bold text-accent"
              >
                Clear filters
              </button>
            </div>
          )}

          {data && data.content.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {data.content.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold text-white"
          : "shrink-0 rounded-full bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink ring-1 ring-border"
      }
    >
      {label}
    </button>
  );
}
