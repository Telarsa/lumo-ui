# Upstream draft — `[all components]` server-rendered controls have no accessible name

**Status:** DRAFT. Not filed.
**Kind:** bug report — WCAG 4.1.2 (Name, Role, Value) failure in the served bytes.
Not a feature request.
**Verified against:** `@base-ui/react@1.7.0`, React 19.2.8, read and rendered on 2026-08-11.
**Prior art searched:** no open or closed issue in `mui/base-ui` reports this. The nearest
neighbours are [#4142](https://github.com/mui/base-ui/pull/4142) (merged 2026-02-24), which
*introduced* the mechanism described below, and the in-flight work listed under "Timing".

---

## Summary

Every control Base UI names through `Field.Label` renders on the server with **no accessible
name at all**. Both of the library's naming routes are layout effects, and layout effects do
not run during `renderToString` / `renderToStaticMarkup`. The name appears only after
hydration.

This is not a hydration-mismatch nuisance. For the window between first paint and hydration —
and permanently, for a crawler, a reader with JavaScript disabled, or a page that fails to
hydrate — the document contains a `<span role="checkbox">` that a screen reader announces as a
bare "checkbox", with no indication of what it toggles.

The usual mitigation for a role-carrying `<span>` — wrap it in a `<label>` — **does not work
here**, for a reason that is specific to Base UI's DOM and shown below.

## Repro

```jsx
import { renderToStaticMarkup } from 'react-dom/server';
import { Checkbox } from '@base-ui/react/checkbox';
import { Field } from '@base-ui/react/field';

renderToStaticMarkup(
  <Field.Root>
    <Checkbox.Root />
    <Field.Label>Accept the terms</Field.Label>
  </Field.Root>,
);
```

Served HTML (styles trimmed):

```html
<div>
  <span data-unchecked role="checkbox" tabindex="0" id="base-ui-_R_3_" aria-checked="false"></span>
  <input id="base-ui-_R_0_" tabindex="-1" type="checkbox" aria-hidden="true" style="…"/>
  <label id="base-ui-_R_5_" for="base-ui-_R_0_">Accept the terms</label>
</div>
```

The same tree after hydration, for contrast — the only difference is the attribute that
matters:

```html
<span … role="checkbox" id="base-ui-_r_1_" aria-checked="false"
      aria-labelledby="base-ui-_r_4_"></span>
```

Two things in the server output are worth reading closely:

1. The `role="checkbox"` element carries **neither** `aria-labelledby` **nor** `aria-label`.
   It has no accessible name.
2. `<label for="base-ui-_R_0_">` points at the **`aria-hidden="true"` proxy input**. The label
   *is* associated with something — with an element that has been removed from the
   accessibility tree. So the label names nothing that a screen reader can reach.

### The wrapping-`<label>` workaround does not save it

```jsx
renderToStaticMarkup(
  <label><Checkbox.Root /> Accept the terms</label>,
);
```

```html
<label>
  <span data-unchecked role="checkbox" tabindex="0" id="base-ui-_R_1_" aria-checked="false"></span>
  <input tabindex="-1" type="checkbox" aria-hidden="true" style="…"/>
  Accept the terms
</label>
```

A native `<label>` names only *labelable elements*. A `<span>` carrying a role is not one, so
the wrapping label does not reach the exposed control. The only labelable element inside is
the proxy `<input>`, and it is `aria-hidden`. Same outcome: an unnamed checkbox in the served
bytes.

This is the part that makes the defect Base-UI-specific rather than a general SSR caveat.
Libraries that expose a real `<input>` as the control get named by the platform with no
JavaScript at all.

## Cause

Both naming routes are inside `useIsoLayoutEffect`, which is `useEffect` on the server — i.e.
never runs.

**Route 1 — the label registers its id into the field context.**
`utils/useRegisteredLabelId.js` (`.mjs` identical):

```js
export function useRegisteredLabelId(idProp, setLabelId) {
  const id = useBaseUiId(idProp);
  useIsoLayoutEffect(() => {
    setLabelId(id);                       // ← the only write, in a layout effect
    return () => { /* … */ };
  }, [id, setLabelId]);
  return id;
}
```

**Route 2 — the DOM fallback that scans for an associated `<label>`.**
`internals/labelable-provider/useAriaLabelledBy.js`:

```js
export function useAriaLabelledBy(explicitAriaLabelledBy, labelId, labelSourceRef,
                                  enableFallback = true, labelSourceId) {
  const [fallbackAriaLabelledBy, setFallbackAriaLabelledBy] = React.useState();
  const generatedLabelId = useBaseUiId(labelSourceId ? `${labelSourceId}-label` : undefined);
  const ariaLabelledBy = explicitAriaLabelledBy ?? labelId ?? fallbackAriaLabelledBy;

  useIsoLayoutEffect(() => {              // ← the fallback, also in a layout effect
    const nextAriaLabelledBy = /* … */ getAriaLabelledBy(labelSourceRef.current, generatedLabelId);
    if (fallbackAriaLabelledBy !== nextAriaLabelledBy) {
      setFallbackAriaLabelledBy(nextAriaLabelledBy);
    }
  });

  return ariaLabelledBy;
}
```

On the server, `labelId` is `undefined` (route 1 never fired) and `fallbackAriaLabelledBy` is
`undefined` (route 2 never fired). `ariaLabelledBy` is `undefined`, and the control renders
without the attribute.

Note that route 2 also *mutates the DOM* — `label.id = generatedLabelId` in
`getAriaLabelledBy` — which is a second reason it can only be a client-side operation as
written.

## Why this has not been noticed

It self-heals on hydration, so **every test tier except a served-bytes tier is green**. jsdom
tests, Testing Library queries, `getByRole('checkbox', { name })`, axe run in a browser — all
of them observe the post-hydration DOM and all of them pass. Only grading the actual HTML
output catches it.

For scale, from our own measurement: a Next.js site rendering 442 prerendered documents with
Base UI checkboxes, switches, selects and number fields carried **98 controls with no
accessible name** in the served HTML, across four components. Every one of those pages looked
correct in the browser and passed the component test suite.

## Affected

Anything Base UI exposes as a role-carrying element rather than a native control, whenever it
is server-rendered and named by a `Field.Label` (or by a wrapping `<label>`):

- `Checkbox` — `<span role="checkbox">`
- `Switch` — `<span role="switch">`
- `Select` — `<button role="combobox">`
- `Combobox` — `<input role="combobox">` when named by a `Field.Label`
- `Radio`, and by inheritance anything else built on `labelable-provider`

## Proposed fix — resolve `aria-labelledby` during render

`useAriaLabelledBy` already has a render-time path. Line 9 reads:

```js
const ariaLabelledBy = explicitAriaLabelledBy ?? labelId ?? fallbackAriaLabelledBy;
```

`explicitAriaLabelledBy` is consulted **first and synchronously**, ahead of both effects. So
the machinery to name a control during render exists; only the *id* is missing, because it is
published from an effect.

The fix is to make `Field.Label`'s id available during the render pass instead of after it:

1. **Mint the label id in `Field.Root`, in render.** `Field.Root` is the common ancestor of
   both the label and the control and it already renders before both. Generating
   `labelId = useBaseUiId()` there and putting it on the context value makes it readable by
   the control synchronously, on the server and on the client, with no effect involved.
   `Field.Label` consumes the same id rather than generating its own, so the two cannot
   disagree.
2. **Emit `aria-labelledby` on the control from that context value.** Keep
   `useRegisteredLabelId`'s effect as the reconciliation path for labels that mount, unmount
   or change id later — it is correct for those cases — but stop it being the *only* source
   of the first byte.
3. **Point `Field.Label`'s `for` at the exposed control, or drop it.** Today it targets the
   `aria-hidden` proxy input, which is a second, independent defect: the association exists
   but resolves to an element outside the accessibility tree. `aria-labelledby` on the control
   makes `for` redundant for naming; a click-to-toggle behaviour that currently depends on it
   should move to the control's own handler rather than to a hidden input.

The DOM-scanning fallback in route 2 can stay a layout effect. It is genuinely a client-side
concern — there is no DOM to scan on the server — and once route 1 resolves during render, the
fallback is only needed for the uncontrolled wrapping-`<label>` composition, where the correct
server-side answer is arguably a dev warning rather than a silent unnamed control.

### Interim, for anyone who lands here first

`aria-labelledby` passed as a **prop** is the one naming route Base UI already resolves during
render, per line 9 above. Minting an id in userland and threading it to both the label and the
control produces correct first-byte HTML today:

```jsx
const labelId = React.useId();
<Field.Root>
  <Checkbox.Root aria-labelledby={labelId} />
  <Field.Label id={labelId}>Accept the terms</Field.Label>
</Field.Root>
```

This works, and it is what we shipped — it took our 98 violations to 12, the remainder being a
composition where the consumer renders the label and the wrapper has no seam to inject
through. It is a workaround for an internal implementation choice, not a use of a documented
extension point, so it has to be re-verified on every upgrade. That is the cost this issue is
asking to remove.

## Timing

`atomiks` is actively refactoring `labelable-provider` right now, which is why this is worth
filing today rather than after the next release:

| PR | State (checked 2026-08-11 via the GitHub API) | Title |
| --- | --- | --- |
| [#5448](https://github.com/mui/base-ui/pull/5448) | **closed, NOT merged** — `"Splitting into separate PRs."`, 2026-08-10 | `[all components]` Fix labelable id registration and non-native label focus |
| [#5456](https://github.com/mui/base-ui/pull/5456) | open, 2026-08-10 | `[all components]` Fix label association when a control unregisters |
| [#5457](https://github.com/mui/base-ui/pull/5457) | open, 2026-08-10 | `[checkbox]` Fix stale and duplicated control ids |

A correction to note, because it changes what this draft should say: #5448 was **not** merged.
It was closed the same day and split into #5456 and #5457, both still open. The substantive
point is unaffected — the two open PRs are in exactly this code — but "merged" would have been
a factual error in a comment to a maintainer, and the two open PRs are the better place to
reference.

Both open PRs address *registration and id correctness*, which is the same subsystem but a
different axis: they make the effect-published id right, where this report is that the id is
published from an effect at all. Worth raising while the file is open rather than after.
