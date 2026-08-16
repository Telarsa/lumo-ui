import { cn, type LumoNode } from "@lumo-ui/core";
import { Container, Link, Separator } from "@lumo-ui/ui";

/**
 * The band at the bottom of every page: brand, grouped navigation, legal
 * links, copyright.
 *
 * No `"use client"` — real `<a href>` navigation, nothing needs a callback.
 * No `level` prop: a footer sits at the same document depth on every route, so
 * its column headings are fixed at `<h2>`. `brand` and `social` are `LumoNode`
 * slots, not strings — a wordmark is markup and social icons carry their own labels.
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
  /** The whole copyright line, assembled by the caller — e.g. «© ۱۴۰۴ شرکت تلارسا. تمام حقوق محفوظ است.». The caller owns the year: formatting one needs a `locale` this block has no other use for. */
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
