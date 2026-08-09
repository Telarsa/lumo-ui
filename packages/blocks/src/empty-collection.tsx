import { cn, type LumoNode } from "@lumo-ui/core";
import { Card, CardBody, EmptyState, Separator } from "@lumo-ui/ui";

/**
 * "There is nothing here yet", with the first steps spelled out.
 *
 * ── NO `"use client"`, AND THE `action` SLOT IS WHY ────────────────────────
 *
 * The obvious API is `{ actionLabel, onAction }`. It would make this a client
 * component — a function cannot cross the server boundary — and an empty state
 * is the thing a server `loading.tsx` or a freshly-provisioned dashboard route
 * renders first, before any JavaScript has arrived. So the action is a
 * `LumoNode` slot: the caller drops a client `<Button>` in and keeps its own
 * boundary, exactly as `empty-state.tsx` does one tier down.
 *
 * ── WHAT THIS ADDS OVER `<EmptyState>` ──────────────────────────────────────
 *
 * `EmptyState` is a primitive: icon, title, description, one action. This block
 * is the screen around it — a surface, and an optional numbered list of what to
 * do next. That list is the part worth having: an empty collection with no
 * instructions is the single most common dead end in an admin product, and the
 * instructions are prose the caller writes in their own language.
 *
 * The hints are an `<ol>` with `list-none`, not a UA-numbered list. A UA marker
 * is placed on the inline-start side and its numerals come from the list-style
 * type, not from `Intl` — so an `<ol>` on a Persian page numbers itself
 * `1. 2. 3.` in Latin digits with nothing to hook `formatNumber` into. The
 * ordering is carried by the element (which is what a screen reader reads) and
 * the marker is simply not drawn.
 */
export interface EmptyCollectionHint {
  /** Stable key. Not rendered. */
  id: string;
  /** One step, in the reader's language. */
  text: string;
}

export interface EmptyCollectionStrings {
  /** What is empty, e.g. «هنوز پرونده‌ای ندارید». */
  title: string;
  /** Why it is empty and what it will hold. */
  description?: string | undefined;
  /** Heading above the hint list, e.g. «برای شروع». */
  hintsLabel?: string | undefined;
}

export interface EmptyCollectionProps {
  strings: EmptyCollectionStrings;
  /** Steps to get started. Omitted or empty renders no list. */
  hints?: readonly EmptyCollectionHint[] | undefined;
  /** Decorative glyph. `EmptyState` renders it `aria-hidden`. */
  icon?: LumoNode;
  /** One action, usually a `<Button>`. A slot — see the file header. */
  action?: LumoNode;
  /** Heading level for the title. Default `2`. */
  level?: 2 | 3 | 4 | 5 | 6 | undefined;
  className?: string | undefined;
}

export function EmptyCollection({
  strings,
  hints,
  icon,
  action,
  level = 2,
  className,
}: EmptyCollectionProps) {
  const steps = hints ?? [];

  return (
    <Card variant="outlined" className={cn("w-full", className)}>
      <CardBody className="p-0">
        <EmptyState
          title={strings.title}
          level={level}
          {...(icon === undefined ? {} : { icon })}
          {...(strings.description === undefined
            ? {}
            : { description: strings.description })}
          {...(action === undefined ? {} : { action })}
        />

        {steps.length > 0 ? (
          <>
            <Separator />
            {/* `mx-auto` is `margin-inline: auto` in Tailwind v4 — logical, so
                the centred column is symmetric in both scripts. */}
            <div className="mx-auto flex max-w-prose flex-col gap-2 p-6">
              {strings.hintsLabel !== undefined ? (
                <p className="text-sm font-medium text-fg">{strings.hintsLabel}</p>
              ) : null}
              {/* See the file header for why the marker is suppressed. */}
              <ol className="flex list-none flex-col gap-1.5 p-0 text-sm text-fg-muted">
                {steps.map((hint) => (
                  // `ps-4` + a `::before` bullet would need a logical inset;
                  // a flex row with a `gap` needs nothing, because the layout
                  // algorithm already knows the reading direction.
                  <li key={hint.id} className="flex items-start gap-2">
                    {/*
                     * A dot, not a numeral. `aria-hidden` because the `<ol>`
                     * already conveys order to a screen reader, and a bullet
                     * read aloud is noise. `•` is direction-neutral: it has no
                     * Bidi_Mirrored pair to get wrong, unlike `›`.
                     */}
                    <span aria-hidden="true" className="mbs-1.5 size-1.5 shrink-0 rounded-full bg-fg-subtle" />
                    <span className="min-w-0">{hint.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        ) : null}
      </CardBody>
    </Card>
  );
}
