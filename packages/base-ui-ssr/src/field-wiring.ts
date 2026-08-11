import { useId } from "react";

/**
 * How the label reaches the control.
 *
 * Two spellings, because the two SHAPES a field library composes in have
 * different owners and only one of them can prove a label exists.
 *
 *   "aria"    The WRAPPER renders the label, so it knows the label element is
 *             in the tree and can point the control at it with
 *             `aria-labelledby`. Checkbox, Switch and NumberField are this
 *             shape. It is also the only route that works for Checkbox and
 *             Switch at all: their control is `<span role="checkbox">` /
 *             `<span role="switch">`, and a native `<label>` names only
 *             labelable ELEMENTS — a span carrying a role is not one.
 *
 *   "native"  The CONSUMER renders the label, as a sibling the wrapper never
 *             sees: `<Select><Label>…</Label><SelectTrigger/></Select>`. The
 *             wrapper therefore CANNOT know whether a label exists, and
 *             `aria-labelledby` would be a guess — pointing at an id that may
 *             never be rendered, which is a DANGLING IDREF and a second defect
 *             class rather than a fix. So the arrow is reversed: the label
 *             carries `htmlFor` and the control carries the matching `id`. If no
 *             label renders, no attribute is emitted and nothing dangles. This
 *             is only available where the control is a real labelable element —
 *             Base UI's `Select.Trigger` renders a `<button>`, which is one.
 *
 * Measured, both routes satisfy an accessible-name grader on prerendered bytes;
 * the `native` arm is chosen for Select on the dangle argument alone.
 */
export type FieldWiringMode = "aria" | "native";

/** What the caller hands the hook: the CONTENT it is about to render, plus its own props. */
export interface FieldWiringInput {
  /** The visible label's content, or `undefined`/`null` when there is none. */
  label?: unknown;
  /** The description's content, on the same terms. */
  description?: unknown;
  /** The error message's content, on the same terms. */
  errorMessage?: unknown;
  /**
   * The caller's own props, read for `aria-label`, `aria-labelledby` and
   * `aria-describedby`. Naming a control the caller already named is the one
   * way this hook can make things WORSE, so it never does.
   */
  explicit?: Record<string, unknown> | undefined;
  /** See `FieldWiringMode`. Defaults to `"aria"`. */
  mode?: FieldWiringMode | undefined;
}

/**
 * Paired props, each spread onto exactly one element. Every field is optional
 * and absent means "do not wire it" — under `exactOptionalPropertyTypes` an
 * absent key and an `undefined` one are different things and only the absent one
 * is safe to spread.
 */
export interface FieldWiring {
  labelProps: { id?: string; htmlFor?: string };
  controlProps: { id?: string; "aria-labelledby"?: string; "aria-describedby"?: string };
  descriptionProps: { id?: string };
  errorProps: { id?: string };
}

/**
 * Wire a field's label, description and error to its control so the FIRST BYTE
 * carries them — not the first frame after hydration.
 *
 * ── THE BASE UI DEFECT THIS EXISTS FOR ──────────────────────────────────────
 *
 * Base UI names a control from `Field.Label` by publishing the label's id into a
 * context — and it does that inside `useIsoLayoutEffect`
 * (`utils/useRegisteredLabelId.js`), which does not run on the server. Its second
 * route, scanning the DOM for an associated `<label>`
 * (`internals/labelable-provider/useAriaLabelledBy.js`), is in a layout effect
 * too, and MUTATES the DOM (`label.id = generatedLabelId`), so it could never be
 * anything else. BOTH naming paths are therefore inert during a server render,
 * and `explicitAriaLabelledBy ?? labelId ?? fallbackAriaLabelledBy` yields
 * `undefined`.
 *
 * The consequence is not cosmetic and a wrapping `<label>` does not save it, for
 * the `role`-on-a-span reason given under `FieldWiringMode`. The served HTML
 * carries a control with NO accessible name, which a screen reader announces as
 * a bare "checkbox", and the name appears only after hydration. Measured on a
 * 442-document static export: 98 violations across four components.
 *
 * It self-heals on hydration, which is why it survived upstream review: jsdom,
 * Testing Library, `getByRole({ name })` and axe-in-a-browser all observe the
 * post-hydration DOM and all pass.
 *
 * ── AND THE SAME GAP ON THE DESCRIPTION, WHICH NOTHING GRADES ───────────────
 *
 * `Field.Description` reaches the control through the SAME labelable machinery —
 * `useFieldRootContext`'s `descriptionId`, registered from a layout effect — so a
 * server-rendered description is announced by nothing. Verified by rendering,
 * not by reading source: `renderToStaticMarkup` of a `Field.Root` containing a
 * `Field.Label`, a `Switch.Root` and a `Field.Description` emits `<p id="…">`
 * beside a `<span role="switch">` carrying no `aria-describedby` at all.
 *
 * This half had a violation count of ZERO in every instrument we own, because an
 * accessible-name rule grades names and an idref rule that included
 * `aria-describedby` would false-positive on other engines. Zero violations, real
 * loss: the help text under a field is simply not announced to a no-JS or
 * pre-hydration reader. WCAG 1.3.1 / 4.1.2.
 *
 * The fix is the same shape as the naming one and equally public: an
 * `aria-describedby` PROP is resolved during render, ahead of both effects. Base
 * UI honours a caller's `aria-*` over its own, at SSR and on the client. Both
 * ids are minted from ONE `useId` so server and client agree, and so that a
 * component pays one hook slot rather than three.
 *
 * ── WHAT IT NEVER DOES ─────────────────────────────────────────────────────
 *
 * It never relabels or re-describes a control the caller already named. A
 * `<Checkbox aria-label="انتخاب همه" />` in a table header has no visible label
 * to point at, and wiring `aria-labelledby` at an empty element would REPLACE a
 * correct name with none. Same for an explicit `aria-describedby`.
 *
 * ── THE MAINTENANCE THIS BUYS ──────────────────────────────────────────────
 *
 * This is a workaround for an implementation choice — registration inside a
 * layout effect — and not for a documented seam. Base UI can change it in a patch
 * release and every control wired through here goes quietly unnamed again. The
 * README says so under "what this costs to maintain", and the fixture that would
 * catch it is named there too.
 */
export function useFieldWiring({
  label,
  description,
  errorMessage,
  explicit,
  mode = "aria",
}: FieldWiringInput): FieldWiring {
  // Unconditional, and ONE call: hooks may not sit behind the branches below,
  // and three ids derived from one base cost one slot in the hook order.
  const base = useId();

  const props = explicit ?? {};
  const has = (value: unknown) => value !== undefined && value !== null;

  const wiring: FieldWiring = {
    labelProps: {},
    controlProps: {},
    descriptionProps: {},
    errorProps: {},
  };

  // ── the name ──────────────────────────────────────────────────────────────
  //
  // `has(label)` gates the ARIA arm only. In `"aria"` mode the reference points
  // FROM the control, so minting it without a label element to point at would
  // dangle. In `"native"` mode the reference points from the LABEL, so a label
  // that never renders emits nothing at all — there is no case to guard, and
  // the caller (Select) genuinely cannot answer the question anyway.
  const callerNamedIt =
    props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
  if ((mode === "native" || has(label)) && !callerNamedIt) {
    const labelId = `${base}label`;
    if (mode === "native") {
      const controlId = `${base}control`;
      wiring.labelProps = { id: labelId, htmlFor: controlId };
      wiring.controlProps.id = controlId;
    } else {
      wiring.labelProps = { id: labelId };
      wiring.controlProps["aria-labelledby"] = labelId;
    }
  }

  // ── the description, and the error, which is announced the same way ───────
  //
  // Only ids for content that is ACTUALLY RENDERED go in the list. The caller
  // passes the same values it branches its own JSX on, so the reference cannot
  // outlive the element it points at.
  if (props["aria-describedby"] === undefined) {
    const described: string[] = [];
    if (has(description)) {
      const id = `${base}description`;
      wiring.descriptionProps.id = id;
      described.push(id);
    }
    if (has(errorMessage)) {
      const id = `${base}error`;
      wiring.errorProps.id = id;
      described.push(id);
    }
    if (described.length > 0) wiring.controlProps["aria-describedby"] = described.join(" ");
  }

  return wiring;
}
