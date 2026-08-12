import type { PressEvents } from "../../../core/src/props.ts";

export interface InheritedButtonProps extends PressEvents {
  label: string;
}

export function InheritedButton({ label }: InheritedButtonProps) {
  return <button>{label}</button>;
}
