"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BackLink } from "@/components/layout/back-button";

export default function OrganizerDashboardPage() {
  return (
    <div className="flex min-h-full flex-col pb-mobile-nav">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
        <BackLink href="/" label="Home" />
        <h1 className="font-display mt-4 text-3xl font-extrabold text-ink">
          Organizer dashboard
        </h1>
        <p className="mt-2 text-sm text-muted">
          Manage shows and check guests in at the gate.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DashCard
            href="/organizer/events"
            title="My events"
            body="Create, edit, and submit shows for approval."
          />
          <DashCard
            href="/organizer/events/new"
            title="New event"
            body="Add a draft event with ticket categories."
          />
          <DashCard
            href="/organizer/scan"
            title="Scan tickets"
            body="Validate QR codes and mark tickets used."
          />
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}

function DashCard({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/40"
    >
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </Link>
  );
}
