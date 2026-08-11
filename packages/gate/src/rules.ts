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

/**
 * A locale's NATIVE digit set — the ten code points its readers expect to see.
 *
 * This exists because the digit rules were hardwired to Persian. `noLatinDigits`
 * and the floor both grepped a literal Persian digit range, which is correct for
 * `fa-IR` and silently wrong for every other locale that does not number in
 * Latin: an Arabic page numbers in U+0660–U+0669, nine code points below
 * Persian's U+06F0–U+06F9, so a perfectly correct Arabic page scored ZERO native
 * digits and a floor on it could never be met. The hardwiring was invisible
 * because the only RTL locale in the repo was the one it was hardwired to.
 *
 * So the digit set is locale DATA now, carried on the `Doc`, and the rules read
 * it. The rule ids do not change — `no-latin-digits` and `persian-digit-floor`
 * are referenced by the floors file, by the docs and by CI status checks, and a
 * renamed id is a rule that silently stops being enforced.
 */
export interface DigitSystem {
  /**
   * How the digits are named in a violation message. `fa-IR` is "Persian", so
   * the Persian violation text is byte-identical to what this rule printed when
   * the range was hardwired — the floors file and its docs quote that wording.
   */
  name: string;
  /** The numbering system, as `Intl` spells it: `arabext`, `arab`, `latn`. */
  numberingSystem: string;
  /** This system's ZERO. The ten digits are contiguous from here in Unicode. */
  zero: string;
  /** Matches any one of the ten. Global, so `String.match` counts occurrences. */
  pattern: RegExp;
}

/**
 * Builds a digit system from its zero.
 *
 * Contiguity is a Unicode invariant for decimal digit sets (each is a
 * `Nd` block of exactly ten in value order), so deriving nine code points from
 * one is safe and removes the chance of a hand-typed range being off by one —
 * which is precisely the defect that made this parametrisation necessary.
 */
export function digitSystem(name: string, numberingSystem: string, zero: string): DigitSystem {
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

export interface Doc {
  /** Route path, used to derive the expected locale. e.g. "fa/admin/index.html" */
  path: string;
  document: Document;
  /** The locale this route is expected to serve, derived from its path. */
  locale: string;
  direction: "rtl" | "ltr";
  /** The digits this locale's readers expect. See `DigitSystem`. */
  digits: DigitSystem;
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
const LATIN_WORD = /[A-Za-z]{3,}/;

/**
 * A locale that numbers in `latn` has nothing for the digit rules to catch —
 * its readers expect the same code points the rule would flag. This is the one
 * place that decides it, so both digit rules agree by construction.
 */
function numbersInLatin(digits: DigitSystem): boolean {
  return digits.numberingSystem === "latn";
}

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

/**
 * Rule 2 — no Latin digits in the visible text of a natively-numbered locale.
 *
 * The skip used to be `direction !== "rtl"`, which was a PROXY for "this locale
 * numbers in Latin" that happened to be right for the only two locales the repo
 * had. Direction and numbering system are independent properties, so the rule
 * now asks the question it means. For `fa-IR` (rtl, arabext) and `en-US` (ltr,
 * latn) the two spellings select identically — this is a widening, not a change.
 */
export const noLatinDigits: Rule = {
  id: "no-latin-digits",
  because:
    "A prototype rendered 77 of 77 calendar day cells in Latin digits on a " +
    "Persian page, two lines below a comment explaining that exact failure. " +
    "It is visible to a sighted reader and invisible to an aria-label audit.",
  run: (doc) => {
    if (numbersInLatin(doc.digits)) return [];
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
 * Rule 3 — the NATIVE-DIGIT floor, the anti-vacuity pair for rule 2.
 *
 * "Zero Latin digits" passes trivially on a page with no numbers at all. A route
 * that is supposed to show numbers must actually show them in the reader's own
 * digits, so each route declares a floor. Without this, rule 2 silently stops
 * meaning anything the moment a page stops rendering its data.
 *
 * The count is per-locale: a `fa-IR` route is counted in U+06F0–U+06F9 and an
 * `ar-SA` route in U+0660–U+0669. That distinction is the whole point — the two
 * ranges do not overlap, so an Arabic page rendered with Persian digits fails
 * its floor and a Persian page rendered with Arabic-Indic digits fails its own.
 * A floor that accepted "any Arabic-script digit" would be exactly the vacuous
 * check this rule's own `because` complains about in a sibling project.
 *
 * The id stays `persian-digit-floor`: `apps/website/gate.floors.json`, the docs
 * and the CI status check all name it, and an id that changes is a rule that
 * quietly stops being the one anybody wired up.
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
    const found = (text.match(doc.digits.pattern) ?? []).length;
    return found >= floor
      ? []
      : [{ rule: "persian-digit-floor", path: doc.path, detail: `expected at least ${floor} ${doc.digits.name} digits, found ${found}` }];
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


/**
 * Rule 6 — a composite widget must have a tab stop in the SERVED bytes.
 *
 * A roving-tabindex widget (tablist, radiogroup, tree, listbox, toolbar, menu)
 * is one Tab stop from the outside: exactly ONE member carries `tabindex="0"`
 * and the arrow keys move it. If every member is `tabindex="-1"`, the widget is
 * unreachable by keyboard entirely.
 *
 * ── WHY THIS RULE EXISTS, MEASURED ──────────────────────────────────────────
 *
 * Base UI elects the tabbable member in a layout effect, which does not run on
 * the server — the same architecture that left controls unnamed and produced
 * `useFieldWiring`. The migration shipped a build with **132 `role="tab"`
 * elements at `tabindex="-1"` and none at `0`**, plus six radio groups with no
 * tab stop at all. Every tab list on the site was keyboard-unreachable until
 * hydration.
 *
 * Nothing caught it. The gate had no rule for a MISSING attribute, and the
 * defect self-heals on hydration, so jsdom, Testing Library and axe all pass in
 * both states. It was found by counting attributes in the export by hand. This
 * rule is that count, made permanent.
 *
 * Two shapes are legitimately exempt and are not violations:
 *  - the container manages focus itself via `aria-activedescendant`, so the
 *    CONTAINER is the tab stop and its items are correctly all `-1`;
 *  - every member is disabled, so there is nothing to focus.
 */
const COMPOSITE_ROLES: Record<string, string> = {
  tablist: "tab",
  radiogroup: "radio",
  tree: "treeitem",
  listbox: "option",
  toolbar: "button",
  menu: "menuitem",
  menubar: "menuitem",
};

export const compositeTabStop: Rule = {
  id: "composite-tab-stop",
  because:
    "A roving-tabindex widget whose members are all tabindex=-1 is unreachable " +
    "by keyboard. It self-heals on hydration, so no jsdom test and no axe run " +
    "can see it — only the served bytes can.",
  run: (doc) => {
    const v: Violation[] = [];
    for (const [containerRole, itemRole] of Object.entries(COMPOSITE_ROLES)) {
      for (const el of Array.from(doc.document.querySelectorAll(`[role="${containerRole}"]`))) {
        // The container owns focus itself; its items are meant to be -1.
        if (el.hasAttribute("aria-activedescendant")) continue;
        if (el.closest?.('[aria-hidden="true"],[hidden]')) continue;
        const items = Array.from(el.querySelectorAll(`[role="${itemRole}"]`)).filter(
          (i) => i.getAttribute("aria-disabled") !== "true" && !i.hasAttribute("disabled"),
        );
        if (items.length === 0) continue;
        const stops = items.filter((i) => i.getAttribute("tabindex") === "0");
        if (stops.length === 0) {
          v.push({
            rule: "composite-tab-stop",
            path: doc.path,
            detail: `role="${containerRole}" has ${items.length} enabled ${itemRole}(s) and none is tabbable — the whole widget is unreachable by keyboard in the served bytes`,
            snippet: el.outerHTML.slice(0, 140),
          });
        }
      }
    }
    return v;
  },
};

export const RULES: Rule[] = [langDir, noLatinDigits, noLatinAria, namedControls, resolvedIdrefs, compositeTabStop];
