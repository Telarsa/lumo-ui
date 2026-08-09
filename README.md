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
packages/ui       35 components
packages/blocks   19 whole-screen compositions
packages/gate     lumo-gate — grades built HTML, no browser required
packages/config   the lint policy, zero plugin dependencies
apps/website      the showcase, and the first thing the gate runs against
```

**Current state.** 35 components, 19 blocks, 54 registry items, 242 tests,
150 documents graded at 0 violations. See `ROADMAP.md` for what is still open.

## Getting started

```bash
pnpm install
pnpm verify      # types → no-CSS-Modules → tests → build → gate
pnpm dev         # the showcase site
```

`pnpm verify` is the whole contract. If it is green, the thing is shippable.

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

**3. There is no `dir` prop.**
Direction is derived from the locale via `Intl.Locale.getTextInfo()`. A wrong
direction is unrepresentable rather than discouraged.

**4. Logical utilities only.**
`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`. Physical utilities are banned by lint.
One `ml-2` in a shared component breaks Persian in every project that copied it.

**5. No CSS Modules.**
Styling lives in Tailwind utilities inside `cva()`, so `shadcn migrate rtl` and
`shadcn add --diff` can both see it. Enforced by a `find` in CI.

**6. Every rule has a poison fixture.**
A rule that has never been seen to fail is not a rule. This caught a real one:
`namedControls` originally swallowed an exception and reported green forever.

## The gates, in the order `verify` runs them

| gate | what it proves |
| --- | --- |
| `gate:types` | `LumoNode`, the closed `Locale` union, and every required string prop |
| `gate:no-css-modules` | the styling decision is real, not a comment |
| `gate:test` | 242 tests, including each gate's own poison fixtures |
| `gate:registry` | the manifest is derivable from the code, not hand-kept |
| `gate:smoke` | every item compiles as a **consumer** receives it, outside the workspace |
| `gate:html` | the bytes actually served are correct |

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
