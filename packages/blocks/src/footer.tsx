import { cn, type LumoNode } from "@lumo-ui/core";
import { Container, Link, Separator } from "@lumo-ui/ui";

/**
 * The band at the bottom of every page: brand, grouped navigation, legal
 * links, copyright.
 *
 * No `"use client"` — a footer's links are exactly the kind of real `<a href>`
 * navigation `hero.tsx` and `feature-grid.tsx` argue for at length: they are
 * indexed, they work with no JavaScript, and nothing here needs a callback.
 *
 * ── NO `level` PROP, UNLIKE ITS MARKETING SIBLINGS ──────────────────────────
 *
 * `hero.tsx`, `feature-grid.tsx`, `pricing-table.tsx` and `faq.tsx` all take a
 * `level` because they are IN-FLOW sections whose correct heading depth
 * depends on whatever the caller stacked above them on the same page. A
 * footer is not in that flow — it is the one landmark that sits at the same
 * document depth on every route regardless of what the page above it looks
 * like — so its two heading tiers (a section-level column heading, fixed at
 * `<h2>`) are fixed rather than parameterised. There is nothing above a
 * footer for its own headings to disagree with.
 *
 * ── THE BRAND MARK AND SOCIAL ROW ARE SLOTS, NOT `strings.brand` ────────────
 *
 * `brand` and `social` are `LumoNode`, not text: a wordmark is usually an
 * `<img>` or an inline SVG, and a social row is a set of `IconButton`s that
 * each already carry their OWN required `label` (`button.tsx`'s whole
 * argument for why `IconButton` exists). Typing either as a string here would
 * either lose the markup or force a second, parallel icon API this block has
 * no business inventing — see `app-shell.tsx`'s `sidebarFooter` for the
 * identical trade.
 */
export interface FooterLink {
  /** Stable key. Not rendered. */
  id: string;
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  /** Stable key. Not rendered. */
  id: string;
  /** The column's heading, e.g. «محصول». */
  title: string;
  links: readonly FooterLink[];
}

export interface FooterStrings {
  /** Announced name of the `<footer>` landmark. Required. */
  regionLabel: string;
  /**
   * The whole copyright line, assembled by the caller — e.g.
   * «© ۱۴۰۴ شرکت تلارسا. تمام حقوق محفوظ است.».
   *
   * The caller owns the year for the same reason `booking-summary.tsx` owns
   * its dates: a year is a number, and formatting one needs a `locale` this
   * block has no other use for — nor should it need one, for a single line
   * the caller already has fully formed.
   */
  copyright: LumoNode;
}

export interface FooterProps {
  strings: FooterStrings;
  /** Link columns. Omitted or empty renders none. */
  groups?: readonly FooterLinkGroup[] | undefined;
  brand?: LumoNode;
  description?: LumoNode;
  /** A row of social icon links. See the file header. */
  social?: LumoNode;
  /** Privacy, terms — shown in the bottom bar beside the copyright line. */
  legalLinks?: readonly FooterLink[] | undefined;
  className?: string | undefined;
}

export function Footer({
  strings,
  groups,
  brand,
  description,
  social,
  legalLinks,
  className,
}: FooterProps) {
  const linkGroups = groups ?? [];
  const legal = legalLinks ?? [];
  const hasTop = brand !== undefined || description !== undefined || linkGroups.length > 0;

  return (
    <footer
      aria-label={strings.regionLabel}
      className={cn("w-full border-bs border-border px-4 pbs-12 pbe-8", className)}
    >
      <Container size="xl" padded={false} className="flex flex-col gap-10">
        {hasTop ? (
          <div className="flex flex-col gap-8 md:flex-row md:justify-between">
            {brand !== undefined || description !== undefined || social !== undefined ? (
              <div className="flex max-w-xs flex-col gap-3">
                {brand !== undefined ? <div>{brand}</div> : null}
                {description !== undefined ? (
                  <p className="text-sm text-fg-muted">{description}</p>
                ) : null}
                {social !== undefined ? (
                  <div className="flex items-center gap-2">{social}</div>
                ) : null}
              </div>
            ) : null}

            {linkGroups.length > 0 ? (
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                {linkGroups.map((group) => (
                  <div key={group.id} className="flex flex-col gap-3">
                    <h2 className="text-sm font-semibold text-fg">{group.title}</h2>
                    <ul className="flex list-none flex-col gap-2 p-0">
                      {group.links.map((link) => (
                        <li key={link.id}>
                          <Link href={link.href} variant="subtle" size="sm">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-fg-subtle">{strings.copyright}</p>
          {legal.length > 0 ? (
            <ul className="flex list-none flex-wrap items-center gap-4 p-0">
              {legal.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} variant="subtle" size="sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </footer>
  );
}
