"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";

export function SiteHeader() {
  const router = useRouter();
  const { isAuthenticated, user, logout, homePath, isBootstrapping } =
    useAuth();
  const { data: unread = 0 } = useUnreadNotificationCount(
    isAuthenticated && !isBootstrapping,
  );

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

        <nav className="hidden items-center gap-6 md:flex">
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
              <Link
                href="/notifications"
                className="relative text-sm font-semibold text-muted transition hover:text-ink"
              >
                Alerts
                {unread > 0 && (
                  <span className="absolute -top-1.5 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </>
          )}

          {!isBootstrapping && isAuthenticated ? (
            <>
              <Link href={homePath} className="text-sm font-semibold text-ink">
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

        <div className="flex items-center gap-2 md:hidden">
          {!isBootstrapping && isAuthenticated && (
            <Link
              href="/notifications"
              className="relative text-sm font-semibold text-muted"
            >
              Alerts
              {unread > 0 && (
                <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-accent" />
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
              className="text-sm font-semibold text-muted"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
