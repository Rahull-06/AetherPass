"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { BackButton } from "@/components/layout/back-button";
import { useAuth } from "@/providers/auth-provider";
import { useHoldSeats, useSeatMap } from "@/hooks/use-bookings";
import { formatInr } from "@/utils/cn";
import type { SeatCell } from "@/types/booking";

export function SeatMapView({ slug }: { slug: string }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError, refetch } = useSeatMap(slug);
  const hold = useHoldSeats(slug);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const map = new Map<string, SeatCell[]>();
    for (const seat of data?.seats ?? []) {
      const list = map.get(seat.rowLabel) ?? [];
      list.push(seat);
      map.set(seat.rowLabel, list);
    }
    return Array.from(map.entries());
  }, [data]);

  const selectedSeats = useMemo(
    () => (data?.seats ?? []).filter((s) => selected.includes(s.id)),
    [data, selected],
  );

  const total = selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);

  function toggleSeat(seat: SeatCell) {
    if (seat.state !== "AVAILABLE" && seat.state !== "MINE") return;
    setSelected((prev) =>
      prev.includes(seat.id)
        ? prev.filter((id) => id !== seat.id)
        : prev.length >= 10
          ? prev
          : [...prev, seat.id],
    );
  }

  async function onHold() {
    setError(null);
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!data || selected.length === 0) return;
    try {
      const booking = await hold.mutateAsync({
        eventId: data.eventId,
        seatIds: selected,
      });
      router.push(`/bookings/${booking.id}`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? "Could not hold seats");
      void refetch();
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-64 animate-pulse rounded-2xl bg-border/50" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <BackButton href={`/events/${slug}`} label="Event" />
        <p className="mt-6 font-display text-2xl font-bold">Seat map unavailable</p>
      </div>
    );
  }

  return (
    <div className="pb-28 lg:pb-10">
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-8">
          <BackButton
            href={`/events/${slug}`}
            label="Event"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted"
          />
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-extrabold text-ink md:text-2xl">
              {data.eventTitle}
            </h1>
            <p className="text-xs text-muted">
              Hold lasts {Math.round(data.lockTtlSeconds / 60)} minutes
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-4 flex flex-wrap gap-3 text-xs font-semibold">
            <Legend color="bg-emerald-500" label="Available" />
            <Legend color="bg-accent" label="Selected" />
            <Legend color="bg-amber-400" label="Your hold" />
            <Legend color="bg-zinc-300" label="Taken" />
          </div>

          <div className="mb-4 rounded-lg bg-panel py-2 text-center text-xs font-bold tracking-[0.2em] text-white/70 uppercase">
            Stage
          </div>

          {/* Mobile: horizontal scroll per row. Desktop: centered grid */}
          <div className="space-y-2 overflow-x-auto no-scrollbar pb-2">
            {rows.map(([row, seats]) => (
              <div key={row} className="flex min-w-max items-center gap-2">
                <span className="w-6 text-center text-xs font-bold text-muted">
                  {row}
                </span>
                <div className="flex gap-1.5">
                  {seats.map((seat) => {
                    const isSelected = selected.includes(seat.id);
                    const disabled =
                      seat.state === "BOOKED" ||
                      seat.state === "LOCKED" ||
                      seat.state === "BLOCKED";
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={disabled}
                        title={`${seat.label} · ${seat.categoryName} · ${formatInr(Number(seat.price))}`}
                        onClick={() => toggleSeat(seat)}
                        className={[
                          "h-8 w-8 rounded-md text-[10px] font-bold transition md:h-9 md:w-9",
                          isSelected
                            ? "bg-accent text-white"
                            : seat.state === "MINE"
                              ? "bg-amber-400 text-ink"
                              : seat.state === "AVAILABLE"
                                ? "bg-emerald-500 text-white hover:brightness-110"
                                : "cursor-not-allowed bg-zinc-300 text-zinc-500",
                        ].join(" ")}
                      >
                        {seat.seatNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Desktop summary */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs font-bold tracking-wide text-muted uppercase">
              Your selection
            </p>
            {selectedSeats.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Tap seats to select</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {selectedSeats.map((s) => (
                  <li key={s.id} className="flex justify-between text-sm">
                    <span className="font-semibold text-ink">
                      {s.label} · {s.categoryName}
                    </span>
                    <span>{formatInr(Number(s.price))}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted">Total</span>
              <span className="font-display text-xl font-extrabold text-ink">
                {formatInr(total)}
              </span>
            </div>
            {error && (
              <p className="mt-3 text-sm font-medium text-highlight">{error}</p>
            )}
            <button
              type="button"
              disabled={selected.length === 0 || hold.isPending}
              onClick={() => void onHold()}
              className="mt-4 w-full rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {isAuthenticated
                ? hold.isPending
                  ? "Holding…"
                  : `Hold ${selected.length || ""} seat${selected.length === 1 ? "" : "s"}`
                : "Sign in to continue"}
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              Seats unlock automatically after 5 minutes
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur-lg md:bottom-0 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-muted">
              {selected.length} seat{selected.length === 1 ? "" : "s"}
            </p>
            <p className="font-extrabold text-ink">{formatInr(total)}</p>
          </div>
          <button
            type="button"
            disabled={selected.length === 0 || hold.isPending}
            onClick={() => void onHold()}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {isAuthenticated ? "Hold seats" : "Sign in"}
          </button>
        </div>
        {error && (
          <p className="mx-auto mt-2 max-w-lg text-xs text-highlight">{error}</p>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <span className={`h-3 w-3 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
