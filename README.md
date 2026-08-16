# Lumo UI

A component library for products that ship in Persian.

Right-to-left is the easy half. Lumo exists for the other half: the calendar is
Jalali, the digits are ۱۴۰۵, and the accessible name is Persian too — in the
served bytes, before any JavaScript runs.

Private to Telarsa. See `docs/decisions/log.md §0.2`.

---

## What this is

| | |
| --- | --- |
| Behaviour | [Base UI](https://base-ui.com/) — adapted where its public contract differs from Lumo's |
| Styling | Tailwind v4, CSS-first, no config file |
| Distribution | copy-in components, packaged invariants |
| Locales | `fa-IR`, `en-US` — complete or the build fails |

**The split that matters.** Components are *copied* because they are meant to be
edited. Tokens, the locale contract and the gate are *packages* because an edit
to them is a bug, not a customisation.

## Packages

```
packages/core     the invariants — LumoNode, direction(), formatters, strings
packages/theme    three token tiers + the Tailwind bridge + :lang(fa) rules
packages/ui       111 registry components
packages/blocks   30 whole-screen compositions
packages/gate     lumo-gate — grades built HTML, no browser required
packages/config   the lint policy, zero plugin dependencies
packages/native   the unstarted React Native feasibility probe
apps/website      the showcase, and the first thing the gate runs against
```

**Current state.** 111 components, 30 blocks and 141 generated registry items.
The exact test and document totals are printed by `pnpm run verify`; they are not
hand-copied here because they change whenever a regression test or example is
added. See `docs/history/roadmap-2026-08.md` for the retired roadmap and `docs/README.md` for current documentation.

## Getting started

```bash
pnpm install
pnpm run verify  # types → props → lint → no-CSS-Modules → tests → registry → API → smoke → HTML
pnpm dev         # the showcase site, live
```

`pnpm verify` is the whole contract. If it is green, the thing is shippable.

The site is a static export, not a Next production server. To view the real
built output (the bytes the gate graded), run `pnpm run preview` and open
`http://localhost:4173/fa/`.

If `next dev` once logged errors about `/sw.js`: that was a service worker some
OTHER project registered on `localhost:3000`, still phoning home.
`public/sw.js` now serves a self-destructing worker at that path — the browser
installs it as the update, it unregisters itself and reloads the tab, and after
one visit there is no worker at all. Nothing to do manually.

## The rules, and why they are types and tests rather than documentation

A 52-component prototype preceded this one. It was written in four days under
full attention by someone who had written the RTL rules down first. It shipped:
`<html lang="en">` on all 55 Persian pages; 77 of 77 calendar day cells in Latin
digits, two lines below a 25-line comment explaining that exact failure; 33
controls with no accessible name.

Every one of those defects **rendered correctly, type-checked, and looked right
in review**. So:

**1. `LumoNode`, not `ReactNode`.**
`<Cell>{day.day}</Cell>` is a compile error. A bare number renders Latin digits.

**2. Every announced string is a required prop.**
The library ships no user-facing English, not even as a default. Measured: React
Aria leaks 8 English strings on a Persian page, 5 of them reachable by prop —
those 5 are typed in `packages/core/src/strings.ts`.

**3. `LumoProvider` is not optional.**
Lumo derives direction from its required locale and supplies Base UI's direction
context. A document-level `dir` attribute is necessary but does not configure a
headless component engine's first-byte positioning and keyboard model. The
provider makes those two sources agree before hydration.

**4. There is no `dir` prop.**
Direction is derived from the closed locale contract. Lumo asks
`Intl.Locale.getTextInfo()` when the engine has it and uses an exhaustive,
compile-checked fallback on older Android engines. A wrong direction is
unrepresentable rather than discouraged.

**5. Logical utilities only.**
`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`. Physical utilities are banned by lint.
One `ml-2` in a shared component breaks Persian in every project that copied it.

**6. No CSS Modules.**
Styling lives in Tailwind utilities inside `cva()`, so the styling floors and
`lumo diff`/`lumo upgrade` can both see it. Enforced by a `find` in CI.

**7. Every rule has a poison fixture.**
A rule that has never been seen to fail is not a rule. This caught a real one:
`namedControls` originally swallowed an exception and reported green forever.

## The gates, in the order `verify` runs them

| gate | what it proves |
| --- | --- |
| `gate:types` | `LumoNode`, the closed `Locale` union, and every required string prop |
| `gate:props` | locally declared and selected inherited behaviour props are delivered; owned root semantics cannot be overwritten |
| `gate:no-css-modules` | the styling decision is real, not a comment |
| `gate:test` | every package's suite — including the gate's own 134, which are its poison fixtures and the negative twin of every exemption |
| `gate:registry` | the manifest is derivable from the code, not hand-kept |
| `gate:api` | every component page's public prop tables are derived from the exported TypeScript contracts and are not stale |
| `gate:smoke` | every item's declared sibling/package closure is complete, and the copied payloads compile outside the workspace |
| `gate:html` | the bytes actually served are correct |

`gate:props` reads source and uses the TypeScript checker for inherited behaviour
contracts, because a prop that is declared, accepted and dropped renders
nothing, throws nothing and type-checks. It also checks semantic attributes a
component owns at its DOM root. Its first run found 45 locally declared defects,
including three that were worse than silent — `form.tsx` served
`<label elementType="div">`, `number-field.tsx` served `commitBehavior="snap"`,
and `disclosure.tsx` let a caller replace the `role="region"` the component
exists for.

Each proves something the one before it cannot. The smoke test in particular
found a real distribution bug — a companion module missing from a registry item
— that is structurally invisible from inside the workspace.

The component pages combine hand-authored examples and part intent with
checker-generated API tables. Run `pnpm run build:api` after changing an
exported props contract; `gate:api` rejects the change if the checked-in
`api-reference.json` was not regenerated.

## What the HTML gate checks

`lumo-gate` parses the built HTML — the bytes a crawler, a JS-disabled reader
and the first paint receive. No browser, so it runs anywhere.

| rule | what it catches |
| --- | --- |
| `lang-dir` | `<html lang>` and `dir` do not match the route's locale |
| `no-latin-digits` | Latin digits in visible text on a locale that numbers in its own |
| `persian-digit-floor` | a page that renders no native digits at all — because "zero Latin digits" passes trivially on a page with no data |
| `no-latin-aria` | an announced string (`aria-label`, roledescription, valuetext, placeholder, title) that is purely Latin — a Persian phrase carrying a foreign token («دانلود PDF») passes; the untranslated engine string does not |
| `named-controls` | an interactive control with no accessible name |
| `resolved-idrefs` | a dangling `aria-labelledby` / `controls` / `describedby` / `errormessage` |
| `composite-tab-stop` | a roving-tabindex widget with NO tab stop — unreachable by keyboard in the served bytes |
| `composite-single-tab-stop` | the same widget with more than one, which is the role telling the reader a lie |
| `native-calendar` | a date in the reader's language and the WRONG CALENDAR — «۲۲ ژوئیه ۲۰۲۴» for a day Iran calls «۱ مرداد ۱۴۰۳» |
| `unique-ids` | a duplicated `id`, where an idref resolves — to whichever element came first |
| `native-script-text` | a run of visible text with no character of the reader's script in it, which is how `thr` reached three Persian routes |
| `native-script-name` | the COMPUTED accessible name is in a script the reader does not read — the name most controls actually have, which no attribute carries |
| `named-roledescription` | an `aria-roledescription` with no accessible name, so the element is announced as that one word and nothing else |
| `latn-island-purity` | a `data-lumo-latn` island holding more letters of the reader's script than Latin — the exemption used to hide Persian prose; on the day it shipped it found a Persian link inside an `lang="en"` island on all 34 block pages |

The last four landed together in Phase 3 and three of them had live findings on
the export the day they shipped: 14 duplicated ids, 138 pure-foreign text runs
and 44 unnamed roledescriptions. That is the intended state — a rule narrowed
until the build is green is a rule that has stopped grading.

It refuses to report success on an empty directory, and it **throws** on a route
whose locale it cannot derive rather than skipping it. An ungraded page is an
unprotected page.

## Escape hatches

Genuinely-Latin content — order IDs, model numbers, code — is marked, not
excused:

```tsx
<span data-lumo-latn dir="ltr">KH-4825</span>
```

It exempts the subtree from the digit and visible-text rules, and it is also
what clears a genuinely-foreign accessible NAME — `native-script-name`
subtracts the text of marked descendants from the computed name and grades what
is left, because a name is assembled from descendants and `closest()` looks the
wrong way. The 474 pure-Latin control names in the export are all proper nouns
(`pnpm`, `npm`, `yarn`, `bun`, component slugs) and all already marked this way.

`lang="en"` is **not** a hatch, deliberately. It is the right thing to write —
it picks the voice — but it is also the first thing anyone reaches for when a
stray English string is read aloud in a Persian voice, and honouring it would
make the rules silent on the exact defect they exist for.

## Where to look next

- `docs/decisions/log.md` — what was chosen, with the evidence, including superseded
  decisions kept struck through
- `docs/` — architecture, codebase map, locale contract, verification; `docs/history/` for retired plans
- `packages/core/src/strings.ts` — the measurement that shaped the i18n design
