import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <RedirectIfAuthenticated>
      <AuthShell
        title="Create account"
        subtitle="Takes under a minute. You can book right after."
        footer={
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-accent hover:underline">
              Sign in
            </Link>
          </p>
        }
      >
        <RegisterForm />
      </AuthShell>
    </RedirectIfAuthenticated>
  );
}
