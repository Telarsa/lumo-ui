# Verification — what `pnpm run verify` proves

The chain is thirteen gates. Each proves something the one before it cannot; a
gate that cannot fail is not listed. The component-library gates
(`gate:props`, `gate:registry`, `gate:api`, `gate:catalog`, `gate:smoke`,
`gate:consumer-lint`, `mutation:components`, the Playwright evidence job)
retired with the web library; `gate:flutter-contract`, `gate:mobile-demos` and
`gate:mobile-api` retired with the MOBILE roster in §53/§54. All of them graded
components no longer shipped; §50.6 and §54 in `docs/decisions/log.md` record
what went and why.

| gate | what it proves | what it cannot |
| --- | --- | --- |
| `gate:versions` | every package moves with the root, the CHANGELOG leads with that version, and no contract package carries a `catalog:`/`workspace:` runtime specifier (uninstallable by git) | that the version is semantically honest |
| `gate:types` | root scripts and every package typecheck, including the consumer type-tests (`TS2578` proves the type-tests are load-bearing) | anything about runtime |
| `gate:consumer-profile` | `core`, `base-ui-ssr` and `dates` compile under a CONSUMER's compiler settings (plain `strict`, Next's lib) | a real install — that is `gate:pack` |
| `gate:lint` | the RTL policy (physical utilities banned, bare numbers in JSX) over every package, with its poison fixtures | class strings built at runtime; the HTML gate is the backstop |
| `gate:no-css-modules` | the styling decision is real, not a comment | — |
| `gate:test` | every package's suite — including the gate's own 206, which are its poison fixtures, and `lumo-ui/dates`' 40-year Jalali sweep against `Intl` | what only served bytes can show |
| `gate:dist` | the committed JS build of the gate (what `lumo gate` actually runs from a consumer's node_modules) matches its source | — |
| `gate:pack` | the packed `lumo-ui` tarball carries every file the CLI needs, AND `lumo gate` and `grade-app` both actually RUN from it, installed under `node_modules` — found necessary twice: 0.1.2 shipped without `scripts/lib`, and `grade-app` spawned a `.ts` file Node refuses to type-strip under `node_modules`, so every file was present and the command still died for every consumer | that a consumer's own build produces gradeable HTML |
| `gate:flutter-tokens` | `tokens.g.dart` matches a fresh generation from `packages/theme` — web and mobile cannot disagree about what `md` or `accent` mean | that the rem→dp mapping is the right one |
| `gate:mobile-styles` | the generated style layer is fresh | — |
| `gate:flutter` | the mobile library's suite AND `apps/mobile-example` — a Material app graded by the semantics grader in both locales, with a per-rule poison fixture and an announced-node floor so no rule can pass on an empty tree | a real device or screen reader |
| `gate:mobile-smoke` | a clean-room consumer outside the workspace names every public declaration in `lib/src/` and compiles — so an export the barrel forgot fails here rather than in someone's app | that the API is well-shaped, only that it is reachable |
| `gate:html` | the docs site — a shadcn-built, Lumo-wired static export (§51's recipe executing itself) — grades clean over all sixteen served documents, digit floors armed on the number-dense fa routes, the exemption held under its committed ceiling, and the export's 404 shells are the site's own Persian ones | what only a real product's bytes can show — that stays `grade-app`'s job |

Separate jobs, not in the chain: `build:gate` (regenerates dist) and
`mutation:mobile`, which breaks one promise per file in `packages/mobile` and
requires that file's own test to fail. It survived the retirement and is
stronger for it: five files can carry a promise, all five have an operator, and
`PENDING_FLOOR` is 0 — it covers the package rather than a sample of it. Its
first run after the narrowing killed two of four, and both survivors were real:
`scope.dart`'s direction could be inverted with every test still passing (the
library's first documented claim had no test in the library), and the
`format.dart` operator was matching a doc comment, so the harness had been
mutating prose and reporting it as an unwatched test.

## Grading a product — the part that is not a gate

The HTML grader's in-repo proof is its fixture suite (206 tests, a poison per
rule, fixture↔rule bijection asserted both ways). Its **corpus** is whatever
product you point it at:

```
node scripts/grade-app.mjs <app>/.next/server/app fa-IR   # single-locale app, locale declared
lumo gate <static-export> [floors.json]                    # export with locale segments
```

First product contact (30 Aug 2026, §50.5): 51 documents of a live shadcn app,
306 violations — including a defect the compile-time layer structurally cannot
reach, and one bug in the grader itself (React streamed segments were skipped
as `[hidden]`; fixed, pinned from both sides). Both example apps now grade to
ZERO (306→0, 434→0), as does a third consumer's site. That residue used to be
described here as a framework-artifact class "left flagged on purpose"; it was
six or four violations of Next's builtin error shells plus, in one of them, a
REAL unnamed progressbar that the permanent red had been hiding since §58.
`own-error-shells` now rewrites the shells' served bytes and the progressbar has
a name. The docs site is the standing in-repo corpus — built from shadcn copies
the repo does not lint-own, wired by the contract packages, graded to zero.

## What is honestly not covered

- **No screen reader, on either platform.** Accessibility *trees* and served
  *bytes* are graded; no NVDA/JAWS/VoiceOver/TalkBack claim exists. Do not make
  one unless you actually ran it.
- **Route names that are also language codes.** `isLanguageTag` requires a code
  ICU actually has a language for, which stopped `/how` and `/map` being read as
  locale segments. `new` (Newari), `car` (Carib), `man`, `war` and `sun` are
  real codes AND common route words, so a route named for one is still read as a
  locale.

  The obvious fix does not work, and the suite says so. Confirming the segment
  against the document's own `<html lang>` was tried and reverted: `gate.test.ts`
  pins `localeForPath("de/about/index.html", …, "fr") === "de"` with the reason
  written beside it — "the route wins, lang-dir will report it". A page whose
  route and `lang` disagree is the founding defect; turning that into "this
  segment must not be a locale" trades a reported violation for a hard error.
  `/new` with `lang="en"` and `/de` with `lang="fr"` are the same shape to any
  test that only compares the two.

  What closes it is an explicit per-site declaration of the locales an app
  serves, in the shape `persian-digit-floor` and `@exempt-ceiling` already use:
  `"@locales"` in the floors file. Declared, a segment is a locale if and only
  if it is in the list, and every other segment is known to be a route name.
  The inference above is what an app gets when it declares nothing.
- **Mobile device evidence** is one hand run on one iPhone (18 Aug 2026); the
  tap-target ratchets and their limits are recorded in
  `docs/evidence/mobile-device.md`.
- **The product runs are on demand**, not in this repository's CI: they need
  the app's own install and build first. A consumer wires `lumo gate` into its
  own pipeline, and until Next's error shells could be owned that pipeline would
  have been red forever, which is why `own-error-shells` exists.
