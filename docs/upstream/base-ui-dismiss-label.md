# Upstream draft — `[combobox]` a prop for the internal dismiss button's `aria-label`

**Status:** DRAFT. Not filed. This is a comment to add to the existing issue, not a new issue.
**Target:** [mui/base-ui#5263](https://github.com/mui/base-ui/issues/5263) — open, filed 2026-07-17 by `vanwalj`.
**Verified against:** `@base-ui/react@1.7.0`, read from the installed dist on 2026-08-11.

---

## Do not open a new issue

`#5263` already says the thing. A core maintainer (`atomiks`) replied within five days
and did not defend the current behaviour:

> We were going to solve this with a translations provider (tbd). A prop can work in the
> meantime, but one concern is that this prop is something people aren't going to configure
> themselves as it's very hidden/niche/non-obvious. […] A translations provider would set it
> for them globally.

So the gap is acknowledged, an interim fix is pre-endorsed, and the design direction is
named. A duplicate issue would cost a maintainer triage time and buy nothing. What is
missing from the thread is a **concrete prop shape** and a **confirmation that the literal
is still unreachable at 1.7.0**. Both are below, and both are what a comment should carry.

---

## 1. Confirmation: still unreachable at 1.7.0

`combobox/utils/ComboboxInternalDismissButton.mjs`, unchanged in substance:

```js
// line 14 — the props argument is discarded at the signature
export const ComboboxInternalDismissButton = React.forwardRef(
  function ComboboxInternalDismissButton(_, forwardedRef) {
    // …
    const dismissProps = getButtonProps({ onClick: handleDismiss });
    return _jsx("span", {
      ref: mergedRef,
      ...dismissProps,
      "aria-label": "Dismiss",   // line 32 — AFTER the spread
      tabIndex: undefined,
      style: visuallyHiddenInput,
    });
  },
);
```

Four independent reasons it cannot be reached from userland, each checked against the
installed package rather than remembered:

1. **No props.** The first parameter is `_`. There is no object to override into.
2. **The literal wins anyway.** It sits *after* `...dismissProps` on line 32, so even a
   props path would lose to it.
3. **Not importable.** `package.json` declares 83 export subpaths; none of them resolves
   into `combobox/utils/`. Its `.d.ts` is `export {};`. Shadowing the module is not
   available either.
4. **Constructed by its parents, not composed by the consumer.**
   `combobox/input/ComboboxInput.mjs:368` renders one before the input and
   `combobox/popup/ComboboxPopup.mjs:115` renders a second after the popup. Neither
   forwards consumer props to it. Both `Combobox` and `Autocomplete` are affected;
   `Select` composes its own popup and is not.

There is also no fallback tier to reach it through: `@base-ui/react` ships no locale
bundles, no strings provider, no key namespace and no locale context. A repository-wide
grep for `i18n|localiz|translation` over all 3240 files in the package returns only CSS
`translate` offsets, date-format token names, and the word "translation" in one toast doc
paragraph.

## 2. Minimal repro

```jsx
import { renderToStaticMarkup } from 'react-dom/server';
import { Combobox } from '@base-ui/react/combobox';

const html = renderToStaticMarkup(
  <Combobox.Root items={['الف', 'ب']} open modal>
    <Combobox.Input aria-label="جستجو" />
  </Combobox.Root>,
);

console.log(html.includes('Dismiss')); // → true
```

Output (trimmed):

```html
<span role="button" aria-label="Dismiss" style="clip-path:inset(50%);…"></span>
<input role="combobox" aria-expanded="true" aria-haspopup="listbox"
       aria-autocomplete="list" aria-label="جستجو" value=""/>
```

Every other announced string on the page is Persian. This one is not, and there is no
prop, provider or bundle that changes it. An open modal combobox emits **two** of these
sentinels.

## 3. Proposed prop shape

Named to match the surrounding API rather than invented. `Combobox.Root` already takes
`locale`, `filter`, `modal`; a strings-shaped prop belongs beside them so it is set once
per combobox rather than once per part.

```ts
// combobox/root/AriaCombobox.d.ts
interface ComboboxRootProps<Value> {
  // …existing props…

  /**
   * Accessible names for the parts Base UI renders internally and the consumer
   * cannot reach. Merged over the English defaults, so a partial object is valid.
   * @default { dismiss: 'Dismiss' }
   */
  labels?: {
    /**
     * `aria-label` of the visually hidden dismiss sentinels rendered around the
     * popup while `modal` is set.
     */
    dismiss?: string;
  };
}
```

Threading, in full — three files, and no change to the rendered tree:

```js
// combobox/root/ComboboxRoot.mjs — put it on the store the sentinel already reads
const store = useComboboxStore({ /* … */, labels });

// combobox/utils/ComboboxInternalDismissButton.mjs
const store = useComboboxRootContext();
return _jsx('span', {
  ref: mergedRef,
  ...dismissProps,
  'aria-label': store.state.labels?.dismiss ?? 'Dismiss',
  tabIndex: undefined,
  style: visuallyHiddenInput,
});
```

`useComboboxRootContext()` is *already imported* by the sentinel (line 9) and already
called (line 15), so the value arrives through a path the component uses today. Nothing
new is subscribed to and nothing re-renders that did not before.

`Autocomplete` composes `Combobox.Root` and inherits the prop with no further work.

### Why an object and not `dismissLabel`

Because the next hardcoded string is cheaper to add than the next prop. An object gives
the translations provider a shape to merge *into* when it lands — `labels` becomes the
per-instance override of whatever the provider sets globally, which is the ordinary
precedence and needs no deprecation. A flat `dismissLabel` would have to be kept forever
beside the provider or removed in a breaking change.

### On the maintainer's objection

`atomiks` is right that a niche prop is easy to miss, and this proposal does not pretend
otherwise — a prop nobody sets leaves the default English in place, which is exactly
today's behaviour and no worse. What the prop buys is that the string stops being
*unreachable*. A team that has decided its product must announce nothing in English
currently has no remedy at all short of rewriting a literal inside an `@internal` file,
which cannot be locale-aware (no locale is in scope at that line) and carries no
compatibility promise across minors.

Two things that would address the discoverability concern directly, and neither blocks the
prop:

- A line in the combobox "Usage guidelines" page, which is where a reader looking for
  exactly this will go.
- A dev-only warning is **not** proposed. It would fire on every English application,
  which is most of them, and a warning everybody silences is worse than no warning.

## 4. Scope this deliberately leaves alone

- The translations provider. It is the right design and it is `tbd`; this comment is about
  the interim `atomiks` already accepted, so it should not be read as an argument against
  the provider or as a proposal for its shape.
- Every other announced string in the library. A census of all 3240 dist files found eight
  English strings and the other seven are already prop-reachable, so there is no second
  case to generalise from and no reason to widen the prop beyond `dismiss` today.
