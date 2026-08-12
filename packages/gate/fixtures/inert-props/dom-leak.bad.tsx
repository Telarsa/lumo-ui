/*
 * POISON — `form.tsx`'s `elementType`, the member of the class that produced
 * WRONG BYTES rather than no bytes.
 *
 * The prop is declared, never destructured, and rides `...props` onto a real
 * `<label>`. Measured against the library before the fix, React 19 logs
 * "React does not recognize the `elementType` prop on a DOM element" and serves
 *
 *     <label class="…" elementType="div">نام</label>
 */

export interface LabelProps {
  children?: unknown;
  className?: string | undefined;
  /** The element type to render. */
  elementType?: string;
}

export function Label({ className, ...props }: LabelProps) {
  return <label className={className} {...props} />;
}
