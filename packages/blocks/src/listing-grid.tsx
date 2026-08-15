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
 * ── NO `"use client"`, AND FOR THIS BLOCK IT IS THE PRODUCT REQUIREMENT ─────
 *
 * A listing grid is the page a crawler indexes. Every card is a real `<a href>`
 * — `Link` from `@lumo-ui/ui`, not a `<div onClick>` — so the catalogue is in
 * the first byte with no JavaScript, which is the reason `badge.tsx`,
 * `card.tsx` and `avatar.tsx` all refuse the client directive as well. One
 * `"use client"` here would remove a whole storefront from the served HTML.
 *
 * ── THREE NUMBERS, THREE CHANCES TO SHIP LATIN DIGITS ──────────────────────
 *
 * A price, a rating and a review count. All three go through `formatNumber`
 * under the route's locale, which is why `locale` is a REQUIRED prop rather
 * than a context with a default (progress.tsx has the argument). `LumoNode`
 * makes the shortcut a compile error: `<CardBody>{listing.price}</CardBody>` is
 * TS2322, not a rendering surprise a Persian shopper discovers.
 *
 * The rating string is assembled by a CALLER-SUPPLIED FUNCTION,
 * `strings.rating(value, count)`, for the same reason `numberField.decrease`
 * is a function in `packages/core/src/strings.ts`: «۴٫۸ از ۱۲۰ نظر» does not
 * place its two numbers where "4.8 from 120 reviews" places them, and a
 * `"{0} from {1}"` template forces Persian into English clause order.
 *
 * ── `image` IS A PAIR, NOT TWO OPTIONAL PROPS ──────────────────────────────
 *
 * `{src, alt}` together or neither. `avatar.tsx` makes the same move: `alt` is
 * required to be WRITTEN, because `alt=""` is right when the title beside the
 * image already names the thing and `alt="اتاق دو تخته با نمای دریا"` is right
 * when it does not — and which one is right is a judgement the type asks for
 * rather than a default it guesses. Two independent optional props would let
 * the attribute vanish entirely, which is the one answer that is always wrong.
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
  /**
   * Announced prefix for the price, e.g. «قیمت». Rendered `sr-only` before the
   * figure, so a screen reader says "price, one million two hundred thousand"
   * rather than a bare number floating under a title.
   */
  priceLabel: string;
  /**
   * The rating sentence, as a function of two ALREADY-FORMATTED strings.
   * See the file header for why this is a function.
   */
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
  /**
   * `Intl.NumberFormat` options for the price, e.g.
   * `{style:"currency",currency:"IRR",maximumFractionDigits:0}`.
   *
   * No default: a currency is a business decision, and a library that guessed
   * one would render a plausible price in the wrong unit.
   */
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
                 * `variant="elevated"` and `h-full`: the cards in a row must
                 * agree on height regardless of how long the Persian title
                 * runs, and Persian titles run measurably longer than the same
                 * English string.
                 */}
                <Card variant="elevated" className="h-full w-full overflow-hidden">
                  {listing.image !== undefined ? (
                    // `aspect-video` + `object-cover` keeps a non-square photo
                    // centred rather than squashed. Neither utility has an
                    // inline axis, so there is nothing here to mirror.
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
                     * The link wraps the TITLE, not the whole card. A card-wide
                     * anchor swallows the price and the rating into the link's
                     * accessible name, which a screen reader then reads as one
                     * long run with no way to skim. `variant="quiet"` keeps the
                     * heading looking like a heading.
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
