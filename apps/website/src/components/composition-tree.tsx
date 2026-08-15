import type { Locale } from "@lumo-ui/core";
import type { ExamplePart } from "@/examples/_system/types";
import type { GeneratedApiGroup } from "@/lib/examples-loader";
import { CodePanel } from "./code-panel";

/**
 * The three "what is this made of" surfaces on a component page. All are SERVER
 * components rendering data the loader has already validated against
 * `packages/ui/src/index.ts` — by the time either mounts, every part name here
 * is a real export, so neither re-checks anything.
 *
 * `CompositionTree` shows the copyable monospace parts tree from the example
 * file's `meta.composition`, with the component module's own exported parts
 * listed under it — the derived list, straight from the barrel, so it cannot
 * name a part that does not ship.
 *
 * `PropsTable` is generated from the exported TypeScript props; `PartsTable`
 * supplies the hand-authored intent for each composable part. Part and prop
 * names are code — genuinely Latin — so they render as LTR islands under
 * `data-lumo-latn`, the same escape hatch `code-panel.tsx` documents; the
 * descriptions are in the page's locale.
 */
export interface CompositionTreeProps {
  /**
   * Shiki output for the pseudo-JSX tree authored in the example file's meta.
   *
   * The raw `composition` string is no longer a prop. It existed only to feed
   * the copy button, which now reads the rendered `<pre>` — and since this is a
   * server component the panel it renders never crosses a client boundary, so
   * the tree ships once instead of twice. See `code-panel.tsx`.
   */
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
  html,
  copyLabel,
  copiedLabel,
  parts,
  partsLabel,
}: CompositionTreeProps) {
  return (
    <div className="flex flex-col gap-4">
      <CodePanel html={html} label={copyLabel} copiedLabel={copiedLabel} />
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

export interface PropsTableProps {
  groups: readonly GeneratedApiGroup[];
  propHeader: string;
  typeHeader: string;
  descriptionHeader: string;
  requirementHeader: string;
  requiredLabel: string;
  optionalLabel: string;
}

/**
 * Checker-generated public props. Each exported props type is a disclosure so
 * a large compound component remains navigable rather than becoming one
 * several-hundred-row table. Names and types are code/LTR islands; every piece
 * of prose comes from required localized page copy.
 */
export function PropsTable({
  groups,
  propHeader,
  typeHeader,
  descriptionHeader,
  requirementHeader,
  requiredLabel,
  optionalLabel,
}: PropsTableProps) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, index) => (
        <details
          key={group.name}
          open={index === 0}
          className="rounded-lg border border-border bg-surface"
        >
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-fg">
            <code dir="ltr" lang="en" data-lumo-latn="">
              {group.name}
            </code>
          </summary>
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken">
                  <th scope="col" className="px-3 py-2 text-start font-medium text-fg">
                    {propHeader}
                  </th>
                  <th scope="col" className="px-3 py-2 text-start font-medium text-fg">
                    {typeHeader}
                  </th>
                  <th scope="col" className="px-3 py-2 text-start font-medium text-fg">
                    {descriptionHeader}
                  </th>
                  <th scope="col" className="px-3 py-2 text-start font-medium text-fg">
                    {requirementHeader}
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.props.map((prop) => (
                  <tr key={prop.name} className="border-b border-border last:border-b-0">
                    <th scope="row" className="whitespace-nowrap px-3 py-2 text-start font-normal">
                      <code dir="ltr" lang="en" data-lumo-latn="" className="text-xs text-fg">
                        {prop.name}
                      </code>
                    </th>
                    <td className="max-w-xl px-3 py-2 text-fg-muted">
                      <code
                        dir="ltr"
                        lang="en"
                        data-lumo-latn=""
                        className="break-words text-xs text-fg-muted"
                      >
                        {prop.type}
                      </code>
                    </td>
                    <td
                      dir="ltr"
                      lang="en"
                      data-lumo-latn=""
                      className="min-w-64 max-w-2xl px-3 py-2 text-start text-fg-muted"
                    >
                      {prop.description}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-fg-muted">
                      {prop.required ? requiredLabel : optionalLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ))}
    </div>
  );
}
