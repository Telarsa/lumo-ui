import type { ElementType } from "react";
import { cn, formatNumber, type Locale } from "@lumo-ui/core";
import {
  Badge,
  Card,
  CardBody,
  Container,
  Grid,
  Link,
  buttonVariants,
} from "@lumo-ui/ui";

/**
 * The plan comparison: name, price, what is in, one call to action each.
 *
 * No `"use client"`. A pricing page is indexed, quoted and shared; the CTA is a
 * real `<a href>` wearing `buttonVariants`, for the reasons hero.tsx sets out
 * at length.
 *
 * ── THE PRICE IS THE POINT, AND IT IS THE EASIEST THING TO GET WRONG ───────
 *
 * `plan.price` is a `number` and is never rendered. `formatNumber(price,
 * locale, priceFormat)` runs it through `fa-IR-u-ca-persian-nu-arabext`, which
 * produces Persian digits with U+066C as the thousands separator — not the
 * comma a naive `toLocaleString` gives on some runtimes (format.ts records the
 * verification). `<p>{plan.price}</p>` is TS2322 because `children` is
 * `LumoNode`, which is the whole point of rule 0: the wrong path does not
 * compile, so nobody has to notice it in review.
 *
 * `priceFormat` has NO default. A currency is a business decision, and a
 * library that guessed one would render a plausible number in the wrong unit —
 * the single most expensive kind of plausible-looking defect on this page.
 *
 * ── INCLUSION IS NOT COMMUNICATED BY A GLYPH ALONE ─────────────────────────
 *
 * A ✓/✕ column fails WCAG 1.4.1 twice over: the two marks differ mainly in
 * shape at small sizes, and neither is announced usefully. So each row carries
 * a REQUIRED, translated `strings.included` / `strings.excluded` rendered
 * `sr-only`, and the mark itself is `aria-hidden` decoration. The marks are
 * drawn as spans rather than written as characters, so this package still ships
 * no glyph of its own — and a drawn shape has no Bidi_Mirrored question to
 * answer, unlike the `›` that breadcrumbs.tsx has to reason about.
 */
export interface PricingFeature {
  /** Stable key. Not rendered. */
  id: string;
  /** What the row says, e.g. «۱۰ کاربر». */
  label: string;
  /** Default `true`. `false` renders the row struck out and announced as excluded. */
  isIncluded?: boolean | undefined;
}

export interface PricingPlan {
  /** Stable key. Not rendered. */
  id: string;
  /** The plan's name, e.g. «حرفه‌ای». */
  name: string;
  /** One line about who it is for. */
  description?: string | undefined;
  /** The figure. Never rendered raw. */
  price: number;
  /** The CTA's text, per plan — «شروع رایگان» and «تماس با فروش» differ. */
  cta: string;
  /** Where the CTA goes. */
  href: string;
  features: readonly PricingFeature[];
  /** Draws the plan as the recommended one. At most one, by convention. */
  isFeatured?: boolean | undefined;
  /** A corner marker on the featured plan, e.g. «محبوب‌ترین». */
  badge?: string | undefined;
}

export interface PricingTableStrings {
  /** Announced name of the section landmark. Required. */
  regionLabel: string;
  /** The section's own heading. */
  title?: string | undefined;
  description?: string | undefined;
  /** The billing period shown after each price, e.g. «/ ماهانه». */
  periodLabel: string;
  /** Announced prefix on an included row. REQUIRED — see the file header. */
  included: string;
  /** Announced prefix on an excluded row. REQUIRED. */
  excluded: string;
  /** Announced name of each plan's feature list, e.g. «امکانات». */
  featuresLabel: string;
}

export interface PricingTableProps {
  strings: PricingTableStrings;
  plans: readonly PricingPlan[];
  /** Formats every price. Required by design — see progress.tsx. */
  locale: Locale;
  /** `Intl.NumberFormat` options for the price. No default — see the header. */
  priceFormat?: Intl.NumberFormatOptions | undefined;
  /** Heading level for the section title. Default `2`; plans render one below. */
  level?: 2 | 3 | 4 | undefined;
  className?: string | undefined;
}

const NEXT_LEVEL = { 2: "h3", 3: "h4", 4: "h5" } as const;
const SECTION_TAG = { 2: "h2", 3: "h3", 4: "h4" } as const;

export function PricingTable({
  strings,
  plans,
  locale,
  priceFormat,
  level = 2,
  className,
}: PricingTableProps) {
  const SectionHeading: ElementType = SECTION_TAG[level];
  const PlanHeading: ElementType = NEXT_LEVEL[level];

  return (
    <section
      aria-label={strings.regionLabel}
      className={cn("w-full px-4 pbs-16 pbe-16", className)}
    >
      <Container size="xl" padded={false}>
        {strings.title !== undefined || strings.description !== undefined ? (
          <div className="mbe-10 flex max-w-prose flex-col gap-3">
            {strings.title !== undefined ? (
              <SectionHeading className="text-2xl leading-snug font-semibold text-fg">
                {strings.title}
              </SectionHeading>
            ) : null}
            {strings.description !== undefined ? (
              <p className="text-base text-fg-muted">{strings.description}</p>
            ) : null}
          </div>
        ) : null}

        <Grid cols="3" gap="md" tag="ul" className="list-none p-0">
          {plans.map((plan) => (
            <li key={plan.id} className="flex">
              <Card
                // `border-accent` on all four edges for the featured plan, not
                // an inline-start accent bar: a bar would sit on the reading
                // edge, which is where the plan name already starts, and the
                // two would compete for the same attention in Persian only.
                variant={plan.isFeatured === true ? "elevated" : "outlined"}
                className={cn("h-full w-full", plan.isFeatured === true && "border-accent")}
              >
                <CardBody className="flex h-full flex-col gap-4 text-start">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <PlanHeading className="text-base leading-snug font-semibold text-fg">
                        {plan.name}
                      </PlanHeading>
                      {plan.badge !== undefined ? (
                        <Badge tone="accent" variant="solid">
                          {plan.badge}
                        </Badge>
                      ) : null}
                    </div>
                    {plan.description !== undefined ? (
                      <p className="text-sm text-fg-muted">{plan.description}</p>
                    ) : null}
                  </div>

                  {/*
                   * `items-baseline` so the period sits on the price's
                   * baseline. `gap-1` rather than a margin: the gap is inserted
                   * on the inline axis by the layout algorithm, which already
                   * knows the direction, so the period lands after the figure
                   * in READING order in both scripts.
                   */}
                  <p className="flex flex-wrap items-baseline gap-1">
                    <span className="text-2xl leading-tight font-semibold text-fg">
                      {formatNumber(plan.price, locale, priceFormat)}
                    </span>
                    <span className="text-sm text-fg-muted">{strings.periodLabel}</span>
                  </p>

                  <ul
                    aria-label={strings.featuresLabel}
                    className="flex list-none flex-col gap-2 p-0 text-sm"
                  >
                    {plan.features.map((feature) => {
                      const isIncluded = feature.isIncluded !== false;
                      return (
                        <li key={feature.id} className="flex items-start gap-2">
                          {/*
                           * Drawn marks, `aria-hidden`. The announced version is
                           * the sr-only word beside them — see the file header
                           * for why a glyph alone is not enough.
                           */}
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mbs-1.5 size-1.5 shrink-0 rounded-full",
                              isIncluded ? "bg-positive" : "bg-fg-subtle",
                            )}
                          />
                          <span className="sr-only">
                            {isIncluded ? strings.included : strings.excluded}
                          </span>
                          <span
                            className={cn(
                              "min-w-0",
                              isIncluded ? "text-fg" : "text-fg-subtle line-through",
                            )}
                          >
                            {feature.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/*
                   * `mbs-auto` pushes the CTA to the block end, so a row of
                   * plans aligns its buttons even when the feature lists differ
                   * in length. Block axis: nothing to mirror.
                   */}
                  <Link
                    href={plan.href}
                    variant="quiet"
                    className={cn(
                      buttonVariants({
                        variant: plan.isFeatured === true ? "solid" : "outline",
                        size: "md",
                      }),
                      "mbs-auto w-full no-underline data-hovered:no-underline",
                    )}
                  >
                    {plan.cta}
                  </Link>
                </CardBody>
              </Card>
            </li>
          ))}
        </Grid>
      </Container>
    </section>
  );
}
