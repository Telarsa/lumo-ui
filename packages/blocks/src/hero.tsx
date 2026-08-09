import { cn, type LumoNode } from "@lumo-ui/core";
import { Badge, Container, Link, buttonVariants } from "@lumo-ui/ui";

/**
 * The top of a marketing page: a claim, a sentence, and two calls to action.
 *
 * ═══ NO `"use client"`. THIS IS THE BLOCK WHERE IT MATTERS MOST ═════════════
 *
 * A hero is what a crawler indexes and what a reader on a slow connection sees
 * first. A client directive would remove it from the server-rendered HTML in a
 * framework that streams — which is the same argument `badge.tsx` makes for a
 * plan tier and `card.tsx` for its wrapper, applied to the one element whose
 * absence from the first byte is a business problem rather than a latency one.
 *
 * ── SO THE CTA IS A LINK WEARING A BUTTON, NOT A BUTTON ────────────────────
 *
 * `<Button onPress={() => router.push(…)}>` is the usual implementation and it
 * costs three things: the client boundary above, an element with no `href` for
 * a crawler to follow, and a control that cannot be opened in a new tab or
 * copied. A hero CTA is NAVIGATION, so it is an `<a>`.
 *
 * `buttonVariants` is exported from `@lumo-ui/ui` for exactly this: the CTA
 * borrows the button's cva output and stays a `Link`. Two details make the
 * merge behave:
 *
 *  - `variant="quiet"` on the Link, because `accent` brings `underline` and a
 *    `decoration-*` colour that a solid fill does not want. `quiet` is
 *    `text-current no-underline`, which is what a button-shaped thing needs.
 *  - `data-hovered:no-underline` cancels `quiet`'s own hover underline.
 *    `cn()` is tailwind-merge, so `no-underline` and `underline` resolve in the
 *    same conflict group and the last one written wins.
 *
 * ── `align` IS `start`/`center`, NEVER `left`/`center` ─────────────────────
 *
 * `items-start` compiles to `align-items: flex-start`, and *flex* start follows
 * the container's direction — so the same value is the left edge in English and
 * the right edge in Persian. `text-start` is the logical form of `text-align`.
 * There is deliberately no spelling of this prop that names a physical edge,
 * which is the same enforcement `Drawer.side` uses.
 */
export interface HeroStrings {
  /** A small line above the title, e.g. «نسخه ۲ منتشر شد». */
  eyebrow?: string | undefined;
  /** The claim. Rendered as the page `<h1>`. */
  title: string;
  /** One or two sentences under it. */
  description?: string | undefined;
  /** The primary call to action. Requires `primaryHref`. */
  primaryAction?: string | undefined;
  /** The secondary call to action. Requires `secondaryHref`. */
  secondaryAction?: string | undefined;
  /** Small print under the buttons, e.g. «بدون نیاز به کارت بانکی». */
  footnote?: string | undefined;
}

export interface HeroProps {
  strings: HeroStrings;
  /** Target of the primary CTA. Both this and `strings.primaryAction` are needed. */
  primaryHref?: string | undefined;
  secondaryHref?: string | undefined;
  /** A screenshot, an illustration, a video. Laid out beside the copy. */
  media?: LumoNode;
  /** Where the copy sits on the inline axis. Default `"start"`. */
  align?: "start" | "center" | undefined;
  className?: string | undefined;
}

export function Hero({
  strings,
  primaryHref,
  secondaryHref,
  media,
  align = "start",
  className,
}: HeroProps) {
  const isCentered = align === "center" && media === undefined;
  const hasPrimary = strings.primaryAction !== undefined && primaryHref !== undefined;
  const hasSecondary = strings.secondaryAction !== undefined && secondaryHref !== undefined;

  return (
    <section className={cn("w-full px-4 pbs-16 pbe-20", className)}>
      <Container size="xl" padded={false}>
        {/*
         * `md:flex-row`: below the medium breakpoint the copy and the media
         * stack on the BLOCK axis, which is direction-invariant. Above it,
         * `flex-row` puts the copy first in READING order — left in English,
         * right in Persian — with no `flex-row-reverse` anywhere. Reversing the
         * flex direction to "fix" RTL mirrors the paint order but not the DOM
         * order, so the keyboard then walks the section backwards.
         */}
        <div
          className={cn(
            "flex flex-col gap-10 md:flex-row md:items-center",
            isCentered ? "items-center text-center" : "items-start text-start",
          )}
        >
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-5",
              isCentered ? "items-center" : "items-start",
            )}
          >
            {strings.eyebrow !== undefined ? (
              <Badge tone="accent" variant="subtle">
                {strings.eyebrow}
              </Badge>
            ) : null}

            {/*
             * `text-balance` is deliberately absent. card.tsx records why: it
             * is tuned for short Latin headlines and produces uneven rag on
             * Arabic script, where the line-breaking opportunities are
             * different. `leading-tight` agrees with the `line-height: 1.4`
             * theme.css already applies to Persian headings.
             */}
            <h1 className="text-3xl leading-tight font-semibold text-fg sm:text-4xl">
              {strings.title}
            </h1>

            {strings.description !== undefined ? (
              // `max-w-prose` is set in `ch`, which follows the RENDERED font —
              // so under the Persian stack it resolves against Vazirmatn's
              // glyph width rather than a Latin one.
              <p className="max-w-prose text-base text-fg-muted">{strings.description}</p>
            ) : null}

            {hasPrimary || hasSecondary ? (
              <div className="flex flex-wrap items-center gap-3">
                {hasPrimary && primaryHref !== undefined ? (
                  <Link
                    href={primaryHref}
                    variant="quiet"
                    // See the file header: a Link wearing the Button's cva
                    // output, so the CTA is a real `<a href>` in the first byte.
                    className={cn(
                      buttonVariants({ variant: "solid", size: "lg" }),
                      "no-underline data-hovered:no-underline",
                    )}
                  >
                    {strings.primaryAction}
                  </Link>
                ) : null}

                {hasSecondary && secondaryHref !== undefined ? (
                  <Link
                    href={secondaryHref}
                    variant="quiet"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "no-underline data-hovered:no-underline",
                    )}
                  >
                    {strings.secondaryAction}
                  </Link>
                ) : null}
              </div>
            ) : null}

            {strings.footnote !== undefined ? (
              <p className="text-sm text-fg-subtle">{strings.footnote}</p>
            ) : null}
          </div>

          {media !== undefined ? (
            <div className="min-w-0 flex-1">{media}</div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
