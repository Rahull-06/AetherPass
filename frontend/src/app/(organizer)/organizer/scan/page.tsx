"use client";

import { useState } from "react";
import type { AxiosError } from "axios";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BackLink } from "@/components/layout/back-button";
import { useScanTicket } from "@/hooks/use-ops";
import type { ScanResult } from "@/services/ops.service";
import { CameraQrScanner } from "@/features/organizer/camera-qr-scanner";

export default function ScanPage() {
  const scan = useScanTicket();
  const [payload, setPayload] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runScan(value: string) {
    setError(null);
    setResult(null);
    const trimmed = value.trim();
    if (!trimmed) return;
    setPayload(trimmed);
    try {
      const res = await scan.mutateAsync(trimmed);
      setResult(res);
      if (res.valid) setPayload("");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? "Scan failed");
    }
  }

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 md:px-8">
        <BackLink href="/organizer/dashboard" label="Organizer" />
        <h1 className="font-display mt-4 text-3xl font-extrabold text-ink">
          Scan tickets
        </h1>
        <p className="mt-2 text-sm text-muted">
          Use the camera at the gate, or paste a QR payload / ticket code.
        </p>

        <div className="mt-6">
          <CameraQrScanner
            disabled={scan.isPending}
            onScan={(value) => void runScan(value)}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
          <label className="text-sm font-bold text-ink">QR / ticket code</label>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={4}
            placeholder="AETHER|AP-…|TKT-…|E… or TKT-XXXXXXXX"
            className="mt-2 w-full rounded-xl border border-border bg-chip px-3 py-3 font-mono text-xs outline-none focus:border-accent"
          />
          <button
            type="button"
            disabled={scan.isPending || !payload.trim()}
            onClick={() => void runScan(payload)}
            className="mt-4 w-full rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {scan.isPending ? "Checking…" : "Check in"}
          </button>
          {error && (
            <p className="mt-3 text-sm font-medium text-highlight">{error}</p>
          )}
        </div>

        {result && (
          <div
            className={[
              "mt-6 rounded-2xl border p-5",
              result.valid
                ? "border-emerald-300 bg-emerald-50"
                : "border-amber-300 bg-amber-50",
            ].join(" ")}
          >
            <p
              className={[
                "font-display text-xl font-extrabold",
                result.valid ? "text-emerald-800" : "text-amber-900",
              ].join(" ")}
            >
              {result.message}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Event" value={result.eventTitle} />
              <Row label="Guest" value={result.holderName} />
              <Row label="Seat" value={result.seatLabel} />
              <Row label="Ticket" value={result.ticketCode} />
              <Row label="Booking" value={result.bookingCode} />
              <Row label="Status" value={result.ticketStatus} />
            </dl>
          </div>
        )}
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
