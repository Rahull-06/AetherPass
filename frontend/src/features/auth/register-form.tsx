"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { useAuth } from "@/providers/auth-provider";
import { homeForRoles } from "@/services/auth.service";
import { PasswordInput } from "@/components/ui/password-input";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || v === "" || /^[0-9]{10,20}$/.test(v), {
      message: "Phone must be 10–20 digits",
    }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition duration-200 placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", phone: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      const user = await registerUser({
        ...values,
        phone: values.phone?.trim() ? values.phone.trim() : undefined,
      });
      router.push(homeForRoles(user.roles));
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setServerError(
        axiosErr.response?.data?.message ??
          axiosErr.message ??
          "Registration failed. Please try again.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="reg-name" className="text-sm font-semibold text-ink">
          Full name
        </label>
        <input
          id="reg-name"
          type="text"
          autoComplete="name"
          className={fieldClass}
          placeholder="Arjun Mehta"
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="mt-1.5 text-xs font-medium text-highlight">
            {errors.fullName.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="reg-email" className="text-sm font-semibold text-ink">
          Email
        </label>
        <input
          id="reg-email"
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
        <label
          htmlFor="reg-password"
          className="text-sm font-semibold text-ink"
        >
          Password
        </label>
        <PasswordInput
          id="reg-password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1.5 text-xs font-medium text-highlight">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="reg-phone" className="text-sm font-semibold text-ink">
          Phone <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="reg-phone"
          type="tel"
          autoComplete="tel"
          className={fieldClass}
          placeholder="10–20 digits"
          {...register("phone")}
        />
        {errors.phone && (
          <p className="mt-1.5 text-xs font-medium text-highlight">
            {errors.phone.message}
          </p>
        )}
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded-xl border border-highlight/25 bg-highlight/5 px-4 py-3 text-sm font-medium text-highlight"
        >
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-white transition duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
