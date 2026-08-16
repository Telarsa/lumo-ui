import { cn, type LumoNode } from "@lumo-ui/core";
import { Badge, Container, Link, buttonVariants } from "@lumo-ui/ui";

/**
 * The top of a marketing page: a claim, a sentence, and two calls to action.
 *
 * No `"use client"` — a hero is what a crawler indexes and what the first byte
 * must contain. So the CTA is a `Link` wearing `buttonVariants` (a real `<a href>`),
 * with `variant="quiet"` + `data-hovered:no-underline` so the merge behaves.
 * `align` is `start`/`center`, never a physical edge: `items-start` and
 * `text-start` follow the container's direction.
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
         * `md:flex-row` puts the copy first in READING order with no
         * `flex-row-reverse` — reversing would mirror paint order but not DOM order.
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
             * `text-balance` is deliberately absent: uneven rag on Arabic script (card.tsx).
             */}
            <h1 className="text-3xl leading-tight font-semibold text-fg sm:text-4xl">
              {strings.title}
            </h1>

            {strings.description !== undefined ? (
              // `max-w-prose` is in `ch`, so it follows the rendered (Persian) font.
              <p className="max-w-prose text-base text-fg-muted">{strings.description}</p>
            ) : null}

            {hasPrimary || hasSecondary ? (
              <div className="flex flex-wrap items-center gap-3">
                {hasPrimary && primaryHref !== undefined ? (
                  <Link
                    href={primaryHref}
                    variant="quiet"
                    // A Link wearing the Button's cva output — a real `<a href>` in the first byte.
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
