"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BackLink } from "@/components/layout/back-button";
import { RequireAuth } from "@/components/auth/require-auth";
import {
  useBooking,
  useCancelBooking,
  useApplyCoupon,
  useRemoveCoupon,
} from "@/hooks/use-bookings";
import {
  useCreatePaymentOrder,
  useMockPay,
  useVerifyPayment,
} from "@/hooks/use-payments";
import { openRazorpayCheckout } from "@/features/payments";
import { CouponPicker } from "@/features/booking/coupon-picker";
import { formatInr } from "@/utils/cn";
import { formatEventDate, statusLabel } from "@/utils/format";

export default function BookingDetailPage() {
  return (
    <RequireAuth>
      <BookingDetailContent />
    </RequireAuth>
  );
}

function BookingDetailContent() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useBooking(id);
  const cancel = useCancelBooking();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const createOrder = useCreatePaymentOrder();
  const verify = useVerifyPayment();
  const mockPay = useMockPay();
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const seats = useMemo(() => {
    const seen = new Set<number>();
    return (data?.seats ?? []).filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [data?.seats]);

  const tickets = useMemo(() => {
    const seen = new Set<string>();
    return (data?.tickets ?? []).filter((t) => {
      const key = t.ticketCode || String(t.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data?.tickets]);

  const busy =
    paying || createOrder.isPending || verify.isPending || mockPay.isPending;

  async function onPay() {
    setPayError(null);
    setPaying(true);
    try {
      const order = await createOrder.mutateAsync(id);
      if (order.mock) {
        const booking = await mockPay.mutateAsync(id);
        router.replace(`/bookings/${booking.id}`);
        return;
      }

      await openRazorpayCheckout(
        order,
        async (response) => {
          try {
            const booking = await verify.mutateAsync({
              bookingId: id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            router.replace(`/bookings/${booking.id}`);
          } catch (err) {
            const axiosErr = err as AxiosError<{ message?: string }>;
            setPayError(
              axiosErr.response?.data?.message ?? "Payment verification failed",
            );
            void refetch();
          } finally {
            setPaying(false);
          }
        },
        () => setPaying(false),
      );
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setPayError(
        axiosErr.response?.data?.message ??
          (err instanceof Error ? err.message : "Could not start payment"),
      );
      setPaying(false);
    }
  }

  async function onCancel() {
    await cancel.mutateAsync(id);
    router.replace("/bookings");
  }

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-8">
        <BackLink href="/bookings" label="My tickets" />

        {isLoading && <p className="mt-8 text-sm text-muted">Loading…</p>}
        {isError || !data ? (
          !isLoading && (
            <p className="mt-8 text-sm text-highlight">Booking not found.</p>
          )
        ) : (
          <div className="mt-5 space-y-4">
            <header>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
                  {data.eventTitle}
                </h1>
                <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent">
                  {statusLabel(data.status)}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">
                {data.bookingCode} · {formatEventDate(data.startsAt)}
              </p>
            </header>

            {data.status === "PENDING" && data.expiresAt && (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 ring-1 ring-amber-200/80">
                Seat hold ends at{" "}
                {new Date(data.expiresAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                . Pay before it expires.
              </p>
            )}

            <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm">
              <h2 className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
                Seats
              </h2>
              <ul className="mt-3 space-y-2.5">
                {seats.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-semibold text-ink">
                      {s.label}
                      {s.categoryName ? (
                        <span className="font-normal text-muted">
                          {" "}
                          · {s.categoryName}
                        </span>
                      ) : null}
                    </span>
                    <span className="tabular-nums text-ink">
                      {formatInr(Number(s.price ?? 0))}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2 border-t border-border/80 pt-4 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums">
                    {formatInr(Number(data.subtotal))}
                  </span>
                </div>
                {Number(data.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>
                      Discount
                      {data.couponCode ? ` · ${data.couponCode}` : ""}
                    </span>
                    <span className="tabular-nums">
                      -{formatInr(Number(data.discountAmount))}
                    </span>
                  </div>
                )}
                <div className="flex items-end justify-between border-t border-border/80 pt-3">
                  <span className="text-sm text-muted">Total</span>
                  <span className="font-display text-2xl font-extrabold tabular-nums text-ink">
                    {formatInr(Number(data.totalAmount))}
                  </span>
                </div>
              </div>
            </section>

            {data.status === "PENDING" && (
              <CouponPicker
                bookingId={id}
                subtotal={Number(data.subtotal)}
                appliedCode={data.couponCode}
                applying={applyCoupon.isPending}
                removing={removeCoupon.isPending}
                onApply={async (code) => {
                  await applyCoupon.mutateAsync({ id, code });
                }}
                onRemove={async () => {
                  await removeCoupon.mutateAsync(id);
                }}
              />
            )}

            {tickets.length > 0 && (
              <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-sm">
                <h2 className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
                  Tickets / QR
                </h2>
                <ul className="mt-3 space-y-3">
                  {tickets.map((t) => (
                    <li
                      key={t.ticketCode}
                      className="flex flex-col gap-3 rounded-xl bg-chip/80 px-3 py-3 sm:flex-row sm:items-center"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(t.qrPayload)}`}
                        alt={`QR for ${t.ticketCode}`}
                        width={140}
                        height={140}
                        className="mx-auto rounded-lg bg-white p-2 sm:mx-0"
                      />
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-bold text-ink">
                          {t.seatLabel} · {t.ticketCode}
                        </p>
                        <p className="mt-1 break-all text-xs text-muted">
                          {t.qrPayload}
                        </p>
                        <p className="mt-2 text-[11px] font-semibold text-muted uppercase">
                          {t.status}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              {data.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onPay()}
                    className="rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
                  >
                    {busy
                      ? "Processing…"
                      : `Pay ${formatInr(Number(data.totalAmount))}`}
                  </button>
                  <button
                    type="button"
                    disabled={cancel.isPending || busy}
                    onClick={() => void onCancel()}
                    className="rounded-xl border border-border bg-surface px-5 py-3.5 text-sm font-bold text-ink transition hover:bg-chip"
                  >
                    Cancel hold
                  </button>
                </>
              )}
              {data.status === "CONFIRMED" && (
                <>
                  <Link
                    href={`/events/${data.eventSlug}`}
                    className="rounded-xl border border-border bg-surface px-5 py-3.5 text-center text-sm font-bold text-ink"
                  >
                    View event
                  </Link>
                  <button
                    type="button"
                    disabled={cancel.isPending}
                    onClick={() => void onCancel()}
                    className="rounded-xl border border-border px-5 py-3.5 text-sm font-bold text-highlight"
                  >
                    {cancel.isPending ? "Cancelling…" : "Cancel & refund"}
                  </button>
                </>
              )}
            </div>
            {payError && (
              <p className="text-sm font-medium text-highlight">{payError}</p>
            )}
            {data.status === "PENDING" && (
              <p className="text-xs text-muted">
                Local demo uses mock pay. Set Razorpay keys for live checkout.
              </p>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
