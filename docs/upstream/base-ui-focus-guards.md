# Upstream note — Base UI focus management as axe sees it (three findings)

**Observed 15 Aug 2026, Chromium (Playwright), `@base-ui/react` 1.7.0**, on the
built `fa/components/navigation-menu/` page with a menu open: the engine
renders `span[data-base-ui-focus-guard][aria-hidden="true"]` elements with
`tabindex="0"` around the open popup so Tab wraps inside it. axe-core flags each
as `aria-hidden-focus` (serious): "focusable content should have tabindex=-1 or
be removed from the DOM".

Two more from the same run:

- **Menubar** (`fa/components/menubar/`, one menu open): the guards — plus an
  `aria-owns` span — are injected as direct children of the `role="menubar"`
  element, so axe reports `aria-required-children` (critical): a menubar whose
  children are not all menuitems.
- **Combobox and MultiSelect** (Lumo's is built on `Combobox`; `modal` left at
  its default `false`): with the list open, the rest of the document is marked
  `aria-hidden="true"` (the app wrapper, the site header, …) but is not `inert`,
  so every focusable control on the page trips `aria-hidden-focus` (serious).
  `Select` does not do this.

This is the Floating UI focus-manager pattern; the guards exist to catch focus
leaving the popup and are hidden from the accessibility tree on purpose. A
screen reader in browse mode can still land on them for a moment. Lumo does not
render them and cannot remove them without disabling focus management.

Status: **not filed** (filing upstream is an owner decision — Task 11). In the
evidence suite the navigation-menu case runs axe and records the finding as a
`fixme` annotation pointing here instead of failing. Re-check on every Base UI
upgrade; delete this file when the engine changes.
