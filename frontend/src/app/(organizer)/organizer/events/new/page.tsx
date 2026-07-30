"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BackLink } from "@/components/layout/back-button";
import { useCreateEvent, useVenues } from "@/hooks/use-events";
import { EVENT_CATEGORIES } from "@/types/event";

const BANNER_PRESETS = [
  {
    label: "Concert lights",
    url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=80",
  },
  {
    label: "Comedy stage",
    url: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1600&q=80",
  },
  {
    label: "Marathon",
    url: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1600&q=80",
  },
  {
    label: "Festival crowd",
    url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1600&q=80",
  },
  {
    label: "Theatre",
    url: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1600&q=80",
  },
  {
    label: "Workshop",
    url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=80",
  },
];

const schema = z
  .object({
    title: z.string().min(3, "Title is required"),
    description: z.string().optional(),
    category: z.enum([
      "MUSIC",
      "COMEDY",
      "SPORTS",
      "THEATRE",
      "FESTIVAL",
      "WORKSHOP",
    ]),
    bannerUrl: z
      .string()
      .url("Enter a valid image URL")
      .optional()
      .or(z.literal("")),
    venueId: z.coerce.number().min(1, "Pick a venue"),
    startsAt: z.string().min(1, "Start time required"),
    endsAt: z.string().min(1, "End time required"),
    ticketCategories: z
      .array(
        z.object({
          name: z.string().min(1, "Name required"),
          description: z.string().optional(),
          price: z.coerce.number().min(0),
          totalSeats: z.coerce.number().min(1),
        }),
      )
      .min(1),
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    message: "End must be after start",
    path: ["endsAt"],
  });

type FormValues = z.infer<typeof schema>;

const field =
  "mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent";

function toIso(local: string) {
  return new Date(local).toISOString();
}

export default function CreateEventPage() {
  const router = useRouter();
  const { data: venues } = useVenues();
  const createMutation = useCreateEvent();
  const [serverError, setServerError] = useState<string | null>(null);

  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  }, []);

  const defaultEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    d.setHours(d.getHours() + 3);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  }, []);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title: "",
      description: "",
      category: "MUSIC",
      bannerUrl: "",
      venueId: 0,
      startsAt: defaultStart,
      endsAt: defaultEnd,
      ticketCategories: [
        { name: "Regular", description: "", price: 999, totalSeats: 100 },
        { name: "VIP", description: "", price: 2499, totalSeats: 30 },
      ],
    },
  });

  const bannerUrl = watch("bannerUrl");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ticketCategories",
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await createMutation.mutateAsync({
        ...values,
        bannerUrl: values.bannerUrl?.trim() || undefined,
        startsAt: toIso(values.startsAt),
        endsAt: toIso(values.endsAt),
      });
      router.push("/organizer/events");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setServerError(
        axiosErr.response?.data?.message ??
          axiosErr.message ??
          "Could not create event",
      );
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 md:px-8">
        <BackLink href="/organizer/events" label="My events" />
        <h1 className="font-display mt-4 text-3xl font-extrabold text-ink">
          Create event
        </h1>
        <p className="mt-2 text-sm text-muted">
          Saved as a draft. Submit it later for approval.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 space-y-5"
          noValidate
        >
          <div>
            <label className="text-sm font-semibold text-ink">Title</label>
            <input className={field} {...register("title")} />
            {errors.title && (
              <p className="mt-1 text-xs text-highlight">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-ink">Description</label>
            <textarea className={`${field} min-h-28`} {...register("description")} />
          </div>

          <div>
            <label className="text-sm font-semibold text-ink">Banner image</label>
            <p className="mt-1 text-xs text-muted">
              Pick a preset or paste any public image URL.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {BANNER_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() =>
                    setValue("bannerUrl", preset.url, { shouldValidate: true })
                  }
                  className={[
                    "overflow-hidden rounded-xl ring-2 transition",
                    bannerUrl === preset.url
                      ? "ring-accent"
                      : "ring-transparent hover:ring-border",
                  ].join(" ")}
                  title={preset.label}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="aspect-[4/3] h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
            <input
              className={field}
              placeholder="https://…"
              {...register("bannerUrl")}
            />
            {errors.bannerUrl && (
              <p className="mt-1 text-xs text-highlight">
                {errors.bannerUrl.message}
              </p>
            )}
            {bannerUrl?.trim() ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bannerUrl}
                  alt="Banner preview"
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-ink">Category</label>
              <select className={field} {...register("category")}>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Venue</label>
              <select className={field} {...register("venueId")}>
                <option value={0}>Select venue</option>
                {(venues ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · {v.city}
                  </option>
                ))}
              </select>
              {errors.venueId && (
                <p className="mt-1 text-xs text-highlight">
                  {errors.venueId.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-ink">Starts</label>
              <input type="datetime-local" className={field} {...register("startsAt")} />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Ends</label>
              <input type="datetime-local" className={field} {...register("endsAt")} />
              {errors.endsAt && (
                <p className="mt-1 text-xs text-highlight">
                  {errors.endsAt.message}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface/70 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-ink">
                Ticket categories
              </h2>
              <button
                type="button"
                onClick={() =>
                  append({
                    name: "New tier",
                    description: "",
                    price: 499,
                    totalSeats: 50,
                  })
                }
                className="text-sm font-semibold text-accent"
              >
                Add tier
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {fields.map((fieldItem, index) => (
                <div
                  key={fieldItem.id}
                  className="grid gap-3 rounded-xl border border-border/70 p-3 sm:grid-cols-2"
                >
                  <input
                    className={field}
                    placeholder="Name"
                    {...register(`ticketCategories.${index}.name`)}
                  />
                  <input
                    className={field}
                    placeholder="Description"
                    {...register(`ticketCategories.${index}.description`)}
                  />
                  <input
                    type="number"
                    className={field}
                    placeholder="Price"
                    {...register(`ticketCategories.${index}.price`)}
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className={field}
                      placeholder="Seats"
                      {...register(`ticketCategories.${index}.totalSeats`)}
                    />
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="rounded-xl border border-border px-3 text-sm font-semibold text-highlight"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {serverError && (
            <p className="rounded-xl border border-highlight/25 bg-highlight/5 px-4 py-3 text-sm text-highlight">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-white disabled:opacity-70 sm:w-auto sm:px-8"
          >
            {isSubmitting ? "Saving…" : "Save draft"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
