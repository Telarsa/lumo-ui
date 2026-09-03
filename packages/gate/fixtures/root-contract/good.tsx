/*
 * The half that must stay CLEAN — every legal shape the root contract admits,
 * taken from the library rather than invented.
 *
 * A rule tightened until it accuses correct code does not get loosened; it gets
 * switched off. Three of the four shapes below are subtractions, which is the
 * thing this rule is most likely to over-fire on.
 */
import type { ComponentProps, Ref } from "react";

/** The ordinary case: omit what you own, spread the rest. `spinner.tsx`. */
export interface SpinnerProps
  extends Omit<ComponentProps<"span">, "children" | "className" | "role"> {
  label: string;
  className?: string | undefined;
}

export function Spinner({ label, className, ...props }: SpinnerProps) {
  return (
    <span role="status" className={className} {...props}>
      {label}
    </span>
  );
}

/** OWNED, explained in the heritage clause. `table.tsx`'s worked example. */
export interface TableProps
  extends Omit<
    ComponentProps<"table">,
    /* `ref` and `onKeyDown` are the grid's own machinery: it reads the cell
     * coordinates out of the ref and its `onKeyDown` IS the arrow-key model.
     * A caller's value replaced them and every arrow key stopped silently. */
    "ref" | "onKeyDown" | "children" | "className"
  > {
  children?: unknown;
  className?: string | undefined;
}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <table {...props} className={className}>
      {children}
    </table>
  );
}

/** OWNED, explained before `extends`. `gantt.tsx`'s placement. */
export interface GanttProps
  /* `ref` is owned: the pointer route hit-tests against it. */
  extends Omit<ComponentProps<"div">, "className" | "ref"> {
  className?: string | undefined;
}

export function Gantt({ className, ...props }: GanttProps) {
  return <div {...props} className={className} />;
}

/** WIDENED, explained on the redeclaration. `stack.tsx`'s placement — the note
 *  is on the line a reader lands on when they ask what `ref` is here. */
export interface StackProps extends Omit<ComponentProps<"div">, "className" | "ref"> {
  /**
   * The root at the widest type true of every branch: `tag` picks the element
   * and `Ref<HTMLDivElement>` would be a lie for `tag="section"`.
   */
  ref?: Ref<HTMLElement> | undefined;
  className?: string | undefined;
}

export function Stack({ className, ...props }: StackProps) {
  return <div className={className} {...(props as ComponentProps<"div">)} />;
}

/** A shape with no DOM base at all is not this rule's business. `Pagination`
 *  before the sweep was a defect; a pure-vocabulary props type is not. */
export interface UseLumoTableOptions {
  locale: string;
}

export function useLumoTable(options: UseLumoTableOptions) {
  return options.locale;
}
