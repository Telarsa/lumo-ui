import type { Locale } from "@lumo-ui/core";

/**
 * The differentiator: for the demo on this page, show what a screen reader
 * actually announces — each interactive control's role and its computed
 * accessible name, in red when the name is empty.
 *
 * ── WHY THIS FILE DOES NOT COMPUTE ANYTHING ──────────────────────────────────
 *
 * The obvious approach — call `renderToStaticMarkup` on the demo a second
 * time, right here, and walk the result with `linkedom` + `dom-accessibility-
 * api` exactly like `@lumo-ui/gate`'s `namedControls` rule does — was tried
 * first and does not work. Next's app router treats every `"use client"`
 * component (which is nearly everything in `@lumo-ui/ui`: React Aria requires
 * it) as an opaque reference when it appears inside a Server Component's
 * render tree. Next's OWN prerenderer knows how to resolve that reference into
 * real markup; the plain `react-dom/server` renderer does not. Verified:
 * calling `renderToStaticMarkup` directly on this page's demo throws
 * `Attempted to call RadioGroup() from the server but RadioGroup is on the
 * client` during `next build` — not a lint complaint, a real prerender crash,
 * on the very first demo that used a React Aria component. Since essentially
 * every Lumo component is `"use client"`, this was not a one-off: it would
 * have broken nearly every component page. (A first attempt routed the import
 * through a dynamic `await import("react-dom/server")` inside an async
 * component, hoping to dodge Turbopack's static "you're importing react-dom/
 * server" build error — that only moved the failure from a build-time error to
 * this runtime crash, which is worse, not better.)
 *
 * So the computation does not happen during React's render at all. It happens
 * as a POST-BUILD pass, in `apps/website/scripts/inject-evidence.mjs`, wired
 * into `apps/website/package.json`'s own `build` script (`next build && node
 * ... inject-evidence.mjs`) so it always runs before `lumo-gate` ever sees the
 * output. That script:
 *
 *   1. Reads the already-built, already-correct HTML `next build` produced —
 *      the SAME bytes the gate grades, not a second, separately-rendered copy
 *      that could subtly disagree with what actually ships.
 *   2. Finds the demo's real rendered markup inside the `[data-lumo-demo-root]`
 *      element `preview-toolbar.tsx` marks for exactly this purpose.
 *   3. Runs the identical `linkedom` + `dom-accessibility-api` computation
 *      this file's header describes — selector and shim duplicated from
 *      `packages/gate/src/rules.ts`'s `namedControls` rule, for the same
 *      reasons given there (see that script for the full account, including
 *      why the shim is required and why the computation is not wrapped in
 *      try/catch).
 *   4. Replaces the placeholder this component renders — `[data-lumo-evidence-
 *      slot]`, empty on purpose — with the real table.
 *
 * `next build && node inject-evidence.mjs` is a single `&&`-chained command in
 * `apps/website/package.json`'s `build` script: if the injector throws (the
 * computation failed) or finds no slot to fill (the marker was removed or
 * renamed elsewhere), the whole command exits non-zero, `pnpm run gate:html`
 * never reaches the gate CLI, and the build fails loudly — never a silently
 * empty panel.
 */

export interface EvidencePanelProps {
  locale: Locale;
}

export function EvidencePanel({ locale }: EvidencePanelProps) {
  return (
    <div
      data-lumo-evidence-slot=""
      data-lumo-evidence-locale={locale}
      aria-hidden="true"
    />
  );
}
