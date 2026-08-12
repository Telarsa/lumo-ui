import type { ComponentProps } from "react";

export interface NamedFigureProps
  extends Omit<ComponentProps<"figure">, "children" | "className"> {
  label: string;
  className?: string | undefined;
}

export function NamedFigure({ label, className, ...props }: NamedFigureProps) {
  return <figure role="img" aria-label={label} className={className} {...props} />;
}

export interface DecorativeProps
  extends Omit<ComponentProps<"span">, "children" | "className"> {
  className?: string | undefined;
}

export function Decorative({ className, ...props }: DecorativeProps) {
  return <span {...{ "aria-hidden": "true" }} className={className} {...props} />;
}
