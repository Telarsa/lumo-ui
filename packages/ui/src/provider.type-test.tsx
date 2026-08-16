/**
 * Compile-time pin for `LumoProvider` (decision §28, "any language"): a
 * built-in locale needs nothing else; ANY OTHER BCP-47 tag must bring the
 * app's own `strings` — the type requires it, because the alternative is
 * announcing another language. There is no `dir` prop and there will not be
 * one. An unused `@ts-expect-error` fails `tsc`.
 */
import type { LumoAppStrings } from "./locale.ts";
import { LumoProvider } from "./provider.tsx";

declare const deStrings: LumoAppStrings;

// @ts-expect-error a language Lumo does not carry must bring strings — there is no English (or Persian) fallback
void <LumoProvider locale="de">x</LumoProvider>;
// @ts-expect-error a partial set is not a set: `engine` (Base UI's own strings) is part of `LumoAppStrings`
void <LumoProvider locale="de" strings={{ ...deStrings, engine: undefined }}>x</LumoProvider>;
// @ts-expect-error there is no `dir` prop: direction is `direction(locale)`
void <LumoProvider locale="fa-IR" dir="rtl">x</LumoProvider>;
// @ts-expect-error `direction` is not a prop either — same rule
void <LumoProvider locale="de" strings={deStrings} direction="ltr">x</LumoProvider>;
// @ts-expect-error `locale` is required: the provider's ONE input
void <LumoProvider>x</LumoProvider>;

void <LumoProvider locale="de" strings={deStrings}>x</LumoProvider>;
void <LumoProvider locale="ar-EG" strings={deStrings}>x</LumoProvider>;
void <LumoProvider locale="fa-IR">x</LumoProvider>;
void <LumoProvider locale="en-US">x</LumoProvider>;
// A built-in locale MAY bring its own strings (an app's own Persian wording); still complete or nothing.
void <LumoProvider locale="fa-IR" strings={deStrings}>x</LumoProvider>;
