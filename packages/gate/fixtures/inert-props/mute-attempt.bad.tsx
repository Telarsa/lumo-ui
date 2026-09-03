/*
 * POISON — an `@forwarded` claim on a prop that is simply dropped.
 *
 * The tag is the gate's one escape hatch, so it is the one thing that must be
 * proved not to work as a mute button. `Field` below binds no rest and the name
 * `granularity` appears nowhere else in this file, so there is no delivery path
 * for the claim to describe, and the claim is refused. The gate's own suite
 * asserts this file still fails.
 */

export interface FieldProps {
  label: string;
  /**
   * The smallest unit the field edits.
   *
   * @forwarded `...rest` → the engine, honestly, I promise
   */
  granularity?: "day" | "hour" | "minute";
}

export function Field({ label }: FieldProps) {
  return <div>{label}</div>;
}
