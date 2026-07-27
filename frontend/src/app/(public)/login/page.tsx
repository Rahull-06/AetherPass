import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12 md:px-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Sign in</h1>
        <p className="mt-2 text-muted">Auth form lands in the next module.</p>
        <Link href="/register" className="mt-6 text-sm font-semibold text-accent">
          Need an account? Register
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
