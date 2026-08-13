"use client";

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
} from "react";
import { cn, formatDate, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Button } from "./button.tsx";
import { nativeSelectVariants } from "./native-select.tsx";
import { Popover, PopoverTrigger } from "./popover.tsx";
import { inputVariants } from "./text-field.tsx";
import { useLumoLocale } from "./locale.ts";
import {
  assertQuery,
  createFilter,
  createFilterGroup,
  serializeQuery,
  type FilterClause,
  type FilterExpression,
  type FilterGroup,
  type FilterQuery,
  type QueryCombinator,
} from "./filters.shared.ts";

export { createFilter, createFilterGroup, serializeQuery } from "./filters.shared.ts";
export type { FilterClause, FilterExpression, FilterGroup, FilterQuery } from "./filters.shared.ts";

export interface PowerSearchOperator {
  id: string;
  label: string;
  /** False for operators such as “is empty”. Defaults to true. */
  requiresValue?: boolean | undefined;
  disabled?: boolean | undefined;
}

export interface PowerSearchOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

interface PowerSearchFieldBase {
  id: string;
  label: string;
  operators: readonly PowerSearchOperator[];
  defaultOperator?: string | undefined;
  disabled?: boolean | undefined;
  /** Visible, caller-authored availability/help text. */
  status?: string | undefined;
  /** Return caller-authored error text, or null when valid. */
  validate?: ((values: readonly string[], operatorId: string) => string | null) | undefined;
}

export interface PowerSearchTextField extends PowerSearchFieldBase {
  type: "text";
  placeholder?: string | undefined;
}

export interface PowerSearchNumberField extends PowerSearchFieldBase {
  type: "number";
  min?: number | undefined;
  max?: number | undefined;
  step?: number | "any" | undefined;
  placeholder?: string | undefined;
}

export interface PowerSearchDateField extends PowerSearchFieldBase {
  type: "date";
  min?: string | undefined;
  max?: string | undefined;
}

export interface PowerSearchBooleanField extends PowerSearchFieldBase {
  type: "boolean";
  trueLabel: string;
  falseLabel: string;
}

export interface PowerSearchChoiceField extends PowerSearchFieldBase {
  type: "select" | "multiselect" | "entity";
  options: readonly PowerSearchOption[];
}

export interface PowerSearchCustomEditorProps {
  values: readonly string[];
  onValuesChange: (values: readonly string[]) => void;
  label: string;
  isDisabled: boolean;
  isInvalid: boolean;
  describedBy: string | undefined;
}

export interface PowerSearchCustomField extends PowerSearchFieldBase {
  type: "custom";
  renderEditor: (props: PowerSearchCustomEditorProps) => LumoNode;
  formatValue?: ((values: readonly string[]) => string) | undefined;
}

export type PowerSearchField =
  | PowerSearchTextField
  | PowerSearchNumberField
  | PowerSearchDateField
  | PowerSearchBooleanField
  | PowerSearchChoiceField
  | PowerSearchCustomField;

export interface PowerSearchStrings {
  regionLabel: string;
  inputLabel: string;
  inputPlaceholder: string;
  suggestionsLabel: string;
  noFields: string;
  /** `{field}` is replaced with the field label. */
  editFilterTemplate: string;
  /** `{field}` is replaced with the field label. */
  removeFilterTemplate: string;
  fieldLabel: string;
  operatorLabel: string;
  valueLabel: string;
  apply: string;
  cancel: string;
  invalidFilter: string;
  savedViewsLabel: string;
  savedViewsPlaceholder: string;
  /** `{count}` is replaced with the localized result count supplied by the caller. */
  resultCountTemplate: string;
  /** `{count}` is replaced with the localized hidden-token count. */
  overflowTemplate: string;
  collapseFilters: string;
  /** `{field}`, `{operator}` and `{value}` are replaced. */
  tokenTemplate: string;
  emptyValue: string;
  /** Locale-authored separator used between multi-value labels. */
  valueSeparator: string;
  /** `{combinator}` is replaced with the caller-authored AND/OR label. */
  groupLabelTemplate: string;
  andLabel: string;
  orLabel: string;
  addGroup: string;
  removeGroup: string;
}

export interface PowerSearchSavedView {
  id: string;
  label: string;
  query: FilterQuery;
  disabled?: boolean | undefined;
}

export interface PowerSearchStatus {
  kind: "idle" | "loading" | "success" | "error";
  text: string;
}

export interface PowerSearchProps
  extends Omit<
    ComponentProps<"section">,
    "children" | "className" | "aria-label" | "value" | "defaultValue" | "onChange"
  > {
  fields: readonly PowerSearchField[];
  strings: PowerSearchStrings;
  value?: FilterQuery | undefined;
  defaultValue?: FilterQuery | undefined;
  onValueChange?: ((value: FilterQuery) => void) | undefined;
  savedViews?: readonly PowerSearchSavedView[] | undefined;
  onSavedViewChange?: ((view: PowerSearchSavedView) => void) | undefined;
  /** Already-localized display count. */
  resultCount?: number | string | undefined;
  status?: PowerSearchStatus | undefined;
  maxVisibleFilters?: number | undefined;
  readOnly?: boolean | undefined;
  isDisabled?: boolean | undefined;
  name?: string | undefined;
  form?: string | undefined;
  className?: string | undefined;
}

function isFilterGroup(expression: FilterExpression): expression is FilterGroup {
  return "children" in expression;
}

function replace(template: string, values: Readonly<Record<string, string>>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

function defaultOperator(field: PowerSearchField): PowerSearchOperator {
  const selected =
    field.defaultOperator === undefined
      ? field.operators.find((operator) => operator.disabled !== true)
      : field.operators.find((operator) => operator.id === field.defaultOperator);
  if (selected === undefined || selected.disabled === true) {
    throw new RangeError(
      `PowerSearch field "${field.id}" must provide an enabled default operator.`,
    );
  }
  return selected;
}

function fieldValue(
  field: PowerSearchField,
  values: readonly string[],
  emptyValue: string,
  valueSeparator: string,
  locale: Locale,
): string {
  if (values.length === 0) return emptyValue;
  if (field.type === "boolean") {
    return values[0] === "true" ? field.trueLabel : field.falseLabel;
  }
  if (field.type === "select" || field.type === "multiselect" || field.type === "entity") {
    return values
      .map((value) => field.options.find((option) => option.value === value)?.label ?? value)
      .join(valueSeparator);
  }
  if (field.type === "custom" && field.formatValue !== undefined) {
    return field.formatValue(values);
  }
  if (field.type === "number") {
    return values
      .map((value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? formatNumber(parsed, locale) : value;
      })
      .join(valueSeparator);
  }
  if (field.type === "date") {
    return values
      .map((value) => {
        const date = new Date(`${value}T12:00:00Z`);
        return Number.isNaN(date.getTime())
          ? value
          : formatDate(date, locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            });
      })
      .join(valueSeparator);
  }
  return values.join(valueSeparator);
}

function tokenText(
  clause: FilterClause,
  field: PowerSearchField,
  strings: PowerSearchStrings,
  locale: Locale,
): string {
  const operator = field.operators.find((candidate) => candidate.id === clause.operatorId)!;
  return replace(strings.tokenTemplate, {
    field: field.label,
    operator: operator.label,
    value: fieldValue(field, clause.values, strings.emptyValue, strings.valueSeparator, locale),
  });
}

interface ValueEditorProps {
  field: PowerSearchField;
  values: readonly string[];
  onValuesChange: (values: readonly string[]) => void;
  label: string;
  isDisabled: boolean;
  isInvalid: boolean;
  describedBy: string | undefined;
}

function ValueEditor({
  field,
  values,
  onValuesChange,
  label,
  isDisabled,
  isInvalid,
  describedBy,
}: ValueEditorProps) {
  const common = {
    "aria-label": label,
    "aria-invalid": isInvalid || undefined,
    "aria-describedby": describedBy,
    disabled: isDisabled,
  };

  if (field.type === "custom") {
    return field.renderEditor({
      values,
      onValuesChange,
      label,
      isDisabled,
      isInvalid,
      describedBy,
    });
  }
  if (field.type === "select" || field.type === "multiselect" || field.type === "entity") {
    return (
      <select
        data-lumo=""
        {...common}
        multiple={field.type === "multiselect"}
        value={field.type === "multiselect" ? [...values] : values[0] ?? ""}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          const next =
            field.type === "multiselect"
              ? Array.from(event.currentTarget.selectedOptions, (option) => option.value)
              : event.currentTarget.value === ""
                ? []
                : [event.currentTarget.value];
          onValuesChange(next);
        }}
        className={cn(nativeSelectVariants({ size: "sm" }))}
      >
        {field.type === "multiselect" ? null : <option value="" />}
        {field.options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "boolean") {
    return (
      <select
        data-lumo=""
        {...common}
        value={values[0] ?? ""}
        onChange={(event) =>
          onValuesChange(event.currentTarget.value === "" ? [] : [event.currentTarget.value])
        }
        className={cn(nativeSelectVariants({ size: "sm" }))}
      >
        <option value="" />
        <option value="true">{field.trueLabel}</option>
        <option value="false">{field.falseLabel}</option>
      </select>
    );
  }
  return (
    <input
      data-lumo=""
      {...common}
      type={field.type}
      value={values[0] ?? ""}
      {...(field.type === "text" || field.type === "number"
        ? { placeholder: field.placeholder }
        : {})}
      {...(field.type === "number"
        ? { min: field.min, max: field.max, step: field.step }
        : field.type === "date"
          ? { min: field.min, max: field.max }
          : {})}
      onChange={(event) =>
        onValuesChange(event.currentTarget.value === "" ? [] : [event.currentTarget.value])
      }
      className={cn(inputVariants({ size: "sm" }))}
    />
  );
}

interface PowerSearchTokenProps {
  clause: FilterClause;
  fields: readonly PowerSearchField[];
  strings: PowerSearchStrings;
  locale: Locale;
  isDisabled: boolean;
  readOnly: boolean;
  onCommit: (clause: FilterClause) => void;
  onRemove: () => void;
}

function PowerSearchToken({
  clause,
  fields,
  strings,
  locale,
  isDisabled,
  readOnly,
  onCommit,
  onRemove,
}: PowerSearchTokenProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(clause);
  const errorId = `${useId()}-error`;
  const fieldsById = new Map(fields.map((field) => [field.id, field] as const));
  const field = fieldsById.get(clause.fieldId)!;
  const draftField = fieldsById.get(draft.fieldId)!;
  const operator = draftField.operators.find((candidate) => candidate.id === draft.operatorId)!;
  const needsValue = operator.requiresValue !== false;
  const error =
    draftField.validate?.(draft.values, draft.operatorId) ??
    (needsValue && draft.values.length === 0 ? strings.invalidFilter : null);
  const label = replace(strings.editFilterTemplate, { field: field.label });
  const visible = tokenText(clause, field, strings, locale);

  if (readOnly || isDisabled) {
    return (
      <span className="inline-flex min-h-8 max-w-full items-center rounded-md border border-border bg-surface-sunken px-2.5 text-sm text-fg">
        <span className="truncate">{visible}</span>
      </span>
    );
  }

  return (
    <PopoverTrigger
      isOpen={open}
      onOpenChange={(next) => {
        if (next) setDraft(clause);
        setOpen(next);
      }}
    >
      <Button variant="outline" size="sm" aria-label={label} className="max-w-full">
        <span className="truncate">{visible}</span>
      </Button>
      <Popover placement="bottom start" className="w-[min(28rem,calc(100vw-2rem))]">
        <div className="grid gap-3">
          <label className="grid gap-1.5 text-sm font-medium text-fg">
            {strings.fieldLabel}
            <select
              data-lumo=""
              aria-label={strings.fieldLabel}
              value={draftField.id}
              onChange={(event) => {
                const nextField = fieldsById.get(event.currentTarget.value)!;
                setDraft({
                  ...draft,
                  fieldId: nextField.id,
                  operatorId: defaultOperator(nextField).id,
                  values: [],
                });
              }}
              className={cn(nativeSelectVariants({ size: "sm" }))}
            >
              {fields.map((candidate) => (
                <option key={candidate.id} value={candidate.id} disabled={candidate.disabled}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-fg">
            {strings.operatorLabel}
            <select
              data-lumo=""
              aria-label={strings.operatorLabel}
              value={operator.id}
              onChange={(event) => {
                const nextOperator = draftField.operators.find(
                  (candidate) => candidate.id === event.currentTarget.value,
                )!;
                setDraft({
                  ...draft,
                  operatorId: nextOperator.id,
                  values: nextOperator.requiresValue === false ? [] : draft.values,
                });
              }}
              className={cn(nativeSelectVariants({ size: "sm" }))}
            >
              {draftField.operators.map((candidate) => (
                <option key={candidate.id} value={candidate.id} disabled={candidate.disabled}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>
          {needsValue ? (
            <label className="grid gap-1.5 text-sm font-medium text-fg">
              {strings.valueLabel}
              <ValueEditor
                field={draftField}
                values={draft.values}
                onValuesChange={(values) => setDraft({ ...draft, values })}
                label={strings.valueLabel}
                isDisabled={false}
                isInvalid={error !== null}
                describedBy={error === null ? undefined : errorId}
              />
            </label>
          ) : null}
          {draftField.status === undefined ? null : (
            <p className="text-xs text-fg-muted">{draftField.status}</p>
          )}
          {error === null ? null : (
            <p id={errorId} role="alert" className="text-sm text-critical">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                onRemove();
                setOpen(false);
              }}
            >
              {replace(strings.removeFilterTemplate, { field: field.label })}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => {
                  setDraft(clause);
                  setOpen(false);
                }}
              >
                {strings.cancel}
              </Button>
              <Button
                size="sm"
                isDisabled={error !== null}
                onPress={() => {
                  onCommit(draft);
                  setOpen(false);
                }}
              >
                {strings.apply}
              </Button>
            </div>
          </div>
        </div>
      </Popover>
    </PopoverTrigger>
  );
}

interface PowerSearchGroupProps {
  group: FilterGroup;
  fields: readonly PowerSearchField[];
  strings: PowerSearchStrings;
  locale: Locale;
  isDisabled: boolean;
  readOnly: boolean;
  isRoot?: boolean | undefined;
  createId: (kind: "group") => string;
  onChange: (group: FilterGroup) => void;
  onRemove?: (() => void) | undefined;
}

/** Recursive visual projection of the shared query AST; it owns no parallel state. */
function PowerSearchGroup({
  group,
  fields,
  strings,
  locale,
  isDisabled,
  readOnly,
  isRoot = false,
  createId,
  onChange,
  onRemove,
}: PowerSearchGroupProps) {
  const combinatorLabel = group.combinator === "and" ? strings.andLabel : strings.orLabel;
  const label = replace(strings.groupLabelTemplate, { combinator: combinatorLabel });
  const updateChild = (id: string, next: FilterExpression) =>
    onChange({
      ...group,
      children: group.children.map((child) => (child.id === id ? next : child)),
    });
  const removeChild = (id: string) =>
    onChange({ ...group, children: group.children.filter((child) => child.id !== id) });

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-md border border-border p-2",
        isRoot ? "bg-surface" : "bg-surface-sunken",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <select
          data-lumo=""
          aria-label={strings.operatorLabel}
          value={group.combinator}
          disabled={isDisabled || readOnly}
          onChange={(event) =>
            onChange({ ...group, combinator: event.currentTarget.value as QueryCombinator })
          }
          className={cn(nativeSelectVariants({ size: "sm" }), "w-auto")}
        >
          <option value="and">{strings.andLabel}</option>
          <option value="or">{strings.orLabel}</option>
        </select>
        <Button
          variant="ghost"
          size="sm"
          isDisabled={isDisabled || readOnly}
          onPress={() =>
            onChange({
              ...group,
              children: [
                ...group.children,
                createFilterGroup("and", [], createId("group")),
              ],
            })
          }
        >
          {strings.addGroup}
        </Button>
        {isRoot || onRemove === undefined ? null : (
          <Button
            variant="ghost"
            size="sm"
            isDisabled={isDisabled || readOnly}
            onPress={onRemove}
          >
            {strings.removeGroup}
          </Button>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        {group.children.map((child) =>
          isFilterGroup(child) ? (
            <PowerSearchGroup
              key={child.id}
              group={child}
              fields={fields}
              strings={strings}
              locale={locale}
              isDisabled={isDisabled}
              readOnly={readOnly}
              createId={createId}
              onChange={(next) => updateChild(child.id, next)}
              onRemove={() => removeChild(child.id)}
            />
          ) : (
            <div key={child.id} className="flex min-w-0 items-center gap-2">
              <PowerSearchToken
                clause={child}
                fields={fields}
                strings={strings}
                locale={locale}
                isDisabled={isDisabled}
                readOnly={readOnly}
                onCommit={(next) => updateChild(child.id, next)}
                onRemove={() => removeChild(child.id)}
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export function PowerSearch({
  fields,
  strings,
  value,
  defaultValue = [],
  onValueChange,
  savedViews = [],
  onSavedViewChange,
  resultCount,
  status,
  maxVisibleFilters = Number.POSITIVE_INFINITY,
  readOnly = false,
  isDisabled = false,
  name,
  form,
  className,
  ...props
}: PowerSearchProps) {
  const locale = useLumoLocale();
  const generatedId = useId();
  const nextId = useRef(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [uncontrolled, setUncontrolled] = useState<FilterQuery>(defaultValue);
  const [query, setQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [savedViewId, setSavedViewId] = useState("");
  const queryValue = value ?? uncontrolled;
  const fieldsById = new Map(fields.map((field) => [field.id, field] as const));

  if (fields.length === 0) throw new RangeError("PowerSearch requires at least one field.");
  if (fieldsById.size !== fields.length) {
    throw new RangeError("PowerSearch field ids must be unique.");
  }
  if (maxVisibleFilters < 1) {
    throw new RangeError("PowerSearch maxVisibleFilters must be at least one.");
  }
  for (const field of fields) defaultOperator(field);
  assertQuery(queryValue, fields);
  for (const view of savedViews) assertQuery(view.query, fields);

  const normalized = query.trim().toLocaleLowerCase();
  const matchingFields = fields.filter((field) =>
    normalized === "" ? true : field.label.toLocaleLowerCase().includes(normalized),
  );
  const rootGroup = !Array.isArray(queryValue) && isFilterGroup(queryValue as FilterExpression);
  const clauses = Array.isArray(queryValue)
    ? (queryValue as readonly FilterClause[])
    : rootGroup
      ? []
      : [queryValue as FilterClause];
  const visibleClauses = expanded ? clauses : clauses.slice(0, maxVisibleFilters);
  const hiddenCount = clauses.length - visibleClauses.length;
  const unavailable = isDisabled || readOnly;

  function update(next: FilterQuery, selectedView = "") {
    if (value === undefined) setUncontrolled(next);
    setSavedViewId(selectedView);
    onValueChange?.(next);
  }

  function addField(field: PowerSearchField) {
    if (field.disabled === true || unavailable) return;
    const operator = defaultOperator(field);
    const id = `power-search-${generatedId.replaceAll(":", "")}-${++nextId.current}`;
    const clause = createFilter(field.id, operator.id, [], id);
    update(
      Array.isArray(queryValue)
        ? [...queryValue, clause]
        : rootGroup
          ? {
              ...(queryValue as FilterGroup),
              children: [...(queryValue as FilterGroup).children, clause],
            }
          : [queryValue as FilterClause, clause],
    );
    setQuery("");
    setSuggestionsOpen(false);
  }

  function nextEnabled(from: number, delta: -1 | 1): number {
    if (matchingFields.length === 0) return -1;
    for (let step = 1; step <= matchingFields.length; step += 1) {
      const index = (from + delta * step + matchingFields.length) % matchingFields.length;
      if (matchingFields[index]?.disabled !== true) return index;
    }
    return -1;
  }

  const activeField = matchingFields[activeIndex];
  const statusText = [
    resultCount === undefined
      ? null
      : replace(strings.resultCountTemplate, { count: String(resultCount) }),
    status?.text ?? null,
  ]
    .filter((item): item is string => item !== null)
    .join(" · ");

  return (
    <section
      {...props}
      aria-label={strings.regionLabel}
      {...(status?.kind === "loading" ? { "aria-busy": true } : {})}
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
    >
      {name === undefined ? null : (
        <input
          type="hidden"
          aria-hidden="true"
          tabIndex={-1}
          name={name}
          form={form}
          value={serializeQuery(queryValue)}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        {savedViews.length === 0 ? null : (
          <select
            data-lumo=""
            aria-label={strings.savedViewsLabel}
            value={savedViewId}
            disabled={unavailable}
            onChange={(event) => {
              const view = savedViews.find((candidate) => candidate.id === event.currentTarget.value);
              if (view === undefined) {
                setSavedViewId("");
                return;
              }
              update(view.query, view.id);
              onSavedViewChange?.(view);
            }}
            className={cn(nativeSelectVariants({ size: "sm" }), "w-auto min-w-40")}
          >
            <option value="">{strings.savedViewsPlaceholder}</option>
            {savedViews.map((view) => (
              <option key={view.id} value={view.id} disabled={view.disabled}>
                {view.label}
              </option>
            ))}
          </select>
        )}
        <div ref={wrapperRef} className="relative min-w-48 flex-1">
          <input
            data-lumo=""
            role="combobox"
            aria-label={strings.inputLabel}
            aria-autocomplete="list"
            aria-expanded={suggestionsOpen}
            aria-controls={suggestionsOpen ? `${generatedId}-fields` : undefined}
            aria-activedescendant={
              suggestionsOpen && activeField !== undefined
                ? `${generatedId}-field-${activeField.id}`
                : undefined
            }
            placeholder={strings.inputPlaceholder}
            value={query}
            disabled={unavailable}
            onFocus={() => {
              setActiveIndex(nextEnabled(-1, 1));
              setSuggestionsOpen(true);
            }}
            onBlur={() => {
              queueMicrotask(() => {
                if (!wrapperRef.current?.contains(document.activeElement)) setSuggestionsOpen(false);
              });
            }}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setActiveIndex(0);
              setSuggestionsOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                setSuggestionsOpen(true);
                setActiveIndex(nextEnabled(activeIndex, event.key === "ArrowDown" ? 1 : -1));
              } else if (event.key === "Enter" && suggestionsOpen && activeField !== undefined) {
                event.preventDefault();
                addField(activeField);
              } else if (event.key === "Escape") {
                setSuggestionsOpen(false);
              }
            }}
            className={cn(inputVariants({ size: "sm" }))}
          />
          {suggestionsOpen ? (
            <div className="absolute inset-is-0 top-full z-40 mt-1 w-full min-w-64 rounded-md border border-border bg-surface p-1 shadow-overlay">
              <div id={`${generatedId}-fields`} role="listbox" aria-label={strings.suggestionsLabel}>
                {matchingFields.map((field, index) => (
                  <button
                    data-lumo=""
                    key={field.id}
                    id={`${generatedId}-field-${field.id}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    aria-disabled={field.disabled || undefined}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => addField(field)}
                    className={cn(
                      "flex w-full flex-col rounded-sm px-2 py-1.5 text-start text-sm outline-none",
                      "aria-selected:bg-surface-hover",
                      field.disabled === true
                        ? "cursor-not-allowed text-fg-muted opacity-50"
                        : "cursor-pointer text-fg hover:bg-surface-hover",
                    )}
                  >
                    <span>{field.label}</span>
                    {field.status === undefined ? null : (
                      <span className="text-xs text-fg-muted">{field.status}</span>
                    )}
                  </button>
                ))}
              </div>
              {matchingFields.length === 0 ? (
                <p role="status" className="px-2 py-1.5 text-sm text-fg-muted">
                  {strings.noFields}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {rootGroup ? (
        <PowerSearchGroup
          group={queryValue as FilterGroup}
          fields={fields}
          strings={strings}
          locale={locale}
          isDisabled={isDisabled}
          readOnly={readOnly}
          isRoot
          createId={() => `power-search-${generatedId.replaceAll(":", "")}-group-${++nextId.current}`}
          onChange={(next) => update(next)}
        />
      ) : clauses.length === 0 ? null : (
        <div className="flex flex-wrap items-center gap-2">
          {visibleClauses.map((clause) => (
            <PowerSearchToken
              key={clause.id}
              clause={clause}
              fields={fields}
              strings={strings}
              locale={locale}
              isDisabled={isDisabled}
              readOnly={readOnly}
              onCommit={(next) =>
                update(clauses.map((candidate) => (candidate.id === next.id ? next : candidate)))
              }
              onRemove={() => update(clauses.filter((candidate) => candidate.id !== clause.id))}
            />
          ))}
          {hiddenCount > 0 ? (
            <Button variant="ghost" size="sm" onPress={() => setExpanded(true)}>
              {replace(strings.overflowTemplate, { count: String(hiddenCount) })}
            </Button>
          ) : expanded && clauses.length > maxVisibleFilters ? (
            <Button variant="ghost" size="sm" onPress={() => setExpanded(false)}>
              {strings.collapseFilters}
            </Button>
          ) : null}
        </div>
      )}
      {statusText === "" ? null : (
        <p
          role="status"
          aria-live="polite"
          data-status={status?.kind}
          className={cn("text-sm text-fg-muted", status?.kind === "error" && "text-critical")}
        >
          {statusText}
        </p>
      )}
    </section>
  );
}
