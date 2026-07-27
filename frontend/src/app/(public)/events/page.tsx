import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function EventsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8 md:py-14">
        <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">
          Events
        </h1>
        <p className="mt-3 max-w-lg text-muted">
          Event browse, search, and filters will connect here once the catalog
          API is ready.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex text-sm font-semibold text-accent hover:underline"
        >
          Back home
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
