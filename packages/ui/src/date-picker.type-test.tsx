/**
 * Compile-time pin for `DatePicker`: `label`, `openCalendarLabel` and `today`
 * are required, and a year dropdown demands BOTH bounds (`CalendarNavigation`
 * is all-or-nothing). An unused `@ts-expect-error` fails `tsc`.
 */
import type { CalendarDate } from "@internationalized/date";
import { DatePicker } from "./date-picker.tsx";

declare const today: CalendarDate;

// @ts-expect-error label is required: it names the field
void <DatePicker openCalendarLabel="باز کردن تقویم" today={today} />;
// @ts-expect-error openCalendarLabel is required: the calendar button would be nameless
void <DatePicker label="تاریخ" today={today} />;
// @ts-expect-error today is required: the component reads no clock
void <DatePicker label="تاریخ" openCalendarLabel="باز کردن تقویم" />;
// @ts-expect-error a year dropdown without both bounds
void <DatePicker label="تاریخ" openCalendarLabel="باز کردن تقویم" today={today} captionLayout="dropdown" />;
// @ts-expect-error a year dropdown with only maxValue
void <DatePicker label="تاریخ" openCalendarLabel="باز کردن تقویم" today={today} captionLayout="dropdown-years" maxValue={today} />;

void <DatePicker label="تاریخ" openCalendarLabel="باز کردن تقویم" today={today} />;
void <DatePicker label="تاریخ" openCalendarLabel="باز کردن تقویم" today={today} captionLayout="dropdown" minValue={today} maxValue={today} size="sm" />;
