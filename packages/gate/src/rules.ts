/**
 * The rules. Each one exists because a real prototype shipped the defect it
 * catches, and each is designed so it CANNOT pass vacuously.
 *
 * All of these grade PRERENDERED HTML — the bytes a crawler, a no-JS reader and
 * the first paint actually receive. That is deliberate: every defect below
 * renders without error, type-checks, and looks correct in review. The only
 * thing that catches them is a failing build.
 *
 * On approximation, stated honestly: `dom-accessibility-api` computes a very
 * good *approximation* of an accessible name, not the engine's own tree. This
 * tier is a fast pre-filter that runs anywhere with no browser and no network —
 * which matters, because the team works under network conditions where
 * downloading three Playwright engines may simply fail. A CDP-based receipt over
 * real engines is the intended second tier, not a replacement for this one.
 */

import { computeAccessibleName } from "dom-accessibility-api";

export interface Doc {
  /** Route path, used to derive the expected locale. e.g. "fa/admin/index.html" */
  path: string;
  document: Document;
  /** The locale this route is expected to serve, derived from its path. */
  locale: string;
  direction: "rtl" | "ltr";
}

export interface Violation {
  rule: string;
  path: string;
  detail: string;
  /**
   * `| undefined` is explicit because the workspace sets
   * `exactOptionalPropertyTypes`: a rule that computes a snippet and finds none
   * assigns `undefined`, which is genuinely different from omitting the key.
   */
  snippet?: string | undefined;
}

export interface Rule {
  id: string;
  /** Why this rule exists, shown when it fires. */
  because: string;
  run: (doc: Doc) => Violation[];
}

const ASCII_DIGIT = /[0-9]/;
const PERSIAN_DIGIT = /[۰-۹]/g;
const LATIN_WORD = /[A-Za-z]{3,}/;

/** Elements whose text is not user-visible prose. */
const NON_TEXT = new Set(["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT"]);

/** Attributes a screen reader speaks. */
const SPOKEN = [
  "aria-label",
  "aria-roledescription",
  "aria-valuetext",
  "aria-description",
  "aria-placeholder",
  "aria-keyshortcuts",
  "title",
];

/** Controls that must have an accessible name to be operable. */
const INTERACTIVE =
  'button,a[href],input:not([type=hidden]),select,textarea,[role=button],' +
  '[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],' +
  '[role=menuitem],[role=option],[role=combobox],[role=searchbox],[role=slider],' +
  '[role=spinbutton],[role=textbox]';

function visibleTextNodes(doc: Document): Text[] {
  const out: Text[] = [];
  const walk = (n: Node) => {
    for (const child of Array.from(n.childNodes)) {
      if (child.nodeType === 3) {
        const t = child as Text;
        if (t.data.trim()) out.push(t);
      } else if (child.nodeType === 1) {
        const el = child as Element;
        if (NON_TEXT.has(el.tagName)) continue;
        // An explicitly Latin-marked subtree is a sanctioned escape hatch.
        if (el.closest?.("[data-lumo-latn]")) continue;
        walk(el);
      }
    }
  };
  walk(doc.body ?? doc);
  return out;
}

/** Rule 1 — the document must declare the language it is actually in. */
export const langDir: Rule = {
  id: "lang-dir",
  because:
    "A screen reader picks its speech synthesiser from the document language. " +
    "A prototype shipped <html lang=\"en\"> on all 55 Persian pages, handing 187 " +
    "correct Persian names to an English voice. Nothing on screen reveals it.",
  run: (doc) => {
    const html = doc.document.documentElement;
    const v: Violation[] = [];
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

/** Rule 2 — no Latin digits in visible Persian text. */
export const noLatinDigits: Rule = {
  id: "no-latin-digits",
  because:
    "A prototype rendered 77 of 77 calendar day cells in Latin digits on a " +
    "Persian page, two lines below a comment explaining that exact failure. " +
    "It is visible to a sighted reader and invisible to an aria-label audit.",
  run: (doc) => {
    if (doc.direction !== "rtl") return [];
    return visibleTextNodes(doc.document)
      .filter((t) => ASCII_DIGIT.test(t.data))
      .map((t) => ({
        rule: "no-latin-digits",
        path: doc.path,
        detail: `Latin digits in visible text: ${JSON.stringify(t.data.trim().slice(0, 40))}`,
        snippet: (t.parentElement as Element | null)?.outerHTML?.slice(0, 120),
      }));
  },
};

/**
 * Rule 3 — the anti-vacuity pair for rule 2.
 *
 * "Zero Latin digits" passes trivially on a page with no numbers at all. A
 * Persian route that is supposed to show numbers must actually show Persian
 * ones, so each route declares a floor. Without this, rule 2 silently stops
 * meaning anything the moment a page stops rendering its data.
 */
export const persianDigitFloor = (floors: Record<string, number>): Rule => ({
  id: "persian-digit-floor",
  because:
    "A rule that cannot fail is worse than no rule. A sibling project asserts " +
    "only that SOME Arabic character appears, which the Persian weekday headers " +
    "satisfy on their own while the day cells render 12 instead of ۱۲.",
  run: (doc) => {
    const floor = floors[doc.path];
    if (floor == null) return [];
    const text = visibleTextNodes(doc.document).map((t) => t.data).join("");
    const found = (text.match(PERSIAN_DIGIT) ?? []).length;
    return found >= floor
      ? []
      : [{ rule: "persian-digit-floor", path: doc.path, detail: `expected at least ${floor} Persian digits, found ${found}` }];
  },
});

/** Rule 4 — no English in the strings a screen reader speaks. */
export const noLatinAria: Rule = {
  id: "no-latin-aria",
  because:
    "React Aria ships 34 locales without Persian. Measured, 8 English strings " +
    "leak on a Persian page; 5 are fixable by prop. This catches the ones nobody " +
    "remembered to pass.",
  run: (doc) => {
    if (doc.direction !== "rtl") return [];
    const v: Violation[] = [];
    for (const attr of SPOKEN) {
      for (const el of Array.from(doc.document.querySelectorAll(`[${attr}]`))) {
        if (el.closest?.("[data-lumo-latn]")) continue;
        const value = el.getAttribute(attr) ?? "";
        if (LATIN_WORD.test(value)) {
          v.push({ rule: "no-latin-aria", path: doc.path, detail: `${attr}=${JSON.stringify(value)}`, snippet: el.outerHTML.slice(0, 120) });
        }
      }
    }
    return v;
  },
};

/**
 * `dom-accessibility-api` reaches for `window.getComputedStyle`, which linkedom
 * does not provide — without this shim every call throws `TypeError: Cannot read
 * properties of undefined (reading 'bind')`.
 *
 * This shim was not a nicety. The first version of `namedControls` caught that
 * throw and `continue`d, which made the rule fire on nothing and report green
 * forever — a check that cannot fail, guarding against the defect class this
 * project exists to prevent. The self-test caught it on the first run, which is
 * precisely why the poison fixtures exist.
 *
 * Everything is reported visible: this tier grades server-rendered markup where
 * nothing has been laid out, and guessing at visibility here would hide real
 * unnamed controls. Visibility belongs to the CDP tier, which has a real engine.
 */
const COMPUTED_STYLE_SHIM = {
  getComputedStyle: () =>
    ({
      getPropertyValue: () => "",
      visibility: "visible",
      display: "block",
      content: "",
    }) as unknown as CSSStyleDeclaration,
  computedStyleSupportsPseudoElements: false,
};

/** Rule 5 — every interactive control has an accessible name. */
export const namedControls: Rule = {
  id: "named-controls",
  because:
    "A prototype shipped 33 controls with no accessible name. A screen reader " +
    "announces them as bare roles: \"button\", with nothing to distinguish them.",
  run: (doc) => {
    const v: Violation[] = [];
    for (const el of Array.from(doc.document.querySelectorAll(INTERACTIVE))) {
      /*
       * `aria-hidden` and `hidden` are INHERITED: they remove the whole subtree
       * from the accessibility tree, so a control inside one is never announced
       * at all and "has no accessible name" is not a defect that can reach a
       * reader. Checking only the element itself was an incomplete spelling of
       * the skip this rule already performs, and it fired on real markup:
       * React Aria's Select renders a hidden `<select>` for browser autofill
       * inside `<div aria-hidden="true" data-a11y-ignore="aria-hidden-focus">`
       * (verified in react-aria 3.51.0, private/select/HiddenSelect.js — the
       * attribute is on the container, and the `<label>` RAC wraps it in is
       * deliberately empty). No prop reaches it, so an ancestor check is the
       * only correct spelling.
       *
       * `[aria-hidden="true"]` and not `[aria-hidden]`: `aria-hidden="false"`
       * means the element IS exposed, and skipping on the bare attribute let a
       * genuinely unnamed control through.
       */
      if (el.closest?.('[aria-hidden="true"],[hidden]')) continue;
      // Deliberately NOT wrapped in try/catch. If name computation breaks, the
      // gate must crash loudly rather than quietly stop checking.
      const name = computeAccessibleName(el as unknown as HTMLElement, COMPUTED_STYLE_SHIM);
      if (!name.trim()) {
        v.push({ rule: "named-controls", path: doc.path, detail: `${el.tagName.toLowerCase()} has no accessible name`, snippet: el.outerHTML.slice(0, 120) });
      }
    }
    return v;
  },
};

/**
 * Rule 6 — ARIA references must resolve.
 *
 * NOTE the deliberate limitation: this runs on PRERENDERED html, and React
 * Aria's SSR legitimately emits `aria-describedby` pointing at ids that only
 * exist after hydration. Verified: post-hydration the dangle count is 0. So
 * describedby is excluded here and belongs to the hydrated test tier. Only
 * `aria-labelledby` and `aria-controls` are graded, where a dangling reference
 * means the name is genuinely absent.
 */
export const resolvedIdrefs: Rule = {
  id: "resolved-idrefs",
  because:
    "A dangling aria-labelledby means the element has no name at all, while " +
    "looking fully labelled in the markup.",
  run: (doc) => {
    const ids = new Set(Array.from(doc.document.querySelectorAll("[id]")).map((e) => e.getAttribute("id")!));
    const v: Violation[] = [];
    for (const attr of ["aria-labelledby", "aria-controls"]) {
      for (const el of Array.from(doc.document.querySelectorAll(`[${attr}]`))) {
        for (const ref of (el.getAttribute(attr) ?? "").split(/\s+/).filter(Boolean)) {
          if (!ids.has(ref)) {
            v.push({ rule: "resolved-idrefs", path: doc.path, detail: `${attr} points at missing id ${JSON.stringify(ref)}`, snippet: el.outerHTML.slice(0, 120) });
          }
        }
      }
    }
    return v;
  },
};

export const RULES: Rule[] = [langDir, noLatinDigits, noLatinAria, namedControls, resolvedIdrefs];
