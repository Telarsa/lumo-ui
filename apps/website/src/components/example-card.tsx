import type { LumoNode } from "@lumo-ui/core";
import { CodePanel } from "./code-panel";
import { ViewCode } from "./view-code";

/**
 * One worked example on a component page: a titled, anchored section with a
 * preview stage and the collapsed source under it. A SERVER component: the
 * example arrives as `children`, the source pre-highlighted. The stage does
 * NOT carry `[data-lumo-demo-root]` — that single-slot evidence marker belongs
 * to `preview-toolbar.tsx`'s demo. The four announced strings are REQUIRED.
 */
export interface ExampleCardProps {
  /** The section anchor, e.g. "example-sizes" — also what the rail links to. */
  id: string;
  title: string;
  /**
   * A node, not a string: GENERATED copy (the Mobile side's demo descriptions)
   * arrives as plain text and has its Latin identifiers islanded on the way in —
   * see `generated-text.tsx`. Hand-authored copy still passes a plain string.
   */
  description?: LumoNode | undefined;
  /** The rendered example. OPTIONAL: the page's FIRST example is already the
   *  top preview, so its card carries only the source (no duplicated ids). */
  children?: LumoNode | undefined;
  /** Shiki output for the example's source. No `code` prop: the listing is
   *  rendered HERE on the server and the copy button reads the rendered `<pre>`. */
  html: string;
  viewLabel: string;
  hideLabel: string;
  copyLabel: string;
  copiedLabel: string;
}

export function ExampleCard({
  id,
  title,
  description,
  children,
  html,
  viewLabel,
  hideLabel,
  copyLabel,
  copiedLabel,
}: ExampleCardProps) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">{title}</h2>
      {description !== undefined ? (
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">{description}</p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2">
        {/*
         * The same stage anatomy as PreviewToolbar's, at example scale.
         */}
        {children !== undefined ? (
          <div tabIndex={0}
        className="grid overflow-x-auto min-h-44 items-center rounded-lg border border-border bg-bg p-6 sm:p-8">
            {/*
             * `min-w-0`: a grid item's `min-width: auto` floors it at min-content width,
             * pushing the cell past the canvas. Kept identical to `preview-toolbar.tsx`.
             */}
            <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col items-center">{children}</div>
          </div>
        ) : null}
        <ViewCode label={viewLabel} expandedLabel={hideLabel}>
          <CodePanel html={html} label={copyLabel} copiedLabel={copiedLabel} />
        </ViewCode>
      </div>
    </section>
  );
}
