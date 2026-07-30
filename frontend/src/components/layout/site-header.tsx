"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";

export function SiteHeader() {
  const router = useRouter();
  const { isAuthenticated, user, logout, isBootstrapping, hasRole } = useAuth();
  const { data: unread = 0 } = useUnreadNotificationCount(
    isAuthenticated && !isBootstrapping,
  );

  const showOrganizerNav = hasRole("ROLE_ORGANIZER") || hasRole("ROLE_ADMIN");
  const showAdminNav = hasRole("ROLE_ADMIN");

  async function onLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-8">
        <Link
          href="/"
          className="font-display text-lg font-extrabold tracking-tight text-ink md:text-xl"
        >
          AetherPass
        </Link>

        <nav className="hidden items-center gap-5 md:flex lg:gap-6">
          <Link
            href="/events"
            className="text-sm font-semibold text-muted transition hover:text-ink"
          >
            Events
          </Link>
          {isAuthenticated && (
            <>
              <Link
                href="/bookings"
                className="text-sm font-semibold text-muted transition hover:text-ink"
              >
                My tickets
              </Link>
              {showOrganizerNav && (
                <Link
                  href="/organizer/dashboard"
                  className="text-sm font-semibold text-muted transition hover:text-ink"
                >
                  Organizer
                </Link>
              )}
              {showAdminNav && (
                <Link
                  href="/admin/dashboard"
                  className="text-sm font-semibold text-muted transition hover:text-ink"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/notifications"
                className="relative inline-flex items-center justify-center rounded-full p-1.5 text-muted transition hover:bg-chip hover:text-ink"
                aria-label={
                  unread > 0
                    ? `Notifications, ${unread} unread`
                    : "Notifications"
                }
                title="Notifications"
              >
                <BellIcon />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </>
          )}

          {!isBootstrapping && isAuthenticated ? (
            <>
              <Link
                href="/profile"
                className="text-sm font-semibold text-ink transition hover:text-accent"
              >
                {user?.fullName?.split(" ")[0] ?? "Account"}
              </Link>
              <button
                type="button"
                onClick={() => void onLogout()}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition hover:bg-chip"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-muted transition hover:text-ink"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Join free
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          {!isBootstrapping && isAuthenticated && showAdminNav && (
            <Link
              href="/admin/dashboard"
              className="rounded-full border border-border px-2.5 py-1 text-xs font-bold text-ink"
            >
              Admin
            </Link>
          )}
          {!isBootstrapping &&
            isAuthenticated &&
            !showAdminNav &&
            showOrganizerNav && (
              <Link
                href="/organizer/dashboard"
                className="rounded-full border border-border px-2.5 py-1 text-xs font-bold text-ink"
              >
                Organizer
              </Link>
            )}
          {!isBootstrapping && isAuthenticated && (
            <Link
              href="/notifications"
              className="relative inline-flex items-center justify-center rounded-full p-2 text-muted"
              aria-label={
                unread > 0
                  ? `Notifications, ${unread} unread`
                  : "Notifications"
              }
            >
              <BellIcon />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
              )}
            </Link>
          )}
          {!isBootstrapping && !isAuthenticated && (
            <Link
              href="/login"
              className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          )}
          {!isBootstrapping && isAuthenticated && (
            <button
              type="button"
              onClick={() => void onLogout()}
              className="px-2 text-sm font-semibold text-muted"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9.5a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13.5 6 9.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.5a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
