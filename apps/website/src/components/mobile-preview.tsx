"use client";

import { useEffect, useRef, useState } from "react";

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
 *  2. The height is a sensible FIXED value that renders without JavaScript; the
 *     `lumo-demo-height` message the gallery posts after first paint is an
 *     ENHANCEMENT, clamped, and never assumed to arrive.
 *  3. The theme follows the page. The gallery takes it in the query string, so a
 *     flip is a NAVIGATION of the frame — done with `location.replace` rather
 *     than by writing `src`, which would push a history entry and turn the
 *     browser's Back button into a theme-undo. Same mechanism as
 *     `demo-frame.tsx`'s `PreviewFrameThemeSync`: an explicit `data-theme` stamp
 *     wins, otherwise the OS, because the "system" case stamps nothing.
 */

export interface MobilePreviewProps {
  /** The gallery's demo id, `<slug>-<n>` — also what the height message names. */
  demoId: string;
  /** The gallery URL in the light scheme. The SSR `src`, so no-JS readers get a frame. */
  lightSrc: string;
  /** The same demo in the dark scheme. */
  darkSrc: string;
  /** The frame's accessible name, in the PAGE's language. Required. */
  title: string;
}

/** Below this a phone demo is a sliver; above it the frame outgrows the viewport. */
const MIN_HEIGHT = 220;
const MAX_HEIGHT = 900;
/** What a reader gets with JavaScript off, or when the message never arrives. */
const DEFAULT_HEIGHT = 480;

type Resolved = "light" | "dark";

function effectiveTheme(): Resolved {
  const stamped = document.documentElement.getAttribute("data-theme");
  if (stamped === "dark" || stamped === "light") return stamped;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function MobilePreview({ demoId, lightSrc, darkSrc, title }: MobilePreviewProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

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

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only this frame's own messages: the page hosts one per demo.
      if (event.source !== ref.current?.contentWindow) return;
      const data: unknown = event.data;
      if (typeof data !== "object" || data === null) return;
      const message = data as { type?: unknown; demo?: unknown; height?: unknown };
      if (message.type !== "lumo-demo-height" || message.demo !== demoId) return;
      if (typeof message.height !== "number" || !Number.isFinite(message.height)) return;
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(message.height))));
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [demoId]);

  return (
    <iframe
      ref={ref}
      src={lightSrc}
      title={title}
      loading="lazy"
      style={{ height: `${String(height)}px` }}
      className="block w-full border-0 bg-transparent"
    />
  );
}
