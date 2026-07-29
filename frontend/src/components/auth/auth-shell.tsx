import Link from "next/link";
import { BackLink } from "@/components/layout/back-button";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

/**
 * Mobile: compact form with back link.
 * Desktop: split brand panel + form.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-panel px-12 py-14 text-white lg:flex lg:min-h-screen lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 20% 20%, rgba(225,29,72,0.4), transparent 55%)",
          }}
        />
        <Link href="/" className="relative z-10 font-display text-2xl font-extrabold">
          AetherPass
        </Link>
        <div className="relative z-10 mt-auto max-w-md pb-6">
          <h1 className="font-display text-4xl font-extrabold leading-tight xl:text-5xl">
            Tickets that get you in
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-panel-muted xl:text-base">
            Browse shows, hold seats for 5 minutes, and walk in with a QR pass.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 md:px-10 lg:px-16">
        <div className="rise-in w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <BackLink href="/" label="Home" />
            <Link
              href="/"
              className="mt-4 block font-display text-xl font-extrabold text-ink"
            >
              AetherPass
            </Link>
          </div>

          <div className="mb-6 hidden lg:block">
            <BackLink href="/" label="Back to home" />
          </div>

          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            {title}
          </h2>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>

          <div className="mt-8">{children}</div>
          <div className="mt-8 text-sm text-muted">{footer}</div>
        </div>
      </main>
    </div>
  );
}
