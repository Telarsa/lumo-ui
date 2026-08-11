"use client";

import { segmentFor } from "@/lib/locale";
import { useMemo, useState } from "react";
import Link from "next/link";
import { cn, formatNumber, type Locale } from "@lumo-ui/core";
import { SearchField } from "@lumo-ui/ui";
import { PreviewFrameThemeSync } from "./demo-frame";

/**
 * The components index as a filterable gallery of live previews.
 *
 * ═══ WHAT THIS REPLACED, AND WHY THE OLD ONE STOPPED SCALING ════════════════
 *
 * An A–Z text listing with a letter-jump strip. That page was RIGHT for what it
 * was — its header argued, correctly, that the sidebar answers "what do I use
 * for a date range" and an alphabetical index answers "where is the one I can
 * already name", and that these are different questions.
 *
 * What changed is the count. At 110 components the letter strip has more
 * entries than some letters have components, and neither axis answers the
 * question a visitor actually arrives with, which is *"show me the overlays"*
 * or *"show me anything with a calendar in it"*. That is a FILTER, and neither
 * an alphabet nor a tier tree is one.
 *
 * So: search plus tier chips plus a grid of real previews, which is the shape
 * reui.io uses and the reason it stays navigable at its size. The sidebar keeps
 * its job unchanged.
 *
 * ═══ THE PREVIEWS ARE IFRAMES, WHICH IS NOT A PERFORMANCE COMPROMISE ════════
 *
 * Each card shows `/view/<lang>/<slug>/`, the same prerendered route the detail
 * pages frame. Rendering the demos INLINE instead would have been the obvious
 * build and is wrong three times over:
 *
 *  1. **They would all hydrate.** Two thirds of the catalogue is `"use client"`,
 *     so an inline grid ships 70-odd interactive widgets to a page whose only
 *     interaction is a filter box.
 *  2. **They would not be Persian documents.** A preview that claims Persian
 *     correctness has to BE a `<html lang="fa-IR" dir="rtl">` document —
 *     `demo-frame.tsx` makes that argument at length and it does not weaken
 *     because the frame got smaller.
 *  3. **The demos are React nodes, and this component is a filter.** Filtering
 *     needs the list to be serialisable state; a `render` function is not. As
 *     iframes the preview is a URL, so the whole catalogue crosses the server
 *     boundary as plain data.
 *
 * `loading="lazy"` means a visitor who filters to "overlay" never fetches the
 * other ninety documents.
 *
 * ═══ THE PREVIEWS ARE `inert`, AND THAT IS THE ACCESSIBILITY DECISION ═══════
 *
 * A hundred and ten frames, each containing a real widget with real controls,
 * is several hundred tab stops between the filter box and the footer. It would
 * also be several hundred announced regions for a screen reader user whose
 * question is "which of these do I want".
 *
 * `inert` removes the subtree from the tab order AND from the accessibility
 * tree, which is exactly the claim being made: on THIS page the preview is a
 * picture. The card's link carries the name, and the detail page has the same
 * frame named and reachable. `aria-hidden` rides along because `lumo-gate`
 * skips `[aria-hidden="true"]` subtrees when grading interaction rules — an
 * inert widget genuinely cannot be keyboard-unreachable, so grading it would
 * report a defect that cannot be experienced.
 */

export type GalleryItem = {
  id: string;
  title: string;
  intro: string;
  tier: string;
};

export interface ComponentGalleryStrings {
  /** The search field's name. */
  searchLabel: string;
  /** The clear button's name. */
  clearLabel: string;
  searchPlaceholder: string;
  /** Names the chip row. A bare row of words is an unnamed list of links. */
  filterLabel: string;
  /** The chip that clears the tier filter. */
  allLabel: string;
  /** Shown when nothing matches. */
  emptyLabel: string;
  /**
   * The result count, as a per-locale template with a `{n}` hole.
   *
   * A STRING and not the `(n) => string` shape `core/src/strings.ts` argues
   * for, and the difference is the server boundary rather than a change of
   * mind: a function cannot cross from a server component into a client one,
   * and this list is assembled on the server.
   *
   * The objection that shape exists to answer still gets answered. It was never
   * "templates are wrong" — it was that a template written ONCE, in the
   * component, forces every language into the clause order of whoever wrote it.
   * A template supplied PER LOCALE does not: «{n} کامپوننت» and "{n} components"
   * each put the hole where their own grammar wants it, and a language that
   * wanted it last would write it last.
   */
  countLabel: string;
}

export interface ComponentGalleryProps {
  lang: Locale;
  items: readonly GalleryItem[];
  /** Tier ids in display order, with their per-locale names. */
  tiers: ReadonlyArray<{ id: string; label: string }>;
  strings: ComponentGalleryStrings;
}

/**
 * Folds the spellings a Persian reader does not distinguish.
 *
 * Arabic kaf (U+0643) and yeh (U+064A) arrive constantly from Arabic keyboards
 * and older content, and a reader who types «کارت» expects to find «كارت».
 * ZWNJ is invisible and appears inside «کامپوننت‌ها»-shaped compounds, so a
 * substring search that keeps it fails on a word the reader can see.
 *
 * `Intl.Collator` is the right tool for ORDERING and for equality, and
 * `autocomplete.tsx` uses it for exactly that. It is the wrong tool here:
 * collation compares whole strings, and this is a SUBSTRING test.
 */
function fold(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("ك", "ک")
    .replaceAll("ي", "ی")
    .replaceAll("‌", "");
}

export function ComponentGallery({ lang, items, tiers, strings }: ComponentGalleryProps) {
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<string | null>(null);

  // Folded once per item rather than once per keystroke per item.
  const haystacks = useMemo(
    () => new Map(items.map((item) => [item.id, fold(`${item.title} ${item.intro} ${item.id}`)])),
    [items],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) map.set(item.tier, (map.get(item.tier) ?? 0) + 1);
    return map;
  }, [items]);

  const shown = useMemo(() => {
    const needle = fold(query.trim());
    return items.filter((item) => {
      if (tier !== null && item.tier !== tier) return false;
      if (needle === "") return true;
      return (haystacks.get(item.id) ?? "").includes(needle);
    });
  }, [items, haystacks, query, tier]);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-4">
        <SearchField
          label={strings.searchLabel}
          clearLabel={strings.clearLabel}
          placeholder={strings.searchPlaceholder}
          value={query}
          onChange={setQuery}
          className="max-w-sm"
        />

        {/*
          `nav` with a name: a bare row of one-word links is a list of unlabelled
          links to a screen reader. Same argument the old letter strip made.

          `aria-pressed` rather than `aria-current`: these are toggles that
          change what the page SHOWS, not links to a different page.
        */}
        <nav aria-label={strings.filterLabel} className="flex flex-wrap gap-1.5">
          <ChipButton
            isActive={tier === null}
            onPress={() => setTier(null)}
            label={strings.allLabel}
            count={formatNumber(items.length, lang)}
          />
          {tiers.map((t) => {
            const count = counts.get(t.id) ?? 0;
            if (count === 0) return null;
            return (
              <ChipButton
                key={t.id}
                isActive={tier === t.id}
                onPress={() => setTier(tier === t.id ? null : t.id)}
                label={t.label}
                count={formatNumber(count, lang)}
              />
            );
          })}
        </nav>

        {/*
          `aria-live="polite"`: filtering is a visual change with no focus move,
          so a screen reader user gets no signal that the grid changed under
          them. The count is that signal.
        */}
        <p aria-live="polite" className="text-sm text-fg-muted">
          {strings.countLabel.replace("{n}", formatNumber(shown.length, lang))}
        </p>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-border p-10 text-center text-sm text-fg-muted">
          {strings.emptyLabel}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((item) => (
            <li key={item.id}>
              <Link
                href={`/${segmentFor(lang)}/components/${item.id}/`}
                className={cn(
                  "group flex h-full flex-col overflow-hidden rounded-lg border border-border",
                  "bg-surface transition-colors hover:border-border-strong hover:bg-surface-hover",
                )}
              >
                {/*
                  `inert` + `aria-hidden`: see the file header. `pointer-events-none`
                  is the third of the trio and the one that makes the card
                  clickable at all — without it the frame swallows every click
                  that lands on the preview, which is most of the card.
                */}
                <div
                  inert
                  aria-hidden="true"
                  className="pointer-events-none h-44 overflow-hidden border-b border-border bg-surface-sunken"
                >
                  <iframe
                    src={`/view/${segmentFor(lang)}/${item.id}/`}
                    loading="lazy"
                    tabIndex={-1}
                    className="block h-full w-full bg-surface"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <span className="text-sm font-medium text-fg">{item.title}</span>
                  <span className="line-clamp-2 text-sm text-fg-muted">{item.intro}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Repaints the frames already loaded when the header's theme flips. */}
      <PreviewFrameThemeSync />
    </div>
  );
}

/**
 * One filter chip.
 *
 * A `<button>` and not a `<Link>`: the filter is page state, not a location.
 * Making it a link would put 8 near-duplicate URLs in the sitemap and would
 * mean a full navigation per chip on a static export.
 */
function ChipButton({
  isActive,
  onPress,
  label,
  count,
}: {
  isActive: boolean;
  onPress: () => void;
  label: string;
  count: string;
}) {
  return (
    <button
      type="button"
      data-lumo=""
      aria-pressed={isActive}
      onClick={onPress}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
        isActive
          ? "border-accent bg-accent text-accent-fg"
          : "border-border text-fg-muted hover:bg-surface-hover hover:text-fg",
      )}
    >
      {label}
      <span className={cn("tabular-nums", isActive ? "opacity-80" : "text-fg-subtle")}>
        {count}
      </span>
    </button>
  );
}
