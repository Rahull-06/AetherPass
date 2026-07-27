import Link from "next/link";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/login", label: "Sign in" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:h-16 md:px-8">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-ink md:text-xl"
        >
          AetherPass
        </Link>

        {/* Desktop / tablet nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/register"
            className="rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Get started
          </Link>
        </nav>

        {/* Mobile actions */}
        <div className="flex items-center gap-3 md:hidden">
          <Link href="/login" className="text-sm font-medium text-muted">
            Sign in
          </Link>
          <Link
            href="/events"
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white"
          >
            Events
          </Link>
        </div>
      </div>
    </header>
  );
}
