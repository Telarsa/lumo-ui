"use client";

import Link from "next/link";
import type { Locale, LumoNode } from "@lumo-ui/core";
import { Tab, TabList, TabPanel, Tabs } from "@lumo-ui/ui";

/**
 * Installation: a Command tab (package-manager sub-tabs, pnpm first) and a
 * Manual tab (dependencies to install, then the source to copy).
 *
 * Every piece of data here — `registryComponents`, `files`, and the commands
 * inside `commandPanels` — is DERIVED from `registry.json` by the caller
 * (`page.tsx`, a server component that can read the filesystem at build time).
 * This component never hardcodes a package name or a file path; it only lays
 * out whatever the registry says. See `page.tsx`'s
 * `resolveRegistryItem` for how a page's slug is matched to a registry item —
 * most match by name, but `icon-button` shares `button.tsx` with `button` and
 * is matched by content rather than by a hardcoded exception.
 *
 * ── THE LISTINGS ARRIVE RENDERED, NOT AS STRINGS ────────────────────────────
 *
 * This module is `"use client"` because `Tabs` is, and every prop of a client
 * component is serialized into the RSC flight payload. It used to take the
 * command text, the dependency command and each file's full source as strings
 * plus a parallel bag of shiki HTML, and render `CodeBlock` itself — so the
 * component source shipped in the payload a second time even though React
 * Aria's `Tabs` never mounts the Manual panel that would display it. Measured
 * at 3f46039 on `fa/components/event-calendar`: a 336,371-char shiki row and a
 * 58,715-char source row, neither of which was ever in the DOM.
 *
 * The panels are now built by `page.tsx` (a server component) and handed over
 * already rendered. This file lays out tabs and nothing else; it holds no code
 * text, and the copy buttons inside those panels read the DOM.
 *
 * PACKAGE-MANAGER NAMES ARE NEVER PLACED IN AN ARIA-LABEL.
 * "pnpm" and "npm" both satisfy `/[A-Za-z]{3,}/`, the exact pattern
 * `no-latin-aria` (packages/gate/src/rules.ts) rejects when it appears in a
 * spoken attribute on a Persian page. Every copy button below carries a
 * locale-only accessible name ("Copy the install command", never "Copy the
 * pnpm command") for that reason — the manager name stays in the VISIBLE tab
 * text, which the gate does not restrict, and never in a `label`/`aria-label`.
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
   * pill row iterates — a `Record`, not a `Partial`, because a missing panel is
   * a tab that selects into nothing and nobody would notice until they tried it.
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
           * The package-manager switcher is deliberately NOT a third underline
           * bar. The design review measured three byte-identical TabLists
           * stacked ~12px apart on the built page — Preview|Code, then
           * Command|Manual, then this — which flattens the hierarchy into
           * noise. shadcn renders the PM switch as compact chrome attached to
           * the code block, and that is what these class overrides do: a small
           * segmented pill row, subordinate to the underline bar above it.
           * Same Tabs component, same keyboard behaviour — only the clothes.
           */}
          {/*
           * `data-[orientation=horizontal]:border-b-0`, not a bare `border-be-0`:
           * tabListVariants draws its hairline as `data-[orientation=horizontal]:
           * border-b`, and a bare width-0 utility loses to it on specificity —
           * tailwind-merge only removes the base class when the override carries
           * the SAME variant. Measured on the built page: the pill row shipped
           * with the underline bar's hairline still under it.
           */}
          <TabList
            label={t.pmGroup}
            className="inline-flex gap-0.5 rounded-md bg-surface-sunken p-0.5 data-[orientation=horizontal]:border-b-0"
          >
            {PMS.map((pm) => (
              /*
               * `mb-0 border-b-0` removes the selected-tab indicator entirely:
               * tabVariants marks selection with `border-b-2 -mb-px
               * data-selected:border-accent`, and on a `rounded-sm` pill that
               * 2px rule renders as a second, rounded underline below the
               * selected pill — the artefact the review flagged. The indicator
               * is an underline's clothes; a segmented pill shows selection as
               * a raised surface (`data-selected:bg-surface` + shadow), so the
               * border width and the `-mb-px` that compensated for it both go.
               * (An earlier `after:hidden` here guessed at a pseudo-element
               * that tabs.tsx never renders — the indicator is a real border.)
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
