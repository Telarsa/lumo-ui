import { useId } from "react";

/**
 * How the label reaches the control. `"aria"`: the WRAPPER renders the label
 * and points the control at it (`<span role>` is not labelable). `"native"`:
 * the CONSUMER renders the label as a sibling (Select), so label `htmlFor` →
 * control `id`, and nothing dangles when no label renders.
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
  /** The caller's own props, read for `aria-label`, `aria-labelledby` and `aria-describedby`; a control the caller named is never renamed. */
  explicit?: Record<string, unknown> | undefined;
  /** See `FieldWiringMode`. Defaults to `"aria"`. */
  mode?: FieldWiringMode | undefined;
}

/** Paired props, each spread onto exactly one element. Absent means "do not wire it". */
export interface FieldWiring {
  labelProps: { id?: string; htmlFor?: string };
  controlProps: { id?: string; "aria-labelledby"?: string; "aria-describedby"?: string };
  descriptionProps: { id?: string };
  errorProps: { id?: string };
}

/**
 * Wire a field's label, description and error to its control so the FIRST BYTE
 * carries them. Base UI registers `Field.Label`/`Field.Description` ids from a
 * layout effect, so the served control has no name and no description (it
 * self-heals on hydration, which is why jsdom and axe pass). The fix is public:
 * `aria-labelledby`/`aria-describedby` PROPS resolved during render, all ids
 * from ONE `useId`. Never relabels a control the caller already named. README.
 */
export function useFieldWiring({
  label,
  description,
  errorMessage,
  explicit,
  mode = "aria",
}: FieldWiringInput): FieldWiring {
  // Unconditional, ONE call: hooks may not sit behind the branches below.
  const base = useId();

  const props = explicit ?? {};
  const has = (value: unknown) => value !== undefined && value !== null;

  const wiring: FieldWiring = {
    labelProps: {},
    controlProps: {},
    descriptionProps: {},
    errorProps: {},
  };

  // `has(label)` gates the ARIA arm only: in "aria" mode the reference points
  // FROM the control and would dangle without a label; in "native" mode it
  // points from the label, so an unrendered label emits nothing.
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

  // Only ids for content that is ACTUALLY RENDERED go in the list, so the
  // reference cannot outlive the element it points at.
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
