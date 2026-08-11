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
 * ── NO `"use client"`, WHICH IS NOT OBVIOUS HERE ───────────────────────────
 *
 * `Disclosure` and its friends ARE client components — they carry `"use client"`
 * because `@base-ui/react`'s Accordion holds expansion state. (It was
 * `react-aria-components` marking itself `client-only` before the migration;
 * the conclusion is the same and the reason is now Lumo's own directive.) But
 * this block adds no callback and no state of its own, so it stays a server
 * component that RENDERS client components, and
 * the answers arrive in the served HTML where a crawler can index them. That
 * distinction is the whole reason rule 1 says "only where genuinely needed":
 * `"use client"` marks a boundary, not a dependency, and putting it on a
 * wrapper that needs no interactivity drags the wrapper's whole subtree across.
 *
 * ── THE CHEVRON ROTATES 180°, WHICH `Disclosure` ALREADY HANDLES ───────────
 *
 * Worth stating because it is the reason this block composes rather than
 * hand-rolls: the usual accordion affordance is a chevron pointing along the
 * INLINE axis that turns a quarter-turn on expand, and that is a direction bug
 * in two places at once — the resting glyph points at a physical side, and
 * `rotate-90` turns the same way regardless of script. `disclosure.tsx` uses a
 * half-turn on a block-axis glyph, which is its own mirror image. A block that
 * re-implemented the trigger would re-introduce exactly that defect.
 *
 * ── EACH QUESTION IS A REAL HEADING ────────────────────────────────────────
 *
 * `DisclosureTrigger` renders `<Heading><Button slot="trigger">`, and the
 * heading is what puts each question in the document outline so a screen-reader
 * user can jump between them. `level` here is the SECTION's heading level; each
 * question renders one below it, so the outline cannot skip a level.
 */
export interface FaqItem {
  /**
   * Stable key. Also RAC's `expandedKeys` identity inside the group, so it must
   * be unique across the list.
   */
  id: string;
  /** The question. */
  question: string;
  /**
   * The answer. `LumoNode` so it can carry links and lists — and `LumoNode`
   * rather than `ReactNode` so it still cannot be a bare number.
   */
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
  /**
   * Whether more than one answer can be open at a time. Default `false` —
   * an accordion, which keeps the page height predictable.
   */
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
