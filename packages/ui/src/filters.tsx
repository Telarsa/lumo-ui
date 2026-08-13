"use client";

import {
  useId,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { cn } from "@lumo-ui/core";
import { Button } from "./button.tsx";
import { inputVariants } from "./text-field.tsx";
import { SelectField } from "./select.tsx";
import { MultiSelect } from "./multi-select.tsx";
import { useLumoLocale } from "./locale.ts";
import {
  assertQuery,
  createFilter,
  serializeQuery,
  type FilterClause,
} from "./filters.shared.ts";

export {
  assertQuery,
  createFilter,
  createFilterGroup,
  executeQuery,
  parseQuery,
  queryIssues,
  serializeQuery,
} from "./filters.shared.ts";
export type {
  FilterClause,
  FilterExpression,
  FilterGroup,
  FilterQuery,
  ParseQueryResult,
  QueryCombinator,
  QueryExecutionField,
  QueryExecutionOperator,
  QueryIssue,
  QueryShapeField,
  QueryShapeOperator,
} from "./filters.shared.ts";

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
  /** Announced name for the multi-value suggestion list. */
  valueSuggestionsLabel: string;
  /** Full localized sentence. `{value}` is replaced with the option label. */
  removeValueTemplate: string;
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
  const locale = useLumoLocale();
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
  }
  assertQuery(clauses, fields);

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
          value={serializeQuery(clauses)}
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
                <SelectField
                  label={strings.fieldLabel}
                  placeholder={strings.fieldLabel}
                  options={fields.map((candidate) => ({
                    value: candidate.id,
                    label: candidate.label,
                  }))}
                  selectedKey={field.id}
                  onSelectionChange={(key) => {
                      const nextField = fieldsById.get(key ?? "")!;
                      replaceClause(clause.id, {
                        id: clause.id,
                        fieldId: nextField.id,
                        operatorId: defaultOperator(nextField).id,
                        values: [],
                      });
                  }}
                  showLabel
                  size="sm"
                  className="min-w-0"
                />

                <SelectField
                  label={strings.operatorLabel}
                  placeholder={strings.operatorLabel}
                  options={field.operators.map((candidate) => ({
                    value: candidate.id,
                    label: candidate.label,
                  }))}
                  selectedKey={operator.id}
                  onSelectionChange={(key) => {
                      const nextOperator = field.operators.find(
                        (candidate) => candidate.id === key,
                      )!;
                      replaceClause(clause.id, {
                        ...clause,
                        operatorId: nextOperator.id,
                        values: nextOperator.requiresValue === false ? [] : clause.values,
                      });
                  }}
                  showLabel
                  size="sm"
                  className="min-w-0"
                />

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
                  ) : field.type === "multiselect" ? (
                    <MultiSelect
                      locale={locale}
                      label={strings.valueLabel}
                      placeholder={strings.valueLabel}
                      suggestionsLabel={strings.valueSuggestionsLabel}
                      removeLabel={(label) =>
                        strings.removeValueTemplate.replaceAll("{value}", label)
                      }
                      options={field.options}
                      value={clause.values}
                      onValueChange={(values) =>
                        replaceClause(clause.id, { ...clause, values })
                      }
                      className="min-w-0"
                    />
                  ) : (
                    <SelectField
                      label={strings.valueLabel}
                      placeholder={strings.valueLabel}
                      options={field.options}
                      selectedKey={clause.values[0] ?? null}
                      onSelectionChange={(key) =>
                        replaceClause(clause.id, {
                          ...clause,
                          values: key === null ? [] : [key],
                        })
                      }
                      isInvalid={error !== null}
                      errorMessage={error}
                      showLabel
                      size="sm"
                      className="min-w-0"
                    />
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
              {error === null || (needsValue && field.type === "select") ? null : (
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
