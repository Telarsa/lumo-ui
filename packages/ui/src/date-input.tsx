"use client";

import {
  useCallback,
  useImperativeHandle,
  useRef,
  type ComponentProps,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
} from "react";
import { direction, type Locale } from "@lumo-ui/core";
import { cn } from "@lumo-ui/core";
import { useLumoStringsFor } from "./locale.ts";
import {
  dateInputVariants,
  dateLiteralVariants,
  dateSegmentVariants,
} from "./calendar.variants.ts";
import { optional } from "./form.tsx";
import {
  digitFromKey,
  type DateFieldState,
  type EditableSegmentType,
} from "./date-field-state.ts";

export { dateInputVariants, dateLiteralVariants, dateSegmentVariants };

/**
 * THE segmented input: the keyboard model, once, for every date and time
 * surface, and state-agnostic (`useDateFieldState` or `useTimeFieldState`).
 * Up/Down cycle a segment; the inline-axis arrows move between segments and
 * WHICH key is forward comes from `direction(locale)`; Home/End are NOT
 * mirrored (reading order already flipped); digits type-to-fill in either
 * numbering system with the buffer in a ref; the `dayPeriod` segment takes the
 * first LETTER of either period in the reader's script. Each segment is a
 * `role="spinbutton"` with a Latin `aria-valuenow` (spec-mandated decimal) and
 * a Persian `aria-valuetext`.
 */

export type DateInputSize = "sm" | "md" | "lg";

/** What a container (a picker) needs in order to focus the field. */
export interface DateInputHandle {
  /** Moves focus to the first editable segment. */
  focus: () => void;
}

export interface DateInputProps
  /* `ref` is OWNED and WIDENED to a `DateInputHandle` ("focus the first
   * segment"); `role`/`aria-labelledby`/`aria-describedby` are written from props. */
  extends Omit<
    ComponentProps<"div">,
    "children" | "className" | "ref" | "role" | "aria-labelledby" | "aria-describedby"
  > {
  /** The engine. `useDateFieldState` or `useTimeFieldState` — either. */
  state: DateFieldState;
  /** Selects the numbering system AND the arrow-key mapping. Passed, not read from context, so a picker cannot disagree with it. */
  locale: Locale;
  /** The id of the element naming this group. REQUIRED — an unnamed group of spinbuttons announces as bare "group". */
  labelId: string;
  /** Space-separated idrefs for `aria-describedby`. */
  describedBy?: string | undefined;
  isDisabled?: boolean | undefined;
  /** The segments are announced and focusable but cannot be edited. */
  isReadOnly?: boolean | undefined;
  /** Draws the invalid state on every segment. */
  isInvalid?: boolean | undefined;
  /** The control-height variant shared across form controls. */
  size?: DateInputSize;
  /** Renders the segments WITHOUT the bordered box, for a caller (a picker) that supplies its own. */
  bare?: boolean | undefined;
  className?: string | undefined;
  ref?: Ref<DateInputHandle> | undefined;
}

export function DateInput({
  state,
  locale,
  labelId,
  describedBy,
  isDisabled,
  isReadOnly,
  isInvalid,
  size,
  bare,
  className,
  ref,
  ...props
}: DateInputProps) {
  // Segment names and the "empty" value text for THIS `locale`: built-in, or the app's own strings.
  const strings = useLumoStringsFor(locale);
  const dir = direction(locale);

  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  /** Digits typed so far in the segment currently being filled. */
  const typed = useRef<{ index: number; buffer: number } | null>(null);

  const focusSegment = useCallback((index: number) => {
    segmentRefs.current[index]?.focus();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        const first = state.editableIndices[0];
        if (first != null) focusSegment(first);
      },
    }),
    [focusSegment, state.editableIndices],
  );

  const move = useCallback(
    (from: number, step: number) => {
      const order = state.editableIndices;
      const at = order.indexOf(from);
      const next = order[at + step];
      if (next != null) focusSegment(next);
    },
    [focusSegment, state.editableIndices],
  );

  const onSegmentKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>, index: number, type: EditableSegmentType) => {
      // Resolved from the direction, never written down — the line the component exists to get right.
      const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
      const backward = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
      const order = state.editableIndices;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          typed.current = null;
          state.cycle(type, 1);
          return;
        case "ArrowDown":
          event.preventDefault();
          typed.current = null;
          state.cycle(type, -1);
          return;
        case forward:
          event.preventDefault();
          typed.current = null;
          move(index, 1);
          return;
        case backward:
          event.preventDefault();
          typed.current = null;
          move(index, -1);
          return;
        case "Home": {
          event.preventDefault();
          typed.current = null;
          // Not mirrored — "first" is already in reading order.
          const first = order[0];
          if (first != null) focusSegment(first);
          return;
        }
        case "End": {
          event.preventDefault();
          typed.current = null;
          const last = order[order.length - 1];
          if (last != null) focusSegment(last);
          return;
        }
        case "Backspace":
        case "Delete":
          event.preventDefault();
          typed.current = null;
          state.clearSegment(type);
          return;
        default:
          break;
      }

      // The day period takes LETTERS in the reader's script; the candidates come from the engine's `Intl` text.
      if (type === "dayPeriod") {
        const key = event.key.toLowerCase();
        if (key.length !== 1) return;
        const texts = state.optionTexts?.(type);
        if (texts === undefined) return;
        const match = texts.findIndex((text) => text.toLowerCase().startsWith(key));
        if (match === -1) return;
        event.preventDefault();
        state.setSegment(type, match);
        // Advance the way a filled numeric segment does.
        move(index, 1);
        return;
      }

      const digit = digitFromKey(event.key, locale);
      if (digit == null) return;
      event.preventDefault();

      const { max } = state.boundsOf(type);
      const buffer = typed.current?.index === index ? typed.current.buffer : 0;
      let next = buffer * 10 + digit;
      if (next > max) next = digit;
      state.setSegment(type, next);

      if (next * 10 > max) {
        typed.current = null;
        move(index, 1);
      } else {
        typed.current = { index, buffer: next };
      }
    },
    [dir, focusSegment, locale, move, state],
  );

  return (
    <div
      {...props}
      data-lumo=""
      role="group"
      aria-labelledby={labelId}
      {...optional("aria-describedby", describedBy)}
      className={cn(bare === true ? "flex flex-1 items-center" : dateInputVariants({ size }), className)}
      {...(isInvalid === true ? { "data-invalid": "" } : {})}
      {...(isDisabled === true ? { "data-disabled": "" } : {})}
    >
      {state.segments.map((segment, index) => {
        if (!segment.isEditable) {
          return (
            <span
              // Separators are positional and there is nothing else to key on.
              key={`literal-${String(index)}`}
              data-lumo=""
              data-type="literal"
              aria-hidden="true"
              className={dateLiteralVariants()}
            >
              {segment.text}
            </span>
          );
        }
        const type = segment.type as EditableSegmentType;
        return (
          <div
            key={type}
            ref={(node) => {
              segmentRefs.current[index] = node;
            }}
            data-lumo=""
            data-type={type}
            role="spinbutton"
            tabIndex={isDisabled === true ? -1 : 0}
            aria-label={strings.dateField[type]}
            {...optional("aria-valuemin", segment.minValue)}
            {...optional("aria-valuemax", segment.maxValue)}
            {...optional("aria-valuenow", segment.value)}
            // The Persian-audible override for the spec-mandated Latin `aria-valuenow`.
            aria-valuetext={segment.value == null ? strings.dateField.empty : segment.text}
            {...(isReadOnly === true ? { "aria-readonly": true } : {})}
            {...(segment.isPlaceholder ? { "data-placeholder": "" } : {})}
            {...(focusedIndex === index ? { "data-focused": "" } : {})}
            {...(isInvalid === true ? { "data-invalid": "" } : {})}
            {...(isDisabled === true ? { "data-disabled": "" } : {})}
            onFocus={() => {
              setFocusedIndex(index);
            }}
            onBlur={() => {
              setFocusedIndex((current) => (current === index ? null : current));
              typed.current = null;
            }}
            onKeyDown={(event) => {
              onSegmentKeyDown(event, index, type);
            }}
            className={dateSegmentVariants()}
          >
            {segment.text}
          </div>
        );
      })}
    </div>
  );
}
