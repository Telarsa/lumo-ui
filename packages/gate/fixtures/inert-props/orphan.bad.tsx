/*
 * POISON — an exported props shape no component in the file takes.
 *
 * A shape can be detached by a rename, by a component moving out, or by a
 * parameter annotation that drifts. Whatever the cause, nothing can deliver
 * these props, and the export tells a consumer they are settable. `date-field.tsx`
 * reached this state through an intersection annotation the analyser could not
 * read, which is why the verdict is separate from `dropped`: it points at a
 * missing component rather than a missing line inside one.
 */

export interface DetachedFieldProps {
  label: string;
  /** Whether the hour is shown on a 12- or 24-hour clock. */
  hourCycle?: 12 | 24;
}

export function SomethingElse({ label }: { label: string }) {
  return <div>{label}</div>;
}
