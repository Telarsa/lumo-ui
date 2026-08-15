import { cn, type LumoNode } from "@lumo-ui/core";
import { Card, CardBody, EmptyState, Separator } from "@lumo-ui/ui";

/**
 * "There is nothing here yet", with the first steps spelled out.
 *
 * No `"use client"`: `action` is a `LumoNode` slot rather than `onAction`, so an
 * empty state can render from the server before any JavaScript arrives. The
 * hints are an `<ol>` with `list-none` because a UA marker numbers itself in
 * Latin digits with nothing to hook `formatNumber` into; order is carried by the
 * element and the marker is simply not drawn.
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
                  // A flex row with a `gap` needs no logical inset for the bullet.
                  <li key={hint.id} className="flex items-start gap-2">
                    {/*
                     * A drawn dot rather than a bullet CHARACTER: no string literal
                     * shipped, no mirroring question. `aria-hidden` — the `<ol>` conveys order.
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
