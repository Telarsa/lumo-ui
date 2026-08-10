import type { Locale } from "@lumo-ui/core";
import type { ExamplePart } from "@/examples/_system/types";
import { CodeBlock } from "./code-block";

/**
 * The two "what is this made of" surfaces on a component page. Both are SERVER
 * components rendering data the loader has already validated against
 * `packages/ui/src/index.ts` — by the time either mounts, every part name here
 * is a real export, so neither re-checks anything.
 *
 * `CompositionTree` shows the copyable monospace parts tree from the example
 * file's `meta.composition`, with the component module's own exported parts
 * listed under it — the derived list, straight from the barrel, so it cannot
 * name a part that does not ship.
 *
 * `PartsTable` is the hand-authored API reference: one row per part. Part
 * names are code — genuinely Latin — so they render as LTR islands under
 * `data-lumo-latn`, the same escape hatch `code-block.tsx` documents; the
 * descriptions are in the page's locale.
 */
export interface CompositionTreeProps {
  /** The pseudo-JSX tree, exactly as authored in the example file's meta. */
  composition: string;
  /** Shiki output for the same tree. */
  html: string;
  /** The copy button's name. Required. */
  copyLabel: string;
  /** The copied announcement. Required. */
  copiedLabel: string;
  /** The component module's exported parts — the loader's derived list. */
  parts: readonly string[];
  /** Heading over the derived parts list. Required when parts render. */
  partsLabel: string;
}

export function CompositionTree({
  composition,
  html,
  copyLabel,
  copiedLabel,
  parts,
  partsLabel,
}: CompositionTreeProps) {
  return (
    <div className="flex flex-col gap-4">
      <CodeBlock code={composition} html={html} label={copyLabel} copiedLabel={copiedLabel} />
      {parts.length > 0 ? (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
            {partsLabel}
          </h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {parts.map((name) => (
              <li key={name}>
                <code
                  dir="ltr"
                  lang="en"
                  data-lumo-latn=""
                  className="rounded-md border border-border bg-surface-sunken px-1.5 py-0.5 text-xs text-fg"
                >
                  {name}
                </code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export interface PartsTableProps {
  parts: readonly ExamplePart[];
  locale: Locale;
  /** Column header over the part names. Required. */
  partHeader: string;
  /** Column header over the descriptions. Required. */
  descriptionHeader: string;
}

export function PartsTable({ parts, locale, partHeader, descriptionHeader }: PartsTableProps) {
  return (
    /*
     * A static HTML table, not the library's Table: this is a document table
     * with no selection, no sorting and no focus behaviour, and renting a
     * keyboard grid for it would put tab stops where a reader expects prose.
     * Wide content scrolls inside its own container, never the page.
     */
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-sunken">
            <th scope="col" className="px-3 py-2 text-start font-medium text-fg">
              {partHeader}
            </th>
            <th scope="col" className="px-3 py-2 text-start font-medium text-fg">
              {descriptionHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => (
            <tr key={part.name} className="border-b border-border last:border-b-0">
              <th scope="row" className="whitespace-nowrap px-3 py-2 text-start font-normal">
                <code
                  dir="ltr"
                  lang="en"
                  data-lumo-latn=""
                  className="rounded-md bg-surface-sunken px-1.5 py-0.5 text-xs text-fg"
                >
                  {part.name}
                </code>
              </th>
              <td className="px-3 py-2 text-fg-muted">{part.description[locale]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
