import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SeatMapView } from "@/features/booking/seat-map-view";

export default async function BookSeatsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="flex-1">
        <SeatMapView slug={slug} />
      </main>
      <div className="hidden lg:block">
        <SiteFooter />
      </div>
      <MobileBottomNav />
    </div>
  );
}
