# Adding a component

Read `packages/ui/src/button.tsx` first. It is the exemplar and its header
comment states the rules; this file is the procedure around it.

## The loop

```bash
pnpm verify          # types → inert props → lint → no-CSS-Modules → tests → build → gate
pnpm lint            # just the source policy, on its own
```

If `verify` is green the change is shippable. Nothing else is a gate.

## The five files

A component is not done until all five exist. The registry generator and the
site both derive from them, so a missing one shows up as a missing page rather
than as a warning.

```
packages/ui/src/<name>.tsx                 the component
packages/ui/src/<name>.test.tsx            behaviour under fa-IR
apps/website/src/examples/<name>.tsx       the page: meta (title + intro + tier, both locales) and examples
packages/ui/src/index.ts                   the export
registry.json                              generated — run scripts/build-registry.mjs
```

## Writing a component

Lumo's components are its own. Before writing one, check `catalog.json` /
`lumo search` for an existing family that already covers the need, and read the
closest sibling's source — the shape (props docblocks, required announced
strings, `formatNumber`, the `<name>.variants.ts` cva file, `data-lumo`
markers, first-byte naming) is the contract every new module must meet, and
the gates below enforce it. Commit the new component with its five files (see
above), its examples page, a popup-tier case if it opens anything, and a
behavioural mutation operator; regenerate registry, API reference and catalog.

## The rules that will fail your build

**Logical utilities only.** `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`border-s`/
`rounded-ss`/`text-start`. A physical utility is caught by lint. There is no
exception for "it's only used in LTR" — a component is copied into projects you
will not see.

That sentence was **false until 12 Aug 2026**: the policy in
`packages/config/eslint/lumo.mjs` was real and nothing ran it. It runs now, over
every package and the site, as `pnpm lint` and as `gate:lint` inside `verify`.
Read docs/decisions/log.md §16 before adding a rule to it — the first real run was 34
parts prose to 3 parts false positive, and what it MISSED (`md:ml-4`) mattered
more than what it found.

Two limits, stated so you do not trust the rule further than it goes. Lint sees
class strings in a `className` attribute or in a `cva`/`cn`/`clsx`/`tv`/
`twMerge` argument, and nowhere else — a class assembled through a variable is
invisible to it, and to the styling floors. And `inset-x-*` and `space-x-*` are
NOT flagged, because on the pinned tailwindcss they compile to `inset-inline` and
`margin-inline-start`/`-end`: they are already logical, and there is nothing to
migrate them to.

**`children?: LumoNode`, never `ReactNode`.** A bare number renders Latin digits.
If you need to show one, format it:

```tsx
import { formatNumber } from "@lumo-ui/core";
<span>{formatNumber(count, locale)}</span>
```

**Any string a screen reader announces is a required prop.** Not optional with a
default — required, typed `string`. An icon-only control takes a required
`label`. This is the rule people push back on; it exists because a default is a
promise the library cannot keep in a language it does not speak.

```tsx
export interface IconButtonProps {
  label: string;        // required. an icon is not a name.
}
```

**Never write `<html>`.** Use `LumoHtml` from `@lumo-ui/core`. It derives `dir`
from the locale, so there is no way to pass a wrong one.

**State comes from Base UI's `data-*` attributes (`data-open`, `data-checked`, `data-disabled`, `data-focused`…)**, styled with Tailwind `data-`
variants. Do not mirror state React already tracks:

```tsx
// yes
"data-hovered:bg-surface-hover data-focus-visible:outline data-disabled:opacity-50"

// no
const [hovered, setHovered] = useState(false)
```

## The root contract: `ref`, `id`, and what a component owns

**Extend the DOM surface of the element you render, `Omit` what you own, and
spread the rest.** The decision and the argument are in
`packages/core/src/props.ts`; `button.tsx` restates it at the exemplar. The rule
in one line:

```tsx
export interface CardProps
  extends Omit<ComponentProps<"div">, "children" | "className">, VariantProps<typeof cardVariants> {
  children?: LumoNode;              // narrowed — never ReactNode
  className?: string | undefined;   // merged last by cn(), never replaced
}
```

**`ComponentProps<E>`, never `HTMLAttributes<T>`.** Under React 19 `ref` is an
ordinary prop and the first carries it while the second does not. That single
token is the entire `ref` story — no `forwardRef`, no ceremony — and it is why
this shape was chosen over a hand-listed `attr()` allow-list. It was a coin flip
until 12 Aug 2026: 21 files reached for one base and 10 for the other, so whether
`<Card ref={r}>` compiled was an accident nobody had chosen.

**`ref` and `id` are the floor.** They may be OWNED — the component reads or
writes them, so a caller's value would *replace* its own — or WIDENED, when the
root is chosen at run time. They may never be quietly cut. Say which, on the
line; the gate fails an unexplained subtraction.

```tsx
// OWNED. `table.tsx`: the grid reads cell coordinates out of its own ref, and
// its onKeyDown IS the arrow-key model. Both accepted plus `{...props}` last is
// how every arrow key silently stopped working.
extends Omit<ComponentProps<"table">, /* why */ "ref" | "onKeyDown" | …>

// WIDENED. `stack.tsx`: `tag` picks the element, so Ref<HTMLDivElement> would
// type-check and be wrong.
ref?: Ref<HTMLElement> | undefined;
```

**Where a displaced attribute fails silently, spread `{...props}` FIRST** and
write what you own after it. This is the reverse of the house order and is
deliberate on every root that writes an attribute its own behaviour then reads
back — `Table`, `ListBox`, `VirtualList`, `Tree`, `Gantt`, `Kanban`, `Sortable`,
`FileUpload`. `Omit` protects a TypeScript consumer; this library is distributed
by copying source into other projects, several of which are not TypeScript.

`pnpm gate:props` runs both source rules. The second one, `root-contract`, fails
on `HTMLAttributes` as a base, on a DOM surface that is inherited and never
spread, and on an unexplained `ref`/`id` subtraction. Fixtures are in
`packages/gate/fixtures/root-contract/`, one per verdict plus `good.tsx`.

## When the engine leaks English

Base UI writes almost no announced strings itself; the one it hardcodes is
`aria-label="Dismiss"` on the internal dismiss sentinel of every open
combobox-family popup (mui/base-ui#5263). Lumo relabels it live from a REQUIRED
`dismissLabel` prop. If you find another:

1. Prove it: render the OPEN state under `fa-IR` (the popup-interiors tier does
   this for 18 families) and read the served/live attributes — do not assume.
2. If a prop reaches it, add the string to `LumoStrings` and make it required.
3. If nothing reaches it, relabel the live element the way `relabelEngineDismiss`
   in `@lumo-ui/base-ui-ssr` does (called from `combobox.tsx` and
   `multi-select.tsx`), record the defect in `docs/upstream/`, and do not paper over it with a
   client dictionary — anything that only runs after hydration cannot fix the
   first byte.

## Adding a gate rule

Every rule needs a poison fixture, and the self-test asserts the fixture exists:

```
packages/gate/fixtures/<rule-id>.bad.html    must fail the rule
packages/gate/fixtures/good.html             must still pass
```

Then check the rule can actually fail — break it deliberately and watch the
suite go red. A rule that has never been observed failing is decoration. One
shipped in this repo that swallowed an exception and reported green forever; the
fixture caught it within a minute.

Three more things the Phase 3 rules made explicit, each of which cost a rewrite
to learn:

**Measure the rule against the real export before settling its scope, not
after.** The scope you would write from the description is usually wrong about
the bytes. `native-script-text` was specified per text NODE and reported 178
findings, 40 of which were phantoms: linkedom splits a text node at every
`&quot;`, so one Persian sentence quoting a prop value arrives as five nodes and
two of them hold no Persian at all. Grading an element's own text instead gives
138, of which every single one is a real string. `unique-ids` was specified with
a `<pre>`/`<code>` carve-out that turned out to be a no-op — 0 of 8,846 elements
carrying an `id` are inside one, because a highlighted listing renders `id="…"`
as text and never as an attribute — so the carve-out was not written, and the
measurement was written into the rule's header instead. An exemption needs
evidence, not plausibility (docs/decisions/log.md §13).

**A rule that would need many exemptions to be usable grades nothing — say so
and do not ship it.** The bar is not "the export is green". Three of the four
Phase 3 rules landed with live findings and that is correct. The bar is that the
findings are *fixable defects* rather than a standing tax: 138 `native-script-text`
violations sound like a lot until you see they are two strings, a footer brand
and one 404 line, each fixed by one attribute.

**When two rules genuinely overlap, declare it rather than design around it.**
`gate.test.ts`'s `IMPLIES` table names the pairs where one poison legitimately
trips two rules — a dangling `aria-labelledby` means the control has no name, a
Latin `aria-label` on a control IS that control's computed name. Everything not
in that table is a fixture testing more than one thing.

## The other gate: props that are accepted and never delivered

`pnpm gate:props` grades SOURCE, not HTML, because this defect usually produces
no bytes at all. It fails on a prop a component file declares and does not
deliver — the class that has already cost this repository four postmortems
(`isPending`, `preventFocusOnPress`, `isKeyboardDismissDisabled`, `form.tsx`'s
`elementType`, which served `<label elementType="div">` to every reader).

Three answers when it fires, in order of preference:

```tsx
{...attr("allowWheelScrub", …)}   // TRANSLATE — the engine has it under another name
isKeyboardDismissDisabled          // RELOCATE — to the part that owns the state
                                   // DELETE — a prop that reaches nothing is not declared
```

The React Aria compatibility carriers (`?: undefined`) that used to be the third
answer are gone (15 Aug 2026): Lumo's API is Lumo's, and a name with no
destination is removed rather than carried. `?: undefined` remains correct for
DISCRIMINATED-UNION ARMS (`StaticAlertProps { onClose?: undefined }` beside
`DismissibleAlertProps { onClose: () => void }`) — never `?: never`, which under
`exactOptionalPropertyTypes` rejects an explicit `undefined` and breaks spreads.

The fourth answer is a claim, and it is checked:

```tsx
/** @forwarded `...rest` → `Slider.Root` → the hidden `<input type="range">`. */
step?: number;
```

`@forwarded` clears a prop that rides a rest spread the gate cannot follow. It is
admissible only when the gate can independently see a delivery path, so it cannot
be used on a prop that is simply dropped — `fixtures/inert-props/mute-attempt.bad.tsx`
is the test that keeps it that way. Write the destination and the evidence you
measured, not "forwarded".

Fixtures live in `packages/gate/fixtures/inert-props/`, one per failing verdict
plus `good.tsx`, which holds the three legitimate reasons a prop can be
unreferenced and must stay clean.

## Adding a locale

The goal is that adding German or Arabic is **translation work**, not
engineering. It is close to that now, and the list below is the whole distance.

Steps 1–5 are enforced: a `Record<Locale, …>` somewhere turns a missing entry
into a compile error. Steps 6–9 are **not**, and each is a place where a new
locale renders plausible-looking output that is quietly wrong — so they are
written out rather than left to be rediscovered.

### The library

1. Add the tag to `Locale` in `packages/core/src/types.ts`. Direction is NOT
   part of this — `direction()` derives it from `Intl`, so there is no table to
   forget.
2. Add its complete string set to `STRINGS` in `strings.ts`. `satisfies
   Record<Locale, LumoStrings>` makes a missing key a compile error, and the
   parity tests catch an empty value, a half-translated string, or a function
   that ignores its argument.
3. Add its entry to `FORMAT_LOCALE` (`types.ts`). The compiler demands the key;
   it cannot check the **value**, and the value is a judgement call. Note in
   particular that Persian and Arabic do not share a numbering system: Persian
   is `nu-arabext` (U+06F0–U+06F9) and Arabic is `nu-arab` (U+0660–U+0669), nine
   code points apart and visually distinct to a reader of either. Pick the
   calendar deliberately too — `ar-SA` wants `ca-islamic-umalqura`, not the
   Gregorian default. This tag is for FORMATTERS only; `<html lang>` stays a
   plain language tag, because that is what picks a screen reader's voice.

### The gate

4. Add it to `KNOWN` in `packages/gate/src/index.ts` with its direction **and
   its numbering system**. These are independent properties and the gate needs
   both: the digit rules were once written against a literal Persian range, so
   a flawless Arabic page scored zero native digits and could never meet a
   floor. Then add a fixture under `packages/gate/fixtures/locales/` — a
   parametrisation with one instantiation is indistinguishable from a hardwire,
   and the self-test fails if a non-Latin-numbering locale in `KNOWN` has none.
5. Add its number-bearing routes to `apps/website/gate.floors.json`, mirroring
   the `fa-IR` entries. **Nothing enforces this**, and its absence is the
   vacuous pass the floor rule exists to prevent: with no floor declared, a page
   in the new locale that renders no numbers at all satisfies "no Latin digits"
   trivially. The CLI only catches the opposite mistake — a floor naming a route
   the build stopped producing.

### The site

6. Add its copy to `site` and its endonym to `LOCALE_NAMES`, both in
   `apps/website/src/lib/locale.ts`. Both are full `Record<Locale, …>`, so both
   are compile-enforced. The endonym is the name the language uses for ITSELF —
   a reader stranded on the wrong locale scans the menu for that, not for its
   English name.
7. Give it a font stack in `apps/website/src/app/globals.css`. The stacks are
   keyed by `html[lang]`, and a locale with no rule of its own silently inherits
   the `:root` default, which leads with the Latin face. That is right for
   German and wrong for any Arabic-script locale, where it means OS-substituted
   glyphs on a page that ships a designed face.
8. **If the locale is Arabic-script, extend the script rules in
   `packages/theme/src/tokens.css`** — the `lumo.script` layer, not this app.
   Letter spacing severs the joins between Arabic-script letters — spaced-out
   text is not a word, it is disconnected letters — so an Arabic page would
   inherit the defect the Persian rule exists to fix, with nothing on screen
   that a reviewer who does not read the script would notice. The same layer
   carries the per-size leading ramp, for the same reason: Arabic script needs
   more leading than Latin, and a locale added without it ships Latin leading.

   This step used to say "the same file", meaning `globals.css`, and pointed at
   a guard keyed to two utility names. Both facts changed on 12 Aug 2026: the
   guard is now a `[class*="tracking-"]` whitelist so it fails CLOSED for
   utilities that do not exist yet, and it moved into the theme because a
   site-only guard leaves every other consumer of the library shipping the
   defect. Splitting the Persian script rules across two files is what let the
   gap hide in the first place.
9. Extend `normalize()` in `apps/website/src/lib/search-index.ts` if the locale
   needs folding the current steps do not cover. It already folds ZWNJ, Arabic
   combining diacritics, the two Arabic/Persian letter pairs, and BOTH digit
   ranges — so an Arabic locale needs nothing new. German does: `toLowerCase()`
   leaves an umlaut an umlaut, so a query typed `uber` will not find a title
   spelled `Über` until ä/ö/ü/ß fold to a/o/u/ss. Add a rule and a
   failing-without-it case in `search-index.test.ts`, which is the file's
   convention.

### Site copy is a `Record<Locale>` map, never a binary ternary

This is the rule the whole recipe rests on, and the one that is easiest to
break by hand:

```tsx
// no — compiles fine with a third locale, and serves it the ENGLISH branch
<h2>{lang === "fa-IR" ? "پیش‌نمایش" : "Preview"}</h2>

// yes — adding a locale is now a compile error naming every string still to do
const COPY = {
  "fa-IR": { preview: "پیش‌نمایش" },
  "en-US": { preview: "Preview" },
} as const satisfies Record<Locale, { preview: string }>;
<h2>{COPY[lang].preview}</h2>
```

The ternary is not a style preference. It **type-checks** with three locales,
it renders, it looks correct in review, and the HTML gate cannot see it either,
because the branch it wrongly serves is Latin script exactly like the branch it
should have served — the same shape as every other defect in this repository's
ledger. A `Record<Locale, …>` moves the failure to compile time and lists the
work.

Precedent: the site carried **154** of these across sixteen files, densest in the
prose docs pages; all 154 are now maps. Around a third sat in `aria-label`s and
screen-reader-only text, where nothing visible would ever have revealed the
miss. The sweep was verified by rendering every affected page in both locales
before and after and diffing the markup — byte-identical, so the maps changed
what a third locale would get and nothing about what the two shipped locales
get.

Two ternaries in that sweep were **logic**, not copy, and got a different fix:
`lang === "fa-IR" ? "en-US" : "fa-IR"` picked the locale a side-by-side exhibit
mirrors against, and silently meant "the other one of our two". It is now
`oppositeDirectionLocale()` in `lib/locale.ts`, which asks for a locale whose
`direction()` differs — the question the exhibit was actually asking. When a
ternary picks classes or logic rather than text, derive it from `direction()`;
only text belongs in the copy map.

**The sweep is NOT finished, and this is the honest count.** Round 4 converted
154 occurrences across 16 owned files and proved byte-identical output for both
locales. It did not touch `apps/website/src/lib/blocks.tsx`, which alone holds
**402** more — every block's gallery copy — because a sibling agent owned that
file the same hour. Two more sit in `demo-frame.tsx`. So:

```
converted   154   docs pages, component/block pages, chrome, install tabs
remaining   404   blocks.tsx (402) · demo-frame.tsx (2)
```

Until those are converted, adding a third locale would compile and hand German
the English half of four hundred block strings. **Anyone adding a locale must
finish this sweep first** — it is a prerequisite, not a cleanup task, and it is
listed as such in docs/history/roadmap-2026-08.md.

There is no partial locale and no fallback. A fallback is what puts an English
word in a Persian sentence.

## Dependencies

The catalog in `pnpm-workspace.yaml` names every version once. Anything that can
change rendered output or an accessible name is pinned **exactly**, so an
upstream change arrives as a reviewed bump that turns a gate red once — never as
a silent difference between a laptop and CI.

`minimumReleaseAge: 1440` refuses anything published in the last 24 hours. When
it blocks you, pin one release behind rather than adding an exclude. The cooldown
is the policy; bypassing it for convenience is how it stops meaning anything.
