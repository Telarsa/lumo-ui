"use client";

import * as React from "react";
import { formatHex, formatHex8, parse } from "culori";
import { cn } from "@lumo-ui/core";

import { ColorPicker, type ColorSwatch } from "./color-picker.tsx";
import { Description, Field, FieldError, FieldInput, Label, useFieldControl } from "./form.tsx";
import { inputVariants } from "./text-field.tsx";

export type ColorFormat = "hex" | "hex8";

export function normalizeColor(value: string, format: ColorFormat = "hex"): string | undefined {
  const color = parse(value.trim());
  if (!color) return undefined;
  return format === "hex8" ? formatHex8(color) : formatHex(color);
}

export interface ColorInputProps {
  /** The accessible name of the text field, rendered as its visible label. */
  label: string;
  /** The accessible name announced for the swatch group beside the field. */
  pickerLabel: string;
  /** The error announced when the typed text is not a parseable color. */
  invalidColorMessage: string;
  /** Help text rendered under the field and linked to it. */
  description?: string;
  /** The color text, when controlled. */
  value?: string;
  /** The initial color text, when uncontrolled. */
  defaultValue?: string;
  /** Called with the normalized color after each valid change. */
  onValueChange?: (value: string) => void;
  /** The color notation the field normalizes into. */
  format?: ColorFormat;
  /** Preset colors offered beside the field. */
  swatches?: readonly ColorSwatch[];
  isDisabled?: boolean;
  /** Marks the field required for form submission and announces it as such. */
  isRequired?: boolean;
  /** Submitted field name when the control sits inside a form. */
  name?: string;
  className?: string;
}

function ColorControls({
  pickerLabel,
  text,
  normalized,
  swatches,
  format,
  isDisabled,
  isRequired,
  name,
  onText,
}: {
  pickerLabel: string;
  text: string;
  normalized: string | undefined;
  swatches: readonly ColorSwatch[] | undefined;
  format: ColorFormat;
  isDisabled: boolean | undefined;
  isRequired: boolean | undefined;
  name: string | undefined;
  onText: (value: string) => void;
}) {
  const wiring = useFieldControl();
  const native = normalizeColor(text, "hex") ?? normalizeColor("black", "hex")!;
  return (
    <>
      <div className="flex items-center gap-2">
        <FieldInput
          {...wiring}
          className={cn(inputVariants({ size: "md" }), "font-mono")}
          value={text}
          disabled={isDisabled}
          required={isRequired}
          name={name}
          onChange={(event) => onText(event.currentTarget.value)}
        />
        <label className="relative size-control-md shrink-0 overflow-hidden rounded-md border border-border-control" title={pickerLabel}>
          <input
            type="color"
            aria-label={pickerLabel}
            value={native}
            disabled={isDisabled}
            className="absolute -inset-2 size-14 cursor-pointer border-0 bg-transparent p-0"
            onChange={(event) => onText(normalizeColor(event.currentTarget.value, format) ?? event.currentTarget.value)}
          />
        </label>
      </div>
      {swatches === undefined ? null : (
        <ColorPicker
          label={pickerLabel}
          swatches={swatches}
          {...(normalized === undefined ? {} : { value: normalized })}
          {...(isDisabled === undefined ? {} : { isDisabled })}
          onValueChange={(next) => onText(normalizeColor(next, format) ?? next)}
        />
      )}
    </>
  );
}

export function ColorInput({
  label,
  pickerLabel,
  invalidColorMessage,
  description,
  value,
  defaultValue = "",
  onValueChange,
  format = "hex",
  swatches,
  isDisabled,
  isRequired,
  name,
  className,
}: ColorInputProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const text = value ?? internal;
  const normalized = normalizeColor(text, format);
  const invalid = text.trim() !== "" && normalized === undefined;
  const change = (next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  return (
    <Field label={label} isDisabled={isDisabled} isInvalid={invalid} className={className}>
      <Label>{label}</Label>
      <ColorControls
        pickerLabel={pickerLabel}
        text={text}
        normalized={normalized}
        swatches={swatches}
        format={format}
        isDisabled={isDisabled}
        isRequired={isRequired}
        name={name}
        onText={change}
      />
      {description === undefined ? null : <Description>{description}</Description>}
      {invalid ? <FieldError>{invalidColorMessage}</FieldError> : null}
    </Field>
  );
}
