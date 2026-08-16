#!/usr/bin/env node

/**
 * Apply one mutation to every @lumo-ui/ui implementation module, one process at
 * a time, and require the tests that import that module to kill it. Source is
 * restored byte-for-byte in a finally block. The kill oracle is `vitest related
 * <module>`; a mutant no related test observes is reported `unobserved`, not
 * `killed`. Not in the local `verify` chain (one vitest process per module); CI
 * runs it in a separate job. Locally: `pnpm run mutation:components`.
 *
 * Every module is EITHER listed in `PRESENTATIONAL` (class delivery is its whole
 * behaviour, so the class-strip operator is the honest floor) OR carries one
 * behavioural operator in `BEHAVIOURAL` that breaks a real promise on one line —
 * a Persian digit turning Latin, an announced name dropped, a direction sign
 * flipped, a key ignored. A module in neither set throws before the campaign
 * starts, so a new module cannot fall into class-strip unnoticed. The floor
 * test (`packages/ui/src/component-mutation-floor.test.ts`) mirrors both lists.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repository = resolve(import.meta.dirname, "..");
const sourceDirectory = join(repository, "packages/ui/src");
const files = readdirSync(sourceDirectory)
  .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx") && !file.endsWith(".type-test.tsx"))
  .sort();

// The invariant is directory ↔ registry agreement: a hardcoded count rotted once already.
/** @type {{ items: Array<{ type: string }> }} */
const registry = JSON.parse(readFileSync(join(repository, "registry.json"), "utf8"));
const declared = registry.items.filter((item) => item.type === "registry:ui").length;
if (files.length !== declared) {
  throw new Error(
    `packages/ui/src has ${files.length} implementation modules but ` +
      `registry.json declares ${declared} registry:ui items`,
  );
}

/**
 * Modules whose whole behaviour is delivering classes and slots: no announced
 * string is derived, no number is formatted, no direction is resolved, no key is
 * handled. Class-strip is the honest floor for these; one reason each.
 */
const PRESENTATIONAL = Object.freeze([
  // A CSS custom property and one class; the ratio is style, not semantics.
  "aspect-ratio.tsx",
  // Tone × variant class table on a span; nothing announced, nothing derived.
  "badge.tsx",
  // Corner/alignment class tables; BubbleCollapse only forwards to disclosure.tsx, which owns the behaviour.
  "bubble.tsx",
  // Sectioning slots and a heading-tag lookup; no announced string of its own.
  "card.tsx",
  // <dl>/<dt>/<dd> with a layout class; the semantics are the elements'.
  "description-list.tsx",
  // Title/description/action slots and a heading-tag lookup; the icon slot is decorative.
  "empty-state.tsx",
  // Stack/Grid/Container: flex and grid class tables over a tag prop.
  "stack.tsx",
]);

/**
 * One behavioural operator per module: `[operator, anchor, replacement, all?]`.
 * `anchor` must occur in the module (the floor test guards it) and is replaced
 * once — or everywhere when `all` is set, for the two engine-string relabels.
 * @type {Readonly<Record<string, readonly [string, string, string] | readonly [string, string, string, true]>>}
 */
const BEHAVIOURAL = Object.freeze({
  "alert-dialog.tsx": ["stop confirm from calling back", "onConfirm?.();", "void onConfirm;"],
  "alert.tsx": [
    "drop the caller-authored name from the dismiss button",
    "aria-label={closeLabel}",
    "aria-label={undefined}",
  ],
  "attachment.tsx": [
    "print the byte count as a raw JavaScript number",
    "{formatFileSize(size, locale)}",
    "{String(size)}",
  ],
  "autocomplete.tsx": [
    "compare unfolded Persian on both sides of the collator",
    "compare(item, foldPersian(query), (value: T) => foldPersian(toString(value)))",
    "compare(item, query, (value: T) => toString(value))",
  ],
  "avatar.tsx": [
    "paint the status dot without saying what it means",
    '<span className="sr-only">{statusLabel}</span>',
    "<span className=\"sr-only\">{null}</span>",
  ],
  "breadcrumbs.tsx": [
    "stop announcing the last crumb as the current page",
    "index === lastIndex,",
    "false,",
  ],
  "button-group.tsx": [
    "leave the group unnamed",
    "aria-label={label}",
    "aria-label={undefined}",
  ],
  "button.tsx": [
    "swallow onPress",
    "onPress?.(pressFromClick(event));",
    "void event;",
  ],
  "calendar.tsx": [
    "let a bounded day be selected",
    "{...(disabled !== undefined ? { disabled } : {})}",
    "",
  ],
  "carousel.tsx": [
    "make ArrowLeft go back on a Persian page",
    "if (isRtl) scrollNext();",
    "if (false) scrollNext();",
  ],
  "cascader.tsx": [
    "replace locale-shaped column number with a raw JavaScript number",
    "formatNumber(columnIndex + 1, locale)",
    "String(columnIndex + 1)",
  ],
  "chart.tsx": [
    "print data-table numbers as raw JavaScript numbers",
    'return typeof value === "number" ? formatNumber(value, locale) : value;',
    "return String(value);",
  ],
  "checkbox.tsx": [
    "unwire the box from its label",
    "className={checkboxIndicatorVariants()}\n          {...wiring.controlProps}",
    "className={checkboxIndicatorVariants()}",
  ],
  "color-input.tsx": [
    "leave the native picker unnamed",
    "aria-label={pickerLabel}",
    "aria-label={undefined}",
  ],
  "color-picker.tsx": [
    "leave the swatch collection unnamed",
    "aria-label={label}",
    "aria-label={undefined}",
  ],
  "combobox.tsx": [
    "leave the engine's English dismiss sentinel unrelabelled",
    "relabelEngineDismiss(boxRef.current, dismissLabel)",
    "void dismissLabel",
    true,
  ],
  "command.tsx": [
    "leave the command input unnamed",
    'aria-label={label}\n        data-slot="command-input"',
    'data-slot="command-input"',
  ],
  "context-menu.tsx": [
    "ignore Shift+F10 and the ContextMenu key",
    'event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")',
    "true",
  ],
  "data-grid.tsx": [
    "disconnect the validation reason from its invalid editor",
    "aria-errormessage={error === null ? undefined : errorId}",
    "aria-errormessage={undefined}",
  ],
  "date-field.tsx": [
    "leave the description out of aria-describedby",
    "description != null ? descriptionId : null",
    "null",
  ],
  "date-input.tsx": [
    "make ArrowRight the forward key on a Persian page",
    'const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";',
    'const forward = "ArrowRight";',
  ],
  "date-picker.tsx": [
    "leave the calendar trigger unnamed",
    "aria-label={openCalendarLabel}",
    "aria-label={undefined}",
  ],
  "date-range-picker.tsx": [
    "name the end half after the start half",
    "labelId={endLabelId}",
    "labelId={startLabelId}",
  ],
  "date-selector.tsx": [
    "drop the required name from the trigger",
    '<span className="sr-only">{label}</span>',
    '<span className="sr-only">{null}</span>',
  ],
  "dialog.tsx": [
    "drop the caller-authored dialog name before it reaches the popup",
    '{...attr("aria-label", dialogPopupName(children))}',
    '{...attr("aria-label", undefined)}',
  ],
  "disclosure.tsx": [
    "let a group expand several sections regardless of allowsMultipleExpanded",
    "multiple={allowsMultipleExpanded === true}",
    "multiple={true}",
  ],
  "drawer.tsx": [
    "drop the lifted dialog name from the drawer panel",
    '{...attr("aria-label", dialogPopupName(children))}',
    '{...attr("aria-label", undefined)}',
  ],
  "event-calendar.tsx": [
    "make ArrowRight the forward key on a Persian page",
    'const forwardKey = rtl ? "ArrowLeft" : "ArrowRight";',
    'const forwardKey = "ArrowRight";',
  ],
  "file-upload.tsx": [
    "serve an unclamped aria-valuenow",
    "aria-valuenow={Math.round(Math.max(0, Math.min(lifecycle.progress, 1)) * 100)}",
    "aria-valuenow={Math.round(lifecycle.progress * 100)}",
  ],
  "filters.tsx": [
    "leave the remove-clause button unnamed",
    "aria-label={replaceField(strings.removeFilterTemplate, field.label)}",
    "aria-label={undefined}",
  ],
  "form-state.tsx": ["remove submit cancellation", "event.preventDefault();", "void event.defaultPrevented;"],
  "form.tsx": [
    "unwire the field input from its label, description and error",
    '<BaseInput data-lumo="" {...control} {...props} />',
    '<BaseInput data-lumo="" {...props} />',
  ],
  "frame.tsx": ["leave the figure unnamed", "aria-label={label}", "aria-label={undefined}"],
  "gantt.tsx": [
    "stop mirroring dependency x under RTL",
    'const physical = (ratio: number) => (direction(locale) === "rtl" ? 100 - ratio * 100 : ratio * 100);',
    "const physical = (ratio: number) => ratio * 100;",
  ],
  "heatmap-chart.tsx": [
    "stop mirroring the category axis under RTL",
    "...chartMirror(locale).categoryAxis,",
    "",
  ],
  "hover-card.tsx": ["leave the panel unnamed", "aria-label={label}", "aria-label={undefined}"],
  "icon-stack.tsx": [
    "print the overflow count as a raw JavaScript number",
    "{`+${formatNumber(overflow, locale)}`}",
    "{`+${String(overflow)}`}",
  ],
  "icon-tile.tsx": [
    "serve a named tile as an unnamed role=img",
    '"aria-label": label,',
    '"aria-label": undefined,',
  ],
  "input-group.tsx": ["render an empty label", "<Label>{label}</Label>", "<Label>{null}</Label>"],
  "input-otp.tsx": [
    "let the code row inherit the page direction",
    '<div dir="ltr" className={inputOtpRowVariants()}>',
    "<div className={inputOtpRowVariants()}>",
  ],
  "item.tsx": [
    "render the button without delivering onPress",
    "onClick={(event: ReactMouseEvent<HTMLButtonElement>) => onPress(pressFromClick(event))}",
    "onClick={undefined}",
  ],
  "json-input.tsx": [
    "never mark broken JSON invalid",
    'const invalid = text.trim() !== "" && !validation.valid;',
    "const invalid = false;",
  ],
  "kanban.tsx": [
    "make ArrowRight the next-column key on a Persian board",
    'const nextColumnKey = isRtl ? "ArrowLeft" : "ArrowRight";',
    'const nextColumnKey = "ArrowRight";',
  ],
  "kbd.tsx": [
    "let the key run inherit the page direction",
    'data-lumo-latn=""\n      dir="ltr"',
    'data-lumo-latn=""',
  ],
  "link.tsx": [
    "drop the new-tab warning from the accessible name",
    "href !== undefined && isDisabled !== true && newTabLabel !== undefined",
    "false",
  ],
  "list-box.tsx": [
    "make ArrowRight the forward key on a horizontal Persian list",
    '(dir === "rtl" ? "ArrowLeft" : "ArrowRight")',
    '"ArrowRight"',
  ],
  "marker.tsx": [
    "expose the decorative icon to assistive technology",
    'aria-hidden="true"\n      role={undefined}',
    "role={undefined}",
  ],
  "mask-input.tsx": [
    "never report a completed mask",
    "onValueChangeRef.current?.(unmasked, masked, completed);",
    "onValueChangeRef.current?.(unmasked, masked, false);",
  ],
  "menu.tsx": [
    "drop the menu's announced name on its way to the popup",
    'findChildProp(children, "aria-label") as string | undefined',
    "undefined",
  ],
  "menubar.tsx": ["leave the menubar unnamed", "aria-label={label}", "aria-label={undefined}"],
  "message-scroller.tsx": [
    "stay pinned however far the reader scrolls up",
    "setPinned(distance <= BOTTOM_TOLERANCE);",
    "setPinned(true);",
  ],
  "message.tsx": [
    "render a plain span even when the machine instant is given",
    "return dateTime !== undefined ? (",
    "return false ? (",
  ],
  "multi-select.tsx": [
    "leave the engine's English dismiss sentinel unrelabelled",
    "relabelEngineDismiss(boxRef.current, dismissLabel)",
    "void dismissLabel",
    true,
  ],
  "navigation-menu.tsx": ["leave the nav landmark unnamed", "aria-label={label}", "aria-label={undefined}"],
  "num.tsx": [
    "print the number as a raw JavaScript number",
    "{formatNumber(value, locale, options)}",
    "{String(value)}",
  ],
  "number-field.tsx": [
    "leave the increment button to the engine's English name",
    "aria-label={incrementLabel}",
    "aria-label={undefined}",
  ],
  "overflow-list.tsx": [
    "stop reserving room for the overflow indicator",
    "(hasOverflow ? overflowSize : 0) +",
    "0 +",
  ],
  "pagination.tsx": [
    "print page numbers as raw JavaScript numbers",
    "const formatted = formatNumber(page, locale);",
    "const formatted = String(page);",
  ],
  "phone-input.tsx": [
    "stop country changes from emitting the corresponding E.164 value",
    "onChange?.(nextValue);",
    "void nextValue;",
  ],
  "popover.tsx": [
    "leave the popup unnamed by its trigger",
    '{...attr("aria-labelledby", named ? undefined : triggerId)}',
    '{...attr("aria-labelledby", undefined)}',
  ],
  "power-search.tsx": [
    "print numeric token values as raw JavaScript numbers",
    "return Number.isFinite(parsed) ? formatNumber(parsed, locale) : value;",
    "return value;",
  ],
  "progress.tsx": [
    "format the raw value where a percentage was asked for",
    'formatOptions.style === "percent" ? fraction : value,',
    "value,",
  ],
  "provider.tsx": [
    "disconnect direction from locale",
    "<DirectionProvider direction={direction(locale)}>",
    '<DirectionProvider direction={"ltr"}>',
  ],
  "questionnaire.tsx": [
    "print the position as a raw JavaScript number",
    "const currentNumber = formatNumber(position, locale);",
    "const currentNumber = String(position);",
  ],
  "radar-chart.tsx": [
    "stop reversing the dimensions under RTL",
    'chartMirror(locale).direction === "rtl" && authored.length > 1',
    "false",
  ],
  "radio-group.tsx": [
    "designate no tab stop when nothing is checked",
    "(children === undefined ? undefined : firstRadioValue(children))",
    "undefined",
  ],
  "range-calendar.tsx": [
    "let a bounded day be selected",
    "{...(disabled !== undefined ? { disabled } : {})}",
    "",
  ],
  "range-slider.tsx": [
    "leave both thumbs unnamed",
    "aria-label={thumbLabel}",
    "aria-label={undefined}",
  ],
  "rating.tsx": [
    "announce the score as raw JavaScript numbers",
    "aria-label={valueLabel(formatNumber(value, locale), formatNumber(maxValue, locale))}",
    "aria-label={valueLabel(String(value), String(maxValue))}",
  ],
  "resizable.tsx": [
    "make ArrowLeft shrink the start pane on a Persian page",
    "sign = rtl ? 1 : -1;",
    "sign = -1;",
  ],
  "sankey-chart.tsx": [
    "stop mirroring the flow under RTL",
    'const rtl = chartMirror(locale).direction === "rtl";',
    "const rtl = false;",
  ],
  "scroll-area.tsx": ["leave the region unnamed", "aria-label={label}", "aria-label={undefined}"],
  "scrollspy.tsx": [
    "never mark the observed section current",
    '{...(activeId === item.id ? { "aria-current": "location" as const } : {})}',
    "",
  ],
  "search-field.tsx": ["ignore Escape", 'if (event.key === "Escape") {', "if (false) {"],
  "segmented-control.tsx": ["leave the radio group unnamed", "aria-label={label}", "aria-label={undefined}"],
  "select.tsx": ["leave the listbox unnamed", "{...listName}", ""],
  "separator.tsx": [
    "announce a vertical separator as horizontal",
    'aria-orientation="vertical"',
    'aria-orientation="horizontal"',
  ],
  "sidebar.tsx": [
    "keep the collapse name on the trigger while collapsed",
    "label={collapsed ? expandLabel : collapseLabel}",
    "label={collapseLabel}",
  ],
  "skeleton-presets.tsx": [
    "expose the text preset to assistive technology",
    'aria-hidden="true" className={cn("flex w-full flex-col gap-2", className)}',
    'className={cn("flex w-full flex-col gap-2", className)}',
  ],
  "skeleton.tsx": [
    "expose the placeholder to assistive technology",
    'aria-hidden="true"',
    "aria-hidden={undefined}",
  ],
  "slider.tsx": [
    "announce the single thumb as a raw JavaScript number",
    "if (thumbCount < 2) return formatNumber(value, locale, formatOptions);",
    "if (thumbCount < 2) return String(value);",
  ],
  "sortable.tsx": [
    "make ArrowLeft the backward key on a horizontal Persian list",
    '        : isRtl\n          ? "ArrowRight"\n          : "ArrowLeft";',
    '        : "ArrowLeft";',
  ],
  "spinner.tsx": [
    "drop the required label from the status region",
    '<span className={showLabel ? "text-sm text-fg-muted" : "sr-only"}>{label}</span>',
    '<span className={showLabel ? "text-sm text-fg-muted" : "sr-only"}>{null}</span>',
  ],
  "steps.tsx": [
    "state every step as upcoming",
    'position < current ? "complete" : position === current ? "current" : "upcoming"',
    '"upcoming"',
  ],
  "switch.tsx": [
    "unwire the track from its label",
    "className={switchTrackVariants({ size })}\n          {...wiring.controlProps}",
    "className={switchTrackVariants({ size })}",
  ],
  "table.tsx": [
    "ignore Home/End/PageUp/PageDown jumps",
    "const jump = arrow.jump(event.key, event.ctrlKey || event.metaKey);",
    "const jump = null;",
  ],
  "tabs.tsx": [
    "derive no default selection from the first tab",
    ": firstTabId((rest as { children?: LumoNode }).children);",
    ": undefined;",
  ],
  "tag-group.tsx": [
    "leave the remove button unnamed",
    "aria-label={group.removeLabel(textValue)}",
    "aria-label={undefined}",
  ],
  "tag.tsx": [
    "leave the remove button unnamed",
    "aria-label={props.removeLabel}",
    "aria-label={undefined}",
  ],
  "tags-input.tsx": [
    "leave the tag remove buttons unnamed",
    "aria-label={removeLabel(tag)}",
    "aria-label={undefined}",
  ],
  "text-area.tsx": ["render an empty label", "<Label>{label}</Label>", "<Label>{null}</Label>"],
  "text-field.tsx": ["render an empty label", "<Label>{label}</Label>", "<Label>{null}</Label>"],
  "time-field.tsx": [
    "ignore the caller's validate",
    "const validationResult = validate?.(validationValue);",
    "const validationResult = undefined;",
  ],
  "timeline.tsx": [
    "draw a rail below the last item",
    "{ isLast: index === lastItemIndex }",
    "{ isLast: false }",
  ],
  "toast.tsx": [
    "give the toast region a fixed direction",
    "dir={direction(locale)}",
    'dir={"ltr"}',
  ],
  "toggle-group.tsx": [
    "swallow selection changes",
    "onSelectionChange?.(new Set(next.map((key) => keyByValue.get(key) ?? key)));",
    "void next;",
  ],
  "toggle.tsx": [
    "swallow onChange",
    '...attr("onPressedChange", onChange),',
    '...attr("onPressedChange", undefined),',
  ],
  "toolbar.tsx": ["leave the toolbar unnamed", "aria-label={label}", "aria-label={undefined}"],
  "tooltip.tsx": [
    "stop describing the trigger by the open tooltip",
    '{...attr("aria-describedby", described)}',
    '{...attr("aria-describedby", undefined)}',
  ],
  "transfer-list.tsx": [
    "announce the moved count as a raw JavaScript number",
    "strings.moved(formatNumber(movedCount, locale), destination)",
    "strings.moved(String(movedCount), destination)",
  ],
  "tree-select.tsx": [
    "derive multiple-mode parent state from descendants instead of its value",
    'mode === "checkbox" ? state === "checked" : selected.has(node.value)',
    'state === "checked"',
  ],
  "tree.tsx": [
    "make ArrowRight the forward key on a Persian page",
    'const forwardKey = tree.turn.direction === "rtl" ? "ArrowLeft" : "ArrowRight";',
    'const forwardKey = "ArrowRight";',
  ],
  "treemap-chart.tsx": [
    "tile left-to-right under RTL",
    'chartMirror(locale).direction === "rtl" ? treemapMirroredSquarify : "squarify"',
    '"squarify"',
  ],
  "virtual-list.tsx": [
    "state every row's position one too low",
    "aria-posinset={item.index + 1}",
    "aria-posinset={item.index}",
  ],
});

// Refuse to start unless every module is classified exactly once.
for (const file of files) {
  const presentational = PRESENTATIONAL.includes(file);
  const behavioural = Object.hasOwn(BEHAVIOURAL, file);
  if (presentational === behavioural) {
    throw new Error(
      presentational
        ? `${file} is listed as PRESENTATIONAL and carries a behavioural operator; pick one`
        : `${file} is neither in PRESENTATIONAL nor in BEHAVIOURAL — classify it before it ` +
          "falls into class-strip unnoticed",
    );
  }
}
for (const listed of [...PRESENTATIONAL, ...Object.keys(BEHAVIOURAL)]) {
  if (!files.includes(listed)) throw new Error(`${listed} is classified but is not a module`);
}

/**
 * @param {string} file
 * @param {string} source
 */
function mutate(file, source) {
  const behavioural = BEHAVIOURAL[file];
  if (behavioural !== undefined) {
    const [operator, anchor, replacement, all] = behavioural;
    return {
      operator,
      source: all === true ? source.replaceAll(anchor, replacement) : source.replace(anchor, replacement),
    };
  }
  return {
    operator: "remove rendered class assignments",
    source: source.replaceAll("className=", "data-lumo-mutant="),
  };
}

/**
 * @type {Array<{
 *   file: string;
 *   operator: string;
 *   status: "killed" | "survived" | "unobserved" | "invalid";
 *   durationMs: number;
 *   stdout?: string;
 *   stderr?: string;
 * }>}
 */
const results = [];
const only = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1]?.split(",")
  : undefined;

for (const file of files) {
  if (only && !only.includes(file)) continue;
  const path = join(sourceDirectory, file);
  const original = readFileSync(path, "utf8");
  const mutant = mutate(file, original);
  if (mutant.source === original) {
    results.push({ file, operator: mutant.operator, status: "invalid", durationMs: 0 });
    process.stdout.write(`INVALID ${file}\n`);
    continue;
  }

  const started = performance.now();
  /** @type {ReturnType<typeof spawnSync> | undefined} */
  let run;
  try {
    writeFileSync(path, mutant.source);
    run = spawnSync(
      "pnpm",
      ["exec", "vitest", "related", `src/${file}`, "--run", "--reporter=dot"],
      {
        cwd: join(repository, "packages/ui"),
        encoding: "utf8",
        env: { ...process.env, FORCE_COLOR: "0" },
      },
    );
  } finally {
    writeFileSync(path, original);
  }

  const output = `${run?.stdout ?? ""}${run?.stderr ?? ""}`;
  const unobserved = /No test files found/i.test(output);
  const killed = !unobserved && run?.status !== 0;
  const status = unobserved ? "unobserved" : killed ? "killed" : "survived";
  results.push({
    file,
    operator: mutant.operator,
    status,
    durationMs: Math.round(performance.now() - started),
    ...(status === "killed"
      ? {}
      : { stdout: String(run?.stdout ?? ""), stderr: String(run?.stderr ?? "") }),
  });
  process.stdout.write(`${status.toUpperCase()} ${file}\n`);
}

const summary = {
  generatedAt: new Date().toISOString(),
  population: results.length,
  behavioural: results.filter((result) => Object.hasOwn(BEHAVIOURAL, result.file)).length,
  presentational: results.filter((result) => PRESENTATIONAL.includes(result.file)).length,
  killed: results.filter((result) => result.status === "killed").length,
  survived: results.filter((result) => result.status === "survived").length,
  unobserved: results.filter((result) => result.status === "unobserved").length,
  invalid: results.filter((result) => result.status === "invalid").length,
  results,
};

const outputFlag = process.argv.indexOf("--output");
if (outputFlag >= 0) {
  const output = process.argv[outputFlag + 1];
  if (!output) throw new Error("--output requires a path");
  writeFileSync(resolve(repository, output), `${JSON.stringify(summary, null, 2)}\n`);
}

process.stdout.write(
  `\n${summary.killed}/${summary.population} killed; ${summary.survived} survived; ` +
    `${summary.unobserved} unobserved; ${summary.invalid} invalid ` +
    `(${summary.behavioural} behavioural, ${summary.presentational} presentational)\n`,
);

if (summary.survived > 0 || summary.unobserved > 0 || summary.invalid > 0) {
  process.exitCode = 1;
}
