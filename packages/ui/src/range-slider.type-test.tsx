/**
 * Compile-time pin for `RangeSlider`: `locale`, `label`, `startLabel` and
 * `endLabel` are required, the value is a pair, and there is no `dir` prop.
 * An unused `@ts-expect-error` fails `tsc`.
 */
import { RangeSlider } from "./range-slider.tsx";

// @ts-expect-error label is required: it names the group
void <RangeSlider locale="fa-IR" startLabel="از" endLabel="تا" />;
// @ts-expect-error startLabel is required: it names the first thumb
void <RangeSlider locale="fa-IR" label="بازه قیمت" endLabel="تا" />;
// @ts-expect-error endLabel is required: it names the second thumb
void <RangeSlider locale="fa-IR" label="بازه قیمت" startLabel="از" />;
// @ts-expect-error locale is required: it formats the thumb values
void <RangeSlider label="بازه قیمت" startLabel="از" endLabel="تا" />;
// @ts-expect-error a range is a pair, not one number
void <RangeSlider locale="fa-IR" label="بازه قیمت" startLabel="از" endLabel="تا" value={[10]} />;
// @ts-expect-error no dir prop: direction comes from the locale
void <RangeSlider locale="fa-IR" label="بازه قیمت" startLabel="از" endLabel="تا" dir="ltr" />;

void <RangeSlider locale="fa-IR" label="بازه قیمت" startLabel="از" endLabel="تا" />;
void <RangeSlider locale="fa-IR" label="بازه قیمت" startLabel="از" endLabel="تا" defaultValue={[10, 90]} step={5} onChangeEnd={() => undefined} />;
