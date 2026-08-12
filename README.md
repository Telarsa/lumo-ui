# Lumo UI

A component library for products that ship in Persian.

Right-to-left is the easy half. Lumo exists for the other half: the calendar is
Jalali, the digits are ۱۴۰۵, and the accessible name is Persian too — in the
served bytes, before any JavaScript runs.

Private to Telarsa. See `DECISIONS.md §0.2`.

---

## What this is

| | |
| --- | --- |
| Behaviour | [React Aria Components](https://react-spectrum.adobe.com/react-aria/) — rented, not rebuilt |
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
packages/ui       68 components
packages/blocks   28 whole-screen compositions
packages/gate     lumo-gate — grades built HTML, no browser required
packages/config   the lint policy, zero plugin dependencies
apps/website      the showcase, and the first thing the gate runs against
```

**Current state.** 68 components, 30 blocks, 99 registry items, 604 tests,
410 documents graded at 0 violations. See `ROADMAP.md` for what is still open.

## Getting started

```bash
pnpm install
pnpm verify      # types → no-CSS-Modules → tests → build → gate
pnpm dev         # the showcase site, live
```

`pnpm verify` is the whole contract. If it is green, the thing is shippable.

There is no `pnpm start` — the site is a static export, so there is no server
to start. To view the real built output (the bytes the gate graded), run
`pnpm --filter website build && pnpm --filter website preview` and open
`http://localhost:4173/fa-IR/`.

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
React Aria resolves its locale from `navigator.language`, falling back to
`en-US` — and during server rendering there is no `navigator`. Without a provider
every React Aria component renders `en-US`/`ltr` regardless of `<html lang dir>`.
Measured: a slider thumb at value 40 sits at `left: 40%` instead of `left: 60%`,
the mirror image of where it belongs. No gate catches this — it is valid HTML
with plausible inline styles — which is why it is a component with a required
prop rather than a line of documentation.

**4. There is no `dir` prop.**
Direction is derived from the locale via `Intl.Locale.getTextInfo()`. A wrong
direction is unrepresentable rather than discouraged.

**5. Logical utilities only.**
`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`. Physical utilities are banned by lint.
One `ml-2` in a shared component breaks Persian in every project that copied it.

**6. No CSS Modules.**
Styling lives in Tailwind utilities inside `cva()`, so `shadcn migrate rtl` and
`shadcn add --diff` can both see it. Enforced by a `find` in CI.

**7. Every rule has a poison fixture.**
A rule that has never been seen to fail is not a rule. This caught a real one:
`namedControls` originally swallowed an exception and reported green forever.

## The gates, in the order `verify` runs them

| gate | what it proves |
| --- | --- |
| `gate:types` | `LumoNode`, the closed `Locale` union, and every required string prop |
| `gate:props` | no prop is typed, accepted and then never delivered |
| `gate:no-css-modules` | the styling decision is real, not a comment |
| `gate:test` | 604 tests, including each gate's own poison fixtures |
| `gate:registry` | the manifest is derivable from the code, not hand-kept |
| `gate:smoke` | every item compiles as a **consumer** receives it, outside the workspace |
| `gate:html` | the bytes actually served are correct |

`gate:props` is the only one that reads SOURCE rather than output, because the
defect it catches produces no output: a prop that is declared, accepted and
dropped renders nothing, throws nothing and type-checks. Its first run found 45
of them, including three that were worse than silent — `form.tsx` served
`<label elementType="div">`, `number-field.tsx` served `commitBehavior="snap"`,
and `disclosure.tsx` let a caller replace the `role="region"` the component
exists for.

Each proves something the one before it cannot. The smoke test in particular
found a real distribution bug — a companion module missing from a registry item
— that is structurally invisible from inside the workspace.

## What the HTML gate checks

`lumo-gate` parses the built HTML — the bytes a crawler, a JS-disabled reader
and the first paint receive. No browser, so it runs anywhere.

- `<html lang>` and `dir` match the route's locale
- no Latin digits in visible text on Persian routes
- **a minimum count of Persian digits** — because "zero Latin digits" passes
  trivially on a page that renders no data
- no Latin-script `aria-label` / `aria-roledescription` / `aria-valuetext`
- every interactive control has an accessible name
- no dangling `aria-labelledby` / `aria-controls`

It refuses to report success on an empty directory, and it **throws** on a route
whose locale it cannot derive rather than skipping it. An ungraded page is an
unprotected page.

## Escape hatches

Genuinely-Latin content — order IDs, model numbers, code — is marked, not
excused:

```tsx
<span data-lumo-latn dir="ltr">KH-4825</span>
```

## Where to look next

- `DECISIONS.md` — what was chosen, with the evidence, including superseded
  decisions kept struck through
- `ROADMAP.md` — the road to 1.0
- `packages/core/src/strings.ts` — the measurement that shaped the i18n design
