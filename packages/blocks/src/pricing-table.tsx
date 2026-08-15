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
 * No `"use client"`: a pricing page is indexed and shared; the CTA is a real
 * `<a href>` wearing `buttonVariants` (see hero.tsx). `plan.price` is a `number`
 * never rendered raw, and `priceFormat` has NO default — a currency is a
 * business decision. Inclusion is never a glyph alone (WCAG 1.4.1): each row
 * carries a REQUIRED sr-only `included`/`excluded` word and a drawn, `aria-hidden` mark.
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
                // A full `border-accent` outline for the featured plan, not an
                // inline-start bar that would compete with the plan name.
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
                   * `items-baseline` + `gap-1`: the period lands after the figure
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
                           * Drawn marks, `aria-hidden`; the sr-only word beside them is what is announced.
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
                   * `mbs-auto` aligns the CTAs across a row of plans. Block axis: nothing to mirror.
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
