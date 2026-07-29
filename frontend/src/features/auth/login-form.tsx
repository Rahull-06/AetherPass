"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { useAuth } from "@/providers/auth-provider";
import { homeForRoles } from "@/services/auth.service";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    try {
      const user = await login(values);
      router.push(homeForRoles(user.roles));
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setServerError(
        axiosErr.response?.data?.message ??
          axiosErr.message ??
          "Login failed. Please try again.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="login-email" className="text-sm font-semibold text-ink">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          className={fieldClass}
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1.5 text-xs font-medium text-highlight">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="login-password"
            className="text-sm font-semibold text-ink"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-accent hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          className={fieldClass}
          placeholder="Your password"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1.5 text-xs font-medium text-highlight">
            {errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded-xl border border-highlight/20 bg-accent-soft px-4 py-3 text-sm font-medium text-highlight"
        >
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-70"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
