# lumo_mobile_gallery

The demo gallery behind the **Mobile** tab of the Lumo UI docs site. ONE Flutter
web app renders EVERY demo, so the ~7 MB engine is fetched once and cached
across every component page instead of once per page.

Built to `apps/website/public/mobile-preview/` and addressed as:

```
/mobile-preview/index.html?demo=<demoId>&lang=<fa-IR|en-US>&theme=<light|dark>
```

- `demo` — `<slug>-<n>`, e.g. `button-1`. An id this app does not know renders a
  visible, honest box that names the id; never a blank canvas.
- `lang` — a BCP-47 tag. Anything not served falls back to `fa-IR`.
- `theme` — `light` or `dark`, straight into `LumoScope(brightness:)`.

The app renders ONE demo, transparent, centred, at phone width, with no chrome
of its own — the docs page draws the phone frame. After first paint and on every
change it posts its measured height to the frame above:

```js
window.parent.postMessage({ type: 'lumo-demo-height', demo: '<id>', height: <px> }, '*')
```

The page is expected never to assume that arrives.

## Adding a demo

1. `lib/demos/<slug>.dart` — one file per component slug, where `<slug>` is the
   id used by the WEB docs (check `catalog.json`; the build refuses a slug that
   is not there).
2. In that file:
   - `const demos = <String, WidgetBuilder>{ '<slug>-<n>': builder, … }`
   - `const demoMeta = { '<slug>-<n>': { 'title': {'fa-IR': …, 'en-US': …},
     'description': {…} } }` — every string in EVERY locale; a missing one is a
     build failure, not a fallback.
   - `const copy = { 'key': {'fa-IR': …, 'en-US': …} }` for every string the
     demo RENDERS, read in the demo as `t['key']`. The build substitutes each
     `t['key']` for that locale's literal, so the published snippet is plain
     Dart that never mentions `t`. Inside a string, write `'${t['remove']} $name'`
     — the substitution there is raw, giving `'Remove $name'`.
   - `// BEGIN <slug>-<n>` … `// END <slug>-<n>` around the exact Dart a reader
     should copy. A slice that is a single `return <expr>;` is unwrapped into
     the expression. The key in `t['…']` must be a LITERAL inside the markers —
     resolve anything dynamic in `didChangeDependencies`, outside them.
3. Import the file in `lib/demos/all.dart` — the build fails if you do not.
4. `pnpm run build:mobile-demos`, then commit the regenerated
   `apps/website/src/lib/mobile-demos.generated.json`.

Demo copy is localized in both served locales, exactly as the web examples in
`apps/website/src/examples/*.tsx` localize theirs: the English page must not show
a Persian button. `fa-IR` stays the default and the fallback, and every announced
string stays a required parameter — the build fails on a missing translation
rather than degrading one locale into the other.

A demo `title` must carry **no Latin digit**: it becomes the iframe's `title`
attribute, where the page cannot island it, and a Latin digit there fails
`no-latin-digits` on the served HTML. Persian digits are fine, and descriptions
are safe because they get islanded.

## Commands

Flutter is not on this machine's PATH by default:
`export PATH=/opt/homebrew/share/flutter/bin:$PATH`.

| | |
|---|---|
| `flutter analyze` / `flutter test` | the gallery's own guard rails: ids, locale coverage, the `lang` fallback, and that an unknown demo names its id |
| `pnpm run build:mobile-demos` | regenerate `apps/website/src/lib/mobile-demos.generated.json` (per-locale titles, descriptions and Dart sources) |
| `pnpm run gate:mobile-demos` | fail when that file is stale (runs inside `pnpm run verify`) |
| `pnpm run build:mobile-gallery` | `flutter build web --release --base-href=/mobile-preview/`, then copy and prune into the website's `public/` |

`apps/website/public/mobile-preview/` is **built, not committed** — it is
gitignored, and `scripts/ensure-mobile-gallery.mjs` rebuilds it when the hash of
the gallery, `packages/mobile/` or the Flutter version changes. Run
`build:mobile-gallery` directly to force a rebuild.

## What the preview cannot prove

The preview is a **canvas**. `pnpm run gate:html` grades served bytes and there
are no bytes inside a canvas to grade, so nothing here is evidence of an
accessible name, a role or a reading order. The semantics-tree tests in
`packages/mobile/test/` are that evidence; this app is evidence that the widgets
lay out and run.
