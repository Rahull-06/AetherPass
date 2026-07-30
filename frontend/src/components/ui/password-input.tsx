"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/utils/cn";

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  inputClassName?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { className, inputClassName, disabled, ...props },
    ref,
  ) {
    const [visible, setVisible] = useState(false);

    return (
      <div className={cn("relative mt-1.5", className)}>
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={cn(
            "w-full rounded-xl border border-border bg-surface py-3 pr-11 pl-4 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-70",
            inputClassName,
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted transition hover:text-ink"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    );
  },
);

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.5 10.6a3 3 0 0 0 4 4M9.4 5.4A10.5 10.5 0 0 1 12 5c6 0 9.5 7 9.5 7a16.8 16.8 0 0 1-3.2 4.1M6.2 6.3A16.5 16.5 0 0 0 2.5 12s3.5 7 9.5 7c1.4 0 2.7-.3 3.9-.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
