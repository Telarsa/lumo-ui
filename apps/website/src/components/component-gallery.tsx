"use client";

import { segmentFor } from "@/lib/locale";
import { useMemo, useState } from "react";
import Link from "next/link";
import { cn, formatNumber, type BuiltinLocale as Locale } from "@lumo-ui/core";
import { SearchField } from "@lumo-ui/ui";
import { PreviewFrameThemeSync } from "./demo-frame";

/**
 * The components index as a filterable gallery of live previews (search + tier
 * chips + grid), replacing the A–Z listing that stopped scaling at 110 items.
 * Each preview is an `<iframe>` of `/view/<lang>/<slug>/` (a real Persian
 * document, no hydration of 70 widgets, serialisable as a URL) with
 * `loading="lazy"`. Frames are `inert` + `aria-hidden`: on THIS page a preview
 * is a picture, and `lumo-gate` skips aria-hidden subtrees so an unreachable
 * inert widget is not graded as a defect. Reasoning: docs/decisions/log.md.
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
   * The result count, as a per-locale template with a `{n}` hole. A STRING and
   * not `(n) => string` because a function cannot cross the server boundary;
   * supplied PER LOCALE, so each language puts the hole where its grammar wants.
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
 * Folds the spellings a Persian reader does not distinguish (Arabic kaf/yeh,
 * ZWNJ). Not `Intl.Collator`: that compares whole strings, this is a substring test.
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
 * One filter chip. A `<button>` and not a `<Link>`: the filter is page state,
 * not a location (no duplicate sitemap URLs, no navigation per chip).
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
