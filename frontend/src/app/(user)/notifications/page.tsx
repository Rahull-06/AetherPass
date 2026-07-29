"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BackLink } from "@/components/layout/back-button";
import { RequireAuth } from "@/components/auth/require-auth";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsContent />
    </RequireAuth>
  );
}

function NotificationsContent() {
  const { data, isLoading, isError } = useNotifications();
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-8">
        <BackLink href="/bookings" label="My tickets" />
        <div className="mt-4 flex items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-extrabold text-ink">
            Alerts
          </h1>
          {(data?.some((n) => !n.read) ?? false) && (
            <button
              type="button"
              disabled={markAll.isPending}
              onClick={() => void markAll.mutateAsync()}
              className="text-sm font-bold text-accent"
            >
              Mark all read
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-muted">
          Booking confirmations, refunds, and reminders.
        </p>

        {isLoading && <p className="mt-8 text-sm text-muted">Loading…</p>}
        {isError && (
          <p className="mt-8 text-sm text-highlight">Could not load alerts.</p>
        )}

        <ul className="mt-6 space-y-3">
          {(data ?? []).map((n) => (
            <li
              key={n.id}
              className={[
                "rounded-2xl border px-4 py-4",
                n.read
                  ? "border-border bg-surface"
                  : "border-accent/30 bg-accent-soft/40",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">{n.title}</p>
                  <p className="mt-1 text-sm text-muted">{n.body}</p>
                  <p className="mt-2 text-[11px] text-muted">
                    {new Date(n.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    className="shrink-0 text-xs font-bold text-accent"
                    onClick={() => void markOne.mutateAsync(n.id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {!isLoading && (data?.length ?? 0) === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <p className="font-display text-xl font-bold text-ink">No alerts yet</p>
            <p className="mt-2 text-sm text-muted">
              Confirm a booking and you’ll see it here.
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
