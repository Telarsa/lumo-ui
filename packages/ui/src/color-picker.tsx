"use client";

import * as React from "react";
import { cn } from "@lumo-ui/core";

export interface ColorSwatch {
  /** The CSS color this swatch paints and submits. */
  value: string;
  /** The accessible name announced for this swatch. */
  label: string;
}

export interface ColorPickerProps {
  /** The accessible name announced for the swatch radio group. */
  label: string;
  /** The swatch collection: each entry is a CSS color value with an accessible label. */
  swatches: readonly ColorSwatch[];
  /** The selected swatch value, when controlled. */
  value?: string;
  /** The initially selected swatch value, when uncontrolled. */
  defaultValue?: string;
  /** Called with the chosen swatch value. */
  onValueChange?: (value: string) => void;
  isDisabled?: boolean;
  className?: string;
}

export function ColorPicker({
  label,
  swatches,
  value,
  defaultValue,
  onValueChange,
  isDisabled,
  className,
}: ColorPickerProps) {
  const name = React.useId();
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const selectedValue = value ?? internalValue;

  return (
    <div
      data-lumo=""
      role="radiogroup"
      aria-label={label}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {swatches.map((swatch, index) => {
        const checked = selectedValue === swatch.value;
        const tabbable = checked || (selectedValue === undefined && index === 0);
        return (
          <label
            key={swatch.value}
            title={swatch.label}
            data-lumo-proxy-focus=""
            className="relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-border-control"
            style={{ backgroundColor: swatch.value }}
          >
            <input
              className="absolute inset-0 cursor-pointer opacity-0"
              type="radio"
              name={name}
              aria-label={swatch.label}
              value={swatch.value}
              checked={checked}
              tabIndex={tabbable ? 0 : -1}
              disabled={isDisabled}
              onChange={() => {
                if (value === undefined) setInternalValue(swatch.value);
                onValueChange?.(swatch.value);
              }}
            />
            {checked ? (
              <span data-color-selected="" aria-hidden="true" className="size-2.5 rounded-full bg-surface shadow-raised" />
            ) : null}
          </label>
        );
      })}
    </div>
  );
}
