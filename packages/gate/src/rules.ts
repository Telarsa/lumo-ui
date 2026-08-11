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
  /**
   * The Unicode calendar this locale's readers count years in — `"persian"`,
   * `"islamic-umalqura"`, `"gregory"`. See `nativeCalendar`.
   */
  calendar: string;
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
 * ── `aria-describedby` WAS EXCLUDED WHOLESALE. IT IS NOW EXEMPTED BY ID. ────
 *
 * The exclusion was real and its reason was right: React Aria's server render
 * legitimately emits `aria-describedby` pointing at ids that only exist after
 * hydration (post-hydration the dangle count is 0), so grading the attribute
 * under React Aria produced hundreds of violations for a defect that was not
 * there. It was excluded, and described as belonging to the hydrated test tier.
 *
 * **The reason was never about the ATTRIBUTE. It was about one ENGINE.**
 * Measured on the 442-document export of this branch, 11 Aug 2026:
 *
 *     dangling aria-describedby, total          301
 *     …whose id begins `react-aria-`            301
 *     …from Base UI, from Lumo, from anything    0
 *
 *     documents affected                         16
 *     components                                  4  — date-picker,
 *                                                      date-range-picker,
 *                                                      time-field, list-box
 *
 * Those four are exactly the React Aria roots the Base UI migration has not
 * reached. So the exclusion is narrowed to what it always meant: ids matching
 * `react-aria-`, which that library mints and no other code in this tree does.
 * Everything else is graded from now on.
 *
 * That matters because `form-state.tsx` made `aria-describedby` LOAD-BEARING:
 * a validation error reaches the reader through that attribute and through
 * nothing else. A dangling one is an error that is drawn and announced by
 * nobody — visually identical to a working form. Under the old rule the gate
 * could not see it. The gap was found by writing the poison twin for
 * `form-state.test.tsx` and watching it fail to fire.
 *
 * ── THE EXEMPTION EXPIRES BY ITSELF ────────────────────────────────────────
 *
 * `react-aria-` ids stop being emitted when the last React Aria root goes. At
 * that point this exemption matches nothing, and deleting it is a no-op that
 * can be verified with a build rather than argued about — grep the export for
 * `react-aria-`, and if the count is 0 delete the constant below. It is written
 * as an exemption rather than a `TODO` for that reason.
 */
const HYDRATION_DEFERRED_ID = /^react-aria-/;

export const resolvedIdrefs: Rule = {
  id: "resolved-idrefs",
  because:
    "A dangling aria-labelledby means the element has no name at all, and a " +
    "dangling aria-describedby means its help text or validation error is " +
    "announced by nobody — both while looking fully wired in the markup.",
  run: (doc) => {
    const ids = new Set(Array.from(doc.document.querySelectorAll("[id]")).map((e) => e.getAttribute("id")!));
    const v: Violation[] = [];
    // `aria-errormessage` is graded with the others and not separately: it is
    // the same defect as a dangling describedby, on the attribute whose ONLY
    // job is to carry a validation error.
    for (const attr of ["aria-labelledby", "aria-controls", "aria-describedby", "aria-errormessage"]) {
      for (const el of Array.from(doc.document.querySelectorAll(`[${attr}]`))) {
        for (const ref of (el.getAttribute(attr) ?? "").split(/\s+/).filter(Boolean)) {
          if (ids.has(ref)) continue;
          if (HYDRATION_DEFERRED_ID.test(ref)) continue; // see the header
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
 * THREE shapes are legitimately exempt and are not violations:
 *  - the container manages focus itself via `aria-activedescendant`, so the
 *    CONTAINER is the tab stop and its items are correctly all `-1`;
 *  - the container carries `tabindex="0"` itself — the same idea, arrived at
 *    without `aria-activedescendant`. See below;
 *  - every member is disabled, so there is nothing to focus.
 *
 * ── THE THIRD EXEMPTION, AND HOW IT WAS FOUND ───────────────────────────────
 *
 * By this rule reporting four violations that were not defects. React Aria's
 * collections make the COLLECTION tabbable while nothing inside it is focused
 * and marshal focus into the first item on entry — `useSelectableCollection`
 * computes `tabIndex = manager.focusedKey == null ? 0 : -1` in the RENDER BODY,
 * and `useSelectableItem` computes the mirror of it in the same pass, so the
 * two swap atomically. There is never a moment with two stops, and Tab into the
 * container lands on a real option. The served shape — `role="listbox"
 * tabindex="0"` with every option at `-1` — is the rule's own first exemption,
 * reached by a different route, and the rule simply had no test for it.
 *
 * The header above already described this case in words. It was only ever
 * DETECTED via `aria-activedescendant`, which React Aria does not use here.
 *
 * `=== "0"` and not `hasAttribute("tabindex")`, measured: the looser spelling
 * also swallows the eight autocomplete/command containers, which sit at
 * `tabindex="-1"` and ARE genuinely unreachable in the served bytes. Measured
 * across the whole export, no other composite container carries any tabindex at
 * all — 470 tablists, 322 radiogroups, 8 toolbars, 8 menubars, none of them —
 * so this exemption cannot reach the defect the rule was written for.
 *
 * ── THE FOURTH: A COMBOBOX'S LIST ───────────────────────────────────────────
 *
 * The same principle as the first, with the focus manager living on a DIFFERENT
 * ELEMENT. In the combobox pattern focus never enters the list at all: it stays
 * on the input, the options are correctly `tabindex="-1"`, and the input names
 * the active one with `aria-activedescendant`. A listbox reached this way is
 * one Tab from the outside — the input's Tab.
 *
 * The exemption is deliberately NARROW, and the narrowness is the whole of it:
 *
 *   · the owner must reference this list BY ID through `aria-controls`. An
 *     earlier draft matched any `role="combobox"` sharing a `parentElement`,
 *     which excuses a listbox because a combobox happens to sit next to it —
 *     blindness by adjacency, and precisely the weakening
 *     `experiments/measurements/composite-tab-stop-open.json` rejected;
 *   · the owner must itself be TABBABLE. A combobox that is disabled or at
 *     `tabindex="-1"` cannot be Tabbed to, so the list behind it is exactly as
 *     unreachable as it looks and the violation is real.
 *
 * Nothing in the export satisfied this before `useComboboxWiring` shipped —
 * Base UI writes `aria-controls` from a ref callback after mount, so the served
 * input pointed at nothing. The exemption and the fix landed together, which is
 * the only order in which either is honest: a rule narrowed to fit markup that
 * does not exist yet is a rule that has stopped grading anything.
 */

/**
 * Is this listbox referenced by a `role="combobox"` that can itself be reached?
 *
 * `aria-controls` is a SPACE-SEPARATED LIST, so `~=` rather than `=`: one input
 * may control a list and a grid, and an exact match silently fails that case.
 */
function ownedByTabbableCombobox(document: Doc["document"], list: Element): boolean {
  const id = list.getAttribute("id");
  // An id with a quote or whitespace in it would break the selector — and a
  // thrown SyntaxError inside the gate reads as "the build is broken" rather
  // than "this page has an odd id". Refuse to match rather than to run.
  if (id === null || id === "" || /["'\\\s]/.test(id)) return false;
  const owner = document.querySelector(`[role="combobox"][aria-controls~="${id}"]`);
  if (owner === null) return false;
  return (
    !owner.hasAttribute("disabled") &&
    owner.getAttribute("aria-disabled") !== "true" &&
    owner.getAttribute("tabindex") !== "-1"
  );
}
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
        // The container IS the tab stop, without saying so via
        // aria-activedescendant. See the third exemption in the header.
        if (el.getAttribute("tabindex") === "0") continue;
        // A combobox's list: the INPUT is the tab stop and the options are
        // correctly all -1. See the fourth exemption in the header.
        if (containerRole === "listbox" && ownedByTabbableCombobox(doc.document, el)) continue;
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


/**
 * Rule 7 — a date must be in the READER'S calendar, not merely their language.
 *
 * ── THE DEFECT, WHICH EVERY OTHER RULE IN THIS FILE PASSES ──────────────────
 *
 * A Persian page can render «۲۲ ژوئیه ۲۰۲۴» — Persian digits, Persian script,
 * Persian month name — and be completely wrong. Iran uses the Jalali calendar,
 * where that day is «۱ مرداد ۱۴۰۳». Wrong year, wrong month, wrong day, and
 * ژوئیه is not a month anyone in Iran uses: it is "July" transliterated.
 *
 * Nothing else here can see it. The digits ARE Persian, so `no-latin-digits` is
 * green. There is no Latin in the ARIA, so `no-latin-aria` is green. The
 * controls are named and the idrefs resolve. **The page is green on every rule
 * and off by 622 years.** A reviewer who does not read the calendar sees a
 * correct, fully localised date.
 *
 * ── WHY THE RISK IS REAL RATHER THAN THEORETICAL ────────────────────────────
 *
 * Measured on this project's Node, 11 Aug 2026:
 *
 *     new Intl.DateTimeFormat("fa-IR").format(d)   →  ۱ مرداد ۱۴۰۳    Jalali
 *     new Intl.DateTimeFormat("ar-SA").format(d)   →  ٢٢ يوليو ٢٠٢٤   GREGORIAN
 *
 * `fa-IR` happens to default to its own calendar in this ICU build. `ar-SA`
 * does NOT. So the same code, written the same way, is correct in one RTL
 * locale and silently wrong in the next — and because it is an ICU DEFAULT it
 * can differ between a laptop and CI. That is precisely why
 * `packages/core/src/format.ts` states `-u-ca-persian` explicitly rather than
 * inheriting it, and this rule is what makes that discipline enforceable
 * instead of remembered.
 *
 * It also guards the one thing `react-day-picker` gets wrong by default: its
 * v10 `locale/fa-IR` is `date-fns`'s Persian locale over a GREGORIAN grid, so
 * an import written the obvious way ships exactly this defect.
 *
 * ── HOW IT GRADES ──────────────────────────────────────────────────────────
 *
 * By asking `Intl` for both month lists rather than hardcoding either — the
 * same construction `parseNumber` uses for digits, and for the same reason: a
 * hardcoded list is correct until CLDR revises a name, and then it is a rule
 * that silently stops detecting.
 *
 *   NATIVE  the 12 month names in the locale's own calendar
 *   FOREIGN the 12 month names of the GREGORIAN calendar in the same LANGUAGE
 *
 * A foreign name in the served text is the violation. Verified to be
 * unambiguous — the two sets have **zero overlap** in both non-Gregorian
 * locales the gate knows:
 *
 *     fa-IR  native  دی بهمن اسفند فروردین …    foreign  ژانویه فوریه … ژوئیه …
 *     ar-SA  native  محرم صفر ربيع الأول …      foreign  يناير فبراير … يوليو …
 *
 * A locale whose calendar IS `gregory` has no distinguishable foreign set, so
 * the rule is vacuous there and returns early rather than inventing a check.
 * That is the honest behaviour for `en-US` and it is stated so nobody later
 * reads the empty result as coverage.
 *
 * ── TWO FALSE-POSITIVE TRAPS, BOTH MEASURED ON THE REAL BUILD ──────────────
 *
 * The first version of this rule used `text.includes(name)` and reported **481
 * violations across 446 documents**, every one of them wrong. Two causes, and
 * both are specific to non-Latin script:
 *
 *   1. **There is no `` for Persian.** «مه» (Gregorian May) is two letters
 *      and occurs inside «برنامه», «نامه», «ادامه» — ordinary words on nearly
 *      every page. Substring matching on a short month name in an abjad is
 *      matching noise. Fixed with explicit letter lookarounds over `\p{L}\p{M}`,
 *      which is what `` would mean if it were script-aware.
 *
 *   2. **A month name can be an ordinary word.** «مه» ALSO means fog in
 *      Persian, and «آذر» is a common given name. A bare match is therefore not
 *      evidence of a date even when the boundaries are right.
 *
 * So the rule requires a DATE SHAPE: the month name, bounded, with a run of
 * digits beside it. That is what the rule actually means — «۲۲ ژوئیه ۲۰۲۴» is
 * a date in the wrong calendar; «مه غلیظی شهر را گرفت» is a sentence about fog.
 * Both digit systems count, because a page can render a Gregorian date with
 * Latin digits too, and that is a worse defect rather than an exempt one.
 *
 * ── THE ESCAPE HATCH, WHICH IS A REAL PATTERN AND NOT A CONCESSION ─────────
 *
 * `[data-lumo-gregory]` marks a subtree whose Gregorian date is DELIBERATE.
 * Same shape, same reasoning and the same file as `[data-lumo-latn]`, which
 * exempts genuinely-Latin runs like an order ID from the digit rule.
 *
 * It exists because a real, correct pattern needs it: Iranian software
 * routinely prints BOTH calendars — this repository's own changelog renders
 * «۱۹ مرداد ۱۴۰۵ — ۱۰ اوت ۲۰۲۶», Jalali first with the Gregorian beside it,
 * which is helpful rather than wrong. Those three were the only survivors once
 * the false positives were fixed, so the hatch is carrying its real weight and
 * nothing else.
 *
 * It is deliberately an ATTRIBUTE on the markup rather than a path allow-list
 * in a config file: the exemption then lives next to the date it exempts, where
 * the person changing that date will see it, instead of in a file nobody opens.
 */
const monthNameCache = new Map<string, string[]>();

function monthNames(locale: string, calendar: string): string[] {
  const key = `${locale}|${calendar}`;
  let names = monthNameCache.get(key);
  if (!names) {
    const format = new Intl.DateTimeFormat(`${locale}-u-ca-${calendar}`, {
      month: "long",
      timeZone: "UTC",
    });
    // Mid-month, so a timezone slip cannot roll into a neighbouring month.
    names = [
      ...new Set(
        Array.from({ length: 12 }, (_, i) => format.format(new Date(Date.UTC(2024, i, 15)))),
      ),
    ];
    monthNameCache.set(key, names);
  }
  return names;
}

/**
 * A month name in a DATE, not a month name in a sentence.
 *
 * `(?<![\p{L}\p{M}])` / `(?![\p{L}\p{M}])` are `\b` rewritten to be
 * script-aware: JavaScript's own `\b` is defined over `[A-Za-z0-9_]`, so in
 * Persian it fires between two letters and the boundary means nothing.
 *
 * The digit run either side is what makes it a date. `\p{Nd}` covers every
 * decimal numbering system at once — Latin, Persian, Arabic-Indic — so a
 * Gregorian date is caught whichever digits it is written in.
 */
function datePattern(monthName: string): RegExp {
  const L = "\\p{L}\\p{M}";
  const escaped = monthName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const bounded = `(?<![${L}])${escaped}(?![${L}])`;
  // digits ... month, or month ... digits — within a few characters either way,
  // which is every date format either locale writes.
  return new RegExp(`(\\p{Nd}[\\p{Nd}\\s،,/-]{0,12}${bounded})|(${bounded}[\\s،,/-]{0,3}\\p{Nd})`, "u");
}

export const nativeCalendar: Rule = {
  id: "native-calendar",
  because:
    "A date rendered in the reader's language but the WRONG CALENDAR is green " +
    "on every other rule and off by centuries. «۲۲ ژوئیه ۲۰۲۴» is Persian text " +
    "for a day Iran calls «۱ مرداد ۱۴۰۳».",
  run: (doc) => {
    if (doc.calendar === "gregory") return []; // nothing to distinguish — see the header
    const native = monthNames(doc.locale, doc.calendar);
    const foreign = monthNames(doc.locale, "gregory").filter((name) => !native.includes(name));
    if (foreign.length === 0) return [];
    const patterns = foreign.map((name) => [name, datePattern(name)] as const);

    const v: Violation[] = [];
    for (const node of visibleTextNodes(doc.document)) {
      // A deliberately dual-calendar subtree. See the header.
      if (node.parentElement?.closest?.("[data-lumo-gregory]")) continue;
      const text = node.data;
      for (const [name, pattern] of patterns) {
        if (!pattern.test(text)) continue;
        v.push({
          rule: "native-calendar",
          path: doc.path,
          detail:
            `Gregorian month ${JSON.stringify(name)} in a date on a ${doc.locale} page, whose ` +
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

export const RULES: Rule[] = [langDir, noLatinDigits, noLatinAria, namedControls, resolvedIdrefs, compositeTabStop, nativeCalendar];
