/*
 * POISON — the four props this repository has already been bitten by, in the
 * shape they shipped in. See the README beside this file.
 *
 * Not compiled and not rendered: the gate parses it. The imports below are
 * deliberately absent for that reason — `createSourceFile` needs no resolution,
 * and a fixture that pulled in React would make the gate's own suite depend on
 * the library it grades.
 */

/** The overlay SURFACE, which does not own dismissal state. */
export interface DialogModalProps {
  children?: unknown;
  className?: string | undefined;
  /** Whether Escape dismisses the overlay. */
  isKeyboardDismissDisabled?: boolean;
}

export function DialogModal({ children, className }: DialogModalProps) {
  return <div className={className}>{children}</div>;
}

export interface ButtonProps {
  children?: unknown;
  isDisabled?: boolean | undefined;
  /** Whether the button is in a pending state. */
  isPending?: boolean;
  /** Whether to prevent focus from moving to the button on press. */
  preventFocusOnPress?: boolean;
}

export function Button({ children, isDisabled }: ButtonProps) {
  return <button disabled={isDisabled}>{children}</button>;
}

export interface FieldErrorProps {
  children?: unknown;
  className?: string | undefined;
  /** The element type to render. Defaults to `'span'`. */
  elementType?: string;
}

export function FieldError({ children, className }: FieldErrorProps) {
  return <span className={className}>{children}</span>;
}
