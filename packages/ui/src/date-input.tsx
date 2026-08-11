"use client";

import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
} from "react";
import { direction, stringsFor, type Locale } from "@lumo-ui/core";
import { cn } from "@lumo-ui/core";
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
 * THE segmented input. The keyboard model, once, for every date surface.
 *
 *     const state = useDateFieldState({ locale, value, onChange });
 *     <DateInput state={state} locale={locale} labelId={labelId} />
 *
 * ═══ WHY THIS FILE EXISTS, AND WHY IT IS THE UNBLOCKING ONE ═════════════════
 *
 * The segmented input was written on Base UI inside `date-field.tsx` — the
 * markup, the refs and the whole keyboard grammar, inline in one component. It
 * worked, and it was unreachable: `time-field.tsx`, `date-picker.tsx` and
 * `date-range-picker.tsx` all still imported `renderSegment`, which was React
 * Aria's, so the library shipped TWO segmented inputs with different keyboard
 * behaviour and only one of them was Lumo's.
 *
 * That is also why the date family could not be migrated a component at a time:
 * a `DatePicker` CONTAINS a date input, so the input has to be a part before
 * anything containing one can move. `experiments/in-flight/README.md` names
 * this as step 1 and says the next attempt should start here rather than at the
 * calendar. This is that step.
 *
 * It is deliberately state-AGNOSTIC. `useDateFieldState` and
 * `useTimeFieldState` both return `DateFieldState`, and this file cannot tell
 * which it was handed — it reads `segments`, moves focus and calls `cycle` /
 * `setSegment` / `clearSegment`. A date has a leap rule and a time does not,
 * and neither fact belongs in a keyboard handler.
 *
 * ═══ THE KEYBOARD MODEL, WHICH IS THE ENTIRE COMPONENT ══════════════════════
 *
 *     Arrow up / down     cycle this segment inside its own unit, wrapping
 *     Arrow along the     move to the next / previous segment — and WHICH key
 *       inline axis       that is depends on the direction, see below
 *     Digits              type-to-fill, in either numbering system
 *     Backspace / Delete  clear this segment
 *     Home / End          first / last segment
 *
 * ── ARROW TRAVERSAL IS DIRECTION-DEPENDENT AND THIS IS THE WHOLE POINT ──────
 *
 * On a Persian page the segments run right to left, so ArrowLeft moves to the
 * NEXT segment and ArrowRight to the previous one. Hard-coding the Latin
 * mapping renders correctly, type-checks, and is wrong for every user of this
 * library — the same class of defect as `sortable.tsx`'s horizontal arrows and
 * `table.variants.ts`'s `gridArrow`, and it is resolved from the same source of
 * truth, `direction(locale)`.
 *
 * Home and End are NOT mirrored, and that is deliberate rather than an
 * oversight: they mean "first" and "last" in reading order, and reading order
 * is what already flipped. Mirroring them too would flip it back.
 *
 * ── TYPE-TO-FILL, AND THE BUFFER THAT IS A REF ─────────────────────────────
 *
 * Digits accumulate inside one segment until another would overflow its bound,
 * then focus advances on its own — typing ۱۹ into a day segment lands on 19 and
 * moves on, typing ۴ moves on immediately because 40 cannot be a day. The
 * buffer is a ref rather than state because it must not survive a blur or an
 * arrow key, and because it is never rendered.
 *
 * ── THE `dayPeriod` SEGMENT TAKES LETTERS, NOT DIGITS ──────────────────────
 *
 * «قبل‌ازظهر» has no numeric form, so a digit is meaningless there and is
 * ignored rather than being coerced into 0 or 1. What it does take is the first
 * letter of either period IN THE READER'S OWN SCRIPT, read off the segment's
 * own rendered text, so a Persian user presses «ق» or «ب» and an English one
 * presses A or P without this file knowing either alphabet.
 *
 * ═══ WHAT A SEGMENT IS, TO A SCREEN READER ══════════════════════════════════
 *
 * `role="spinbutton"`, which is what makes a value that changes under arrow
 * keys be announced as a new value rather than as the text being read again.
 *
 * `aria-valuenow` is required by the spec to be a DECIMAL NUMBER, so it cannot
 * carry Persian digits — it is the one announced value in this library that
 * must stay Latin. `aria-valuetext` is the override that makes it audible in
 * Persian anyway, and it is why the served bytes read `aria-valuetext="۱۹"`
 * beside `aria-valuenow="19"` rather than either alone.
 */

export type DateInputSize = "sm" | "md" | "lg";

/** What a container (a picker) needs in order to focus the field. */
export interface DateInputHandle {
  /** Moves focus to the first editable segment. */
  focus: () => void;
}

export interface DateInputProps {
  /** The engine. `useDateFieldState` or `useTimeFieldState` — either. */
  state: DateFieldState;
  /**
   * Selects the numbering system AND the arrow-key mapping.
   *
   * Passed rather than read from context here, because a picker already has the
   * locale in hand and two reads of one fact is how they come to disagree.
   */
  locale: Locale;
  /**
   * The id of the element naming this group. REQUIRED.
   *
   * A `role="group"` of spinbuttons with no name is announced as "group" and
   * nothing else. It is an idref rather than a string because the label is a
   * real, visible element that a caller has already rendered — and
   * `resolved-idrefs` in `lumo-gate` fails the build if it points at nothing.
   */
  labelId: string;
  /** Space-separated idrefs for `aria-describedby`. */
  describedBy?: string | undefined;
  isDisabled?: boolean | undefined;
  isReadOnly?: boolean | undefined;
  /** Draws the invalid state on every segment. */
  isInvalid?: boolean | undefined;
  size?: DateInputSize;
  /**
   * Renders the segments WITHOUT the bordered box, for a caller that supplies
   * its own — `date-picker.tsx` wraps the segments and a trigger button in one
   * bordered group, and two nested borders is what that looks like otherwise.
   */
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
}: DateInputProps) {
  const strings = stringsFor(locale);
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
      // See the file header: the mapping is resolved from the direction, never
      // written down. This is the line the whole component exists to get right.
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
          // Not mirrored — "first" is already in reading order. See the header.
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

      /*
       * The day period takes LETTERS, in the reader's own script — see the
       * header. The candidates come from the ENGINE, which read them out of
       * `Intl`, so this file matches a keystroke against «ق» and «ب» on a
       * Persian page and against A and P on an English one while knowing
       * neither alphabet.
       */
      if (type === "dayPeriod") {
        const key = event.key.toLowerCase();
        if (key.length !== 1) return;
        const texts = state.optionTexts?.(type);
        if (texts === undefined) return;
        const match = texts.findIndex((text) => text.toLowerCase().startsWith(key));
        if (match === -1) return;
        event.preventDefault();
        state.setSegment(type, match);
        // Advance the way a filled numeric segment does, so typing straight
        // through a time never needs a manual arrow at the end.
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
            // The Persian-audible override for a spec-mandated Latin
            // `aria-valuenow`. See the file header.
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
