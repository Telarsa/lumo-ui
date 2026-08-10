"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { formatNumber, type Locale } from "@lumo-ui/core";
import {
  Button,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Kbd,
} from "@lumo-ui/ui";
import { matches, type SearchDoc } from "@/lib/search-index";

/**
 * The site-wide ⌘K palette: a header trigger plus the dialog it opens.
 *
 * Built entirely from `@lumo-ui/ui`'s `Command`/`CommandDialog` primitives —
 * see `command.tsx` — never `@lumo-ui/blocks`' `CommandPalette`. That block
 * exists and is dogfooded elsewhere (it IS the "command" demo on
 * `/[lang]/components/command/`), but its `groups`/`strings` API has no way
 * to override HOW an item is matched against the typed query, and the whole
 * point of this file is that the default match is wrong for Persian — see
 * `search-index.ts`'s `normalize()`. So this composes one level below the
 * block, at the same primitives the block itself is built from. Nothing here
 * is hand-rolled: the dialog, the listbox, the roving focus between the input
 * and the results, and Escape-to-close are all still React Aria's.
 *
 * ── WHY FILTERING IS DONE HERE, NOT VIA `Command`'s `filter` PROP ───────────
 *
 * `CommandProps.filter` (see command.tsx) is the sanctioned override point —
 * `(textValue, inputValue) => boolean`, called once per item on every
 * keystroke. It would be the obvious place to plug `normalize()` in. It is
 * not used here because a result count and a real empty state need to know
 * how many items matched, and `Autocomplete`'s own filtering happens inside
 * React Aria's collection machinery, which exposes no "how many survived"
 * hook back out. So the query is a controlled `Command inputValue`, the
 * matching set is computed once per render with the same `matches()` this
 * file would otherwise have handed to `filter`, and only that already-matched
 * set is rendered as children — `filter={() => true}` tells `Command` not to
 * ALSO filter with its own Intl.Collator-based default, which does not fold
 * ك/ک or ي/ی and would otherwise re-hide exactly what `normalize()` exists to
 * surface.
 *
 * ── THE GLOBAL SHORTCUT ──────────────────────────────────────────────────
 *
 * ⌘K on macOS, Ctrl+K elsewhere. Detected once after mount (no `navigator`
 * during the static export's server render), and the `keydown` listener
 * itself accepts EITHER modifier regardless of the detected platform, so a
 * wrong guess only ever affects the drawn hint, never whether the shortcut
 * works.
 */

const copy = {
  triggerLabel: { "fa-IR": "جستجو", "en-US": "Search" },
  dialogTitle: { "fa-IR": "جستجوی سراسری", "en-US": "Global search" },
  dialogDescription: {
    "fa-IR": "میان کامپوننت‌ها و بلوک‌ها جستجو کنید.",
    "en-US": "Search across components and blocks.",
  },
  closeLabel: { "fa-IR": "بستن", "en-US": "Close" },
  inputLabel: { "fa-IR": "جستجوی کامپوننت‌ها و بلوک‌ها", "en-US": "Search components and blocks" },
  inputPlaceholder: {
    "fa-IR": "نام یک کامپوننت یا بلوک را بنویسید…",
    "en-US": "Type a component or block name…",
  },
  emptyMessage: { "fa-IR": "نتیجه‌ای پیدا نشد", "en-US": "No results found" },
  componentsHeading: { "fa-IR": "کامپوننت‌ها", "en-US": "Components" },
  blocksHeading: { "fa-IR": "بلوک‌ها", "en-US": "Blocks" },
} as const satisfies Record<string, Record<Locale, string>>;

function resultCountLabel(count: number, lang: Locale): string {
  const n = formatNumber(count, lang);
  if (lang === "fa-IR") return `${n} نتیجه`;
  return count === 1 ? `${n} result` : `${n} results`;
}

export interface SiteSearchProps {
  lang: Locale;
  index: readonly SearchDoc[];
}

export function SiteSearch({ lang, index }: SiteSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Clears the query each time the palette closes, so re-opening it (via the
  // shortcut or the trigger) always starts from the full, unfiltered list
  // rather than whatever was last typed.
  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const components = useMemo(() => index.filter((d) => d.kind === "component"), [index]);
  const blocks = useMemo(() => index.filter((d) => d.kind === "block"), [index]);

  const visibleComponents = useMemo(
    () => components.filter((d) => matches(`${d.title[lang]} ${d.intro[lang]}`, query)),
    [components, query, lang],
  );
  const visibleBlocks = useMemo(
    () => blocks.filter((d) => matches(`${d.title[lang]} ${d.intro[lang]}`, query)),
    [blocks, query, lang],
  );
  const total = visibleComponents.length + visibleBlocks.length;

  return (
    <CommandDialog
      title={copy.dialogTitle[lang]}
      description={copy.dialogDescription[lang]}
      closeLabel={copy.closeLabel[lang]}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      /*
       * The trigger reads as a search FIELD, not a button — the pill shape
       * every docs site converged on, because it advertises what will open.
       * It is still a Button underneath: pressing it opens a dialog, and an
       * element that behaves as a button must be one.
       */
      trigger={
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-40 justify-between gap-2 border-border bg-surface-sunken/60 px-2.5 font-normal text-fg-subtle hover:bg-surface-sunken hover:text-fg-muted sm:w-52"
        >
          <span className="flex min-w-0 items-center gap-2">
            <SearchIcon aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate text-[0.8125rem]/5">{copy.triggerLabel[lang]}</span>
          </span>
          <Kbd keys={isMac ? ["⌘", "K"] : ["Ctrl", "K"]} size="sm" />
        </Button>
      }
    >
      {/*
       * `filter={() => true}`: the visible set below is already the result of
       * `matches()` — see the file header for why RAC's own default filter
       * must be disabled rather than left to run a second time.
       */}
      <Command inputValue={query} onInputChange={setQuery} filter={() => true}>
        <CommandInput label={copy.inputLabel[lang]} placeholder={copy.inputPlaceholder[lang]} />
        <p className="px-3 pt-2 text-xs text-fg-subtle">{resultCountLabel(total, lang)}</p>
        <CommandList
          className="mt-1"
          renderEmptyState={() => <CommandEmpty>{copy.emptyMessage[lang]}</CommandEmpty>}
        >
          {visibleComponents.length > 0 ? (
            <CommandGroup heading={copy.componentsHeading[lang]}>
              {visibleComponents.map((doc) => (
                <CommandItem
                  key={doc.id}
                  id={`component-${doc.id}`}
                  href={doc.href[lang]}
                  textValue={`${doc.title[lang]} ${doc.intro[lang]}`}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{doc.title[lang]}</span>
                    <span className="truncate text-xs text-fg-subtle">{doc.intro[lang]}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {visibleBlocks.length > 0 ? (
            <CommandGroup heading={copy.blocksHeading[lang]}>
              {visibleBlocks.map((doc) => (
                <CommandItem
                  key={doc.id}
                  id={`block-${doc.id}`}
                  href={doc.href[lang]}
                  textValue={`${doc.title[lang]} ${doc.intro[lang]}`}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{doc.title[lang]}</span>
                    <span className="truncate text-xs text-fg-subtle">{doc.intro[lang]}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
