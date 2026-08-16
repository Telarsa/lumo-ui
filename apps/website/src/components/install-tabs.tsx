"use client";

import Link from "next/link";
import type { BuiltinLocale as Locale, LumoNode } from "@lumo-ui/core";
import { Tab, TabList, TabPanel, Tabs } from "@lumo-ui/ui";

/**
 * Installation: a Command tab (package-manager sub-tabs, pnpm first) and a
 * Manual tab (dependencies, then the source to copy). Every piece of data is
 * DERIVED from `registry.json` by the server caller (`page.tsx`); nothing is
 * hardcoded here. The listings arrive RENDERED, not as strings: this module is
 * `"use client"` (because `Tabs` is), and string props would ship the source
 * in the flight payload a second time. Package-manager names are NEVER placed
 * in an aria-label ("pnpm" trips `no-latin-aria`); they stay in visible tab
 * text only. Measurements: docs/decisions/log.md.
 */

export interface InstallFile {
  /** Where a consumer's copy lands, e.g. "components/ui/button.tsx" — read
   *  verbatim from the registry item's own `files[].target`. */
  target: string;
  /** The file's listing, server rendered by `page.tsx` as a `CodePanel`. */
  panel: LumoNode;
}

export interface InstallTabsProps {
  locale: Locale;
  /** Sibling Lumo registry items this one depends on — real registry item
   *  names only; a companion `*.variants.ts` file is filtered out upstream. */
  registryComponents: string[];
  /** The file(s) to copy: the component itself, and its companion
   *  `*.variants.ts` when the registry lists one. */
  files: InstallFile[];
  /**
   * One rendered listing per package manager, keyed by the same `PMS` order the
   * pill row iterates — a `Record`, not a `Partial`, so no tab selects into nothing.
   */
  commandPanels: Record<PM, LumoNode>;
  /** The dependency-install listing, absent when the registry entry has no
   *  external dependencies — the same condition that renders `noDeps` instead. */
  depsPanel?: LumoNode | undefined;
}

import { PMS, type PM } from "@/lib/install-commands";
import { INSTALL_COPY } from "@/lib/install-copy";
import { segmentFor } from "@/lib/locale";

export function InstallTabs({
  commandPanels,
  depsPanel,
  locale,
  registryComponents,
  files,
}: InstallTabsProps) {
  const t = INSTALL_COPY[locale];

  return (
    <Tabs>
      <TabList label={t.installMethod}>
        <Tab id="command">{t.command}</Tab>
        <Tab id="manual">{t.manual}</Tab>
      </TabList>

      <TabPanel id="command" className="mt-3">
        <Tabs>
          {/*
           * The package-manager switcher is deliberately NOT a third underline bar
           * (three stacked TabLists flattened the hierarchy): a compact segmented
           * pill row, subordinate to the bar above. Same Tabs, only the clothes.
           */}
          {/*
           * `data-[orientation=horizontal]:border-b-0`, not a bare `border-be-0`:
           * tailwind-merge only removes tabListVariants' hairline when the override
           * carries the SAME variant.
           */}
          <TabList
            label={t.pmGroup}
            className="inline-flex gap-0.5 rounded-md bg-surface-sunken p-0.5 data-[orientation=horizontal]:border-b-0"
          >
            {PMS.map((pm) => (
              /*
               * `mb-0 border-b-0` removes the selected-tab underline entirely:
               * on a `rounded-sm` pill it renders as a second rounded underline.
               * Selection reads as a raised surface (`data-selected:bg-surface`) instead.
               */
              <Tab
                key={pm}
                id={pm}
                className="mb-0 rounded-sm border-b-0 px-2.5 py-1 font-mono text-xs text-fg-muted data-selected:bg-surface data-selected:text-fg data-selected:shadow-xs"
              >
                <span dir="ltr" lang="en" data-lumo-latn="">
                  {pm}
                </span>
              </Tab>
            ))}
          </TabList>
          {PMS.map((pm) => (
            <TabPanel key={pm} id={pm} className="mt-3">
              {commandPanels[pm]}
            </TabPanel>
          ))}
        </Tabs>
      </TabPanel>

      <TabPanel id="manual" className="mt-3 flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-medium text-fg">{t.depsHeading}</h3>
          <div className="mt-2">
            {depsPanel !== undefined ? (
              depsPanel
            ) : (
              <p className="text-sm text-fg-muted">{t.noDeps}</p>
            )}
          </div>
          {registryComponents.length > 0 && (
            <p className="mt-3 text-sm text-fg-muted">
              {t.alsoUses}{" "}
              {registryComponents.map((name, i) => (
                <span key={name}>
                  {i > 0 && t.listSeparator}
                  {/* The registry name itself is an English identifier
                   * ("form", "popover") even on the Persian route — a proper
                   * noun, not prose, so it is an LTR island like the file
                   * paths above rather than something to translate. */}
                  <Link
                    href={`/${segmentFor(locale)}/components/${name}/`}
                    dir="ltr"
                    lang="en"
                    data-lumo-latn=""
                    className="text-fg underline underline-offset-4 hover:text-accent"
                  >
                    {name}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-fg">{t.sourceHeading}</h3>
          <div className="mt-2 flex flex-col gap-4">
            {files.map((file) => (
              <div key={file.target}>
                <p
                  dir="ltr"
                  lang="en"
                  data-lumo-latn=""
                  className="mb-1.5 text-start font-mono text-xs text-fg-subtle"
                >
                  {file.target}
                </p>
                {file.panel}
              </div>
            ))}
          </div>
        </div>
      </TabPanel>
    </Tabs>
  );
}
