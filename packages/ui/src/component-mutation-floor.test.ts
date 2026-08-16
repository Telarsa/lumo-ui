/**
 * Anchor drift guard for the component mutation campaign.
 *
 * `scripts/mutate-components.mjs` rewrites one anchor per module — JSX
 * `className` assignments for the modules listed as PRESENTATIONAL, a
 * behavior-specific anchor for the modules listed in `behaviorAnchors` — and
 * grades each mutant with `vitest related`, so only tests that import the
 * module can kill it. This suite is NOT the kill oracle: it reads source text
 * with `fs`, so counting its failures as kills would be circular (an earlier
 * version of the campaign did exactly that). Its two jobs are to fail loudly
 * when a module loses its anchor, which would silently shrink the campaign's
 * reach, and to fail when a module is classified in neither list (or both),
 * which would let a new module fall into class-strip unnoticed. Both lists are
 * mirrored by hand from the script: the script cannot be imported without
 * running the campaign.
 *
 * The catalogue size is derived from registry.json rather than hardcoded: a
 * hardcoded count rotted once already (99 against a directory of 111), and
 * the real invariant is directory ↔ registry agreement.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const componentFiles = readdirSync(sourceDirectory)
  .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx") && !file.endsWith(".type-test.tsx"))
  .sort();

const registry = JSON.parse(
  readFileSync(join(sourceDirectory, "../../../registry.json"), "utf8"),
) as { items: Array<{ type: string }> };
const declaredModules = registry.items.filter(
  (item) => item.type === "registry:ui",
).length;

/** Mirrors `PRESENTATIONAL` in scripts/mutate-components.mjs — the reasons live there. */
const presentational: ReadonlySet<string> = new Set([
  "aspect-ratio.tsx",
  "badge.tsx",
  "bubble.tsx",
  "card.tsx",
  "description-list.tsx",
  "empty-state.tsx",
  "stack.tsx",
]);

/** Mirrors the anchor column of `BEHAVIOURAL` in scripts/mutate-components.mjs. */
const behaviorAnchors: Readonly<Record<string, string>> = {
  "alert-dialog.tsx": "onConfirm?.();",
  "alert.tsx": "aria-label={closeLabel}",
  "attachment.tsx": "{formatFileSize(size, locale)}",
  "autocomplete.tsx": "compare(item, foldPersian(query), (value: T) => foldPersian(toString(value)))",
  "avatar.tsx": '<span className="sr-only">{statusLabel}</span>',
  "breadcrumbs.tsx": "index === lastIndex,",
  "button-group.tsx": "aria-label={label}",
  "button.tsx": "onPress?.(pressFromClick(event));",
  "calendar.tsx": "{...(disabled !== undefined ? { disabled } : {})}",
  "carousel.tsx": "if (isRtl) scrollNext();",
  "cascader.tsx": "formatNumber(columnIndex + 1, locale)",
  "chart.tsx": 'return typeof value === "number" ? formatNumber(value, locale) : value;',
  "checkbox.tsx": "className={checkboxIndicatorVariants()}\n          {...wiring.controlProps}",
  "color-input.tsx": "aria-label={pickerLabel}",
  "color-picker.tsx": "aria-label={label}",
  "combobox.tsx": "relabelEngineDismiss(boxRef.current, dismissLabel)",
  "command.tsx": 'aria-label={label}\n        data-slot="command-input"',
  "context-menu.tsx": 'event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")',
  "data-grid.tsx": "aria-errormessage={error === null ? undefined : errorId}",
  "date-field.tsx": "description != null ? descriptionId : null",
  "date-input.tsx": 'const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";',
  "date-picker.tsx": "aria-label={openCalendarLabel}",
  "date-range-picker.tsx": "labelId={endLabelId}",
  "date-selector.tsx": '<span className="sr-only">{label}</span>',
  "dialog.tsx": '{...attr("aria-label", dialogPopupName(children))}',
  "disclosure.tsx": "multiple={allowsMultipleExpanded === true}",
  "drawer.tsx": '{...attr("aria-label", dialogPopupName(children))}',
  "event-calendar.tsx": 'const forwardKey = rtl ? "ArrowLeft" : "ArrowRight";',
  "file-upload.tsx": "aria-valuenow={Math.round(Math.max(0, Math.min(lifecycle.progress, 1)) * 100)}",
  "filters.tsx": "aria-label={replaceField(strings.removeFilterTemplate, field.label)}",
  "form-state.tsx": "event.preventDefault();",
  "form.tsx": '<BaseInput data-lumo="" {...control} {...props} />',
  "frame.tsx": "aria-label={label}",
  "gantt.tsx":
    'const physical = (ratio: number) => (direction(locale) === "rtl" ? 100 - ratio * 100 : ratio * 100);',
  "heatmap-chart.tsx": "...chartMirror(locale).categoryAxis,",
  "hover-card.tsx": "aria-label={label}",
  "icon-stack.tsx": "{`+${formatNumber(overflow, locale)}`}",
  "icon-tile.tsx": '"aria-label": label,',
  "input-group.tsx": "<Label>{label}</Label>",
  "input-otp.tsx": '<div dir="ltr" className={inputOtpRowVariants()}>',
  "item.tsx": "onClick={(event: ReactMouseEvent<HTMLButtonElement>) => onPress(pressFromClick(event))}",
  "json-input.tsx": 'const invalid = text.trim() !== "" && !validation.valid;',
  "kanban.tsx": 'const nextColumnKey = isRtl ? "ArrowLeft" : "ArrowRight";',
  "kbd.tsx": 'data-lumo-latn=""\n      dir="ltr"',
  "link.tsx": "href !== undefined && isDisabled !== true && newTabLabel !== undefined",
  "list-box.tsx": '(dir === "rtl" ? "ArrowLeft" : "ArrowRight")',
  "marker.tsx": 'aria-hidden="true"\n      role={undefined}',
  "mask-input.tsx": "onValueChangeRef.current?.(unmasked, masked, completed);",
  "menu.tsx": 'findChildProp(children, "aria-label") as string | undefined',
  "menubar.tsx": "aria-label={label}",
  "message-scroller.tsx": "setPinned(distance <= BOTTOM_TOLERANCE);",
  "message.tsx": "return dateTime !== undefined ? (",
  "multi-select.tsx": "relabelEngineDismiss(boxRef.current, dismissLabel)",
  "navigation-menu.tsx": "aria-label={label}",
  "num.tsx": "{formatNumber(value, locale, options)}",
  "number-field.tsx": "aria-label={incrementLabel}",
  "overflow-list.tsx": "(hasOverflow ? overflowSize : 0) +",
  "pagination.tsx": "const formatted = formatNumber(page, locale);",
  "phone-input.tsx": "onChange?.(nextValue);",
  "popover.tsx": '{...attr("aria-labelledby", named ? undefined : triggerId)}',
  "power-search.tsx": "return Number.isFinite(parsed) ? formatNumber(parsed, locale) : value;",
  "progress.tsx": 'formatOptions.style === "percent" ? fraction : value,',
  "provider.tsx": "<DirectionProvider direction={direction(locale)}>",
  "questionnaire.tsx": "const currentNumber = formatNumber(position, locale);",
  "radar-chart.tsx": 'chartMirror(locale).direction === "rtl" && authored.length > 1',
  "radio-group.tsx": "(children === undefined ? undefined : firstRadioValue(children))",
  "range-calendar.tsx": "{...(disabled !== undefined ? { disabled } : {})}",
  "range-slider.tsx": "aria-label={thumbLabel}",
  "rating.tsx": "aria-label={valueLabel(formatNumber(value, locale), formatNumber(maxValue, locale))}",
  "resizable.tsx": "sign = rtl ? 1 : -1;",
  "sankey-chart.tsx": 'const rtl = chartMirror(locale).direction === "rtl";',
  "scroll-area.tsx": "aria-label={label}",
  "scrollspy.tsx": '{...(activeId === item.id ? { "aria-current": "location" as const } : {})}',
  "search-field.tsx": 'if (event.key === "Escape") {',
  "segmented-control.tsx": "aria-label={label}",
  "select.tsx": "{...listName}",
  "separator.tsx": 'aria-orientation="vertical"',
  "sidebar.tsx": "label={collapsed ? expandLabel : collapseLabel}",
  "skeleton-presets.tsx": 'aria-hidden="true" className={cn("flex w-full flex-col gap-2", className)}',
  "skeleton.tsx": 'aria-hidden="true"',
  "slider.tsx": "if (thumbCount < 2) return formatNumber(value, locale, formatOptions);",
  "sortable.tsx": '        : isRtl\n          ? "ArrowRight"\n          : "ArrowLeft";',
  "spinner.tsx": '<span className={showLabel ? "text-sm text-fg-muted" : "sr-only"}>{label}</span>',
  "steps.tsx": 'position < current ? "complete" : position === current ? "current" : "upcoming"',
  "switch.tsx": "className={switchTrackVariants({ size })}\n          {...wiring.controlProps}",
  "table.tsx": "const jump = arrow.jump(event.key, event.ctrlKey || event.metaKey);",
  "tabs.tsx": ": firstTabId((rest as { children?: LumoNode }).children);",
  "tag-group.tsx": "aria-label={group.removeLabel(textValue)}",
  "tag.tsx": "aria-label={props.removeLabel}",
  "tags-input.tsx": "aria-label={removeLabel(tag)}",
  "text-area.tsx": "<Label>{label}</Label>",
  "text-field.tsx": "<Label>{label}</Label>",
  "time-field.tsx": "const validationResult = validate?.(validationValue);",
  "timeline.tsx": "{ isLast: index === lastItemIndex }",
  "toast.tsx": "dir={direction(locale)}",
  "toggle-group.tsx": "onSelectionChange?.(new Set(next.map((key) => keyByValue.get(key) ?? key)));",
  "toggle.tsx": '...attr("onPressedChange", onChange),',
  "toolbar.tsx": "aria-label={label}",
  "tooltip.tsx": '{...attr("aria-describedby", described)}',
  "transfer-list.tsx": "strings.moved(formatNumber(movedCount, locale), destination)",
  "tree-select.tsx": 'mode === "checkbox" ? state === "checked" : selected.has(node.value)',
  "tree.tsx": 'const forwardKey = tree.turn.direction === "rtl" ? "ArrowLeft" : "ArrowRight";',
  "treemap-chart.tsx": 'chartMirror(locale).direction === "rtl" ? treemapMirroredSquarify : "squarify"',
  "virtual-list.tsx": "aria-posinset={item.index + 1}",
};

describe("the systematic component mutation floor", () => {
  it("matches the registry-declared catalogue", () => {
    expect(componentFiles).toHaveLength(declaredModules);
  });

  it.each(componentFiles)("%s is classified exactly once", (file) => {
    const isPresentational = presentational.has(file);
    const isBehavioural = Object.hasOwn(behaviorAnchors, file);
    expect(
      isPresentational !== isBehavioural,
      `${file} must be EITHER presentational OR carry a behavioural anchor`,
    ).toBe(true);
  });

  it("classifies nothing that is not a module", () => {
    for (const listed of [...presentational, ...Object.keys(behaviorAnchors)]) {
      expect(componentFiles, `${listed} is classified but is not a module`).toContain(listed);
    }
  });

  it.each(componentFiles)("%s preserves its campaign anchor", (file) => {
    const source = readFileSync(join(sourceDirectory, file), "utf8");
    const anchor = behaviorAnchors[file] ?? "className=";
    expect(
      source.includes(anchor),
      `${file} lost its mutation anchor ${JSON.stringify(anchor)}`,
    ).toBe(true);
  });
});
