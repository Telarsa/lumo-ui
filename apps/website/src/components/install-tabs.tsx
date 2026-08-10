"use client";

import Link from "next/link";
import type { Locale } from "@lumo-ui/core";
import { Tab, TabList, TabPanel, Tabs } from "@lumo-ui/ui";
import { CodeBlock } from "./code-block";

/**
 * Installation: a Command tab (package-manager sub-tabs, pnpm first) and a
 * Manual tab (dependencies to install, then the source to copy).
 *
 * Every piece of data here — the registry name, `dependencies`,
 * `registryComponents`, `files` — is DERIVED from `registry.json` by the
 * caller (`page.tsx`, a server component that can read the filesystem at
 * build time). This component never hardcodes a package name or a file path;
 * it only lays out whatever the registry says. See `page.tsx`'s
 * `resolveRegistryItem` for how a page's slug is matched to a registry item —
 * most match by name, but `icon-button` shares `button.tsx` with `button` and
 * is matched by content rather than by a hardcoded exception.
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
  code: string;
  /** Build-time shiki output for `code`. See `commandHtml` on the props. */
  html?: string | undefined;
}

export interface InstallTabsProps {
  locale: Locale;
  /** The registry item name actually resolved for this page, e.g. "button". */
  registryName: string;
  /** External npm packages the registry entry lists in `dependencies`. */
  dependencies: string[];
  /** Sibling Lumo registry items this one depends on — real registry item
   *  names only; a companion `*.variants.ts` file is filtered out upstream. */
  registryComponents: string[];
  /** The file(s) to copy: the component itself, and its companion
   *  `*.variants.ts` when the registry lists one. */
  files: InstallFile[];
  /** Shiki output per command/file, produced by the SERVER page via
   *  `lib/highlight.ts` — this client module must not import the highlighter
   *  (see code-block.tsx's `html` prop for the whole argument). */
  commandHtml?: Partial<Record<PM, string>> | undefined;
  depsHtml?: string | undefined;
}

import { CLI_COMMAND, PMS, depsCommand, type PM } from "@/lib/install-commands";

const COPY: Record<
  Locale,
  {
    installMethod: string;
    command: string;
    manual: string;
    pmGroup: string;
    copyCommand: string;
    copyCommandDone: string;
    depsHeading: string;
    noDeps: string;
    copyDeps: string;
    copyDepsDone: string;
    alsoUses: string;
    sourceHeading: string;
    copyMain: string;
    copyMainDone: string;
    copyCompanion: string;
    copyCompanionDone: string;
  }
> = {
  "fa-IR": {
    installMethod: "روش نصب",
    command: "دستور",
    manual: "دستی",
    pmGroup: "مدیر بستهٔ ترجیحی",
    copyCommand: "کپی دستور نصب",
    copyCommandDone: "دستور نصب در کلیپ‌بورد کپی شد",
    depsHeading: "نصب وابستگی‌ها",
    noDeps: "این کامپوننت به بستهٔ بیرونی نیاز ندارد.",
    copyDeps: "کپی دستور وابستگی‌ها",
    copyDepsDone: "دستور وابستگی‌ها کپی شد",
    alsoUses: "همچنین به این کامپوننت‌های لومو نیاز دارد:",
    sourceHeading: "کد را کپی و در پروژه جای‌گذاری کنید",
    copyMain: "کپی کد اصلی",
    copyMainDone: "کد اصلی کپی شد",
    copyCompanion: "کپی کد کمکی",
    copyCompanionDone: "کد کمکی کپی شد",
  },
  "en-US": {
    installMethod: "Install method",
    command: "Command",
    manual: "Manual",
    pmGroup: "Package manager",
    copyCommand: "Copy the install command",
    copyCommandDone: "Install command copied to clipboard",
    depsHeading: "Install the dependencies",
    noDeps: "This component has no external dependencies.",
    copyDeps: "Copy the dependency command",
    copyDepsDone: "Dependency command copied",
    alsoUses: "Also requires these Lumo components:",
    sourceHeading: "Copy and paste the code into your project",
    copyMain: "Copy the main file",
    copyMainDone: "Main file copied",
    copyCompanion: "Copy the companion file",
    copyCompanionDone: "Companion file copied",
  },
};

export function InstallTabs({
  commandHtml,
  depsHtml,
  locale,
  registryName,
  dependencies,
  registryComponents,
  files,
}: InstallTabsProps) {
  const t = COPY[locale];

  return (
    <Tabs>
      <TabList label={t.installMethod}>
        <Tab id="command">{t.command}</Tab>
        <Tab id="manual">{t.manual}</Tab>
      </TabList>

      <TabPanel id="command" className="mt-3">
        <Tabs>
          <TabList label={t.pmGroup}>
            {PMS.map((pm) => (
              <Tab key={pm} id={pm}>
                <span dir="ltr" lang="en" data-lumo-latn="">
                  {pm}
                </span>
              </Tab>
            ))}
          </TabList>
          {PMS.map((pm) => (
            <TabPanel key={pm} id={pm} className="mt-3">
              <CodeBlock
                code={CLI_COMMAND[pm](registryName)}
                html={commandHtml?.[pm]}
                label={t.copyCommand}
                copiedLabel={t.copyCommandDone}
              />
            </TabPanel>
          ))}
        </Tabs>
      </TabPanel>

      <TabPanel id="manual" className="mt-3 flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-medium text-fg">{t.depsHeading}</h3>
          <div className="mt-2">
            {dependencies.length > 0 ? (
              <CodeBlock
                code={depsCommand(dependencies)}
                html={depsHtml}
                label={t.copyDeps}
                copiedLabel={t.copyDepsDone}
              />
            ) : (
              <p className="text-sm text-fg-muted">{t.noDeps}</p>
            )}
          </div>
          {registryComponents.length > 0 && (
            <p className="mt-3 text-sm text-fg-muted">
              {t.alsoUses}{" "}
              {registryComponents.map((name, i) => (
                <span key={name}>
                  {i > 0 && (locale === "fa-IR" ? "، " : ", ")}
                  {/* The registry name itself is an English identifier
                   * ("form", "popover") even on the Persian route — a proper
                   * noun, not prose, so it is an LTR island like the file
                   * paths above rather than something to translate. */}
                  <Link
                    href={`/${locale}/components/${name}/`}
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
            {files.map((file, i) => (
              <div key={file.target}>
                <p
                  dir="ltr"
                  lang="en"
                  data-lumo-latn=""
                  className="mb-1.5 text-start font-mono text-xs text-fg-subtle"
                >
                  {file.target}
                </p>
                <CodeBlock
                  code={file.code}
                  html={file.html}
                  label={i === 0 ? t.copyMain : t.copyCompanion}
                  copiedLabel={i === 0 ? t.copyMainDone : t.copyCompanionDone}
                />
              </div>
            ))}
          </div>
        </div>
      </TabPanel>
    </Tabs>
  );
}
