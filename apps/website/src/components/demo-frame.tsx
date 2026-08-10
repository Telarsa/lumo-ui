import type { Locale } from "@lumo-ui/core";
import { direction } from "@lumo-ui/core";

/**
 * A demo rendered in its own document.
 *
 * `/view/<lang>/<slug>/` is a real prerendered route with its own root layout,
 * so the iframe contains a genuine `<html lang="fa-IR" dir="rtl">`. That is the
 * point: a preview that claims Persian correctness must actually BE a Persian
 * document, or it is demonstrating nothing.
 *
 * Lazy-loaded and fixed-height on purpose — a ResizeObserver + postMessage
 * handshake would add JavaScript to every component page to save a few pixels
 * of whitespace. The height is GENEROUS (`h-96`) rather than minimal: the
 * inner document centres the demo and only scrolls when content genuinely
 * overflows, so a stingy frame height is what used to produce a document
 * scrollbar stacked on top of a ListBox's own — two scrollbars for one list.
 */
export function DemoFrame({
  slug,
  lang,
  title,
  pageLang,
}: {
  slug: string;
  lang: Locale;
  /** The component's name in the SURROUNDING page's language, not the frame's. */
  title: string;
  pageLang: Locale;
}) {
  return (
    <figure className="m-0 overflow-hidden rounded-lg border border-border">
      <figcaption
        dir="ltr"
        lang="en"
        data-lumo-latn=""
        className="flex items-center justify-between border-b border-border bg-surface-sunken px-3 py-1.5 text-xs text-fg-muted"
      >
        <code>{`lang="${lang}" dir="${direction(lang)}"`}</code>
      </figcaption>
      <iframe
        src={`/view/${lang}/${slug}/`}
        /*
         * The frame's accessible name is in the PAGE's language, because a
         * screen reader reads it from the surrounding document. Interpolating
         * the slug here shipped English into a Persian page and the gate caught
         * it — which is precisely why the name is a required prop now.
         */
        title={
          pageLang === "fa-IR"
            ? `${title} — ${lang === "fa-IR" ? "فارسی" : "انگلیسی"}`
            : `${title} — ${lang === "fa-IR" ? "Persian" : "English"}`
        }
        loading="lazy"
        className="block h-96 w-full bg-surface"
      />
    </figure>
  );
}
