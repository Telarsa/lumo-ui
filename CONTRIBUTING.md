# Adding a component

Read `packages/ui/src/button.tsx` first. It is the exemplar and its header
comment states the rules; this file is the procedure around it.

## The loop

```bash
pnpm verify          # types → no-CSS-Modules → tests → build → gate
```

If `verify` is green the change is shippable. Nothing else is a gate.

## The five files

A component is not done until all five exist. The registry generator and the
site both derive from them, so a missing one shows up as a missing page rather
than as a warning.

```
packages/ui/src/<name>.tsx                 the component
packages/ui/src/<name>.test.tsx            behaviour under fa-IR
apps/website/src/lib/demos.tsx             a registry entry (title + intro, both locales)
packages/ui/src/index.ts                   the export
registry.json                              generated — run scripts/build-registry.mjs
```

## Taking a component from shadcn

Do not hand-type something upstream already has.

```bash
pnpm dlx shadcn@4.16.2 add @shadcn/<name> --base aria
```

Commit the raw emit as **one commit**, then apply Lumo changes as a **second**.
That keeps the diff reviewable and lets `shadcn add <name> --diff` show what
upstream changed later. A single squashed commit makes every future upgrade a
manual merge.

## The rules that will fail your build

**Logical utilities only.** `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`border-s`/
`rounded-ss`/`text-start`. A physical utility is caught by lint. There is no
exception for "it's only used in LTR" — a component is copied into projects you
will not see.

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

**State comes from RAC's `data-*` attributes**, styled with Tailwind `data-`
variants. Do not mirror state React already tracks:

```tsx
// yes
"data-hovered:bg-surface-hover data-focus-visible:outline data-disabled:opacity-50"

// no
const [hovered, setHovered] = useState(false)
```

## When React Aria leaks English

It leaks 8 strings on a Persian page; 5 are reachable by prop and are already
typed in `packages/core/src/strings.ts`. If you find a sixth:

1. Check whether a prop reaches it. Render with `renderToStaticMarkup` under
   `fa-IR` and grep the output — do not assume. `aria-roledescription` on
   NumberField sits on the `<input>`, not the `<Group>`; passing it to the wrong
   element emits **both** and English wins.
2. If a prop reaches it, add it to `LumoStrings` and make it required.
3. If nothing reaches it, record it in the `strings.ts` header with the evidence
   and open an upstream issue. Do not paper over it with a client-side
   dictionary: `LocalizedStringProvider` renders no children and only sets a
   `window` global, so it cannot affect server-rendered HTML at all.

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

## Adding a locale

1. Add the tag to `Locale` in `packages/core/src/types.ts`.
2. Add its complete string set to `STRINGS` in `strings.ts`. `satisfies
   Record<Locale, LumoStrings>` makes a missing key a compile error, and the
   parity tests catch an empty value, a half-translated string, or a function
   that ignores its argument.
3. Add it to `KNOWN` in `packages/gate/src/index.ts` with its direction.
4. Add its copy to `site` in `apps/website/src/lib/locale.ts`.

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
