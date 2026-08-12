import type { Locale } from "@lumo-ui/core";

/**
 * Every announced string the Installation section needs, in both locales.
 *
 * ── WHY THIS IS NOT IN `install-tabs.tsx`, WHERE IT LIVED ────────────────────
 *
 * The listings on that page are now built by `page.tsx` on the server, so the
 * four copy-button names have to be readable from a SERVER module — and a
 * `"use client"` file cannot supply one. Next replaces every export of a client
 * module with a client REFERENCE when a server component imports it; the value
 * is a stand-in the browser resolves, not the object. Importing the table from
 * `install-tabs.tsx` therefore type-checked, built its first 130 pages, and then
 * failed the export with `TypeError: Cannot read properties of undefined
 * (reading 'copyCommand')` — the reference has no `"en-US"` key, and nothing
 * before the prerender says so.
 *
 * A plain module has no boundary, so both sides read the same object. The
 * strings stay in ONE table with the tab labels they sit beside, which is the
 * point: a translator adding a locale gets one compile error listing all
 * seventeen, not two files to find. Same argument as `page.tsx`'s own `COPY`,
 * and the same `Record<Locale, …>` shape CONTRIBUTING.md's "Adding a locale"
 * requires instead of a binary ternary.
 */
export const INSTALL_COPY: Record<
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
    /**
     * What goes between two names in a run-on list. Persian uses U+060C, not a
     * comma — the last string on this page that was still picked with a binary
     * conditional on `locale`, which would have silently handed a third locale
     * the Latin comma inside otherwise-correct prose.
     */
    listSeparator: string;
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
    listSeparator: "، ",
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
    listSeparator: ", ",
  },
};

