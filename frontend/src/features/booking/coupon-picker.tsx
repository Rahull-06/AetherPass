"use client";

import { useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { formatInr } from "@/utils/cn";
import { useCouponOffers } from "@/hooks/use-coupons";
import type { CouponOffer } from "@/services/coupon.service";

type Props = {
  bookingId: number;
  subtotal: number;
  appliedCode?: string | null;
  applying: boolean;
  removing: boolean;
  onApply: (code: string) => Promise<void>;
  onRemove: () => Promise<void>;
};

function offerLabel(offer: CouponOffer) {
  if (offer.discountType === "PERCENT") {
    return `${Number(offer.discountValue)}% off`;
  }
  return `${formatInr(Number(offer.discountValue))} off`;
}

export function CouponPicker({
  bookingId,
  subtotal,
  appliedCode,
  applying,
  removing,
  onApply,
  onRemove,
}: Props) {
  const { data: offers = [], isLoading } = useCouponOffers(subtotal, true);
  const [showAll, setShowAll] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const eligible = useMemo(
    () => offers.filter((o) => o.eligible),
    [offers],
  );
  const locked = useMemo(
    () => offers.filter((o) => !o.eligible),
    [offers],
  );

  const visible = showAll ? offers : eligible;

  async function apply(code: string) {
    setError(null);
    try {
      await onApply(code.trim().toUpperCase());
      setManualCode("");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? "Could not apply coupon");
    }
  }

  if (appliedCode) {
    return (
      <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-emerald-800/70 uppercase">
              Coupon applied
            </p>
            <p className="mt-1 font-display text-lg font-bold text-ink">
              {appliedCode}
            </p>
            <p className="mt-1 text-xs text-muted">
              Savings unlocked for booking #{bookingId}
            </p>
          </div>
          <button
            type="button"
            disabled={removing}
            onClick={() => void onRemove()}
            className="text-xs font-semibold text-highlight hover:underline"
          >
            Remove
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
            Coupons
          </h2>
          <p className="mt-1 text-sm text-muted">
            Offers that fit your cart of {formatInr(subtotal)}
          </p>
        </div>
      </div>

      {isLoading && (
        <p className="mt-4 text-sm text-muted">Finding offers…</p>
      )}

      {!isLoading && eligible.length === 0 && !showAll && (
        <p className="mt-4 rounded-xl bg-chip px-3 py-3 text-sm text-muted">
          No coupons match this cart yet. Add seats or open more coupons below.
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {visible.map((offer) => (
          <li key={offer.code}>
            <button
              type="button"
              disabled={!offer.eligible || applying}
              onClick={() => void apply(offer.code)}
              className={[
                "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition",
                offer.eligible
                  ? "border-border bg-background hover:border-accent/50 hover:bg-accent-soft/40"
                  : "cursor-not-allowed border-dashed border-border/70 bg-chip/60 opacity-70",
              ].join(" ")}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-bold tracking-wide text-ink">
                    {offer.code}
                  </span>
                  <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">
                    {offerLabel(offer)}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted">
                  {offer.eligible
                    ? offer.description || `Save ${formatInr(Number(offer.estimatedDiscount))}`
                    : offer.reason || offer.description}
                </p>
              </div>
              {offer.eligible ? (
                <span className="shrink-0 text-xs font-bold text-accent">
                  Tap apply
                </span>
              ) : (
                <span className="shrink-0 text-[11px] font-medium text-muted">
                  Locked
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {offers.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-[11px] font-medium tracking-wide text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          {showAll
            ? "Show matching coupons"
            : `More coupons${locked.length ? ` (${locked.length})` : ""}`}
        </button>
      )}

      <div className="mt-4 flex gap-2 border-t border-border/70 pt-4">
        <input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent"
        />
        <button
          type="button"
          disabled={applying || !manualCode.trim()}
          onClick={() => void apply(manualCode)}
          className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          Apply
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-highlight">{error}</p>
      )}
    </section>
  );
}
