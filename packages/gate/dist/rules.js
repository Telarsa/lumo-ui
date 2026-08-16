/**
 * The rules. Each one exists because a real prototype shipped the defect it
 * catches, and each is designed so it CANNOT pass vacuously. All grade
 * PRERENDERED HTML — the bytes a crawler, a no-JS reader and the first paint
 * receive. `dom-accessibility-api` is an approximation of an accessible name;
 * a CDP tier over real engines is the intended second tier. See
 * `docs/verification.md`.
 */
import { computeAccessibleName } from "dom-accessibility-api";
/** Builds a digit system from its zero; decimal digit sets are contiguous in Unicode. */
export function digitSystem(name, numberingSystem, zero) {
    const start = zero.codePointAt(0);
    if (start === undefined) {
        throw new Error(`Digit system ${JSON.stringify(name)} has an empty zero.`);
    }
    const nine = String.fromCodePoint(start + 9);
    return {
        name,
        numberingSystem,
        zero,
        // Same shape as the literal it replaces: a global character-class range.
        pattern: new RegExp(`[${zero}-${nine}]`, "gu"),
    };
}
/**
 * Builds a script system from its Unicode script property value — or several,
 * for a writing system that mixes scripts (Japanese: Han + Hiragana + Katakana;
 * Korean: Hangul + Han). `property` keeps the first for messages.
 */
export function scriptSystem(name, property, ...more) {
    const all = [property, ...more];
    return { name, property, pattern: new RegExp(all.map((p) => `\\p{Script=${p}}`).join("|"), "u") };
}
const ASCII_DIGIT = /[0-9]/;
const LATIN_WORD = /[A-Za-z]{3,}/;
/**
 * A WORD in some script, whichever script that is. Applied only to text already
 * shown to hold no character of the reader's script, so it need not name Latin.
 * Three letters, not one: a stray letter is a bullet, an initial or a unit.
 */
const FOREIGN_WORD = /\p{L}{3,}/u;
/** A `latn` locale has nothing for the digit rules to catch; the one place that decides it. */
function numbersInLatin(digits) {
    return digits.numberingSystem === "latn";
}
/** Elements whose text is not user-visible prose. */
const NON_TEXT = new Set(["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT"]);
const SPOKEN = [
    { attr: "aria-label" },
    { attr: "aria-roledescription" },
    { attr: "aria-valuetext" },
    { attr: "aria-description" },
    { attr: "aria-placeholder" },
    { attr: "title" },
    // `input[type=image]`: its `alt` is the name of a real submit button.
    { attr: "alt", on: "img,area,input[type=image]" },
    { attr: "placeholder", on: "input,textarea" },
];
/** Controls that must have an accessible name to be operable. */
const INTERACTIVE = 'button,a[href],input:not([type=hidden]),select,textarea,[role=button],' +
    '[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],' +
    '[role=menuitem],[role=option],[role=combobox],[role=searchbox],[role=slider],' +
    '[role=spinbutton],[role=textbox],' +
    // Composite widgets and named container roles name nothing by themselves.
    '[role=menu],[role=listbox],[role=tree],[role=treegrid],[role=grid],' +
    '[role=dialog],[role=alertdialog],[role=tablist],[role=region],[role=radiogroup]';
function visibleTextNodes(doc) {
    const out = [];
    const walk = (n) => {
        for (const child of Array.from(n.childNodes)) {
            if (child.nodeType === 3) {
                const t = child;
                if (t.data.trim())
                    out.push(t);
            }
            else if (child.nodeType === 1) {
                const el = child;
                if (NON_TEXT.has(el.tagName))
                    continue;
                // An explicitly Latin-marked subtree is a sanctioned escape hatch.
                if (el.closest?.("[data-lumo-latn]"))
                    continue;
                walk(el);
            }
        }
    };
    walk(doc.body ?? doc);
    return out;
}
function visibleTextRuns(doc) {
    const out = [];
    const walk = (el) => {
        let own = "";
        for (const child of Array.from(el.childNodes)) {
            if (child.nodeType === 3) {
                own += child.data;
            }
            else if (child.nodeType === 1) {
                const kid = child;
                if (NON_TEXT.has(kid.tagName))
                    continue;
                // Same escape hatch and same spelling as `visibleTextNodes`.
                if (kid.closest?.("[data-lumo-latn]"))
                    continue;
                walk(kid);
            }
        }
        if (own.trim() && el.tagName !== undefined) {
            out.push({ element: el, text: own });
        }
    };
    const body = doc.body ?? doc;
    if (body.closest?.("[data-lumo-latn]"))
        return out;
    walk(body);
    return out;
}
/** Rule 1 — the document must declare the language it is actually in. */
export const langDir = {
    id: "lang-dir",
    because: "A screen reader picks its speech synthesiser from the document language. " +
        "A prototype shipped <html lang=\"en\"> on all 55 Persian pages, handing 187 " +
        "correct Persian names to an English voice. Nothing on screen reveals it.",
    run: (doc) => {
        const html = doc.document.documentElement;
        const v = [];
        const lang = html?.getAttribute("lang");
        const dir = html?.getAttribute("dir");
        if (lang !== doc.locale) {
            v.push({ rule: "lang-dir", path: doc.path, detail: `<html lang> is ${JSON.stringify(lang)}, expected ${JSON.stringify(doc.locale)}` });
        }
        if (dir !== doc.direction) {
            v.push({ rule: "lang-dir", path: doc.path, detail: `<html dir> is ${JSON.stringify(dir)}, expected ${JSON.stringify(doc.direction)}` });
        }
        return v;
    },
};
/**
 * Rule 2 — no Latin digits in the visible text of a natively-numbered locale.
 * The skip asks about the numbering system, not `direction` (a proxy that was
 * only right for the two locales the repo had).
 */
export const noLatinDigits = {
    id: "no-latin-digits",
    because: "A prototype rendered 77 of 77 calendar day cells in Latin digits on a " +
        "Persian page, two lines below a comment explaining that exact failure. " +
        "It is visible to a sighted reader and invisible to an aria-label audit.",
    run: (doc) => {
        if (numbersInLatin(doc.digits))
            return [];
        const v = visibleTextNodes(doc.document)
            .filter((t) => ASCII_DIGIT.test(t.data))
            .map((t) => ({
            rule: "no-latin-digits",
            path: doc.path,
            detail: `Latin digits in visible text: ${JSON.stringify(t.data.trim().slice(0, 40))}`,
            snippet: t.parentElement?.outerHTML?.slice(0, 120),
        }));
        // The digits a reader SEES or HEARS that are not text nodes: an input's served
        // value (a NumberField serving "1,234" under fa-IR was invisible here until 16 Aug
        // 2026), aria-valuetext, placeholder, alt, title. Inputs whose content is Latin by
        // nature (email, url, tel, password, hidden) and declared islands are skipped.
        // Latin by nature (email, url, tel, password, search) or a machine value no reader
        // sees (radio, checkbox, range, color, file, buttons — what they announce is graded
        // elsewhere: aria-valuetext, the label).
        // `number`: the HTML spec requires an ASCII floating-point value; the browser
        // localises what it SHOWS. (Lumo's own NumberField is a `text` input and IS graded.)
        const LATIN_INPUT = new Set([
            "email", "url", "tel", "password", "hidden", "search", "number",
            "radio", "checkbox", "range", "color", "file", "submit", "button", "reset", "image",
        ]);
        for (const el of Array.from(doc.document.querySelectorAll("[value],[aria-valuetext],[placeholder],[alt],[title],[aria-label],[aria-description],[aria-roledescription]"))) {
            if (el.closest?.("[data-lumo-latn]"))
                continue;
            if (el.closest?.('[aria-hidden="true"],[hidden]'))
                continue;
            const tag = el.tagName.toLowerCase();
            if (tag === "input" && LATIN_INPUT.has((el.getAttribute("type") ?? "text").toLowerCase()))
                continue;
            if (tag === "option" || tag === "meta" || tag === "param" || tag === "li" || tag === "data" || tag === "progress" || tag === "meter")
                continue;
            for (const attr of ["value", "aria-valuetext", "placeholder", "alt", "title", "aria-label", "aria-description", "aria-roledescription"]) {
                if (attr === "value" && tag !== "input" && tag !== "textarea")
                    continue;
                const text = el.getAttribute(attr);
                if (text !== null && ASCII_DIGIT.test(text)) {
                    v.push({
                        rule: "no-latin-digits",
                        path: doc.path,
                        detail: `Latin digits in ${attr}: ${JSON.stringify(text.slice(0, 40))} — the reader sees or hears this the way they see text`,
                        snippet: el.outerHTML.slice(0, 120),
                    });
                }
            }
        }
        return v;
    },
};
/**
 * Rule 3 — the NATIVE-DIGIT floor, the anti-vacuity pair for rule 2. "Zero
 * Latin digits" passes trivially on a page with no numbers, so a route that
 * shows numbers declares a floor, counted in ITS locale's digits. The id stays
 * `persian-digit-floor`: the floors file, docs and CI name it.
 */
export const persianDigitFloor = (floors) => ({
    id: "persian-digit-floor",
    because: "A rule that cannot fail is worse than no rule. A sibling project asserts " +
        "only that SOME Arabic character appears, which the Persian weekday headers " +
        "satisfy on their own while the day cells render 12 instead of ۱۲.",
    run: (doc) => {
        const floor = floors[doc.path];
        if (floor == null)
            return [];
        const text = visibleTextNodes(doc.document).map((t) => t.data).join("");
        const found = (text.match(doc.digits.pattern) ?? []).length;
        return found >= floor
            ? []
            : [{ rule: "persian-digit-floor", path: doc.path, detail: `expected at least ${floor} ${doc.digits.name} digits, found ${found}` }];
    },
});
/** Rule 4 — no English in the strings a screen reader speaks. */
export const noLatinAria = {
    id: "no-latin-aria",
    because: "Engines and product code both leak English into announced strings; a " +
        "required prop that nobody passed a translation for is still English. Keyed " +
        "on the reader's SCRIPT, not direction: an LTR non-Latin locale is graded too.",
    run: (doc) => {
        if (doc.script.property === "Latin")
            return [];
        const v = [];
        for (const { attr, on } of SPOKEN) {
            const selector = on === undefined ? `[${attr}]` : on.split(",").map((s) => `${s}[${attr}]`).join(",");
            for (const el of Array.from(doc.document.querySelectorAll(selector))) {
                if (el.closest?.("[data-lumo-latn]"))
                    continue;
                const value = el.getAttribute(attr) ?? "";
                // Purity, like the visible-text rule: «دانلود PDF» or «ورود با Google» is a Persian
                // phrase with a foreign token and belongs to a translator, not to this rule. Only a
                // value with a Latin word and NO character of the reader's script is graded.
                if (LATIN_WORD.test(value) && !doc.script.pattern.test(value)) {
                    v.push({ rule: "no-latin-aria", path: doc.path, detail: `${attr}=${JSON.stringify(value)}`, snippet: el.outerHTML.slice(0, 120) });
                }
            }
        }
        return v;
    },
};
/**
 * `dom-accessibility-api` reaches for `window.getComputedStyle`, which linkedom
 * lacks. The first `namedControls` caught the throw and reported green forever;
 * the poison fixture caught that. Everything is reported visible — this tier
 * grades unlaid-out markup; visibility belongs to the CDP tier.
 */
const COMPUTED_STYLE_SHIM = {
    getComputedStyle: () => ({
        getPropertyValue: () => "",
        visibility: "visible",
        display: "block",
        content: "",
    }),
    computedStyleSupportsPseudoElements: false,
};
/** Rule 5 — every interactive control has an accessible name. */
export const namedControls = {
    id: "named-controls",
    because: "A prototype shipped 33 controls with no accessible name. A screen reader " +
        "announces them as bare roles: \"button\", with nothing to distinguish them.",
    run: (doc) => {
        const v = [];
        for (const el of Array.from(doc.document.querySelectorAll(INTERACTIVE))) {
            // `aria-hidden` and `hidden` are INHERITED, so check ancestors (React
            // Aria's hidden `<select>` sits inside an aria-hidden container).
            // `="true"`, not bare: `aria-hidden="false"` means the element IS exposed.
            if (el.closest?.('[aria-hidden="true"],[hidden]'))
                continue;
            // Deliberately NOT wrapped in try/catch: a broken name computation must crash, not pass.
            const name = computeAccessibleName(el, COMPUTED_STYLE_SHIM);
            if (!name.trim()) {
                v.push({ rule: "named-controls", path: doc.path, detail: `${el.tagName.toLowerCase()} has no accessible name`, snippet: el.outerHTML.slice(0, 120) });
            }
        }
        return v;
    },
};
/**
 * Rule 6 — ARIA references must resolve. `aria-describedby` is graded too —
 * `form-state.tsx` made it LOAD-BEARING for validation errors — with one
 * exemption by ID PREFIX rather than by attribute: React Aria's server render
 * points at ids that exist only after hydration (measured: 301 dangles, all
 * `react-aria-`). When the export has zero `react-aria-` ids, delete the constant.
 */
const HYDRATION_DEFERRED_ID = /^react-aria-/;
export const resolvedIdrefs = {
    id: "resolved-idrefs",
    because: "A dangling aria-labelledby means the element has no name at all, and a " +
        "dangling aria-describedby means its help text or validation error is " +
        "announced by nobody — both while looking fully wired in the markup.",
    run: (doc) => {
        const ids = new Set(Array.from(doc.document.querySelectorAll("[id]")).map((e) => e.getAttribute("id")));
        const v = [];
        // `aria-errormessage`: the same defect as a dangling describedby.
        for (const attr of ["aria-labelledby", "aria-controls", "aria-describedby", "aria-errormessage"]) {
            for (const el of Array.from(doc.document.querySelectorAll(`[${attr}]`))) {
                for (const ref of (el.getAttribute(attr) ?? "").split(/\s+/).filter(Boolean)) {
                    if (ids.has(ref))
                        continue;
                    if (HYDRATION_DEFERRED_ID.test(ref))
                        continue; // see the header
                    v.push({ rule: "resolved-idrefs", path: doc.path, detail: `${attr} points at missing id ${JSON.stringify(ref)}`, snippet: el.outerHTML.slice(0, 120) });
                }
            }
        }
        return v;
    },
};
/**
 * Rule 6 — a composite widget must have a tab stop in the SERVED bytes.
 *
 * Base UI elects the tabbable member in a layout effect, so the migration
 * shipped 132 `role="tab"` elements at `tabindex="-1"` and none at `0`; it
 * self-heals on hydration, so only the served bytes can see it. Exempt shapes:
 * the container manages focus via `aria-activedescendant`; the container itself
 * carries `tabindex="0"` (React Aria collections — `=== "0"`, since a looser
 * test swallows the eight `-1` command containers that ARE unreachable); every
 * member is disabled; a combobox's list whose TABBABLE owner references it BY
 * ID through `aria-controls` (never by adjacency).
 */
/**
 * Is this listbox referenced by a `role="combobox"` that can itself be reached?
 * `aria-controls` is a SPACE-SEPARATED LIST, so `~=` rather than `=`.
 */
function ownedByTabbableCombobox(document, list) {
    const id = list.getAttribute("id");
    // An id with a quote or whitespace would break the selector; refuse to match rather than throw.
    if (id === null || id === "" || /["'\\\s]/.test(id))
        return false;
    const owner = document.querySelector(`[role="combobox"][aria-controls~="${id}"]`);
    if (owner === null)
        return false;
    return (!owner.hasAttribute("disabled") &&
        owner.getAttribute("aria-disabled") !== "true" &&
        owner.getAttribute("tabindex") !== "-1");
}
const COMPOSITE_ROLES = {
    tablist: "tab",
    radiogroup: "radio",
    tree: "treeitem",
    listbox: "option",
    toolbar: "button",
    menu: "menuitem",
    menubar: "menuitem",
    // A grid's focusable member is a CELL, and ARIA spells "cell" three ways —
    // row 0 of a data grid IS the header row, so the stop may sit on a
    // `columnheader`. A `treegrid` roves over ROWS, not `treeitem`s.
    grid: ["gridcell", "columnheader", "rowheader"],
    treegrid: ["row"],
};
export const compositeTabStop = {
    id: "composite-tab-stop",
    because: "A roving-tabindex widget whose members are all tabindex=-1 is unreachable " +
        "by keyboard. It self-heals on hydration, so no jsdom test and no axe run " +
        "can see it — only the served bytes can.",
    run: (doc) => {
        const v = [];
        for (const [containerRole, itemRoleSpec] of Object.entries(COMPOSITE_ROLES)) {
            const itemRoles = typeof itemRoleSpec === "string" ? [itemRoleSpec] : itemRoleSpec;
            const itemSelector = itemRoles.map((r) => `[role="${r}"]`).join(",");
            for (const el of Array.from(doc.document.querySelectorAll(`[role="${containerRole}"]`))) {
                // The container owns focus itself; its items are meant to be -1.
                if (el.hasAttribute("aria-activedescendant"))
                    continue;
                // The container IS the tab stop (React Aria collections).
                if (el.getAttribute("tabindex") === "0")
                    continue;
                // A combobox's list: the INPUT is the tab stop.
                if (containerRole === "listbox" && ownedByTabbableCombobox(doc.document, el))
                    continue;
                if (el.closest?.('[aria-hidden="true"],[hidden]'))
                    continue;
                const items = Array.from(el.querySelectorAll(itemSelector)).filter((i) => {
                    if (i.getAttribute("aria-disabled") === "true" || i.hasAttribute("disabled")) {
                        return false;
                    }
                    // Under WIDGET focus the disablement is on the control, not the cell:
                    // a fully disabled calendar correctly has no tab stop. A cell with no
                    // controls at all is the cell-focus model and stays enabled.
                    const controls = Array.from(i.querySelectorAll("button,a[href],input,select,textarea"));
                    if (controls.length === 0)
                        return true;
                    return controls.some((c) => !c.hasAttribute("disabled") && c.getAttribute("aria-disabled") !== "true");
                });
                if (items.length === 0)
                    continue;
                // The stop may be ON the item (cell focus, `table.tsx`) or INSIDE it
                // (widget focus, react-day-picker's day buttons); both are specified.
                const stops = items.filter((i) => i.getAttribute("tabindex") === "0" ||
                    i.querySelector('[tabindex="0"]') !== null);
                if (stops.length === 0) {
                    v.push({
                        rule: "composite-tab-stop",
                        path: doc.path,
                        detail: `role="${containerRole}" has ${items.length} enabled ${itemRoles.join("/")} element(s) and none is tabbable — the whole widget is unreachable by keyboard in the served bytes`,
                        snippet: el.outerHTML.slice(0, 140),
                    });
                }
            }
        }
        return v;
    },
};
/**
 * Rule 7 — a composite widget must have at MOST one tab stop in the served
 * bytes: the CEILING to rule 6's floor. Measured, five toolbars served 2–5
 * stops and `ColumnResizer` added one per column; four-fifths of the library
 * already met the ceiling via `useCompositeTabStop`.
 *
 * `[data-lumo-extra-tab-stop]` discounts ONE control (never the container —
 * `closest` would turn it into a blanket skip): used once, by the toolbar demo
 * that teaches this very defect. `role="row"` is not graded (the GRID is the
 * stop). `aria-hidden` skips the container only, not the count — a hidden
 * element is still FOCUSABLE; `inert`/`hidden` are discounted.
 */
const CEILING_EXEMPT = "[data-lumo-extra-tab-stop]";
/** Elements the platform makes focusable with no `tabindex` of their own. */
const NATIVELY_FOCUSABLE = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY"]);
/**
 * Is this element in the SEQUENTIAL focus order? `tabindex` is parsed
 * (`parseInt`, the platform's lenient integer parse): a positive value is also a stop.
 */
function isTabbable(el) {
    if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true")
        return false;
    // `inert` and `hidden` remove a subtree from sequential navigation; `aria-hidden` does NOT.
    if (el.closest?.("[inert],[hidden]"))
        return false;
    const raw = el.getAttribute("tabindex");
    if (raw !== null) {
        const value = Number.parseInt(raw, 10);
        return Number.isFinite(value) && value >= 0;
    }
    if (!NATIVELY_FOCUSABLE.has(el.tagName))
        return false;
    // A bare `<a>` with no `href` is not focusable.
    if (el.tagName === "A")
        return el.hasAttribute("href");
    if (el.tagName === "INPUT")
        return el.getAttribute("type") !== "hidden";
    return true;
}
export const compositeSingleTabStop = {
    id: "composite-single-tab-stop",
    because: "A roving-tabindex widget exists to be ONE Tab stop — that is what the role " +
        "means. Five toolbars in this export served 2, 3, 3, 4 and 5, on a page whose " +
        "own copy says the whole strip is one stop. Nothing else can see it.",
    run: (doc) => {
        const v = [];
        for (const containerRole of Object.keys(COMPOSITE_ROLES)) {
            for (const el of Array.from(doc.document.querySelectorAll(`[role="${containerRole}"]`))) {
                if (el.closest?.('[aria-hidden="true"],[hidden],[inert]'))
                    continue;
                const stops = Array.from(el.querySelectorAll("*")).filter((d) => {
                    if (!isTabbable(d))
                        return false;
                    // The exemption is on a CONTROL; the container is excluded explicitly.
                    const marked = d.closest?.(CEILING_EXEMPT) ?? null;
                    return marked === null || marked === el;
                });
                // The container itself counts: `aria-activedescendant` widgets put the one stop THERE.
                const total = stops.length + (isTabbable(el) ? 1 : 0);
                if (total > 1) {
                    v.push({
                        rule: "composite-single-tab-stop",
                        path: doc.path,
                        detail: `role="${containerRole}" serves ${total} tab stops. A roving-tabindex widget is ` +
                            `ONE stop from the outside; the arrow keys move within it. A keyboard reader Tabs ` +
                            `through all ${total} instead.`,
                        snippet: el.outerHTML.slice(0, 140),
                    });
                }
            }
        }
        return v;
    },
};
/**
 * Rule 8 — a date must be in the READER'S calendar, not merely their language.
 * «۲۲ ژوئیه ۲۰۲۴» is green on every other rule and off by 622 years; ICU's
 * default calendar differs per locale and per machine (`ar-SA` → Gregorian).
 * Grades by asking `Intl` for the native and the Gregorian month names in the
 * same language (zero overlap in both non-Gregorian locales) and requiring a
 * DATE SHAPE — bounded name plus adjacent digits — because JS `\b` is not
 * script-aware and «مه» is both May and fog. Vacuous for a `gregory` locale.
 * `[data-lumo-gregory]` marks a deliberately dual-calendar subtree.
 */
const monthNameCache = new Map();
function monthNames(locale, calendar) {
    const key = `${locale}|${calendar}`;
    let names = monthNameCache.get(key);
    if (!names) {
        const format = new Intl.DateTimeFormat(`${locale}-u-ca-${calendar}`, {
            month: "long",
            timeZone: "UTC",
        });
        // Mid-month, so a timezone slip cannot roll into a neighbouring month.
        names = [
            ...new Set(Array.from({ length: 12 }, (_, i) => format.format(new Date(Date.UTC(2024, i, 15))))),
        ];
        monthNameCache.set(key, names);
    }
    return names;
}
/**
 * A month name in a DATE, not in a sentence: script-aware `\b` via
 * `\p{L}\p{M}` lookarounds, plus a `\p{Nd}` run in any numbering system.
 */
function datePattern(monthName) {
    const L = "\\p{L}\\p{M}";
    const escaped = monthName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const bounded = `(?<![${L}])${escaped}(?![${L}])`;
    // digits … month, or month … digits, within a few characters either way.
    return new RegExp(`(\\p{Nd}[\\p{Nd}\\s،,/-]{0,12}${bounded})|(${bounded}[\\s،,/-]{0,3}\\p{Nd})`, "u");
}
export const nativeCalendar = {
    id: "native-calendar",
    because: "A date rendered in the reader's language but the WRONG CALENDAR is green " +
        "on every other rule and off by centuries. «۲۲ ژوئیه ۲۰۲۴» is Persian text " +
        "for a day Iran calls «۱ مرداد ۱۴۰۳».",
    run: (doc) => {
        if (doc.calendar === "gregory")
            return []; // nothing to distinguish — see the header
        const numeric = [];
        // A DATE FIELD's year segment announcing a Gregorian year: month names cannot
        // see a numeric date, but a Persian (or islamic) year is centuries below 1800.
        // Lumo's segments carry `data-type="year"` and `aria-valuenow`.
        if (doc.calendar === "persian" || doc.calendar.startsWith("islamic")) {
            for (const seg of Array.from(doc.document.querySelectorAll('[role="spinbutton"][data-type="year"][aria-valuenow]'))) {
                if (seg.closest?.('[aria-hidden="true"],[hidden],[data-lumo-latn]'))
                    continue;
                const year = Number(seg.getAttribute("aria-valuenow"));
                if (Number.isFinite(year) && year >= 1800) {
                    numeric.push({
                        rule: "native-calendar",
                        path: doc.path,
                        detail: `a year segment announces ${String(year)} — a Gregorian year in a ${doc.calendar} field. The reader counts years in their own calendar; convert for display and round-trip on change.`,
                        snippet: seg.outerHTML.slice(0, 120),
                    });
                }
            }
        }
        const native = monthNames(doc.locale, doc.calendar);
        const foreign = monthNames(doc.locale, "gregory").filter((name) => !native.includes(name));
        if (foreign.length === 0)
            return numeric;
        const patterns = foreign.map((name) => [name, datePattern(name)]);
        const v = [...numeric];
        for (const node of visibleTextNodes(doc.document)) {
            // A deliberately dual-calendar subtree.
            if (node.parentElement?.closest?.("[data-lumo-gregory]"))
                continue;
            const text = node.data;
            for (const [name, pattern] of patterns) {
                if (!pattern.test(text))
                    continue;
                v.push({
                    rule: "native-calendar",
                    path: doc.path,
                    detail: `Gregorian month ${JSON.stringify(name)} in a date on a ${doc.locale} page, whose ` +
                        `readers count in the ${doc.calendar} calendar. The text is localised; the ` +
                        `CALENDAR is not.`,
                    snippet: text.trim().slice(0, 120),
                });
                break; // one violation per text node, not one per matching name
            }
        }
        return v;
    },
};
/**
 * Rule 9 — an `id` must be unique in the document. `resolved-idrefs` proves an
 * idref RESOLVES, not that it resolves to the INTENDED element: `getElementById`
 * and `<label for>` take the FIRST match. `combobox.tsx` shipped input and
 * trigger sharing one id. No `<pre>`/`<code>` carve-out: measured, a highlighted
 * listing never produces an `id` ATTRIBUTE, so the exemption would grade nothing.
 */
export const uniqueIds = {
    id: "unique-ids",
    because: "resolved-idrefs proves an idref RESOLVES; a duplicate id satisfies it while " +
        "resolving to the wrong element. <label for> and getElementById both take the " +
        "FIRST match, so the wiring is decided by document order — that is, by luck.",
    run: (doc) => {
        const byId = new Map();
        for (const el of Array.from(doc.document.querySelectorAll("[id]"))) {
            const id = el.getAttribute("id");
            // An empty id is a different defect and matches nothing.
            if (id === null || id === "")
                continue;
            byId.set(id, [...(byId.get(id) ?? []), el]);
        }
        const v = [];
        for (const [id, els] of byId) {
            if (els.length < 2)
                continue;
            v.push({
                rule: "unique-ids",
                path: doc.path,
                detail: `id ${JSON.stringify(id)} is carried by ${els.length} elements. An idref to it ` +
                    `RESOLVES — which is why resolved-idrefs is green — and resolves to the first in ` +
                    `document order, so which element is named, described or controlled is luck.`,
                snippet: els[0]?.outerHTML.slice(0, 120),
            });
        }
        return v;
    },
};
/**
 * Rule 10 — visible text must be in the reader's own script. A `Select` with no
 * `items` shipped the raw key «thr» to Persian readers and was green on every
 * rule. Deliberately narrow: only a run with NO character of the reader's script
 * is graded, so inline technical terms inside Persian sentences pass; a Latin
 * word inside a Persian run belongs to a translator. `data-lumo-latn` is the
 * hatch; `lang` deliberately is NOT — it is the natural wrong "fix" for exactly
 * this defect.
 */
export const nativeScriptText = {
    id: "native-script-text",
    because: "A Select shipped the raw key «thr» to Persian readers on three routes and was " +
        "green on all nine rules, because no rule graded WORDS in visible text — only " +
        "digits. It self-heals on hydration, so only the served bytes can see it.",
    run: (doc) => {
        // A Latin-script locale has nothing here to catch.
        if (doc.script.property === "Latin")
            return [];
        const v = [];
        for (const { element, text } of visibleTextRuns(doc.document)) {
            if (doc.script.pattern.test(text))
                continue;
            if (!FOREIGN_WORD.test(text))
                continue;
            v.push({
                rule: "native-script-text",
                path: doc.path,
                detail: `visible text with no ${doc.script.name} character at all: ` +
                    `${JSON.stringify(text.trim().slice(0, 60))}. A ${doc.locale} reader is shown a ` +
                    `word in a script they may not read. If it is deliberately foreign — a brand, a ` +
                    `package name, an order id — mark it data-lumo-latn.`,
                snippet: element.outerHTML.slice(0, 120),
            });
        }
        return v;
    },
};
/**
 * Rule 11 — grade the COMPUTED accessible name, not the `aria-label` attribute.
 * Most controls are named by content, `<label for>`, `aria-labelledby`, a
 * nested `alt` or an `<input value>` — all announced, none graded by
 * `no-latin-aria`. The pair to `named-controls`: that one grades that a name
 * EXISTS, this one what LANGUAGE it is in. The hatch must look DOWN, not up: a
 * name is composed from descendants, so the text of every marked descendant is
 * SUBTRACTED (a discount, not a skip — «Save پرونده» still fires on `Save`).
 */
function foreignResidue(el, name) {
    let residue = name;
    for (const marked of Array.from(el.querySelectorAll("[data-lumo-latn]"))) {
        const text = (marked.textContent ?? "").trim();
        if (text)
            residue = residue.split(text).join(" ");
    }
    return residue;
}
export const nativeScriptName = {
    id: "native-script-name",
    because: "no-latin-aria reads attributes, and most controls are named by their CONTENT, " +
        "a <label for>, a nested <img alt> or an <input value> — all announced, none " +
        "graded for language until this rule.",
    run: (doc) => {
        if (doc.script.property === "Latin")
            return [];
        const v = [];
        for (const el of Array.from(doc.document.querySelectorAll(INTERACTIVE))) {
            // Same inherited-hiding skip as `named-controls`.
            if (el.closest?.('[aria-hidden="true"],[hidden]'))
                continue;
            if (el.closest?.("[data-lumo-latn]"))
                continue;
            // Deliberately NOT wrapped in try/catch — see `namedControls`.
            const name = computeAccessibleName(el, COMPUTED_STYLE_SHIM).trim();
            // An unnamed control is `named-controls`' finding, not this one.
            if (!name)
                continue;
            if (doc.script.pattern.test(name))
                continue;
            if (!FOREIGN_WORD.test(foreignResidue(el, name)))
                continue;
            v.push({
                rule: "native-script-name",
                path: doc.path,
                detail: `<${el.tagName.toLowerCase()}> computes the accessible name ${JSON.stringify(name)}, ` +
                    `which holds no ${doc.script.name} character. That is the string a ${doc.locale} ` +
                    `reader hears announced.`,
                snippet: el.outerHTML.slice(0, 120),
            });
        }
        return v;
    },
};
/**
 * Rule 12 — an `aria-roledescription` needs an accessible name to attach to.
 * The roledescription REPLACES the spoken role, so a nameless element is
 * announced as that word and nothing else (44 `Carousel.Item`s, 22 per locale).
 * Grades every locale, deliberately: an unnamed slide is as unnavigable in English.
 */
export const namedRoledescription = {
    id: "named-roledescription",
    because: "aria-roledescription REPLACES the spoken role, so an element with one and no " +
        "accessible name is announced as the roledescription and nothing else — ten " +
        "slides all called «اسلاید», with nothing to tell them apart.",
    run: (doc) => {
        const v = [];
        for (const el of Array.from(doc.document.querySelectorAll("[aria-roledescription]"))) {
            if (el.closest?.('[aria-hidden="true"],[hidden]'))
                continue;
            const name = computeAccessibleName(el, COMPUTED_STYLE_SHIM).trim();
            if (name)
                continue;
            v.push({
                rule: "named-roledescription",
                path: doc.path,
                detail: `aria-roledescription=${JSON.stringify(el.getAttribute("aria-roledescription") ?? "")} ` +
                    `on a <${el.tagName.toLowerCase()}> with no accessible name. The roledescription ` +
                    `replaces the role, so this element is announced as that word and nothing else.`,
                snippet: el.outerHTML.slice(0, 140),
            });
        }
        return v;
    },
};
/**
 * Rule 13 — a `data-lumo-latn` island must actually be Latin. The island is the
 * hatch every digit and script rule honours, and on Persian routes it exempts
 * ~75% of text nodes (code samples). That share is disclosed by the coverage
 * report; this rule CONTAINS it: an island whose visible text carries more
 * letters of the reader's script than Latin letters is a Persian paragraph
 * someone wrapped to silence a rule, and it fails here instead. Letters only —
 * a phone run in Persian digits or an order id has no letters and is exactly
 * what the hatch is for. Outermost islands only.
 */
export const latnIslandPurity = {
    id: "latn-island-purity",
    because: "The exemption that keeps code samples out of the script and digit rules could " +
        "just as well hide a Persian paragraph; a rule that reads 25% of a page must be " +
        "able to prove the other 75% is what it claims to be.",
    run: (doc) => {
        if (doc.script.property === "Latin")
            return [];
        const v = [];
        const readerLetter = new RegExp(`(?=\\p{L})${doc.script.pattern.source}`, "gu");
        const latinLetter = /(?=\p{L})\p{Script=Latin}/gu;
        for (const island of Array.from(doc.document.querySelectorAll("[data-lumo-latn]"))) {
            if (island.parentElement?.closest("[data-lumo-latn]"))
                continue;
            if (island.closest?.('[aria-hidden="true"],[hidden]'))
                continue;
            const text = island.textContent ?? "";
            const reader = (text.match(readerLetter) ?? []).length;
            const latin = (text.match(latinLetter) ?? []).length;
            // Prose: English documentation that QUOTES Persian strings is still English, so a
            // clear majority is required. A control is different: a Persian button or link
            // inside a Latin island is a UI string in the wrong language container, however
            // short — that was the first live finding (a «باز کردن تمام‌صفحه» link in a
            // `lang="en" dir="ltr"` caption on every block page).
            // Only an island that also declares a foreign `lang` makes a control's language wrong:
            // a bare data-lumo-latn `<bdi>` around a phone run is a bidi/digit exemption, and the
            // Persian-named <input> inside it is exactly right.
            const declaresForeignLang = island.hasAttribute("lang") && !(island.getAttribute("lang") ?? "").toLowerCase().startsWith(doc.locale.slice(0, 2).toLowerCase());
            const control = !declaresForeignLang ? undefined : Array.from(island.querySelectorAll(INTERACTIVE)).find((el) => {
                if (el.closest?.('[aria-hidden="true"],[hidden]'))
                    return false;
                // What the control announces: its aria-label first, else its text.
                const own = el.getAttribute("aria-label") ?? el.textContent ?? "";
                const r = (own.match(readerLetter) ?? []).length;
                return r >= 3 && r > (own.match(latinLetter) ?? []).length;
            });
            if (control !== undefined) {
                v.push({
                    rule: "latn-island-purity",
                    path: doc.path,
                    detail: `a ${doc.script.name}-script control inside a data-lumo-latn island: its text is in the ` +
                        `reader's language but the island declares it Latin. Move the control outside the island.`,
                    snippet: control.outerHTML.slice(0, 120),
                });
            }
            else if (reader >= 10 && reader > latin * 1.5) {
                v.push({
                    rule: "latn-island-purity",
                    path: doc.path,
                    detail: `data-lumo-latn island holds ${String(reader)} ${doc.script.name} letters against ` +
                        `${String(latin)} Latin: this is ${doc.script.name} prose, not a Latin island. ` +
                        `Unwrap it so the script and digit rules read it, or shrink the island to the Latin run.`,
                    snippet: island.outerHTML.slice(0, 120),
                });
            }
        }
        return v;
    },
};
export const RULES = [langDir, noLatinDigits, noLatinAria, namedControls, resolvedIdrefs, compositeTabStop, compositeSingleTabStop, nativeCalendar, uniqueIds, nativeScriptText, nativeScriptName, namedRoledescription, latnIslandPurity];
