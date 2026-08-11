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

  // Clears the query each time the palette closes, so re-opening it (via the
  // shortcut or the trigger) always starts from the full, unfiltered list
  // rather than whatever was last typed.
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
   * `items` for Base UI's Autocomplete root, and it carries the ALREADY-FILTERED
   * union rather than the whole index. This page filters itself — `matches()`
   * folds ZWNJ, tashkeel and the Arabic/Persian letter pairs, which no collator
   * setting does — so the engine's own filter is switched off with
   * `filter={() => true}` and `items` is handed the result.
   *
   * It is not bookkeeping. `CommandEmpty` mounts exactly when
   * `filteredItems.length === 0`, so this array is what makes "nothing matched"
   * an announced live region rather than a div nobody hears.
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
      // cmdk chrome: no drawn ✕ (see command.tsx), so the backdrop must close
      // the palette too — Esc and a press outside are the two exits a pointer
      // user reaches for.
      isDismissable
      // The palette reads better one step narrower than the lg dialog it
      // rides in; `cn` in DialogModal lets this override win.
      className="max-w-xl"
      /*
       * The trigger reads as a search FIELD, not a button — the pill shape
       * every docs site converged on, because it advertises what will open.
       * It is still a Button underneath: pressing it opens a dialog, and an
       * element that behaves as a button must be one.
       *
       * ── WHY THE PILL COLLAPSES TO AN ICON BELOW `lg` ─────────────────────
       *
       * The pill is 160–208px of a header whose contents measured a 580px
       * (fa) / 594px (en) min-content floor against a 375px viewport — that
       * floor was the site's sideways scroll on EVERY page (see site-shell).
       * Below `lg` the drawn label and the ⌘K hint are dropped and the button
       * becomes the same 32px square as its neighbours: the hint names a key
       * a phone has not got, and the magnifier is the one icon that needs no
       * caption. The control is NOT hidden — it stays in the header, in the
       * tab order, at a full 32px target — so the search a phone user reaches
       * for is one press away, exactly as on a desktop.
       *
       * `aria-label` (not a visually-hidden span) carries the name, because
       * the name must survive `hidden` on the drawn text. It is the same
       * translated string the pill draws at `lg`, so the visible label and
       * the announced one never diverge.
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
       * `filter={() => true}`: the visible set below is already the result of
       * `matches()` — see the file header for why RAC's own default filter
       * must be disabled rather than left to run a second time.
       */}
      <Command items={visibleAll} inputValue={query} onInputChange={setQuery} filter={() => true}>
        <CommandInput label={copy.inputLabel[lang]} placeholder={copy.inputPlaceholder[lang]} />
        {/*
         * The result count that used to sit here is gone — a number over a
         * list restates what the list already shows, and cmdk's head is just
         * the input. That makes the EMPTY state the only signal for "nothing
         * matched", so it must be announced, not merely drawn: `role="status"`
         * is a polite live region, and the message inside it is the caller's
         * own translated sentence.
         *
         * Rows are single-line — the title is the row, cmdk-style. The intro
         * still participates in MATCHING (it is part of `matches()`' haystack
         * and `textValue`), it is just no longer drawn in the row.
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
          * A sibling of the list, not a `renderEmptyState` prop: Base UI's
          * `Autocomplete.Empty` IS the live region (`role="status"
          * aria-live="polite"`) and mounts its children only when the filtered
          * set is empty. React Aria needed the announcement to be added by hand.
          */}
        <CommandEmpty>{copy.emptyMessage[lang]}</CommandEmpty>
      </Command>
    </CommandDialog>
  );
}
