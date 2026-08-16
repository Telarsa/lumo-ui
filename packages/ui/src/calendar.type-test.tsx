/**
 * Compile-time pin for `Calendar`: `label`, `locale` and `today` are required,
 * a year dropdown demands BOTH bounds (`CalendarNavigation` is all-or-nothing),
 * and the component takes no children. An unused `@ts-expect-error` fails `tsc`.
 */
import type { CalendarDate } from "@internationalized/date";
import { Calendar } from "./calendar.tsx";

declare const today: CalendarDate;

// @ts-expect-error label is required: it names the grid
void <Calendar locale="fa-IR" today={today} />;
// @ts-expect-error locale is required: it chooses the calendar system
void <Calendar label="تقویم" today={today} />;
// @ts-expect-error today is required: the component reads no clock
void <Calendar label="تقویم" locale="fa-IR" />;
// @ts-expect-error a year dropdown without minValue/maxValue would read a clock to bound itself
void <Calendar label="تقویم" locale="fa-IR" today={today} captionLayout="dropdown" />;
// @ts-expect-error a year dropdown with only one bound
void <Calendar label="تقویم" locale="fa-IR" today={today} captionLayout="dropdown-years" minValue={today} />;
// @ts-expect-error the calendar renders its own grid; children are not a prop
void <Calendar label="تقویم" locale="fa-IR" today={today}>متن</Calendar>;

void <Calendar label="تقویم" locale="fa-IR" today={today} />;
void <Calendar label="تقویم" locale="fa-IR" today={today} captionLayout="dropdown" minValue={today} maxValue={today} />;
void <Calendar label="تقویم" locale="fa-IR" today={today} captionLayout="dropdown-months" onChange={() => undefined} />;
