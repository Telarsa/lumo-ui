"use client";

import {
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ChangeEvent,
} from "react";
import { cn } from "@lumo-ui/core";
import { Button } from "./button.tsx";
import { inputVariants } from "./text-field.tsx";
import { nativeSelectVariants } from "./native-select.tsx";
import { createFilter, type FilterClause } from "./filters.shared.ts";

export { createFilter } from "./filters.shared.ts";
export type { FilterClause } from "./filters.shared.ts";

export interface FilterOperator {
  id: string;
  label: string;
  /** False for operators such as “is empty”. Defaults to true. */
  requiresValue?: boolean | undefined;
}

export interface FilterOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

interface FilterFieldBase {
  id: string;
  label: string;
  operators: readonly FilterOperator[];
  defaultOperator?: string | undefined;
  /** Return caller-authored error text, or null when valid. */
  validate?: ((values: readonly string[], operatorId: string) => string | null) | undefined;
}

export interface FilterTextField extends FilterFieldBase {
  type: "text";
  placeholder?: string | undefined;
}

export interface FilterSelectField extends FilterFieldBase {
  type: "select" | "multiselect";
  options: readonly FilterOption[];
}

export type FilterField = FilterTextField | FilterSelectField;

export interface FiltersStrings {
  regionLabel: string;
  addFilter: string;
  fieldLabel: string;
  operatorLabel: string;
  valueLabel: string;
  /** Full localized sentence. `{field}` is replaced with the field label. */
  removeFilterTemplate: string;
  /** Caller-owned fallback when a value-taking operator has no value. */
  invalidFilter: string;
}

export interface FiltersProps
  extends Omit<
    ComponentProps<"section">,
    "children" | "className" | "aria-label" | "value" | "defaultValue" | "onChange"
  > {
  fields: readonly FilterField[];
  strings: FiltersStrings;
  value?: readonly FilterClause[] | undefined;
  defaultValue?: readonly FilterClause[] | undefined;
  onValueChange?: ((value: readonly FilterClause[]) => void) | undefined;
  /** Serializes the complete clause model into one hidden form control. */
  name?: string | undefined;
  form?: string | undefined;
  className?: string | undefined;
}

function defaultOperator(field: FilterField): FilterOperator {
  if (field.operators.length === 0) {
    throw new RangeError(`Filters field "${field.id}" must provide at least one operator.`);
  }
  const selected =
    field.defaultOperator === undefined
      ? field.operators[0]
      : field.operators.find((operator) => operator.id === field.defaultOperator);
  if (selected === undefined) {
    throw new RangeError(
      `Filters field "${field.id}" has unknown default operator "${field.defaultOperator}".`,
    );
  }
  return selected;
}

function replaceField(template: string, field: string): string {
  return template.replaceAll("{field}", field);
}

export function Filters({
  fields,
  strings,
  value,
  defaultValue = [],
  onValueChange,
  name,
  form,
  className,
  ...props
}: FiltersProps) {
  const generatedId = useId();
  const nextId = useRef(0);
  const [uncontrolled, setUncontrolled] = useState<readonly FilterClause[]>(defaultValue);
  const clauses = value ?? uncontrolled;
  const fieldsById = new Map(fields.map((field) => [field.id, field] as const));

  if (fields.length === 0) {
    throw new RangeError("Filters requires at least one field.");
  }
  if (fieldsById.size !== fields.length) {
    throw new RangeError("Filters field ids must be unique.");
  }
  for (const field of fields) {
    defaultOperator(field);
    if (new Set(field.operators.map((operator) => operator.id)).size !== field.operators.length) {
      throw new RangeError(`Filters field "${field.id}" operator ids must be unique.`);
    }
  }
  if (new Set(clauses.map((clause) => clause.id)).size !== clauses.length) {
    throw new RangeError("Filters clause ids must be unique.");
  }
  for (const clause of clauses) {
    const field = fieldsById.get(clause.fieldId);
    if (field === undefined) {
      throw new RangeError(`Filters clause "${clause.id}" references unknown field "${clause.fieldId}".`);
    }
    if (!field.operators.some((operator) => operator.id === clause.operatorId)) {
      throw new RangeError(
        `Filters clause "${clause.id}" references unknown operator "${clause.operatorId}".`,
      );
    }
  }

  function update(next: readonly FilterClause[]) {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  }

  function replaceClause(id: string, replacement: FilterClause) {
    update(clauses.map((clause) => (clause.id === id ? replacement : clause)));
  }

  return (
    <section
      aria-label={strings.regionLabel}
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    >
      {name === undefined ? null : (
        <input
          type="hidden"
          aria-hidden="true"
          tabIndex={-1}
          name={name}
          form={form}
          value={JSON.stringify(clauses)}
        />
      )}
      <div className="flex flex-col gap-2">
        {clauses.map((clause) => {
          const field = fieldsById.get(clause.fieldId)!;
          const operator = field.operators.find((candidate) => candidate.id === clause.operatorId)!;
          const needsValue = operator.requiresValue !== false;
          const error =
            field.validate?.(clause.values, clause.operatorId) ??
            (needsValue && clause.values.length === 0 ? strings.invalidFilter : null);
          const errorId = `${generatedId}-${clause.id}-error`;

          return (
            <div
              key={clause.id}
              className="rounded-lg border border-border bg-surface p-2"
              data-invalid={error === null ? undefined : ""}
            >
              <div className="grid gap-2 sm:grid-cols-[minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(10rem,2fr)_auto] sm:items-end">
                <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-fg">
                  {strings.fieldLabel}
                  <select
                    data-lumo=""
                    className={cn(nativeSelectVariants({ size: "sm" }))}
                    aria-label={strings.fieldLabel}
                    value={field.id}
                    onChange={(event) => {
                      const nextField = fieldsById.get(event.currentTarget.value)!;
                      replaceClause(clause.id, {
                        id: clause.id,
                        fieldId: nextField.id,
                        operatorId: defaultOperator(nextField).id,
                        values: [],
                      });
                    }}
                  >
                    {fields.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-fg">
                  {strings.operatorLabel}
                  <select
                    data-lumo=""
                    className={cn(nativeSelectVariants({ size: "sm" }))}
                    aria-label={strings.operatorLabel}
                    value={operator.id}
                    onChange={(event) => {
                      const nextOperator = field.operators.find(
                        (candidate) => candidate.id === event.currentTarget.value,
                      )!;
                      replaceClause(clause.id, {
                        ...clause,
                        operatorId: nextOperator.id,
                        values: nextOperator.requiresValue === false ? [] : clause.values,
                      });
                    }}
                  >
                    {field.operators.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.label}
                      </option>
                    ))}
                  </select>
                </label>

                {needsValue ? (
                  field.type === "text" ? (
                    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-fg">
                      {strings.valueLabel}
                      <input
                        data-lumo=""
                        className={cn(inputVariants({ size: "sm" }))}
                        aria-label={strings.valueLabel}
                        aria-invalid={error === null ? undefined : true}
                        aria-describedby={error === null ? undefined : errorId}
                        placeholder={field.placeholder}
                        value={clause.values[0] ?? ""}
                        onChange={(event) =>
                          replaceClause(clause.id, {
                            ...clause,
                            values: event.currentTarget.value === "" ? [] : [event.currentTarget.value],
                          })
                        }
                      />
                    </label>
                  ) : (
                    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-fg">
                      {strings.valueLabel}
                      <select
                        data-lumo=""
                        className={cn(nativeSelectVariants({ size: "sm" }))}
                        aria-label={strings.valueLabel}
                        aria-invalid={error === null ? undefined : true}
                        aria-describedby={error === null ? undefined : errorId}
                        multiple={field.type === "multiselect"}
                        value={field.type === "multiselect" ? [...clause.values] : clause.values[0] ?? ""}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                          const values =
                            field.type === "multiselect"
                              ? [...event.currentTarget.selectedOptions].map((option) => option.value)
                              : event.currentTarget.value === ""
                                ? []
                                : [event.currentTarget.value];
                          replaceClause(clause.id, { ...clause, values });
                        }}
                      >
                        {field.type === "select" ? <option value="" /> : null}
                        {field.options.map((option) => (
                          <option key={option.value} value={option.value} disabled={option.disabled}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )
                ) : (
                  <span aria-hidden="true" />
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={replaceField(strings.removeFilterTemplate, field.label)}
                  onPress={() => update(clauses.filter((candidate) => candidate.id !== clause.id))}
                >
                  <span aria-hidden="true">×</span>
                </Button>
              </div>
              {error === null ? null : (
                <p id={errorId} role="alert" className="mt-1.5 text-xs text-critical">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start"
        onPress={() => {
          const field = fields[0]!;
          nextId.current += 1;
          update([
            ...clauses,
            createFilter(
              field.id,
              defaultOperator(field).id,
              [],
              `${generatedId.replaceAll(":", "")}-${nextId.current}`,
            ),
          ]);
        }}
      >
        {strings.addFilter}
      </Button>
    </section>
  );
}
