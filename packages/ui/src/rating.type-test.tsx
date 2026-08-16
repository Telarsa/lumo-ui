/**
 * Compile-time pin for `Rating`: interactive ratings require `label` and
 * `starLabel`, read-only ratings require `value` and `valueLabel`, and the two
 * shapes do not mix. An unused `@ts-expect-error` fails `tsc`.
 */
import { Rating } from "./rating.tsx";

// @ts-expect-error an interactive rating needs label and starLabel
void <Rating locale="fa-IR" />;
// @ts-expect-error starLabel is required: each star button would be a bare digit
void <Rating locale="fa-IR" label="امتیاز" />;
// @ts-expect-error a read-only rating needs valueLabel: the value would be silent
void <Rating locale="fa-IR" isReadOnly value={3} />;
// @ts-expect-error a read-only rating has no label/starLabel: it is not a radio group
void <Rating locale="fa-IR" isReadOnly value={3} valueLabel={(v, m) => `${v}/${m}`} label="امتیاز" />;
// @ts-expect-error valueLabel belongs to the read-only shape only
void <Rating locale="fa-IR" label="امتیاز" starLabel={(v) => v} valueLabel={(v, m) => `${v}/${m}`} />;
// @ts-expect-error locale is required: it formats the star values
void <Rating label="امتیاز" starLabel={(v) => v} />;

void <Rating locale="fa-IR" label="امتیاز" starLabel={(v) => `${v} ستاره`} defaultValue={3} onChange={() => undefined} />;
void <Rating locale="fa-IR" isReadOnly value={4} valueLabel={(v, m) => `${v} از ${m}`} maxValue={5} />;
