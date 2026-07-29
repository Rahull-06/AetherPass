import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { EventDetailView } from "@/features/events/event-detail-view";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="flex-1">
        <EventDetailView slug={slug} />
      </main>
      <div className="hidden md:block">
        <SiteFooter />
      </div>
      <MobileBottomNav />
    </div>
  );
}
