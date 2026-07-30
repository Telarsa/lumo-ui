# Lumo UI

Two packages and a site.

| | What it is |
| --- | --- |
| **`@lumo-ui/core`** | Headless primitives for Preact. No styles, no dependencies. State is exposed as `data-*` attributes and you style it with CSS |
| **`@lumo-ui/ui`** | Styled components built on the core, in the shadcn tradition: you copy them into your project and own the code, rather than installing a black box |
| **`apps/site`** | Documentation and the landing page |

## Why it exists

Preact has no mature headless UI library. React has Base UI, Radix and Ariakit;
Solid has Kobalte; Svelte has Bits UI and Melt. Preact has essentially nothing,
which means every Preact application either hand-rolls its primitives, ships
`preact/compat` to borrow React's, or gives up and uses the platform controls.

The compat route is worse than it sounds: Base UI under `preact/compat`
**crashes during server rendering** — `Cannot read properties of null (reading
'useContext')` — and installing it pulls real `react` and `react-dom` as peers.
It is React with an alias, at React's price.

## The styling contract

No classes, no style props, no theme object. Components expose state as data
attributes:

```css
[data-lumo-trigger][data-state="open"] { border-color: var(--ring); }
[data-lumo-option][data-highlighted]   { background: var(--muted); }
[data-lumo-option][data-selected]      { font-weight: 550; }
[data-lumo-option][data-disabled]      { opacity: 0.5; }
```

That is the direction Base UI, Ark and Bits UI have all converged on, and the
reason is worth stating plainly: **a library that emits utility classes forces
every consumer onto the same toolchain and the same major version of it.** A
library that emits `data-state="open"` forces nothing. It works with Tailwind,
with plain stylesheets, with cascade layers, with a `<style>` block.

It also puts styling back where the cascade can reach it. A `classes` prop
threaded through six sub-components — the Radix-era pattern — moves styling
decisions into JavaScript, where specificity, layers and media queries cannot
help you.

## The platform wins where it is better

`Select` renders a **native `<select>` on a coarse pointer**. The reason to
replace a select is that the desktop OS popup looks foreign inside a designed
interface. On a phone that inverts: iOS gives a wheel picker, Android a
full-screen list, and neither is reproducible in a div. So the custom listbox is
a desktop affordance and touch keeps the platform control.

Which means the library is never the *worse* choice: where a custom listbox is
weakest — touch, mobile screen readers — it does not run.

## Status

Early. `Select` is implemented against the full WAI-ARIA listbox pattern:
`aria-activedescendant` rather than roving focus, type-ahead, Home/End, Escape
closing without committing, disabled options skipped rather than landed on.

MIT.
