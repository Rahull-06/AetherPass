import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="relative flex flex-1 flex-col">
        {/* Mobile: stacked hero */}
        <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-16 pt-10 md:px-8 md:pt-16 lg:pt-20">
          <p className="mb-4 text-sm font-semibold tracking-[0.18em] text-accent uppercase">
            AetherPass
          </p>
          <h1 className="font-display max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-5xl md:text-6xl lg:text-[4.25rem]">
            Your pass to every live moment.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg md:mt-6">
            Discover concerts, comedy, and festivals. Lock seats for five
            minutes, pay securely, and walk in with a scannable ticket.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center">
            <Link
              href="/events"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-white transition duration-200 hover:brightness-110"
            >
              Browse events
            </Link>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-surface/70 px-6 text-sm font-semibold text-ink transition duration-200 hover:bg-surface"
            >
              Create account
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
