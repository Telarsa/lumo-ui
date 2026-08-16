/**
 * Compile-time pin: a `<Tab>` is a `<button>`, and the React Aria link/press
 * compatibility surface it used to accept (as `?: undefined` carriers, until
 * 15 Aug 2026) is neither declared nor accepted. Each `@ts-expect-error`
 * below is consumed only if the prop is rejected; an unused directive fails
 * `tsc`, so this file cannot pass vacuously.
 */
import { Tab } from "./tabs.tsx";

// @ts-expect-error a tab has no href
void <Tab id="a" href="/x">آ</Tab>;
// @ts-expect-error hrefLang was PROVED leaking into served bytes as <button hrefLang>
void <Tab id="b" hrefLang="fa">ب</Tab>;
// @ts-expect-error no press callback: the engine event is onClick
void <Tab id="c" onPress={() => undefined}>پ</Tab>;
// @ts-expect-error no RAC slot
void <Tab id="d" slot="x">ت</Tab>;
void <Tab id="e">ث</Tab>;
