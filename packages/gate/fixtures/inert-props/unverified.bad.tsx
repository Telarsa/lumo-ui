/*
 * POISON — a prop that rides a rest spread into an ENGINE component and says
 * nothing about where it lands.
 *
 * This is the verdict that fails closed, and `popover.tsx` is why it has to.
 * Four props there were spread onto `Popover.Popup` exactly like this: two were
 * real ARIA attributes that arrived on the dialog, and two (`arrowRef`,
 * `getTargetRect`) were React Aria leftovers that Base UI forwarded to the
 * `<div>` as invalid attributes. Identical syntax, opposite outcomes — so the
 * spread cannot be the evidence, and the fix is either a verified
 * `@forwarded` claim or explicit delivery.
 */

export interface PopoverProps {
  className?: string | undefined;
  /** A ref to the arrow element, if there is one. */
  arrowRef?: { current: Element | null };
}

export function Popover({ className, ...rest }: PopoverProps) {
  return <BasePopover.Popup className={className} {...rest} />;
}
