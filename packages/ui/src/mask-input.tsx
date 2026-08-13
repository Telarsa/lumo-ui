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
  label: string;
  mask: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (raw: string, masked: string, complete: boolean) => void;
  description?: string;
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
  const controlledRef = React.useRef(value !== undefined);
  const onValueChangeRef = React.useRef(onValueChange);
  controlledRef.current = value !== undefined;
  onValueChangeRef.current = onValueChange;

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
