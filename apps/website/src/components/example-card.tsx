import type { LumoNode } from "@lumo-ui/core";
import { CodePanel } from "./code-panel";
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
  /**
   * The rendered example. OPTIONAL, and its absence is a specific shape: the
   * page's FIRST example is rendered once already, as the preview at the top
   * (`catalog.ts` builds the demo from `first.render`), so its card carries
   * only the source. Rendering it here too duplicated every id in it —
   * `unique-ids` measured `spy-usage` twice on the scrollspy page — and
   * omitting the card entirely left single-example components with no usage
   * listing on the page at all.
   */
  children?: LumoNode | undefined;
  /**
   * Shiki output for the example's source.
   *
   * There is no companion `code` prop any more, and that is the point: the card
   * renders the listing HERE, on the server, and `ViewCode` receives it as
   * children rather than as two strings it would carry across the client
   * boundary. The copy button reads the rendered `<pre>` (see `code-block.tsx`),
   * so the raw source is not needed by anything on this path.
   */
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
         * The same stage anatomy as PreviewToolbar's, at example scale: a
         * bordered box, the exhibit centred, intrinsic-width demos centred on
         * the inline axis while full-width ones still span the cell.
         */}
        {children !== undefined ? (
          <div className="grid min-h-44 place-items-center rounded-lg border border-border bg-bg p-6 sm:p-8">
            {/*
             * `min-w-0` for the reason `preview-toolbar.tsx` measures in full: a
             * grid item's `min-width: auto` floors it at its content's min-content
             * width, so an example whose content cannot shrink pushed this cell
             * past the canvas border rather than being held inside it. Keeping
             * the two stages identical here is deliberate — they are the same
             * anatomy at two scales, and a fix that landed on only one of them
             * would show up as examples behaving differently from the preview.
             */}
            <div className="flex w-full min-w-0 max-w-2xl flex-col items-center">{children}</div>
          </div>
        ) : null}
        <ViewCode label={viewLabel} expandedLabel={hideLabel}>
          <CodePanel html={html} label={copyLabel} copiedLabel={copiedLabel} />
        </ViewCode>
      </div>
    </section>
  );
}
