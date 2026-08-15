"use client";

import {
  cn,
  formatDate,
  formatNumber,
  type Locale,
  type LumoNode,
} from "@lumo-ui/core";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
  optional,
} from "@lumo-ui/ui";

/**
 * The panel beside a checkout: what is being booked, when, what it costs.
 *
 * `"use client"`: `onConfirm` is a callback.
 *
 * `locale` is required and the block formats: `formatDate` selects the Jalali
 * calendar under `fa-IR`. The two dates are separate elements joined by the
 * caller's `dateRangeJoiner`, never a literal `–` (a neutral glyph between two
 * strong bidi runs reorders). Money rows are `justify-between` flex, not a
 * table with `text-right`, so amounts sit on the inline end in both scripts.
 */
export interface BookingLine {
  /** Stable key. Not rendered. */
  id: string;
  /** What this charge is for, e.g. «۲ شب اقامت». */
  label: string;
  /** A dimmer second line, e.g. «شامل مالیات». */
  note?: string | undefined;
  /** The amount. Never rendered raw. */
  amount: number;
}

export interface BookingSummaryStrings {
  /** The panel's heading, e.g. «خلاصه رزرو». */
  title: string;
  /** Label for the start date row, e.g. «ورود». */
  startLabel: string;
  /** Label for the end date row, e.g. «خروج». */
  endLabel: string;
  /** The word between the two dates in the compact range, e.g. «تا». */
  dateRangeJoiner: string;
  /** Label for the pre-total row. */
  subtotalLabel: string;
  /** Label for the total row. */
  totalLabel: string;
  /** The confirm button. */
  confirm: string;
  /** Small print under the button, e.g. «تا ۲۴ ساعت قبل رایگان لغو می‌شود». */
  footnote?: string | undefined;
}

export interface BookingSummaryProps {
  strings: BookingSummaryStrings;
  /** Formats every figure and every date. Required by design. */
  locale: Locale;
  lines: readonly BookingLine[];
  /** The grand total. Never rendered raw. */
  total: number;
  /** Sum before the total, when the two differ. Omit to hide the row. */
  subtotal?: number | undefined;
  startsAt?: Date | undefined;
  endsAt?: Date | undefined;
  /** `Intl.NumberFormat` options for every amount, e.g. `{style:"currency",currency:"IRR"}`. No default — a currency is a business decision. */
  currencyFormat?: Intl.NumberFormatOptions | undefined;
  dateFormat?: Intl.DateTimeFormatOptions | undefined;
  onConfirm?: (() => void) | undefined;
  /** A payment or availability failure, already translated. */
  error?: LumoNode;
  isPending?: boolean | undefined;
  className?: string | undefined;
}

const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: "medium" };

export function BookingSummary({
  strings,
  locale,
  lines,
  total,
  subtotal,
  startsAt,
  endsAt,
  currencyFormat,
  dateFormat = DEFAULT_DATE_FORMAT,
  onConfirm,
  error,
  isPending = false,
  className,
}: BookingSummaryProps) {
  return (
    <Card variant="outlined" className={cn("w-full max-w-sm", className)}>
      <CardHeader>
        <CardTitle level={2}>{strings.title}</CardTitle>
      </CardHeader>

      <CardBody className="flex flex-col gap-4">
        {startsAt !== undefined || endsAt !== undefined ? (
          // `flex-wrap`: two Jalali dates plus a joiner overflow a 320px panel; a scrollbar here is fatal.
          <div className="flex flex-wrap items-center gap-2 text-sm text-fg">
            {startsAt !== undefined ? (
              <span className="flex flex-col">
                <span className="text-xs text-fg-subtle">{strings.startLabel}</span>
                {/* `dateTime` stays ISO-8601 — a machine value, not visible
                    text, so neither `LumoNode` nor the gate's digit rule
                    applies to it. The CHILD is the Jalali string. */}
                <time dateTime={startsAt.toISOString()}>
                  {formatDate(startsAt, locale, dateFormat)}
                </time>
              </span>
            ) : null}

            {startsAt !== undefined && endsAt !== undefined ? (
              <span aria-hidden="true" className="text-fg-subtle">
                {strings.dateRangeJoiner}
              </span>
            ) : null}

            {endsAt !== undefined ? (
              <span className="flex flex-col">
                <span className="text-xs text-fg-subtle">{strings.endLabel}</span>
                <time dateTime={endsAt.toISOString()}>
                  {formatDate(endsAt, locale, dateFormat)}
                </time>
              </span>
            ) : null}
          </div>
        ) : null}

        {/*
         * `<dl>`, because these ARE name/value pairs; written directly since
         * the library ships no description-list primitive.
         */}
        <dl className="flex flex-col gap-2 text-sm">
          {lines.map((line) => (
            <div key={line.id} className="flex items-start justify-between gap-3">
              <dt className="flex min-w-0 flex-col text-fg-muted">
                <span className="truncate">{line.label}</span>
                {line.note !== undefined ? (
                  <span className="text-xs text-fg-subtle">{line.note}</span>
                ) : null}
              </dt>
              {/* `shrink-0`, no `text-right`: the flex row already puts this at
                  the inline end, which mirrors. */}
              <dd className="shrink-0 text-fg">
                {formatNumber(line.amount, locale, currencyFormat)}
              </dd>
            </div>
          ))}

          {subtotal !== undefined ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-fg-muted">{strings.subtotalLabel}</dt>
              <dd className="text-fg">
                {formatNumber(subtotal, locale, currencyFormat)}
              </dd>
            </div>
          ) : null}
        </dl>

        <Separator />

        <dl className="flex items-baseline justify-between gap-3">
          <dt className="text-sm font-medium text-fg">{strings.totalLabel}</dt>
          <dd className="text-lg font-semibold text-fg">
            {formatNumber(total, locale, currencyFormat)}
          </dd>
        </dl>

        {error !== undefined ? (
          <Alert tone="critical" live="assertive">
            {error}
          </Alert>
        ) : null}
      </CardBody>

      {/*
       * `CardFooter` is `justify-end` (INLINE end) — so full-width needs
       * `flex-col` + `w-full`, not a positional override.
       */}
      <CardFooter className="flex-col items-stretch gap-2">
        <Button size="lg" isDisabled={isPending} {...optional("onPress", onConfirm)}>
          {strings.confirm}
        </Button>
        {strings.footnote !== undefined ? (
          <p className="text-center text-xs text-fg-subtle">{strings.footnote}</p>
        ) : null}
      </CardFooter>
    </Card>
  );
}
