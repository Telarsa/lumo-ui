import type { ElementType } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Card, CardBody, Container, Grid, Link } from "@lumo-ui/ui";

/**
 * The "what it does" section: a grid of short, self-contained claims.
 *
 * No `"use client"` — marketing copy belongs in the first byte. See hero.tsx.
 *
 * Grid tracks run along the INLINE axis, so the grid mirrors itself with no
 * directional work. Each feature is a real heading one level below the section's
 * `level`, so the outline cannot skip a level.
 */
export interface Feature {
  /** Stable key. Not rendered. */
  id: string;
  /** The claim, in three or four words. */
  title: string;
  /** One or two sentences supporting it. */
  description: string;
  /** A glyph. Rendered `aria-hidden`: the title already says what the icon says. */
  icon?: LumoNode;
  /** Turns the title into a link. Omit and it stays plain text. */
  href?: string | undefined;
}

export interface FeatureGridStrings {
  /** Announced name of the section landmark. Required. */
  regionLabel: string;
  /** The section's own heading. Omit to render an unheaded grid. */
  title?: string | undefined;
  /** One line under it. */
  description?: string | undefined;
}

export interface FeatureGridProps {
  strings: FeatureGridStrings;
  items: readonly Feature[];
  /** Tracks per row. Default `"3"`. */
  cols?: "2" | "3" | "4" | "auto" | undefined;
  /** Heading level for the SECTION title. Each feature renders one level below. Default `2`. */
  level?: 2 | 3 | 4 | undefined;
  className?: string | undefined;
}

const NEXT_LEVEL = { 2: "h3", 3: "h4", 4: "h5" } as const;
const SECTION_TAG = { 2: "h2", 3: "h3", 4: "h4" } as const;

export function FeatureGrid({
  strings,
  items,
  cols = "3",
  level = 2,
  className,
}: FeatureGridProps) {
  // Closed maps rather than `` `h${level}` ``: a template literal would type as
  // `string` and JSX would accept `h9`.
  const SectionHeading: ElementType = SECTION_TAG[level];
  const FeatureHeading: ElementType = NEXT_LEVEL[level];

  return (
    <section
      aria-label={strings.regionLabel}
      className={cn("w-full px-4 pbs-16 pbe-16", className)}
    >
      <Container size="xl" padded={false}>
        {strings.title !== undefined || strings.description !== undefined ? (
          // `mbe-*` and `mx-auto` are logical, so the intro column is symmetric in both scripts.
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

        <Grid cols={cols} gap="md" tag="ul" className="list-none p-0">
          {items.map((feature) => (
            <li key={feature.id} className="flex">
              <Card variant="plain" className="h-full w-full bg-surface-sunken">
                <CardBody className="flex flex-col gap-2 text-start">
                  {feature.icon !== undefined ? (
                    <span
                      aria-hidden="true"
                      className="mbe-1 flex size-10 items-center justify-center rounded-md bg-surface text-accent [&_svg]:size-5"
                    >
                      {feature.icon}
                    </span>
                  ) : null}

                  <FeatureHeading className="text-base leading-snug font-semibold text-fg">
                    {feature.href === undefined ? (
                      feature.title
                    ) : (
                      <Link href={feature.href} variant="quiet">
                        {feature.title}
                      </Link>
                    )}
                  </FeatureHeading>

                  <p className="text-sm text-fg-muted">{feature.description}</p>
                </CardBody>
              </Card>
            </li>
          ))}
        </Grid>
      </Container>
    </section>
  );
}
