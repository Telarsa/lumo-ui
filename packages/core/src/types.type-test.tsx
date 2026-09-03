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
import type { BuiltinLocale, LumoNode, Locale } from "./types.ts";
import type { LinkDOMProps } from "./props.ts";

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

// --- the locale type is OPEN since 0.2.0 (decision §28) ---------------------
// Any BCP-47 tag is a Locale; the built-in two still autocomplete and narrow.
const _anyLocale: Locale = "de-DE";
const _builtin: BuiltinLocale = "fa-IR";
// @ts-expect-error a consumer language is not a BUILT-IN locale — Lumo carries no strings for it
const _notBuiltin: BuiltinLocale = "de-DE";


const _goodLocale: Locale = "fa-IR";

// The RAC compatibility carriers are gone (15 Aug 2026); a link bag is just
// the anchor attributes.
const _linkBagWithAbsentRouter: LinkDOMProps = { href: "/" };

// Silence unused-local diagnostics without weakening the checks above.
void [
  _rawNumber,
  _computed,
  _bigint,
  _formatted,
  _element,
  _nullish,
  _array,
  _anyLocale,
  _notBuiltin,
  _builtin,
  _goodLocale,
  _linkBagWithAbsentRouter,
];
