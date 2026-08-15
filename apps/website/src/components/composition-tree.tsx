import type { Locale } from "@lumo-ui/core";
import type { ExamplePart } from "@/examples/_system/types";
import type { GeneratedApiGroup } from "@/lib/examples-loader";
import { CodePanel } from "./code-panel";

/**
 * The three "what is this made of" surfaces on a component page. All are SERVER
 * components rendering data the loader has already validated against the
 * `@lumo-ui/ui` barrel, so nothing here re-checks anything. Part and prop names
 * are code (Latin), rendered as LTR islands under `data-lumo-latn`.
 */
export interface CompositionTreeProps {
  /** Shiki output for the pseudo-JSX tree from the example file's meta. The copy button reads the rendered `<pre>`, so the raw string is not a prop. */
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
     * A static HTML table, not the library's Table: no selection, sorting or
     * focus behaviour, so a keyboard grid would misplace tab stops.
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
 * a large compound component stays navigable.
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
          {/* A wide props table scrolls sideways; the scroller must be reachable by keyboard (axe scrollable-region-focusable). */}
          <div tabIndex={0} className="overflow-x-auto border-t border-border">
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
