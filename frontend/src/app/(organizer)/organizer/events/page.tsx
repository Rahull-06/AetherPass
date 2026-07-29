"use client";

import Link from "next/link";
import { useMyEvents, useSubmitEvent } from "@/hooks/use-events";
import { formatInr } from "@/utils/cn";
import { formatEventDate, statusLabel } from "@/utils/format";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BackLink } from "@/components/layout/back-button";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export default function OrganizerEventsPage() {
  const { data, isLoading, isError } = useMyEvents();
  const submitMutation = useSubmitEvent();

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
        <BackLink href="/" label="Home" />
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">
              Manage events
            </h1>
            <p className="mt-2 text-sm text-muted">
              Save a draft, submit it, wait for admin approval, then it goes live.
            </p>
          </div>
          <Link
            href="/organizer/events/new"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-bold text-white"
          >
            Create event
          </Link>
        </div>

        {isLoading && (
          <p className="mt-10 text-sm text-muted">Loading your shows…</p>
        )}
        {isError && (
          <p className="mt-10 text-sm text-highlight">
            Could not load events. Are you signed in as an organizer?
          </p>
        )}

        <div className="mt-8 space-y-3">
          {(data ?? []).map((event) => (
            <article
              key={event.id}
              className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-surface/80 p-4 md:flex-row md:items-center md:justify-between md:p-5"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-semibold text-ink">
                    {event.title}
                  </h2>
                  <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
                    {statusLabel(event.status)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {formatEventDate(event.startsAt)} · {event.venueName},{" "}
                  {event.city}
                </p>
                <p className="mt-1 text-sm font-medium text-ink">
                  From {formatInr(Number(event.minPrice))}
                </p>
              </div>

              <div className="flex gap-2">
                {event.status === "DRAFT" && (
                  <button
                    type="button"
                    disabled={submitMutation.isPending}
                    onClick={() => submitMutation.mutate(event.id)}
                    className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Submit for approval
                  </button>
                )}
                {event.status === "PUBLISHED" && (
                  <Link
                    href={`/events/${event.slug}`}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink"
                  >
                    View live
                  </Link>
                )}
              </div>
            </article>
          ))}

          {!isLoading && (data?.length ?? 0) === 0 && (
            <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
              <p className="font-display text-xl font-semibold text-ink">
                No events yet
              </p>
              <p className="mt-2 text-sm text-muted">
                Create your first show and submit it for approval.
              </p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
