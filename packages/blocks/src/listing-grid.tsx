import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import {
  Badge,
  Card,
  CardBody,
  CardDescription,
  EmptyState,
  Grid,
  Link,
} from "@lumo-ui/ui";

/**
 * A grid of purchasable things: a product catalogue, a provider directory, a
 * room list.
 *
 * No `"use client"`: every card is a real `<a href>`, so the catalogue is in the
 * server-rendered first byte a crawler indexes. Price, rating and review count
 * all go through `formatNumber` under the REQUIRED `locale`; the rating sentence
 * is a caller-supplied function so Persian is not forced into English clause
 * order. `image` is a `{src, alt}` pair so `alt` must be WRITTEN, never omitted.
 */
export interface ListingImage {
  src: string;
  /** `""` is legitimate, and usually correct here. See the file header. */
  alt: string;
}

export interface Listing {
  /** Stable key. Not rendered. */
  id: string;
  /** The card's heading and the link's text. */
  title: string;
  /** Where the card goes. A real URL — see the file header. */
  href: string;
  description?: string | undefined;
  image?: ListingImage | undefined;
  /** The price. Never rendered raw — formatted with `priceFormat`. */
  price: number;
  /** A corner marker, e.g. «پیشنهاد ویژه». Text, not a number. */
  badge?: string | undefined;
  /** Average score, e.g. `4.8`. Formatted, then passed to `strings.rating`. */
  rating?: number | undefined;
  /** How many reviews the score is drawn from. */
  ratingCount?: number | undefined;
}

export interface ListingGridStrings {
  /** Announced name of the region wrapping the grid, e.g. «آگهی‌ها». */
  regionLabel: string;
  /** Announced prefix for the price, e.g. «قیمت». Rendered `sr-only` before the figure. */
  priceLabel: string;
  /** The rating sentence, as a function of two ALREADY-FORMATTED strings. A function, not a template — see the file header. */
  rating: (value: string, count: string) => string;
  /** Shown when `items` is empty. */
  emptyTitle: string;
  emptyDescription?: string | undefined;
}

export interface ListingGridProps {
  strings: ListingGridStrings;
  items: readonly Listing[];
  /** Formats every figure. Required by design — see progress.tsx. */
  locale: Locale;
  /** `Intl.NumberFormat` options for the price, e.g. `{style:"currency",currency:"IRR"}`. No default — a currency is a business decision. */
  priceFormat?: Intl.NumberFormatOptions | undefined;
  /** Tracks per row. Default `"auto"` — as many 16rem columns as fit. */
  cols?: "2" | "3" | "4" | "auto" | undefined;
  /** Rendered above the grid — a `<PageHeader>`, a `<FilterBar>`. */
  header?: LumoNode;
  className?: string | undefined;
}

const RATING_FORMAT: Intl.NumberFormatOptions = { maximumFractionDigits: 1 };

/** A responsive card grid of listings — image, title, price and rating — with the empty state built in. */
export function ListingGrid({
  strings,
  items,
  locale,
  priceFormat,
  cols = "auto",
  header,
  className,
}: ListingGridProps) {
  return (
    <section
      aria-label={strings.regionLabel}
      className={cn("flex w-full flex-col gap-4 px-4 py-6", className)}
    >
      {header}

      {items.length === 0 ? (
        <EmptyState
          title={strings.emptyTitle}
          {...(strings.emptyDescription === undefined
            ? {}
            : { description: strings.emptyDescription })}
        />
      ) : (
        <Grid cols={cols} gap="md" tag="ul" className="list-none p-0">
          {items.map((listing) => {
            const rating = listing.rating;
            const ratingCount = listing.ratingCount;

            return (
              <li key={listing.id} className="flex">
                {/*
                 * `h-full`: cards in a row must agree on height however long the Persian title runs.
                 */}
                <Card variant="elevated" className="h-full w-full overflow-hidden">
                  {listing.image !== undefined ? (
                    // `aspect-video` + `object-cover`: centred, not squashed; nothing to mirror.
                    <img
                      src={listing.image.src}
                      alt={listing.image.alt}
                      className="aspect-video w-full object-cover"
                    />
                  ) : null}

                  <CardBody className="flex flex-col gap-2">
                    {listing.badge !== undefined ? (
                      <Badge tone="accent" variant="subtle">
                        {listing.badge}
                      </Badge>
                    ) : null}

                    {/*
                     * The link wraps the TITLE, not the whole card — a card-wide anchor
                     * swallows price and rating into the link's accessible name.
                     */}
                    <h3 className="text-base leading-snug font-semibold text-fg">
                      <Link href={listing.href} variant="quiet">
                        {listing.title}
                      </Link>
                    </h3>

                    {listing.description !== undefined ? (
                      <CardDescription className="line-clamp-2">
                        {listing.description}
                      </CardDescription>
                    ) : null}

                    {rating !== undefined && ratingCount !== undefined ? (
                      <p className="text-xs text-fg-muted">
                        {strings.rating(
                          formatNumber(rating, locale, RATING_FORMAT),
                          formatNumber(ratingCount, locale),
                        )}
                      </p>
                    ) : null}

                    {/* `mbs-auto` pushes the price to the block end of the
                        card, so a row of cards aligns its prices even when the
                        titles wrap to different heights. */}
                    <p className="mbs-auto pbs-2 text-base font-semibold text-fg">
                      <span className="sr-only">{strings.priceLabel}</span>
                      {formatNumber(listing.price, locale, priceFormat)}
                    </p>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </Grid>
      )}
    </section>
  );
}
