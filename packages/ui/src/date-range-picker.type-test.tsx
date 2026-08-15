/**
 * Compile-time pin for `DateRangePicker`: `label`, `startLabel`, `endLabel`,
 * `openCalendarLabel` and `today` are all required. An unused
 * `@ts-expect-error` fails `tsc`.
 */
import type { CalendarDate } from "@internationalized/date";
import { DateRangePicker } from "./date-range-picker.tsx";

declare const today: CalendarDate;

// @ts-expect-error label is required: it names the group
void <DateRangePicker startLabel="شروع" endLabel="پایان" openCalendarLabel="باز کردن تقویم" today={today} />;
// @ts-expect-error startLabel is required: it names the first field
void <DateRangePicker label="بازه" endLabel="پایان" openCalendarLabel="باز کردن تقویم" today={today} />;
// @ts-expect-error endLabel is required: it names the second field
void <DateRangePicker label="بازه" startLabel="شروع" openCalendarLabel="باز کردن تقویم" today={today} />;
// @ts-expect-error openCalendarLabel is required: the calendar button would be nameless
void <DateRangePicker label="بازه" startLabel="شروع" endLabel="پایان" today={today} />;
// @ts-expect-error today is required: the component reads no clock
void <DateRangePicker label="بازه" startLabel="شروع" endLabel="پایان" openCalendarLabel="باز کردن تقویم" />;

void <DateRangePicker label="بازه" startLabel="شروع" endLabel="پایان" openCalendarLabel="باز کردن تقویم" today={today} />;
void <DateRangePicker label="بازه" startLabel="شروع" endLabel="پایان" openCalendarLabel="باز کردن تقویم" today={today} minValue={today} maxValue={today} onChange={() => undefined} />;
