import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { EventsBrowse } from "@/features/events/events-browse";

export default function EventsPage() {
  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-10">
        <Suspense
          fallback={
            <p className="text-sm text-muted">Loading events…</p>
          }
        >
          <EventsBrowse />
        </Suspense>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
