import type { ElementType } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import {
  Container,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTrigger,
} from "@lumo-ui/ui";

/**
 * Questions and answers, collapsed.
 *
 * No `"use client"`: `Disclosure` is a client component, but this block adds no
 * state of its own, so it stays a server component that RENDERS client
 * components and the answers land in the served HTML. It composes rather than
 * hand-rolls the trigger (the chevron half-turn is direction-safe), and each
 * question is a real heading one level below `level`, so the outline never skips.
 */
export interface FaqItem {
  /** Stable key. Also the group's `expandedKeys` identity, so it must be unique across the list. */
  id: string;
  /** The question. */
  question: string;
  /** The answer. `LumoNode` so it can carry links and lists but still cannot be a bare number. */
  answer: LumoNode;
}

export interface FaqStrings {
  /** Announced name of the section landmark. Required. */
  regionLabel: string;
  /** The section's own heading. */
  title?: string | undefined;
  description?: string | undefined;
}

export interface FaqProps {
  strings: FaqStrings;
  items: readonly FaqItem[];
  /** Whether more than one answer can be open at a time. Default `false` — an accordion. */
  allowsMultipleExpanded?: boolean | undefined;
  /** Heading level for the section title. Default `2`; questions render one below. */
  level?: 2 | 3 | 4 | undefined;
  className?: string | undefined;
}

const SECTION_TAG = { 2: "h2", 3: "h3", 4: "h4" } as const;
/** The numeric level RAC's `<Heading>` receives for each question. */
const QUESTION_LEVEL = { 2: 3, 3: 4, 4: 5 } as const;

export function Faq({
  strings,
  items,
  allowsMultipleExpanded = false,
  level = 2,
  className,
}: FaqProps) {
  const SectionHeading: ElementType = SECTION_TAG[level];

  return (
    <section
      aria-label={strings.regionLabel}
      className={cn("w-full px-4 pbs-16 pbe-16", className)}
    >
      {/* `size="md"` caps the measure: an FAQ is prose, and prose set across a
          1280px container is unreadable in any script. `mx-auto` inside
          Container is `margin-inline: auto` — logical in Tailwind v4. */}
      <Container size="md" padded={false}>
        {strings.title !== undefined || strings.description !== undefined ? (
          <div className="mbe-8 flex flex-col gap-3">
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

        <DisclosureGroup allowsMultipleExpanded={allowsMultipleExpanded}>
          {items.map((item) => (
            <Disclosure key={item.id} id={item.id}>
              <DisclosureTrigger level={QUESTION_LEVEL[level]}>
                {item.question}
              </DisclosureTrigger>
              <DisclosurePanel>{item.answer}</DisclosurePanel>
            </Disclosure>
          ))}
        </DisclosureGroup>
      </Container>
    </section>
  );
}
