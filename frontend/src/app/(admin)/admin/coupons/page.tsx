"use client";

import { useState } from "react";
import type { AxiosError } from "axios";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BackLink } from "@/components/layout/back-button";
import {
  useAdminCoupons,
  useCreateCoupon,
  useUpdateCoupon,
} from "@/hooks/use-ops";
import { formatInr } from "@/utils/cn";

function toIsoLocal(value: string) {
  const d = new Date(value);
  return d.toISOString();
}

function defaultWindow() {
  const from = new Date();
  const until = new Date();
  until.setMonth(until.getMonth() + 3);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { from: fmt(from), until: fmt(until) };
}

export default function AdminCouponsPage() {
  const windowDefaults = defaultWindow();
  const { data, isLoading, isError } = useAdminCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"FLAT" | "PERCENT">("FLAT");
  const [discountValue, setDiscountValue] = useState("100");
  const [maxUses, setMaxUses] = useState("1000");
  const [minOrder, setMinOrder] = useState("0");
  const [validFrom, setValidFrom] = useState(windowDefaults.from);
  const [validUntil, setValidUntil] = useState(windowDefaults.until);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormOk(null);
    try {
      await createCoupon.mutateAsync({
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrder) || 0,
        maxUses: maxUses ? Number(maxUses) : null,
        validFrom: toIsoLocal(validFrom),
        validUntil: toIsoLocal(validUntil),
        active: true,
      });
      setFormOk("Coupon created.");
      setCode("");
      setDescription("");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setFormError(axiosErr.response?.data?.message ?? "Could not create coupon.");
    }
  }

  async function onToggleActive(id: number, active: boolean) {
    setFormError(null);
    try {
      await updateCoupon.mutateAsync({ id, payload: { active: !active } });
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setFormError(axiosErr.response?.data?.message ?? "Could not update coupon.");
    }
  }

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
        <BackLink href="/admin/dashboard" label="Admin" />
        <h1 className="font-display mt-4 text-3xl font-extrabold text-ink">
          Coupons
        </h1>
        <p className="mt-2 text-sm text-muted">
          Create promo codes and turn them on or off for checkout.
        </p>

        <form
          onSubmit={(e) => void onCreate(e)}
          className="mt-8 grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-2 md:p-6"
        >
          <h2 className="font-display text-lg font-bold text-ink md:col-span-2">
            New coupon
          </h2>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Code
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              placeholder="SUMMER50"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              placeholder="Summer festival offer"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Type
            <select
              value={discountType}
              onChange={(e) =>
                setDiscountType(e.target.value as "FLAT" | "PERCENT")
              }
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="FLAT">Flat (₹)</option>
              <option value="PERCENT">Percent (%)</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Value
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Max uses
            <input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Min cart (Rs)
            <input
              type="number"
              min="0"
              step="1"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              placeholder="1000"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Valid from
              <input
                required
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Valid until
              <input
                required
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </label>
          </div>
          {formError && (
            <p className="text-sm text-highlight md:col-span-2">{formError}</p>
          )}
          {formOk && (
            <p className="text-sm text-accent md:col-span-2">{formOk}</p>
          )}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createCoupon.isPending}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {createCoupon.isPending ? "Saving…" : "Create coupon"}
            </button>
          </div>
        </form>

        {isLoading && <p className="mt-8 text-sm text-muted">Loading coupons…</p>}
        {isError && (
          <p className="mt-8 text-sm text-highlight">Could not load coupons.</p>
        )}

        <ul className="mt-8 space-y-3">
          {(data ?? []).map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-4 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg font-bold text-ink">
                    {c.code}
                  </p>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      c.active
                        ? "bg-accent-soft text-accent"
                        : "bg-chip text-muted"
                    }`}
                  >
                    {c.active ? "Active" : "Off"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {c.discountType === "PERCENT"
                    ? `${c.discountValue}% off`
                    : `${formatInr(Number(c.discountValue))} off`}
                  {Number(c.minOrderAmount) > 0
                    ? ` on ${formatInr(Number(c.minOrderAmount))}+`
                    : ""}
                  {" · "}
                  {c.usedCount}
                  {c.maxUses != null ? ` / ${c.maxUses}` : ""} uses
                  {c.description ? ` · ${c.description}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={updateCoupon.isPending}
                onClick={() => void onToggleActive(c.id, c.active)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  c.active
                    ? "border border-border text-ink"
                    : "bg-accent text-white"
                }`}
              >
                {c.active ? "Disable" : "Enable"}
              </button>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
