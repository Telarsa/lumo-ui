/**
 * Compile-time assertions. This file emits nothing and is never imported —
 * `tsc --noEmit` IS the test.
 *
 * `@ts-expect-error` inverts the usual failure mode: if the error on the next
 * line ever stops happening, tsc reports "Unused '@ts-expect-error' directive"
 * and the build goes red. So a regression that re-permits raw numbers cannot
 * pass silently, which is the whole point — this is guarding against exactly
 * the class of defect that renders correctly and reads wrong.
 */
import type { LumoNode, Locale } from "./types";

declare function Cell(props: { children: LumoNode }): null;

const day = { day: 18, label: "۱۸" };

// --- the defect this type exists to prevent ---------------------------------
// A prototype shipped 77/77 Latin-digit calendar cells from exactly this.
// @ts-expect-error a raw number is not a LumoNode — format it first
const _rawNumber = <Cell>{day.day}</Cell>;

// @ts-expect-error template-free numeric expressions are equally banned
const _computed = <Cell>{day.day + 1}</Cell>;

// @ts-expect-error bigint too
const _bigint = <Cell>{123n}</Cell>;

// --- what remains allowed ---------------------------------------------------
// A string means someone chose a representation, which is the decision we force.
const _formatted = <Cell>{day.label}</Cell>;
const _element = <Cell><span>{day.label}</span></Cell>;
const _nullish = <Cell>{null}</Cell>;
const _array = <Cell>{[day.label, day.label]}</Cell>;

// --- the locale union is closed --------------------------------------------
// @ts-expect-error an arbitrary tag is not a Locale — adding one is an edit to
// the union plus a passing parity test, never a string from a route param
const _badLocale: Locale = "de-DE";

const _goodLocale: Locale = "fa-IR";

// Silence unused-local diagnostics without weakening the checks above.
void [_rawNumber, _computed, _bigint, _formatted, _element, _nullish, _array, _badLocale, _goodLocale];
