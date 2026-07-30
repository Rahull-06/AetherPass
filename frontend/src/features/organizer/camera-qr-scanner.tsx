"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onScan: (value: string) => void;
  disabled?: boolean;
};

export function CameraQrScanner({ onScan, disabled }: Props) {
  const [active, setActive] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "aether-qr-reader";
  const lastScanRef = useRef(0);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // ignore stop races
    }
  }

  async function startScanner() {
    setCamError(null);
    if (disabled) return;
    try {
      await stopScanner();
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;
      setActive(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          const now = Date.now();
          if (now - lastScanRef.current < 1800) return;
          lastScanRef.current = now;
          onScan(decoded.trim());
        },
        () => undefined,
      );
    } catch {
      setActive(false);
      setCamError(
        "Camera unavailable. Allow camera permission or paste the code below.",
      );
      await stopScanner();
    }
  }

  async function onToggle() {
    if (active) {
      await stopScanner();
      setActive(false);
      return;
    }
    await startScanner();
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink">Camera scan</p>
          <p className="mt-0.5 text-xs text-muted">
            Point at the ticket QR at the gate.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void onToggle()}
          className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-ink disabled:opacity-50"
        >
          {active ? "Stop camera" : "Open camera"}
        </button>
      </div>

      <div
        id={regionId}
        className={[
          "mt-4 overflow-hidden rounded-xl bg-black/90",
          active ? "min-h-[240px]" : "hidden",
        ].join(" ")}
      />

      {camError && (
        <p className="mt-3 text-sm font-medium text-highlight">{camError}</p>
      )}
    </div>
  );
}
