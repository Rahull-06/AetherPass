"use client";

import { useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BackLink } from "@/components/layout/back-button";
import { useAdminUsers, useUpdateUserStatus } from "@/hooks/use-ops";
import { useAuth } from "@/providers/auth-provider";

function roleLabel(roles: string[]) {
  if (roles.includes("ROLE_ADMIN")) return "Admin";
  if (roles.includes("ROLE_ORGANIZER")) return "Organizer";
  return "User";
}

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({ q: q.trim() || undefined, role: role || undefined, status: status || undefined, page }),
    [q, role, status, page],
  );

  const { data, isLoading, isError } = useAdminUsers(filters);
  const updateStatus = useUpdateUserStatus();

  async function onToggle(id: number, current: string, isAdmin: boolean) {
    if (isAdmin || me?.id === id) return;
    setError(null);
    const next = current === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      await updateStatus.mutateAsync({ id, status: next });
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? "Could not update status.");
    }
  }

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
        <BackLink href="/admin/dashboard" label="Admin" />
        <h1 className="font-display mt-4 text-3xl font-extrabold text-ink">
          Users
        </h1>
        <p className="mt-2 text-sm text-muted">
          Search accounts, filter by role, and suspend or restore access.
        </p>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Search
            <input
              value={q}
              onChange={(e) => {
                setPage(0);
                setQ(e.target.value);
              }}
              placeholder="Name or email"
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted md:w-40">
            Role
            <select
              value={role}
              onChange={(e) => {
                setPage(0);
                setRole(e.target.value);
              }}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">All</option>
              <option value="ROLE_USER">User</option>
              <option value="ROLE_ORGANIZER">Organizer</option>
              <option value="ROLE_ADMIN">Admin</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted md:w-40">
            Status
            <select
              value={status}
              onChange={(e) => {
                setPage(0);
                setStatus(e.target.value);
              }}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </label>
        </div>

        {error && (
          <p className="mt-4 text-sm text-highlight">{error}</p>
        )}
        {isLoading && <p className="mt-8 text-sm text-muted">Loading users…</p>}
        {isError && (
          <p className="mt-8 text-sm text-highlight">Could not load users.</p>
        )}

        <ul className="mt-6 space-y-3">
          {(data?.content ?? []).map((u) => {
            const isAdmin = u.roles.includes("ROLE_ADMIN");
            const isSelf = me?.id === u.id;
            const suspended = u.status === "SUSPENDED";
            return (
              <li
                key={u.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-bold text-ink">
                      {u.fullName}
                    </p>
                    <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
                      {roleLabel(u.roles)}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        suspended
                          ? "bg-highlight/15 text-highlight"
                          : "bg-chip text-muted"
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{u.email}</p>
                </div>
                {!isAdmin && !isSelf ? (
                  <button
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() => void onToggle(u.id, u.status, isAdmin)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                      suspended
                        ? "bg-accent text-white"
                        : "border border-border text-ink hover:border-highlight/40"
                    }`}
                  >
                    {suspended ? "Restore" : "Suspend"}
                  </button>
                ) : (
                  <span className="text-xs font-medium text-muted">
                    {isSelf ? "You" : "Protected"}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {!isLoading && data && data.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
            >
              Previous
            </button>
            <p className="text-sm text-muted">
              Page {page + 1} of {data.totalPages}
            </p>
            <button
              type="button"
              disabled={page + 1 >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

        {!isLoading && data && data.content.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <p className="font-display text-xl font-semibold text-ink">
              No matches
            </p>
            <p className="mt-2 text-sm text-muted">Try a different search.</p>
          </div>
        )}
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
