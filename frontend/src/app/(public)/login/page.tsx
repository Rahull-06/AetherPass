import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <RedirectIfAuthenticated>
      <AuthShell
        title="Sign in"
        subtitle="Use your email to book seats and view tickets."
        footer={
          <p>
            New here?{" "}
            <Link href="/register" className="font-bold text-accent hover:underline">
              Create an account
            </Link>
          </p>
        }
      >
        <LoginForm />
      </AuthShell>
    </RedirectIfAuthenticated>
  );
}
