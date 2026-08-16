import type { BuiltinLocale as Locale } from "@lumo-ui/core";

/**
 * Every announced string the Installation section needs, in both locales.
 *
 * Lives in a plain module (not `install-tabs.tsx`) because `page.tsx` builds the listings on
 * the server, and a `"use client"` module's exports reach a server component only as client
 * references — the export failed with `Cannot read properties of undefined`. One
 * `Record<Locale, …>` table, so a new locale is one compile error listing every string.
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
     * What goes between two names in a run-on list. Persian uses U+060C, not a comma —
     * a binary conditional on `locale` would silently hand a third locale the Latin comma.
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

