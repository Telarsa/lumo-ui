"use client";

import type { ElementType } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import {
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  SelectPopover,
  SelectTrigger,
  Spinner,
  Switch,
  optional,
} from "@lumo-ui/ui";

/**
 * A settings screen built from structured, instantly-committing controls:
 * grouped switches, selects and radio choices.
 *
 * Unlike `settings-form.tsx` (a `<form>` with one Save), every control here
 * commits the instant it changes, and the block takes DATA (`PreferenceGroup[]`)
 * rather than `children`. Pending is per ROW, not screen-wide, and
 * `strings.pending` is REQUIRED because a spinner with no text is silence.
 *
 * `"use client"`: every control here fires a callback on change.
 */
interface SwitchControl {
  type: "switch";
  isSelected: boolean;
  onChange?: ((value: boolean) => void) | undefined;
}

export interface PreferenceSelectOption {
  id: string;
  label: string;
}

interface SelectControl {
  type: "select";
  /** `null` when nothing is chosen. */
  value: string | null;
  options: readonly PreferenceSelectOption[];
  /** Visible text when nothing is chosen. REQUIRED — see `select.tsx`. */
  placeholder: string;
  onChange?: ((value: string | null) => void) | undefined;
}

export interface PreferenceRadioOption {
  id: string;
  label: string;
}

interface RadioControl {
  type: "radio";
  value?: string | undefined;
  options: readonly PreferenceRadioOption[];
  onChange?: ((value: string) => void) | undefined;
}

export type PreferenceControl = SwitchControl | SelectControl | RadioControl;

export interface PreferenceItem {
  /** Stable key. Not rendered. */
  id: string;
  /** The control's visible name. */
  label: string;
  description?: string | undefined;
  control: PreferenceControl;
  /** Disables the control and shows `strings.pending` beside it. */
  isPending?: boolean | undefined;
  /** A save failure for this one row, already translated. */
  error?: LumoNode;
}

export interface PreferenceGroup {
  /** Stable key. Not rendered. */
  id: string;
  /** The group's heading, e.g. «اعلان‌ها». */
  title: string;
  description?: string | undefined;
  items: readonly PreferenceItem[];
}

export interface PreferencesStrings {
  /** Announced name of the region wrapping the screen. Required. */
  regionLabel: string;
  title?: string | undefined;
  description?: string | undefined;
  /** Announced while a row is saving. REQUIRED — see the file header. */
  pending: string;
}

export interface PreferencesProps {
  strings: PreferencesStrings;
  groups: readonly PreferenceGroup[];
  /** Heading level for the SCREEN title. Each group renders one below. Default `2`. */
  level?: 2 | 3 | 4 | undefined;
  className?: string | undefined;
}

const SECTION_TAG = { 2: "h2", 3: "h3", 4: "h4" } as const;
const GROUP_TAG = { 2: "h3", 3: "h4", 4: "h5" } as const;

export function Preferences({ strings, groups, level = 2, className }: PreferencesProps) {
  const SectionHeading: ElementType = SECTION_TAG[level];
  const GroupHeading: ElementType = GROUP_TAG[level];

  return (
    <section
      aria-label={strings.regionLabel}
      className={cn("flex w-full flex-col gap-8 px-4 py-6", className)}
    >
      {strings.title !== undefined || strings.description !== undefined ? (
        <div className="flex flex-col gap-1">
          {strings.title !== undefined ? (
            <SectionHeading className="text-xl leading-snug font-semibold text-fg">
              {strings.title}
            </SectionHeading>
          ) : null}
          {strings.description !== undefined ? (
            <p className="max-w-prose text-sm text-fg-muted">{strings.description}</p>
          ) : null}
        </div>
      ) : null}

      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <GroupHeading className="text-base leading-snug font-semibold text-fg">
              {group.title}
            </GroupHeading>
            {group.description !== undefined ? (
              <p className="text-sm text-fg-muted">{group.description}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-5">
            {group.items.map((item) => (
              <PreferenceRow key={item.id} item={item} pendingLabel={strings.pending} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function PreferenceRow({ item, pendingLabel }: { item: PreferenceItem; pendingLabel: string }) {
  const { control } = item;

  if (control.type === "radio") {
    return (
      <div className="flex flex-col gap-1.5">
        <RadioGroup
          label={item.label}
          orientation="horizontal"
          {...optional("description", item.description)}
          {...optional("errorMessage", item.error)}
          {...optional("value", control.value)}
          onChange={(value) => control.onChange?.(value)}
        >
          {control.options.map((option) => (
            <Radio key={option.id} value={option.id}>
              {option.label}
            </Radio>
          ))}
        </RadioGroup>
        {item.isPending ? <Spinner label={pendingLabel} showLabel size="sm" color="muted" /> : null}
      </div>
    );
  }

  if (control.type === "switch") {
    return (
      <div className="flex flex-col gap-1.5">
        <Switch
          isSelected={control.isSelected}
          isDisabled={item.isPending === true}
          {...optional("description", item.description)}
          {...optional("errorMessage", item.error)}
          onChange={(value) => control.onChange?.(value)}
        >
          {item.label}
        </Switch>
        {item.isPending ? (
          <Spinner label={pendingLabel} showLabel size="sm" color="muted" className="ps-13" />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-fg">{item.label}</span>
        {item.description !== undefined ? (
          <span className="text-xs text-fg-muted">{item.description}</span>
        ) : null}
        {item.error !== undefined ? (
          <span className="text-xs text-critical">{item.error}</span>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.isPending ? <Spinner label={pendingLabel} size="sm" color="muted" /> : null}
        <Select
          aria-label={item.label}
          placeholder={control.placeholder}
          className="w-44"
          isDisabled={item.isPending === true}
          selectedKey={control.value}
          onSelectionChange={(key) => control.onChange?.(key === null ? null : String(key))}
        >
          <SelectTrigger />
          <SelectPopover>
            {control.options.map((option) => (
              <SelectItem key={option.id} id={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectPopover>
        </Select>
      </div>
    </div>
  );
}
