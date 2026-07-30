"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BackLink } from "@/components/layout/back-button";
import { useAuth } from "@/providers/auth-provider";

export default function ProfilePage() {
  return <ProfileContent />;
}

function ProfileContent() {
  const router = useRouter();
  const { user, logout, hasRole } = useAuth();

  async function onLogout() {
    await logout();
    router.push("/");
  }

  const roleLabel = hasRole("ROLE_ADMIN")
    ? "Admin"
    : hasRole("ROLE_ORGANIZER")
      ? "Organizer"
      : "Member";

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-8">
        <BackLink href="/events" label="Events" />
        <h1 className="font-display mt-4 text-3xl font-extrabold text-ink">
          Profile
        </h1>
        <p className="mt-2 text-sm text-muted">Your AetherPass account</p>

        <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft font-display text-xl font-extrabold text-accent">
              {(user?.fullName?.trim()?.[0] ?? "U").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-display text-xl font-bold text-ink">
                {user?.fullName ?? "—"}
              </p>
              <p className="truncate text-sm text-muted">{user?.email}</p>
              <p className="mt-1 text-[11px] font-bold tracking-wide text-accent uppercase">
                {roleLabel}
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Phone</dt>
              <dd className="font-semibold text-ink">
                {user?.phone?.trim() ? user.phone : "Not set"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Status</dt>
              <dd className="font-semibold text-ink">
                {user?.status ?? "ACTIVE"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
          {hasRole("ROLE_ADMIN") && (
            <Link
              href="/admin/dashboard"
              className="flex items-center justify-between border-b border-border px-5 py-4 text-sm font-semibold text-ink hover:bg-chip"
            >
              Admin dashboard
              <span className="text-muted">→</span>
            </Link>
          )}
          {(hasRole("ROLE_ORGANIZER") || hasRole("ROLE_ADMIN")) && (
            <Link
              href="/organizer/dashboard"
              className="flex items-center justify-between border-b border-border px-5 py-4 text-sm font-semibold text-ink hover:bg-chip"
            >
              Organizer dashboard
              <span className="text-muted">→</span>
            </Link>
          )}
          <Link
            href="/bookings"
            className="flex items-center justify-between border-b border-border px-5 py-4 text-sm font-semibold text-ink hover:bg-chip"
          >
            My tickets
            <span className="text-muted">→</span>
          </Link>
          <Link
            href="/wishlist"
            className="flex items-center justify-between border-b border-border px-5 py-4 text-sm font-semibold text-ink hover:bg-chip"
          >
            Wishlist
            <span className="text-muted">→</span>
          </Link>
          <Link
            href="/notifications"
            className="flex items-center justify-between border-b border-border px-5 py-4 text-sm font-semibold text-ink hover:bg-chip"
          >
            Notifications
            <span className="text-muted">→</span>
          </Link>
          <Link
            href="/forgot-password"
            className="flex items-center justify-between px-5 py-4 text-sm font-semibold text-ink hover:bg-chip"
          >
            Change password
            <span className="text-muted">→</span>
          </Link>
        </section>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-6 w-full rounded-xl border border-border py-3 text-sm font-bold text-highlight"
        >
          Sign out
        </button>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
