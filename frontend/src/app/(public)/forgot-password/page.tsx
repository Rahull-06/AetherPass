"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { AuthShell } from "@/components/auth/auth-shell";
import { authService } from "@/services/auth.service";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await authService.forgotPassword(values.email);
      setDone(true);
      setResetLink(res.resetLink ?? null);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setServerError(
        axiosErr.response?.data?.message ?? "Could not send reset link.",
      );
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We’ll email you a reset link. No OTP."
      footer={
        <p>
          Remembered it?{" "}
          <Link href="/login" className="font-bold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {done ? (
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-ink">
            If that email is registered, a reset link was sent.
          </p>
          {resetLink && (
            <p className="text-sm text-muted">
              Local/dev shortcut:{" "}
              <a href={resetLink} className="font-semibold text-accent break-all">
                open reset link
              </a>
            </p>
          )}
          <Link href="/login" className="inline-block text-sm font-bold text-accent">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="text-sm font-semibold text-ink">Email</label>
            <input
              type="email"
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs font-medium text-highlight">
                {errors.email.message}
              </p>
            )}
          </div>
          {serverError && (
            <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-highlight">
              {serverError}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-70"
          >
            {isSubmitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
