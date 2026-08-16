"use client";

import * as React from "react";
import { Mask, MaskInput as MaskaInput, type MaskaDetail } from "maska";
import { cn } from "@lumo-ui/core";

export interface MaskValue {
  masked: string;
  raw: string;
  complete: boolean;
}

export function maskValue(value: string, mask: string): MaskValue {
  const engine = new Mask({ mask });
  const raw = engine.unmasked(value);
  const masked = engine.masked(raw);
  return { masked, raw, complete: engine.completed(masked) };
}

export interface MaskInputProps
  extends Omit<React.ComponentProps<"input">, "defaultValue" | "value" | "onChange" | "children"> {
  /** The accessible name of the field, rendered as its visible label. */
  label: string;
  /** The maska pattern the input enforces while typing. */
  mask: string;
  /** The masked text, when controlled. */
  value?: string;
  /** The initial masked text, when uncontrolled. */
  defaultValue?: string;
  /** Called with the masked and unmasked value after every change. */
  onValueChange?: (raw: string, masked: string, complete: boolean) => void;
  description?: string;
  /** The error announced when the value does not fill the mask. */
  incompleteMessage?: string;
}

export function MaskInput({
  label,
  mask,
  value,
  defaultValue = "",
  onValueChange,
  description,
  incompleteMessage,
  className,
  id,
  ref: forwardedRef,
  ...props
}: MaskInputProps) {
  const generated = React.useId();
  const inputId = id ?? generated;
  const [internal, setInternal] = React.useState(() => maskValue(defaultValue, mask).masked);
  const shown = value === undefined ? internal : maskValue(value, mask).masked;
  const status = maskValue(shown, mask);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const engineRef = React.useRef<MaskaInput | null>(null);
  // Latest values for the engine's callback, kept current from an effect (never
  // written during render): `onMaska` fires from DOM input events, always after commit.
  const controlledRef = React.useRef(value !== undefined);
  const onValueChangeRef = React.useRef(onValueChange);
  React.useEffect(() => {
    controlledRef.current = value !== undefined;
    onValueChangeRef.current = onValueChange;
  });

  React.useEffect(() => {
    const input = inputRef.current;
    if (input === null) return;
    const engine = new MaskaInput(input, {
      mask,
      onMaska: ({ unmasked, masked, completed }: MaskaDetail) => {
        if (!controlledRef.current) setInternal(masked);
        onValueChangeRef.current?.(unmasked, masked, completed);
      },
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [mask]);

  React.useEffect(() => {
    const input = inputRef.current;
    if (input !== null && input.value !== shown) {
      input.value = shown;
      engineRef.current?.updateValue(input);
    }
  }, [shown]);
  const incomplete = shown !== "" && !status.complete && incompleteMessage !== undefined;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;
  return (
    <div data-lumo="" className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-fg">{label}</label>
      <input
        {...props}
        // A maska pattern accepts ASCII digits only ('#'), so a masked value — card,
        // phone, ID — is Latin, LTR content by nature: declared, not exempted by accident.
        data-lumo-latn=""
        dir="ltr"
        ref={(node) => {
          inputRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        id={inputId}
        type="text"
        inputMode={props.inputMode ?? "text"}
        value={shown}
        aria-invalid={incomplete || undefined}
        aria-describedby={[description ? descriptionId : "", incomplete ? errorId : ""].filter(Boolean).join(" ") || undefined}
        className={cn("h-control-md w-full rounded-md border border-border-control bg-surface px-3 text-sm text-fg outline-none", className)}
        onChange={() => {}}
      />
      {description === undefined ? null : <p id={descriptionId} className="text-sm text-fg-muted">{description}</p>}
      {incomplete ? <p id={errorId} className="text-sm text-critical">{incompleteMessage}</p> : null}
    </div>
  );
}
