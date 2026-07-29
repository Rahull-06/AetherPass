import Link from "next/link";
import { formatInr } from "@/utils/cn";
import { formatEventDay } from "@/utils/format";
import type { EventSummary } from "@/types/event";

const posters: Record<string, string> = {
  MUSIC:
    "linear-gradient(145deg, #7c1d3a 0%, #1f0b1a 45%, #0b0f19 100%), radial-gradient(circle at 80% 20%, rgba(225,29,72,.45), transparent 40%)",
  COMEDY:
    "linear-gradient(145deg, #854d0e 0%, #1c1408 50%, #0b0f19 100%), radial-gradient(circle at 20% 30%, rgba(250,204,21,.35), transparent 45%)",
  SPORTS:
    "linear-gradient(145deg, #14532d 0%, #0b1a12 50%, #0b0f19 100%), radial-gradient(circle at 70% 40%, rgba(34,197,94,.35), transparent 40%)",
  THEATRE:
    "linear-gradient(145deg, #4c1d95 0%, #160b2e 50%, #0b0f19 100%), radial-gradient(circle at 30% 20%, rgba(167,139,250,.35), transparent 45%)",
  FESTIVAL:
    "linear-gradient(145deg, #9a3412 0%, #1c0f0a 50%, #0b0f19 100%), radial-gradient(circle at 60% 20%, rgba(251,146,60,.4), transparent 40%)",
  WORKSHOP:
    "linear-gradient(145deg, #0e7490 0%, #0b1a22 50%, #0b0f19 100%), radial-gradient(circle at 40% 30%, rgba(34,211,238,.3), transparent 40%)",
};

type Props = {
  event: EventSummary;
  compact?: boolean;
};

export function EventCard({ event, compact }: Props) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className={
        compact
          ? "group w-[148px] shrink-0 snap-start overflow-hidden rounded-xl bg-surface shadow-sm ring-1 ring-border/70 transition active:scale-[0.98] md:w-[180px]"
          : "group overflow-hidden rounded-xl bg-surface shadow-sm ring-1 ring-border/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
      }
    >
      <div
        className={
          compact ? "relative aspect-[2/3] overflow-hidden" : "relative aspect-[3/4] overflow-hidden sm:aspect-[16/10]"
        }
      >
        <div
          aria-hidden
          className="absolute inset-0 transition duration-300 group-hover:scale-[1.04]"
          style={{ background: posters[event.category] ?? posters.MUSIC }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <span className="absolute left-2 top-2 rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
          {event.category}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-2.5 text-white md:p-3">
          <p className="text-[10px] font-medium text-white/80 md:text-xs">
            {formatEventDay(event.startsAt)}
          </p>
          <p className="mt-0.5 line-clamp-2 font-display text-sm font-bold leading-snug md:text-base">
            {event.title}
          </p>
        </div>
      </div>

      {!compact && (
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink">
              {event.venueName}
            </p>
            <p className="truncate text-[11px] text-muted">{event.city}</p>
          </div>
          <p className="shrink-0 text-xs font-bold text-accent">
            {formatInr(Number(event.minPrice))}
          </p>
        </div>
      )}

      {compact && (
        <div className="px-2 py-2">
          <p className="truncate text-[11px] font-semibold text-ink">
            {event.city}
          </p>
          <p className="text-[11px] font-bold text-accent">
            {formatInr(Number(event.minPrice))}
          </p>
        </div>
      )}
    </Link>
  );
}
