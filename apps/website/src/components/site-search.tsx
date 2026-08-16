"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import type { Locale } from "@lumo-ui/core";
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
 * The site-wide ⌘K palette: a header trigger plus the dialog it opens. Built
 * from `@lumo-ui/ui`'s `Command`/`CommandDialog` primitives, not the
 * `CommandPalette` block, because the block cannot override HOW an item is
 * matched and the default match is wrong for Persian (see `search-index.ts`'s
 * `normalize()`). Filtering happens HERE (`matches()`), not via `filter`, so
 * the empty state knows the count; `filter={() => true}` stops the engine's
 * collator-based default re-hiding what `normalize()` surfaces. Shortcut: ⌘K
 * or Ctrl+K — the listener accepts either modifier; only the drawn hint
 * depends on the platform guess.
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
  docsHeading: { "fa-IR": "مستندات", "en-US": "Docs" },
} as const satisfies Record<string, Record<Locale, string>>;

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

  // Clears the query each time the palette closes, so re-opening starts from
  // the full list.
  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const docsPages = useMemo(() => index.filter((d) => d.kind === "doc"), [index]);
  const components = useMemo(() => index.filter((d) => d.kind === "component"), [index]);
  const blocks = useMemo(() => index.filter((d) => d.kind === "block"), [index]);

  const visibleDocs = useMemo(
    () => docsPages.filter((d) => matches(`${d.title[lang]} ${d.intro[lang]}`, query)),
    [docsPages, query, lang],
  );
  const visibleComponents = useMemo(
    () => components.filter((d) => matches(`${d.title[lang]} ${d.intro[lang]}`, query)),
    [components, query, lang],
  );
  const visibleBlocks = useMemo(
    () => blocks.filter((d) => matches(`${d.title[lang]} ${d.intro[lang]}`, query)),
    [blocks, query, lang],
  );

  /*
   * `items` carries the ALREADY-FILTERED union: `CommandEmpty` mounts exactly
   * when `filteredItems.length === 0`, so this array is what makes "nothing
   * matched" an announced live region.
   */
  const visibleAll = useMemo(
    () => [...visibleDocs, ...visibleComponents, ...visibleBlocks],
    [visibleDocs, visibleComponents, visibleBlocks],
  );

  return (
    <CommandDialog
      title={copy.dialogTitle[lang]}
      description={copy.dialogDescription[lang]}
      closeLabel={copy.closeLabel[lang]}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      // No drawn ✕ (cmdk chrome), so the backdrop must close the palette too.
      isDismissable
      // The palette reads better one step narrower than the lg dialog it
      // rides in; `cn` in DialogModal lets this override win.
      className="max-w-xl"
      /*
       * The trigger reads as a search FIELD (the pill shape) but is a Button
       * underneath. Below `lg` the label and ⌘K hint are dropped and it becomes
       * a 32px square like its neighbours (the pill was the header's sideways
       * scroll on phones); it stays in the tab order. `aria-label` carries the
       * name because it must survive `hidden` on the drawn text.
       */
      trigger={
        <Button
          variant="outline"
          size="sm"
          aria-label={copy.triggerLabel[lang]}
          className="size-8 shrink-0 justify-center gap-2 border-border bg-surface-sunken/60 px-0 font-normal text-fg-subtle hover:bg-surface-sunken hover:text-fg-muted lg:h-8 lg:w-52 lg:justify-between lg:px-2.5"
        >
          <span className="flex min-w-0 items-center gap-2">
            <SearchIcon aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="hidden truncate text-[0.8125rem]/5 lg:inline">
              {copy.triggerLabel[lang]}
            </span>
          </span>
          <Kbd keys={isMac ? ["⌘", "K"] : ["Ctrl", "K"]} size="sm" className="hidden lg:inline-flex" />
        </Button>
      }
    >
      {/*
       * `filter={() => true}`: the visible set is already the result of `matches()`.
       */}
      <Command items={visibleAll} inputValue={query} onInputChange={setQuery} filter={() => true}>
        <CommandInput label={copy.inputLabel[lang]} placeholder={copy.inputPlaceholder[lang]} />
        {/*
         * No result count: the EMPTY state is the only "nothing matched" signal, so
         * it must be announced (`role="status"`). Rows are single-line; the intro
         * still participates in MATCHING, it is just not drawn.
         */}
        <CommandList label={copy.inputLabel[lang]}>
          {visibleDocs.length > 0 ? (
            <CommandGroup heading={copy.docsHeading[lang]}>
              {visibleDocs.map((doc) => (
                <CommandItem
                  key={doc.id}
                  id={`doc-${doc.id}`}
                  href={doc.href[lang]}
                >
                  <span className="min-w-0 flex-1 truncate">{doc.title[lang]}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {visibleComponents.length > 0 ? (
            <CommandGroup heading={copy.componentsHeading[lang]}>
              {visibleComponents.map((doc) => (
                <CommandItem
                  key={doc.id}
                  id={`component-${doc.id}`}
                  href={doc.href[lang]}
                >
                  <span className="min-w-0 flex-1 truncate">{doc.title[lang]}</span>
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
                >
                  <span className="min-w-0 flex-1 truncate">{doc.title[lang]}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
        {/*
         * A sibling of the list, not a `renderEmptyState` prop: `Autocomplete.Empty`
         * IS the live region and mounts only when the filtered set is empty.
          */}
        <CommandEmpty>{copy.emptyMessage[lang]}</CommandEmpty>
      </Command>
    </CommandDialog>
  );
}
