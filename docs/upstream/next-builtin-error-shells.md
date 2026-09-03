# Upstream draft — Next's builtin `/_global-error` shell ships no `lang` and no `dir`

**Status:** DRAFT. Not filed.
**Target:** `vercel/next.js` — a new issue. Nothing matching was found while writing this;
search before filing.
**Verified against:** `next@16.0.4` and `16.3`, read from the installed dist and from built
output across five apps, 31 Aug 2026.

---

## What ships

`next/dist/client/components/builtin/app-error.js` renders:

```jsx
_jsxs("html", { id: "__next_error__", ... })
```

No `lang`, no `dir`, and English body copy — "This page couldn't load", "A server error
occurred. Reload to try again.", "Reload".

That document is **served**. `next build` copies it to `.next/server/pages/500.html`, and
`pages-manifest.json` is literally `{"/404": "pages/404.html", "/500": "pages/500.html"}` —
the table `base-server` reads to answer a 500. Under `output: "standalone"` it is copied
again into the bundle the image runs.

So a reader of a Persian-first product who hits a server error receives an English sentence,
with no language declared, announced by whichever synthesiser the user agent guesses.

## Why an app cannot fix it

Not for want of trying. `app/global-error.tsx` has **no effect** on this document:

- `build/route-discovery.js:186` — `const hasAppGlobalError = !isDev && appDirOnly;`
- `build/route-discovery.js:192` — the entry resolves to
  `require.resolve("next/dist/client/components/builtin/app-error")`
- `build/webpack/loaders/next-app-loader/index.js:303-318` — `if (isAppErrorRoute)` sets the
  page to that module unconditionally
- `…/index.js:333` — `if (isAppErrorRoute) { definedFilePaths = definedFilePaths.filter(([type]) => type !== "layout") }`

The route is hardwired to the builtin and every user layout is stripped from its tree.
Measured against an app that ships a correct `app/global-error.tsx`: its Persian copy
appears **zero** times in the emitted shell.

`grep` of `config-shared.d.ts` for `/[Ee]rror/` finds only `ignoreBuildErrors`. There is no
configuration knob.

## `/_not-found` is a different case, and mostly fine

`builtin/global-not-found.js` has the same shape — bare `<html>`, English copy — but that
route renders UNDER the root layout, so an app whose root layout emits `<html lang dir>`
already ships a clean one. Only an app that puts `<html>` inside a `[locale]` segment, with
no root layout, gets the bare builtin. `experimental.globalNotFound` + `app/global-not-found.tsx`
fixes that case in source (verified on a trilingual app whose `<html>` lives in its
`[locale]` segment).

So the ask below is about `/_global-error` alone.

## The ask

Either of these would close it:

1. **Let the builtin inherit.** Stop filtering `layout` out of the app-error tree, so the
   root layout's `<html lang dir>` applies as it does for every other route.
2. **Let the app supply it.** Honour `app/global-error.tsx` for the prerendered shell, which
   is what its name leads every reader of the docs to expect.

A narrower third option: accept `lang`/`dir` from `next.config` so the shell at least
declares the product's default language.

## What we do meanwhile

`scripts/own-error-shells.mjs` rewrites the built bytes — both the copy `grade-app` reads and
the copy `pages-manifest.json` points the server at, plus any `standalone/` bundle. It refuses
to touch a shell that already declares `lang` and `dir`, so an app that owns its 404 keeps it.

This is a byte rewrite of framework output and we would rather not ship it. It is the reason
this note exists.

## Reproducing

```bash
next build                                   # any app-dir-only project
cat .next/server/app/_global-error.html      # <html id="__next_error__">
cat .next/server/pages-manifest.json         # {"/404": …, "/500": …}
cmp .next/server/app/_global-error.html .next/server/pages/500.html   # identical
```

Add a correct `app/global-error.tsx` first and the output does not change.
