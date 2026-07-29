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
import { useBooking, useCancelBooking } from "@/hooks/use-bookings";
import {
  useCreatePaymentOrder,
  useMockPay,
  useVerifyPayment,
} from "@/hooks/use-payments";
import { openRazorpayCheckout } from "@/features/payments";
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
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-extrabold text-ink">
                {data.eventTitle}
              </h1>
              <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent">
                {statusLabel(data.status)}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">
              {data.bookingCode} · {formatEventDate(data.startsAt)}
            </p>

            {data.status === "PENDING" && data.expiresAt && (
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
                Seat hold ends at{" "}
                {new Date(data.expiresAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                . Pay before it expires.
              </p>
            )}

            <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-xs font-bold tracking-wide text-muted uppercase">
                Seats
              </h2>
              <ul className="mt-3 space-y-2">
                {seats.map((s) => (
                  <li key={s.id} className="flex justify-between text-sm">
                    <span className="font-semibold text-ink">
                      {s.label}
                      {s.categoryName ? ` · ${s.categoryName}` : ""}
                    </span>
                    <span>{formatInr(Number(s.price ?? 0))}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-border pt-4">
                <span className="text-sm text-muted">Total</span>
                <span className="font-display text-xl font-extrabold">
                  {formatInr(Number(data.totalAmount))}
                </span>
              </div>
            </section>

            {tickets.length > 0 && (
              <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-xs font-bold tracking-wide text-muted uppercase">
                  Tickets / QR
                </h2>
                <ul className="mt-3 space-y-4">
                  {tickets.map((t) => (
                    <li
                      key={t.ticketCode}
                      className="flex flex-col gap-3 rounded-xl bg-chip px-3 py-3 sm:flex-row sm:items-center"
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

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {data.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onPay()}
                    className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {busy ? "Processing…" : `Pay ${formatInr(Number(data.totalAmount))}`}
                  </button>
                  <button
                    type="button"
                    disabled={cancel.isPending || busy}
                    onClick={() => void onCancel()}
                    className="rounded-xl border border-border px-5 py-3 text-sm font-bold text-ink"
                  >
                    Cancel hold
                  </button>
                </>
              )}
              {data.status === "CONFIRMED" && (
                <>
                  <Link
                    href={`/events/${data.eventSlug}`}
                    className="rounded-xl border border-border px-5 py-3 text-center text-sm font-bold text-ink"
                  >
                    View event
                  </Link>
                  <button
                    type="button"
                    disabled={cancel.isPending}
                    onClick={() => void onCancel()}
                    className="rounded-xl border border-border px-5 py-3 text-sm font-bold text-highlight"
                  >
                    {cancel.isPending ? "Cancelling…" : "Cancel & refund"}
                  </button>
                </>
              )}
            </div>
            {payError && (
              <p className="mt-3 text-sm font-medium text-highlight">{payError}</p>
            )}
            {data.status === "PENDING" && (
              <p className="mt-3 text-xs text-muted">
                Local demo uses mock pay. Set Razorpay keys to use live checkout.
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
