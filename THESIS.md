# What Lumo UI is for

Written 30 July 2026, after a spike that changed the plan. `DECISIONS.md` holds
the measurements; this holds what they mean.

## The one-line version

**DaisyUI's idea, without Tailwind, on primitives that did not exist when
DaisyUI was designed — and you opt into JavaScript per component rather than up
front.**

Astro's argument, applied one level down.

---

## What the spike changed

The original plan was "Ark UI's component layer, for Preact, on Zag". A real
`@zag-js/combobox` island measured against Tessalor's gates said otherwise:

- **42.7 KB** for a page containing one combobox and nothing else — more than
  `/money/compound-interest`, which is a full calculator with decimal.js, a
  chart and a table.
- Server-rendered, Zag's positioner emits an inline `style` attribute and fails
  a CSP carrying no `'unsafe-inline'` for styles.

**Preact was ~11% of that weight.** The rest is the machine, the collection
logic and the positioning engine — and all of it is framework-agnostic, so it
ships identically in the React, Svelte, Solid and Vue adapters.

That is the finding the library is now built around: **headless component
libraries are expensive, and the expense follows you to every framework.**
Choosing a lighter runtime does not help. Not needing the component does.

---

## Why now is a better moment than 2021

DaisyUI proved CSS-only components work. The platform has since taken over most
of what forced components into JavaScript:

| Primitive | Replaces |
| --- | --- |
| `popover` attribute | top layer, light-dismiss, focus management |
| `<dialog>` + `showModal()` | focus trap, inert background, backdrop |
| **CSS anchor positioning** | **a positioning engine — most of that 38 KB** |
| `:has()` | lifting state into JS just to react to it elsewhere |
| `@layer`, `light-dark()`, `@property` | Tailwind's cascade management and theming |

Anchor positioning is the decisive one, and **its browser support must be
verified before the CSS layer is designed around it.** Firefox has historically
lagged there. This is recorded as an open question rather than an assumption.

---

## The two layers, and the opt-in between them

Every other library makes you choose up front. DaisyUI is CSS and leaves you
stranded when you need a real combobox; Ark UI is JavaScript and charges 40 KB
for a button.

| Layer | Ships | Model | Covers |
| --- | --- | --- | --- |
| **CSS** | 0 KB JS | **dependency** | Buttons, cards, tabs, accordions, modals, simple dropdowns — anything whose state the platform already models |
| **Behaviour** | Zag machines | **copy-in** | Filtered comboboxes, date pickers, virtualised collections, toast queues — derived, async or collective state |

**The split is not a compromise, it maps onto what each layer is.** A stylesheet
is a contract you want maintained underneath you — bug fixes, new browser
features, better fallbacks — and theming is already solved by custom properties,
so a dependency costs no control. Component logic is code you will need to
*edit* the moment it meets your validation, your analytics, your async source;
a dependency turns that into a wrapper, then a fork, then resentment. This is
what shadcn got right.

### Where the line falls

Not bundle size. **Whether the component's state can be represented by a native
element's state.**

- **CSS wins** when state is boolean-ish and local — open, checked, selected,
  focused. The platform stores it and `:has()` lets anything react to it.
- **JavaScript wins** when state is derived, async or collective — which of 200
  filtered items is active, what the debounced query returned, where roving
  focus sits, what is in the portal and what must be inert.

Size only decides how much it hurts when you cross the line.

### Be honest about the ceiling

A CSS dropdown built on the checkbox-label hack has no `aria-expanded`, no focus
trapping, no Escape handling and no type-ahead. It looks right and is not
equivalent. **A library that implies otherwise is worse than one that says where
CSS stops.** Each component documents which layer it is honest in.

---

## The problem that decides whether this is a product or a slogan

**A `<details>`-based dropdown and a Zag combobox do not share a DOM shape.**
Different elements, different ARIA, different focus model. "Drop-in
replacement" only works if a *single markup and class contract* satisfies both
implementations — designed before either exists.

That will force compromises on both sides. The CSS version cannot use
`<details>` if the JS version needs `role="combobox"` on an input, so disclosure
state would have to be hand-rolled in CSS rather than obtained free.

**Prototype this on exactly one component before writing any others.** If one
dropdown can be expressed once and driven by either backend, there is a product.
If it cannot, these are two libraries in a trenchcoat and should ship as two.

---

## Sequencing: not yet, and not because of Tessalor

**Tessalor finishes first.** 179 tools remain, and the catalogue's whole
economic argument is that a tool takes an hour. Lumo UI is a second product with
its own docs site, release process, issue tracker and support burden.

And it must not be justified by Tessalor's needs, because **Tessalor is not its
best customer.** By this architecture the catalogue uses the stylesheet layer
and almost none of the JavaScript layer — the chart type toggle, the category
menu and the OS dropdown were all rebuilt this session as radio inputs,
`<details>` and other native disclosures, at 0 KB each. That is the correct outcome,
not a failure of the library.

The right order is to finish the 200 and **keep a note, per component, of where
the platform ran out.** That list becomes Lumo UI's component list — every entry
with a real user behind it, which is the difference between a library people
adopt and one people star.

---

## Open questions, in the order they should be answered

1. **CSS anchor positioning support.** Verify before designing the CSS layer
   around it. It is what makes a zero-JS positioned dropdown viable.
2. **The dual-implementation dropdown.** One component, one contract, both
   backends. This single spike tests the entire thesis.
3. **Cost per Zag component.** Combobox was deliberately the worst case — the
   only one carrying a positioning engine. If a dialog is 5–6 KB the behaviour
   layer is viable as it stands and combobox is simply the outlier to document.
4. **How much of that 42.7 KB was `preact/compat`.** Still unmeasured, and it is
   the one number that would apply to every component.

## Licence

Ark UI, Zag.js and DaisyUI are all MIT. Their work may be used, adapted and
redistributed commercially, provided the copyright notice travels with anything
actually copied. Most of it should not be copied — DaisyUI's source is
Tailwind-plugin-shaped and Ark UI's is React-shaped, so neither transfers. What
is worth taking from both is the **API shape**, which is not meaningfully
copyrightable and is the part that makes a library learnable.
