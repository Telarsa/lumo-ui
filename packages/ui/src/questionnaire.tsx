"use client";

import {
  useId,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react";
import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Button } from "./button.tsx";

export interface QuestionnaireChoice {
  value: string;
  label: LumoNode;
  description?: LumoNode | undefined;
  disabled?: boolean | undefined;
  /** Optional single-key shortcut, announced by the browser through accessKey. */
  shortcut?: string | undefined;
}

interface QuestionnaireItemBase {
  id: string;
  title: LumoNode;
  description?: LumoNode | undefined;
  choices: readonly QuestionnaireChoice[];
  multiple?: boolean | undefined;
  allowSkip?: boolean | undefined;
  /** Removes a conditional item from navigation and progress without losing its saved answer. */
  disabled?: boolean | undefined;
}

export interface QuestionnaireRequiredItem extends QuestionnaireItemBase {
  required: true;
  requiredMessage: string;
}

export interface QuestionnaireOptionalItem extends QuestionnaireItemBase {
  required?: false | undefined;
  requiredMessage?: never;
}

export type QuestionnaireItem = QuestionnaireRequiredItem | QuestionnaireOptionalItem;
export type QuestionnaireValue = Readonly<Record<string, readonly string[]>>;

export interface QuestionnaireStrings {
  progressLabel: string;
  /** Full localized phrase with `{current}` and `{total}` tokens. */
  progressTemplate: string;
  previous: string;
  next: string;
  skip: string;
  submit: string;
}

export interface QuestionnaireProps
  extends Omit<
    ComponentProps<"form">,
    "children" | "className" | "onSubmit" | "value" | "defaultValue" | "onChange"
  > {
  locale: Locale;
  /** The questions, in order; disabled items leave navigation and progress. */
  items: readonly QuestionnaireItem[];
  /** Every string the flow announces or renders. All caller-authored. */
  strings: QuestionnaireStrings;
  /** The answers keyed by question id, when controlled. */
  value?: QuestionnaireValue | undefined;
  /** The initial answers, when answers are uncontrolled. */
  defaultValue?: QuestionnaireValue | undefined;
  /** Called with the full answer record after every change. */
  onValueChange?: ((value: QuestionnaireValue) => void) | undefined;
  /** The visible question's id, when navigation is controlled. */
  activeId?: string | undefined;
  /** The first visible question, when navigation is uncontrolled. */
  defaultActiveId?: string | undefined;
  /** Called when navigation moves to another question. */
  onActiveIdChange?: ((id: string) => void) | undefined;
  /** Called with the complete answers on submit. */
  onSubmitAnswers?: ((value: QuestionnaireValue) => void) | undefined;
  className?: string | undefined;
}

function progressText(template: string, current: string, total: string): string {
  return template.replaceAll("{current}", current).replaceAll("{total}", total);
}

export function Questionnaire({
  locale,
  items,
  strings,
  value,
  defaultValue = {},
  onValueChange,
  activeId,
  defaultActiveId,
  onActiveIdChange,
  onSubmitAnswers,
  className,
  ...props
}: QuestionnaireProps) {
  const enabledItems = items.filter((item) => item.disabled !== true);
  const instanceId = useId();
  if (enabledItems.length === 0) {
    throw new RangeError("Questionnaire requires at least one enabled item.");
  }
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw new RangeError("Questionnaire item ids must be unique.");
  }
  for (const item of items) {
    if (item.choices.length === 0) {
      throw new RangeError(`Questionnaire item "${item.id}" must provide at least one choice.`);
    }
    if (new Set(item.choices.map((choice) => choice.value)).size !== item.choices.length) {
      throw new RangeError(`Questionnaire item "${item.id}" choice values must be unique.`);
    }
  }

  const initialActiveId = defaultActiveId ?? enabledItems[0]!.id;
  const [uncontrolledActiveId, setUncontrolledActiveId] = useState(initialActiveId);
  const currentId = activeId ?? uncontrolledActiveId;
  const currentIndex = enabledItems.findIndex((item) => item.id === currentId);
  if (currentIndex < 0) {
    throw new RangeError(`Questionnaire activeId "${currentId}" is not an enabled item.`);
  }

  const [uncontrolledValue, setUncontrolledValue] = useState<QuestionnaireValue>(defaultValue);
  const answers = value ?? uncontrolledValue;
  const [error, setError] = useState<string | null>(null);
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const shouldFocus = useRef(false);
  const currentItem = enabledItems[currentIndex]!;

  useEffect(() => {
    if (shouldFocus.current) {
      shouldFocus.current = false;
      fieldsetRef.current?.focus();
    }
  }, [currentId]);

  function updateAnswers(next: QuestionnaireValue) {
    if (value === undefined) setUncontrolledValue(next);
    onValueChange?.(next);
  }

  function moveTo(index: number) {
    const next = enabledItems[index];
    if (next === undefined) return;
    setError(null);
    shouldFocus.current = true;
    if (activeId === undefined) setUncontrolledActiveId(next.id);
    onActiveIdChange?.(next.id);
  }

  function validateCurrent(): boolean {
    const selected = answers[currentItem.id] ?? [];
    if (currentItem.required === true && selected.length === 0) {
      setError(currentItem.requiredMessage);
      requestAnimationFrame(() => {
        fieldsetRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
      });
      return false;
    }
    setError(null);
    return true;
  }

  function choose(choice: QuestionnaireChoice, checked: boolean) {
    const previous = answers[currentItem.id] ?? [];
    const selected = currentItem.multiple === true
      ? checked
        ? [...previous.filter((item) => item !== choice.value), choice.value]
        : previous.filter((item) => item !== choice.value)
      : [choice.value];
    updateAnswers({ ...answers, [currentItem.id]: selected });
    setError(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateCurrent()) return;
    onSubmitAnswers?.(answers);
  }

  const position = currentIndex + 1;
  const currentNumber = formatNumber(position, locale);
  const totalNumber = formatNumber(enabledItems.length, locale);
  const itemDomId = `${instanceId}-${currentItem.id}`;
  const describedBy = [currentItem.description ? `${itemDomId}-description` : null, error ? `${itemDomId}-error` : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <form className={cn("flex w-full flex-col gap-5", className)} onSubmit={submit} {...props}>
      <div className="flex items-center gap-3">
        <progress
          aria-label={strings.progressLabel}
          value={position}
          max={enabledItems.length}
          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full accent-accent"
        />
        <span className="shrink-0 text-xs text-fg-muted">
          {progressText(strings.progressTemplate, currentNumber, totalNumber)}
        </span>
      </div>

      <fieldset
        ref={fieldsetRef}
        data-lumo=""
        tabIndex={-1}
        aria-invalid={error === null ? undefined : true}
        aria-describedby={describedBy}
        className="min-w-0 rounded-xl border border-border bg-surface p-4 outline-none"
      >
        <legend className="px-1 text-base font-semibold text-fg">{currentItem.title}</legend>
        {currentItem.description === undefined ? null : (
          <p id={`${itemDomId}-description`} className="mb-4 text-sm text-fg-muted">
            {currentItem.description}
          </p>
        )}
        <div className="grid gap-2">
          {currentItem.choices.map((choice) => {
            const selected = (answers[currentItem.id] ?? []).includes(choice.value);
            return (
              <label
                key={choice.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border border-border-control p-3 transition-colors",
                  "hover:bg-surface-hover",
                  selected && "border-accent bg-surface-hover",
                  choice.disabled === true && "cursor-not-allowed opacity-50",
                )}
              >
                <input
                  data-lumo=""
                  type={currentItem.multiple === true ? "checkbox" : "radio"}
                  name={currentItem.id}
                  value={choice.value}
                  checked={selected}
                  disabled={choice.disabled}
                  required={currentItem.required === true && currentItem.multiple !== true}
                  aria-invalid={error === null ? undefined : true}
                  accessKey={choice.shortcut}
                  className="mt-0.5 size-4 shrink-0 accent-accent"
                  onChange={(event) => choose(choice, event.currentTarget.checked)}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm text-fg">
                  <span className="font-medium">{choice.label}</span>
                  {choice.description === undefined ? null : (
                    <span className="text-fg-muted">{choice.description}</span>
                  )}
                </span>
                {choice.shortcut === undefined ? null : (
                  <kbd aria-hidden="true" className="text-xs text-fg-subtle">
                    {choice.shortcut === undefined
                      ? null
                      : /^\d+$/.test(choice.shortcut)
                        ? [...choice.shortcut].map((digit) => formatNumber(Number(digit), locale)).join("")
                        : choice.shortcut}
                  </kbd>
                )}
              </label>
            );
          })}
        </div>
        {error === null ? null : (
          <p id={`${itemDomId}-error`} role="alert" className="mt-3 text-sm text-critical">
            {error}
          </p>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        {currentIndex === 0 ? null : (
          <Button type="button" variant="outline" onPress={() => moveTo(currentIndex - 1)}>
            {strings.previous}
          </Button>
        )}
        {currentItem.allowSkip === true && currentIndex < enabledItems.length - 1 ? (
          <Button
            type="button"
            variant="ghost"
            onPress={() => {
              const remaining: Record<string, readonly string[]> = { ...answers };
              delete remaining[currentItem.id];
              updateAnswers(remaining);
              moveTo(currentIndex + 1);
            }}
          >
            {strings.skip}
          </Button>
        ) : null}
        <span className="flex-1" />
        {currentIndex < enabledItems.length - 1 ? (
          <Button
            type="button"
            onPress={() => {
              if (validateCurrent()) moveTo(currentIndex + 1);
            }}
          >
            {strings.next}
          </Button>
        ) : (
          <Button type="submit">{strings.submit}</Button>
        )}
      </div>
    </form>
  );
}
