"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  href?: string;
  label?: string;
  className?: string;
};

/** Prefer browser history; fall back to href when there's nowhere to go. */
export function BackButton({ href = "/events", label = "Back", className }: Props) {
  const router = useRouter();

  function onBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(href);
  }

  return (
    <button
      type="button"
      onClick={onBack}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-black/50"
      }
      aria-label={label}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}

export function BackLink({ href = "/", label = "Back" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </Link>
  );
}
