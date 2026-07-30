# Lumo UI — how the pieces fit

One repository, four packages and a site. Same brand and GitHub organisation as
Tessalor; the name is a placeholder the owner will change.

```
packages/core     @lumo-ui/core     headless primitives. No styles, no deps.
                                  State on data attributes.
packages/theme    @lumo-ui/theme    the token contract + a generator that emits
                                  CSS custom properties, and the base reset
packages/ui       @lumo-ui/ui       styled components on top of core.
                                  Copy-in, like shadcn — you own the code
packages/blocks   @lumo-ui/blocks   larger compositions: forms, panels,
                                  empty states, assembled from ui
apps/website         the landing page and documentation
```

## The layering rule

Each layer may only reach one layer down. `blocks` uses `ui`, `ui` uses `core`
and `theme`, `core` uses nothing but Preact. A violation is the thing that turns
a component library into a tangle, so it is worth stating before there is
anything to tangle.

**`core` never imports `theme`.** The headless layer has to work for somebody who
throws our design away entirely — that is what makes it headless, and it is what
makes `ui` an honest demonstration rather than a privileged consumer.

## The docs site is built with the library

`apps/website` uses `@lumo-ui/ui` for its own interface — every button, dialog and
select on the documentation site is the component being documented.

This is not a cute detail. It is the only mechanism that reliably catches a
component that is technically correct and unpleasant to use. A library whose own
site is built with something else has no such feedback, and it shows.

## Why `data-*` and not a `classes` prop

```css
[data-lumo-trigger][data-state="open"] { border-color: var(--lumo-ring); }
[data-lumo-option][data-highlighted]   { background: var(--lumo-muted); }
```

A library that emits utility classes forces every consumer onto the same
toolchain and the same major version of it. A library that emits
`data-state="open"` forces nothing — it works with Tailwind, plain CSS, cascade
layers, or a `<style>` block.

It also puts styling back where the cascade can reach it. A `classes` prop
threaded through six sub-components — the Radix-era pattern — moves styling
decisions into JavaScript, where specificity, layers and media queries cannot
help.

## Why it exists at all

Preact has no mature headless UI library. React has Base UI, Radix and Ariakit;
Solid has Kobalte; Svelte has Bits UI. Preact applications hand-roll their
primitives, ship `preact/compat` to borrow React's, or give up and use platform
controls.

The compat route is worse than it sounds, and it was measured rather than
assumed: **Base UI under `preact/compat` crashes during server rendering** —
`Cannot read properties of null (reading 'useContext')` — and installing it
pulls real `react` and `react-dom` as peers. It is React with an alias, at
React's price, on every page.

## Status

`@lumo-ui/core` has `Select`, implementing the full WAI-ARIA listbox pattern. It
renders a native `<select>` on a coarse pointer, deliberately: the reason to
replace a select is that the *desktop* OS popup looks foreign, while on a phone
iOS's wheel picker beats anything we could build.

Everything else is scaffolding.
