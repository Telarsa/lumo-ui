"use client";

import { useEffect, useRef } from "react";

/**
 * ONE Flutter demo, running for real, inside the page's phone frame.
 *
 * The gallery (`/mobile-preview/index.html?demo=&lang=&theme=`) is a single
 * Flutter web app serving EVERY demo, so the engine is downloaded once and
 * cached across component pages — see the contract, and the caveats the page
 * prints under the frame.
 *
 * Three deliberate choices:
 *
 *  1. The frame is in the SERVED BYTES with a real `src` and a real `title`. An
 *     iframe is not headless: with no accessible name a screen reader announces
 *     it as "frame", so `title` is REQUIRED here as an announced string is
 *     everywhere else in this repo.
 *  2. The frame FILLS its phone bezel and never resizes itself. It used to grow
 *     to the height the gallery posts (`lumo-demo-height`), which was wrong for
 *     the thing being drawn: a phone is a fixed shape. A one-control demo made
 *     the bezel a letterbox, and then opening that control's dropdown grew the
 *     frame and shifted the page under the reader. The gallery still posts the
 *     message — it is useful to anyone embedding a demo WITHOUT a phone frame —
 *     and this component ignores it. Content taller than the bezel scrolls
 *     inside it, exactly as it would on a handset.
 *  3. The theme follows the page. The gallery takes it in the query string, so a
 *     flip is a NAVIGATION of the frame — done with `location.replace` rather
 *     than by writing `src`, which would push a history entry and turn the
 *     browser's Back button into a theme-undo. Same mechanism as
 *     `demo-frame.tsx`'s `PreviewFrameThemeSync`: an explicit `data-theme` stamp
 *     wins, otherwise the OS, because the "system" case stamps nothing.
 */

export interface MobilePreviewProps {
  /** The gallery URL in the light scheme. The SSR `src`, so no-JS readers get a frame. */
  lightSrc: string;
  /** The same demo in the dark scheme. */
  darkSrc: string;
  /** The frame's accessible name, in the PAGE's language. Required. */
  title: string;
}

type Resolved = "light" | "dark";

function effectiveTheme(): Resolved {
  const stamped = document.documentElement.getAttribute("data-theme");
  if (stamped === "dark" || stamped === "light") return stamped;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function MobilePreview({ lightSrc, darkSrc, title }: MobilePreviewProps) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // The URL the frame is currently showing; starts as the server's light one.
    let showing = lightSrc;
    const sync = () => {
      const next = effectiveTheme() === "dark" ? darkSrc : lightSrc;
      if (next === showing) return;
      const frame = ref.current;
      if (frame === null) return;
      showing = next;
      try {
        // Same origin by construction; `replace` leaves the history alone.
        frame.contentWindow?.location.replace(next);
      } catch {
        frame.setAttribute("src", next);
      }
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", sync);
    sync();
    return () => {
      observer.disconnect();
      mq.removeEventListener("change", sync);
    };
  }, [lightSrc, darkSrc]);


  return (
    <iframe
      ref={ref}
      src={lightSrc}
      title={title}
      loading="lazy"
      // `flex-1` inside the phone bezel's flex column: the iframe takes the
      // bezel's height instead of dictating one.
      className="block w-full flex-1 border-0 bg-transparent"
    />
  );
}
