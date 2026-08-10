import type { LumoNode } from "@lumo-ui/core";
import { ViewCode } from "./view-code";

/**
 * One worked example on a component page: a titled, anchored section holding a
 * preview stage with the collapsed source under it (see `view-code.tsx`).
 *
 * A SERVER component. The example itself was rendered by the page (it arrives
 * as `children`) and the source was highlighted by the page — this file only
 * lays the card out, so the whole example system stays prerenderable.
 *
 * The stage deliberately does NOT carry `[data-lumo-demo-root]`. That marker
 * is the evidence injector's contract with `preview-toolbar.tsx` — it names
 * THE demo the accessibility-evidence table is computed from, and the injector
 * takes the first match in the document. These cards sit after the preview
 * section; giving them the same marker would be a second claimant to a
 * single-slot contract.
 *
 * `title`/`description` arrive already resolved to the page's locale, and the
 * four announced strings for the code area are REQUIRED here so a caller
 * cannot mount a card whose controls have no names.
 */
export interface ExampleCardProps {
  /** The section anchor, e.g. "example-sizes" — also what the rail links to. */
  id: string;
  title: string;
  description?: string | undefined;
  /** The rendered example. */
  children: LumoNode;
  /** The example's exact source, as sliced by the loader. */
  code: string;
  /** Shiki output for the same source. */
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
  code,
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
         * The same stage anatomy as PreviewToolbar's, at example scale: a
         * bordered box, the exhibit centred, intrinsic-width demos centred on
         * the inline axis while full-width ones still span the cell.
         */}
        <div className="grid min-h-44 place-items-center rounded-lg border border-border bg-bg p-6 sm:p-8">
          <div className="flex w-full max-w-2xl flex-col items-center">{children}</div>
        </div>
        <ViewCode
          code={code}
          html={html}
          label={viewLabel}
          expandedLabel={hideLabel}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
        />
      </div>
    </section>
  );
}
