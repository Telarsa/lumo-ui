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

/**
 * A locale's NATIVE SCRIPT — the writing system its readers read.
 *
 * A FOURTH independent property, added for the same reason the third was.
 * Direction, numbering system and calendar are already three facts that do not
 * follow from one another; script is a fourth. Persian and Arabic share a
 * script and differ in digits AND calendar; Urdu is rtl and Arabic-script;
 * Serbian is ltr and can be Cyrillic. Deriving "the reader's script" from
 * `direction === "rtl"` would be the same proxy that made `no-latin-digits`
 * silently Persian-only, one property later, so it is stated rather than
 * inferred.
 *
 * The membership test is `\p{Script=…}` rather than a hand-typed code-point
 * range, for the reason `digitSystem` derives nine digits from one: Unicode
 * owns the answer, a hand-typed range is correct until it is not, and the
 * Arabic block alone (U+0600–U+06FF) misses Arabic Presentation Forms and the
 * Supplement, both of which appear in real Persian bytes.
 */
export interface ScriptSystem {
  /** How the script is named in a violation message. */
  name: string;
  /** The Unicode script property value, as `\p{Script=…}` spells it. */
  property: string;
  /** Matches any one character written in this script. */
  pattern: RegExp;
}

/** Builds a script system from its Unicode script property value. */
export function scriptSystem(name: string, property: string): ScriptSystem {
  return { name, property, pattern: new RegExp(`\\p{Script=${property}}`, "u") };
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
  /** The writing system this locale's readers read. See `ScriptSystem`. */
  script: ScriptSystem;
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
 * A WORD in some script, whichever script that is.
 *
 * `LATIN_WORD` above is spelled `[A-Za-z]` because `no-latin-aria` asks a
 * question about Latin specifically. The two script rules below ask a different
 * question — "is there a word here in a script this reader does not read?" —
 * and they ask it of text that has ALREADY been shown to contain no character
 * of the reader's own script. At that point any run of three letters is
 * foreign by construction, so the test does not need to name Latin, and not
 * naming it is what makes the rules work for a Cyrillic leak on an Arabic page
 * or a Greek one on a Persian page without a second constant.
 *
 * Three, not one: a single stray letter is a bullet, an initial or a unit
 * («۵ kg»), and flagging those would make the rule noise. Three is the same
 * threshold `LATIN_WORD` has used since the first rule in this file.
 */
const FOREIGN_WORD = /\p{L}{3,}/u;

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

/**
 * Attributes a screen reader speaks.
 *
 * ── `alt` AND `placeholder` WERE MISSING, AND BOTH ARE SPOKEN ───────────────
 *
 * The list held seven attributes, five of them `aria-*`, and it had a hole with
 * a shape: it graded the attributes an ARIA audit thinks about and not the two
 * ordinary HTML attributes that reach a reader by exactly the same route.
 * `alt` IS the accessible name of an image — it is not a fallback, it is the
 * name — and a native `placeholder` is announced when a field has no other
 * name and is read out alongside the name when it has one. `aria-placeholder`
 * was already here, which is the tell: the ARIA spelling of a thing was graded
 * and the platform spelling of the same thing was not.
 *
 * Measured on the 524-document export before this widening, on the 264
 * documents in a non-`latn` locale:
 *
 *     alt attributes         12   with a Latin word   0
 *     placeholder attributes 40   with a Latin word   0
 *
 * So it costs nothing today, which is the entire argument for doing it now:
 * the cheapest moment to grade a property is while it already holds. It is not
 * VACUOUS — the attributes exist in the export in quantity, they are simply
 * all correct — and the `no-latin-aria` fixture carries one of each so the
 * widening is observed failing rather than assumed to work.
 *
 * ── WHY EACH CARRIES A SELECTOR ────────────────────────────────────────────
 *
 * `alt` and `placeholder` are only announced on the elements the platform
 * defines them for. `<div alt="Save">` is an author error that no reader ever
 * hears, and `<div placeholder="Search">` likewise; grading them would report a
 * defect that cannot reach a user, and a rule whose findings a reader cannot
 * hear is a rule people learn to ignore. The `aria-*` attributes and `title`
 * apply to any element, so their selector is the attribute alone.
 */
interface SpokenAttribute {
  attr: string;
  /**
   * Which elements this attribute is actually spoken on. `undefined` means
   * "any element carrying it".
   */
  on?: string;
}

const SPOKEN: SpokenAttribute[] = [
  { attr: "aria-label" },
  { attr: "aria-roledescription" },
  { attr: "aria-valuetext" },
  { attr: "aria-description" },
  { attr: "aria-placeholder" },
  { attr: "aria-keyshortcuts" },
  { attr: "title" },
  // The two platform spellings. `input[type=image]` is in the list because its
  // `alt` is the name of a real submit button, not decoration.
  { attr: "alt", on: "img,area,input[type=image]" },
  { attr: "placeholder", on: "input,textarea" },
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

/**
 * One element's OWN text — its direct child text nodes, concatenated.
 *
 * ── WHY THIS EXISTS AND `visibleTextNodes` DOES NOT ANSWER IT ──────────────
 *
 * `native-script-text` below asks whether a run of visible text is PURELY
 * foreign, which is a question about a whole run and not about a node. Asked
 * per text NODE it is answered wrongly, and the reason is a parser detail
 * nobody would predict: **linkedom splits a text node at every character
 * entity.** A perfectly ordinary Persian sentence in the export —
 *
 *     <p>tone=&quot;critical&quot; فقط دکمهٔ تأیید را قرمز می‌کند …</p>
 *
 * — arrives as five text nodes, and two of them («tone=» and «critical») hold
 * no Arabic character at all. They are fragments of a Persian sentence that
 * happens to quote a prop value, which is exactly the legitimate inline
 * technical term the scope of this rule was chosen to avoid.
 *
 * Measured on the 524-document export, 12 Aug 2026:
 *
 *     pure-foreign TEXT NODES   178
 *     pure-foreign TEXT RUNS    138   ← the same corpus, merged per element
 *     phantom findings           40   every one of them an entity boundary
 *
 * So the merge is not a softening of the rule; it is the difference between
 * grading sentences and grading the parser. It deliberately merges no further
 * than the element: a `<code>` inside a Persian paragraph is still its own run,
 * because an inline foreign term IS its own run to a reader — it is announced
 * in its own voice — and that is what `data-lumo-latn` is for.
 */
interface TextRun {
  element: Element;
  text: string;
}

function visibleTextRuns(doc: Document): TextRun[] {
  const out: TextRun[] = [];
  const walk = (el: Element | Document) => {
    let own = "";
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === 3) {
        own += (child as Text).data;
      } else if (child.nodeType === 1) {
        const kid = child as Element;
        if (NON_TEXT.has(kid.tagName)) continue;
        // The same sanctioned escape hatch `visibleTextNodes` honours, and the
        // same spelling of it, so the two agree about what is graded.
        if (kid.closest?.("[data-lumo-latn]")) continue;
        walk(kid);
      }
    }
    if (own.trim() && (el as Element).tagName !== undefined) {
      out.push({ element: el as Element, text: own });
    }
  };
  const body = doc.body ?? doc;
  if ((body as Element).closest?.("[data-lumo-latn]")) return out;
  walk(body);
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
    for (const { attr, on } of SPOKEN) {
      const selector = on === undefined ? `[${attr}]` : on.split(",").map((s) => `${s}[${attr}]`).join(",");
      for (const el of Array.from(doc.document.querySelectorAll(selector))) {
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
const COMPOSITE_ROLES: Record<string, string | readonly string[]> = {
  tablist: "tab",
  radiogroup: "radio",
  tree: "treeitem",
  listbox: "option",
  toolbar: "button",
  menu: "menuitem",
  menubar: "menuitem",
  /*
   * ── THE THREE GRID SHAPES, ADDED BECAUSE THE LIBRARY GREW INTO THEM ──────
   *
   * `grid` and `treegrid` were absent until 12 Aug 2026, and their absence was
   * reported by the components themselves rather than found by this file:
   * `tree.tsx`, `event-calendar.tsx` and `gantt.tsx` each landed with a header
   * saying, in effect, "my shape is right because I measured it, not because
   * the gate would have caught me". Three components volunteering that they are
   * ungraded is the signal to grade them.
   *
   * A `treegrid`'s members are ROWS, not `treeitem`s — that is the whole reason
   * `tree: "treeitem"` did not cover `tree.tsx` after its migration, since ARIA
   * names the two container roles differently and the row is what takes focus.
   *
   * `grid` is entered here as `gridcell` rather than `row` deliberately: a data
   * grid moves focus per CELL (`table.tsx` tracks `{row, col}`), and a calendar
   * grid does too. A widget that roves over rows instead is still covered,
   * because the container-is-the-tab-stop exemption below fires first for it.
   */
  /*
   * A grid's focusable member is a CELL, and ARIA spells "cell" three ways.
   * The first draft of this entry mapped `grid → "gridcell"` alone and fired on
   * three of the library's own tables — whose roving stop legitimately sits on
   * a `columnheader`, because row 0 of a data grid IS the header row and
   * `{row: 0, col: 0}` lands there. That was a bug in the rule, not a licence
   * to narrow it (DECISIONS §13), so the value is a LIST and the container
   * passes if any spelling carries the stop.
   *
   * `treegrid` takes `row` and not `treeitem`: ARIA names the two tree
   * containers differently, and in a treegrid it is the row that takes focus.
   */
  grid: ["gridcell", "columnheader", "rowheader"],
  treegrid: ["row"],
};

export const compositeTabStop: Rule = {
  id: "composite-tab-stop",
  because:
    "A roving-tabindex widget whose members are all tabindex=-1 is unreachable " +
    "by keyboard. It self-heals on hydration, so no jsdom test and no axe run " +
    "can see it — only the served bytes can.",
  run: (doc) => {
    const v: Violation[] = [];
    for (const [containerRole, itemRoleSpec] of Object.entries(COMPOSITE_ROLES)) {
      // One role or several — see the grid entry above for why several.
      const itemRoles = typeof itemRoleSpec === "string" ? [itemRoleSpec] : itemRoleSpec;
      const itemSelector = itemRoles.map((r) => `[role="${r}"]`).join(",");
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
        const items = Array.from(el.querySelectorAll(itemSelector)).filter((i) => {
          if (i.getAttribute("aria-disabled") === "true" || i.hasAttribute("disabled")) {
            return false;
          }
          /*
           * Under WIDGET focus the disablement is on the control, not on the
           * cell. A fully disabled calendar serves 42 cells that are not
           * themselves disabled, each holding a `<button disabled>` — and it is
           * CORRECT for it to have no tab stop, because there is nothing to
           * focus. Judging the cell alone reported those as unreachable
           * widgets, which is the rule being wrong about a correct state.
           *
           * A cell with no controls at all is left enabled: that is the
           * cell-focus model, where the cell itself is the thing.
           */
          const controls = Array.from(i.querySelectorAll("button,a[href],input,select,textarea"));
          if (controls.length === 0) return true;
          return controls.some(
            (c) => !c.hasAttribute("disabled") && c.getAttribute("aria-disabled") !== "true",
          );
        });
        if (items.length === 0) continue;
        /*
         * The stop may be ON the item or INSIDE it, and both are specified.
         *
         * ARIA gives a grid two focus models: CELL focus, where the cell itself
         * is tabbable (`table.tsx` does this — it tracks `{row, col}` and puts
         * the stop on the active cell), and WIDGET focus, where the cell holds
         * a control that takes focus instead. react-day-picker uses the second:
         * measured on a served calendar, 42 day buttons with 41 at `-1` and
         * exactly one at `0`, inside cells that are not tabbable at all.
         *
         * The first version of this line looked only at the item and reported
         * every calendar in the library as an unreachable widget. That is the
         * rule being wrong about a correct pattern, so it is widened to the
         * pattern rather than exempted for the component — the distinction
         * DECISIONS §13 draws. It cannot hide a real defect: a widget with no
         * tabbable element anywhere inside it still has no stops.
         */
        const stops = items.filter(
          (i) =>
            i.getAttribute("tabindex") === "0" ||
            i.querySelector('[tabindex="0"]') !== null,
        );
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
 * Rule 7 — a composite widget must have at MOST one tab stop in the served bytes.
 *
 * `composite-tab-stop` above grades a FLOOR: it fires when a roving-tabindex
 * widget has NO tab stop and is therefore unreachable. This grades the CEILING,
 * which is the same contract read the other way. A `role="toolbar"` exists to
 * collapse N controls into ONE Tab stop; a toolbar that serves five is not
 * unreachable, it is the role telling the reader a lie, and every other tier is
 * green on it.
 *
 * ── WHY IT EXISTS, AND THE THIRTY IT WAS WRITTEN AGAINST ────────────────────
 *
 * Measured on the export of the commit before this one, counting the tabbable
 * descendants of every roving-tabindex container in 524 documents:
 *
 *     toolbar        12   ← `ToolbarItem` served tabindex=0 on EVERY item, and
 *                           `ToggleButton` dropped the composite props it was
 *                           handed, so its toggles were never members at all
 *     menubar         6   ← `MenubarButton` served tabindex=0 on EVERY trigger
 *     grid            6   ← `ColumnResizer` carried no tabindex: one extra stop
 *                           per resizable column, permanently
 *     row (in grid)   6   ← the same two elements, counted again one level down
 *
 * All four are fixed at the component. Nothing was exempted to reach green, and
 * three of the four were not first-byte gaps at all — they survived hydration.
 *
 * ── THE CASE FOR SHIPPING IT, WHICH IS THAT IT ALREADY GRADES ──────────────
 *
 * The honest question CONTRIBUTING.md forces is whether a rule needs so many
 * exemptions that it grades nothing. It does not, and the evidence is that the
 * library was ALREADY mostly compliant before anybody wrote this:
 *
 *     tablist, radiogroup, listbox, tree, treegrid, menu — 0 findings in 524
 *     documents, across 470 tablists and 322 radiogroups
 *
 * Every one of those uses `useCompositeTabStop`, which serves the stop on ONE
 * designated member. The thirty findings were exactly the components that
 * rolled their own hydration bridge instead. So the rule is not a new standard
 * imposed on the library — it is the standard four-fifths of the library
 * already meets, made checkable.
 *
 * ── THE ONE EXEMPTION, JUSTIFIED INDIVIDUALLY ──────────────────────────────
 *
 * `[data-lumo-extra-tab-stop]` discounts ONE control from a container's count.
 * It is used in exactly one place in this repository and could not be avoided
 * there: `apps/website/src/examples/toolbar.tsx`'s `RegistrationExample` is a
 * worked demonstration OF THIS DEFECT. Its third control is deliberately not a
 * `ToolbarItem`, and the example's own copy is "you never reach the third —
 * which still renders, still has a name, and still takes a Tab stop OF ITS
 * OWN". The extra stop is the lesson. There is no way to teach it without
 * serving it, and removing it would leave the library's one documented account
 * of the failure describing something the page no longer does.
 *
 * It is an attribute on the markup rather than a path allow-list for the same
 * reason `data-lumo-latn` and `data-lumo-gregory` are: the exemption then lives
 * next to the thing it exempts, where the person changing it will see it.
 *
 * It is deliberately narrow in three ways. It discounts the CONTROL, not the
 * container — so the rest of that toolbar is still graded, and it would still
 * fire if a second unregistered control appeared. It is a discount of one stop
 * rather than a skip, so a marked control beside a real extra stop still fires.
 * And putting the attribute on the CONTAINER does nothing at all: `closest`
 * would otherwise match the container from every descendant and turn one
 * attribute into a blanket skip for the whole widget, which is the exact
 * weakening DECISIONS §13 rejects. Both narrowings carry negative twins in
 * `gate.test.ts`.
 *
 * ── WHAT IS NOT EXEMPTED, AND WAS CONSIDERED ───────────────────────────────
 *
 * A nested composite. A `<ToggleButtonGroup>` inside a `<Toolbar>` is two
 * registries neither of which can take the other's stop away, so the pair is
 * two stops however either behaves — that was one of the thirty, and it was
 * fixed by removing the nesting from the demo rather than by teaching the rule
 * about it. `Toolbar` exposes no `Toolbar.Group`, so there is no correct
 * spelling of that nesting to protect.
 *
 * ── AND WHAT IT DELIBERATELY DOES NOT GRADE ────────────────────────────────
 *
 * `role="row"`. The crude sweep that found the thirty counted rows as
 * composites and reported six, every one of them the same two elements its
 * parent `grid` had already reported. A row inside a grid is not a tab stop of
 * its own — the GRID is the one stop, and the row is a structural container —
 * so grading it double-counts a real defect and would double-count a fix as
 * well. `COMPOSITE_ROLES` never contained it and it is not added.
 *
 * `aria-hidden`, `hidden` and `inert` subtrees are skipped, but `aria-hidden`
 * is skipped for the CONTAINER only and not for the count: an `aria-hidden`
 * element is removed from the accessibility tree and is still FOCUSABLE — that
 * is the whole of axe's `aria-hidden-focus` rule — so discounting one would
 * hide a real stop a Tab key still lands on. `inert` and `hidden` do remove an
 * element from sequential navigation, so those are discounted.
 */
const CEILING_EXEMPT = "[data-lumo-extra-tab-stop]";

/** Elements the platform makes focusable with no `tabindex` of their own. */
const NATIVELY_FOCUSABLE = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY"]);

/**
 * Is this element in the SEQUENTIAL focus order?
 *
 * `tabindex` is parsed rather than compared to `"0"`: a positive tabindex is
 * also a stop, and a page that reaches for one is usually doing something worse
 * than the defect this rule grades. `Number.parseInt` and not `Number`, because
 * `tabindex` is defined as a valid-integer parse and browsers accept `"0x"`
 * shaped junk the same lenient way.
 */
function isTabbable(el: Element): boolean {
  if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return false;
  // `inert` and `hidden` remove a subtree from sequential navigation outright.
  // `aria-hidden` does NOT — see the header.
  if (el.closest?.("[inert],[hidden]")) return false;
  const raw = el.getAttribute("tabindex");
  if (raw !== null) {
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value >= 0;
  }
  if (!NATIVELY_FOCUSABLE.has(el.tagName)) return false;
  // A bare `<a>` with no `href` is not focusable, which is exactly the shape a
  // "link" built out of a click handler has.
  if (el.tagName === "A") return el.hasAttribute("href");
  if (el.tagName === "INPUT") return el.getAttribute("type") !== "hidden";
  return true;
}

export const compositeSingleTabStop: Rule = {
  id: "composite-single-tab-stop",
  because:
    "A roving-tabindex widget exists to be ONE Tab stop — that is what the role " +
    "means. Five toolbars in this export served 2, 3, 3, 4 and 5, on a page whose " +
    "own copy says the whole strip is one stop. Nothing else can see it.",
  run: (doc) => {
    const v: Violation[] = [];
    for (const containerRole of Object.keys(COMPOSITE_ROLES)) {
      for (const el of Array.from(doc.document.querySelectorAll(`[role="${containerRole}"]`))) {
        if (el.closest?.('[aria-hidden="true"],[hidden],[inert]')) continue;
        const stops = Array.from(el.querySelectorAll("*")).filter((d) => {
          if (!isTabbable(d)) return false;
          /*
           * The exemption is on a CONTROL. `closest` would also match the
           * container itself, which would turn one attribute into a blanket
           * skip for the whole widget — the shape DECISIONS §13 rejects — so
           * the container is excluded from the match explicitly.
           */
          const marked = d.closest?.(CEILING_EXEMPT) ?? null;
          return marked === null || marked === el;
        });
        // The container itself counts. `aria-activedescendant` widgets and
        // React Aria's collections put the one stop THERE, which is correct and
        // is exactly one.
        const total = stops.length + (isTabbable(el) ? 1 : 0);
        if (total > 1) {
          v.push({
            rule: "composite-single-tab-stop",
            path: doc.path,
            detail:
              `role="${containerRole}" serves ${total} tab stops. A roving-tabindex widget is ` +
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

/**
 * Rule 9 — an `id` must be unique in the document.
 *
 * ── WHY `resolvedIdrefs` STRUCTURALLY CANNOT SEE THIS ──────────────────────
 *
 * `resolved-idrefs` proves an idref RESOLVES. It cannot prove it resolves to
 * the INTENDED element, because a duplicate satisfies it: `getElementById` and
 * `<label for>` both return the FIRST match in document order, so a page with
 * two `id="a"` is a page where half the wiring is decided by which element the
 * renderer happened to emit first. Every existing rule is green on it. The
 * markup reads as fully wired, the label points at something, the name computes
 * — and it is the wrong element.
 *
 * This is not hypothetical. It shipped: `combobox.tsx` gave its input and its
 * trigger the SAME id within one instance, and the two elements disagreed about
 * their own semantics (`aria-haspopup="listbox"` against `dialog`), so which
 * one a `<label for>` named was luck. That was found by hand and fixed under
 * Phase 1.4; this rule is what would have found it.
 *
 * ── WHAT IT CATCHES ON THE EXPORT TODAY, AND WHAT IT DOES NOT ──────────────
 *
 * Measured, 12 Aug 2026, across 524 documents and 8,846 elements carrying an
 * `id`: **14 duplicated ids over 44 elements in 4 documents** — 30 elements
 * more than there should be. The two components are `Table` (ids `a`/`b`/`c`,
 * the demo row keys, repeated once per example on the page: 5+5+4 elements per
 * locale) and `Scrollspy` (`spy-install`, `spy-usage`, `spy-theming`,
 * `spy-faq`, twice each per locale). Both are per-page duplicates produced by
 * rendering the same example more than once, which is the ordinary way this
 * defect is born.
 *
 * ── THE `<pre>`/`<code>` EXCLUSION THAT IS NOT HERE, AND WHY ───────────────
 *
 * This rule was specified with a carve-out for `<pre>`/`<code>` subtrees, on
 * the reasoning that a documentation site full of shiki-highlighted source
 * listings would be full of `id="…"` that is source code rather than markup —
 * the same methodological trap that inflated three counts in this project's
 * audit, where grep hits turned out to be RSC payload or code samples.
 *
 * It was measured before it was written, and the premise is false HERE:
 *
 *     elements carrying an id, whole export      8,846
 *     …inside a <pre> or <code>                      0
 *     duplicate groups with the exclusion            14
 *     duplicate groups without it                    14
 *
 * A highlighted listing renders `id="…"` as escaped TEXT inside `<span>`s; it
 * never produces an `id` ATTRIBUTE, so a DOM query for `[id]` cannot see it and
 * the carve-out is a no-op on every byte this project ships. An exemption that
 * grades nothing is not free: it is a hole waiting for the day someone embeds
 * live markup inside a `<code>` block, and DECISIONS §13 is explicit that an
 * exemption needs evidence rather than plausibility. So the rule grades every
 * `id` in the document and this note is the measurement, kept because the
 * reasoning is right in general and only wrong about these bytes.
 */
export const uniqueIds: Rule = {
  id: "unique-ids",
  because:
    "resolved-idrefs proves an idref RESOLVES; a duplicate id satisfies it while " +
    "resolving to the wrong element. <label for> and getElementById both take the " +
    "FIRST match, so the wiring is decided by document order — that is, by luck.",
  run: (doc) => {
    const byId = new Map<string, Element[]>();
    for (const el of Array.from(doc.document.querySelectorAll("[id]"))) {
      const id = el.getAttribute("id");
      // An empty id is a different defect and matches nothing, so grouping on
      // it would report every such element as a duplicate of every other.
      if (id === null || id === "") continue;
      byId.set(id, [...(byId.get(id) ?? []), el]);
    }
    const v: Violation[] = [];
    for (const [id, els] of byId) {
      if (els.length < 2) continue;
      v.push({
        rule: "unique-ids",
        path: doc.path,
        detail:
          `id ${JSON.stringify(id)} is carried by ${els.length} elements. An idref to it ` +
          `RESOLVES — which is why resolved-idrefs is green — and resolves to the first in ` +
          `document order, so which element is named, described or controlled is luck.`,
        snippet: els[0]?.outerHTML.slice(0, 120),
      });
    }
    return v;
  },
};

/**
 * Rule 10 — visible text must be in the reader's own script.
 *
 * ── THE DEFECT THIS EXISTS FOR, WHICH WAS GREEN ON ALL NINE RULES ──────────
 *
 * A `Select` with a selected key and no `items` renders THE KEY. Three Persian
 * routes shipped `<span>thr</span>` and `newest` to Persian readers, in the
 * place where a product name belongs. It self-heals on hydration, so no jsdom
 * test and no axe run can see it; the RSC payload two lines below carried the
 * correct Persian label. It was green on every rule this file had, because
 * `no-latin-digits` grades DIGITS and nothing graded WORDS.
 *
 * ── THE SCOPE, AND WHY IT IS NARROW ON PURPOSE ─────────────────────────────
 *
 * Only a run of visible text with NO character of the reader's script is
 * graded. That is a deliberate under-reach. A Persian documentation site is
 * full of legitimate inline technical terms — prop names, values, package
 * names — inside Persian sentences, and a rule that flagged «با
 * orientation="vertical" پشته روی محور بلند می‌نشیند» would be reporting
 * correct prose. The purity test says: a run that is ENTIRELY foreign is not a
 * technical term inside a sentence, it is a string that should have been
 * translated and was not. `<span>thr</span>` is exactly that shape.
 *
 * The under-reach is real and worth naming: a Latin word inside an otherwise
 * Persian run is invisible to this rule. That case belongs to a translator, not
 * to a grader — and `data-lumo-latn` is how a run that IS deliberately foreign
 * says so, which is the same hatch the digit rules have used since the first
 * commit.
 *
 * ── THE FALSE-POSITIVE RATE, MEASURED BEFORE THE SCOPE WAS SETTLED ─────────
 *
 * On the 524-document export, 12 Aug 2026, over the 264 documents in a
 * non-Latin-script locale — TWO distinct strings, 138 occurrences:
 *
 *     135  «Telarsa · Lumo UI»            the footer brand, apps/website/src/
 *                                         components/site-shell.tsx
 *       3  «This page could not be found.» the root 404 documents
 *
 * Neither is a rule that grades nothing and neither is a hundred exemptions:
 * they are two elements, and the fix for both is the one attribute this
 * repository already uses for genuinely-Latin content. The brand is a proper
 * noun; the 404 line is a deliberate second-language sentence for a visitor who
 * does not read Persian, already carrying `lang="en-US" dir="ltr"`.
 *
 * **`lang` is deliberately NOT an escape hatch.** It was considered, because
 * the 404 line already carries it and `lang` is the correct accessibility
 * mechanism for a foreign-language run — it is what picks the voice. It is
 * refused because it is reachable by accident and by the wrong fix: the natural
 * "repair" for a reader who sees `thr` announced in a Persian voice is to add
 * `lang="en"` to it, which would make this rule silent on the exact defect it
 * was written for. `data-lumo-latn` cannot be arrived at accidentally, it is
 * greppable, and it is already what the digit rules mean by "deliberately
 * foreign". Measured, the two mechanisms are not in competition: every element
 * in the export that carries `data-lumo-latn` on a Persian route also carries
 * `lang`, so honouring only the house attribute loses nothing that exists.
 */
export const nativeScriptText: Rule = {
  id: "native-script-text",
  because:
    "A Select shipped the raw key «thr» to Persian readers on three routes and was " +
    "green on all nine rules, because no rule graded WORDS in visible text — only " +
    "digits. It self-heals on hydration, so only the served bytes can see it.",
  run: (doc) => {
    // A Latin-script locale has nothing here to catch: a foreign word on an
    // English page is the same word its readers read. Same shape as the digit
    // rules' `numbersInLatin` early return, asked about script.
    if (doc.script.property === "Latin") return [];
    const v: Violation[] = [];
    for (const { element, text } of visibleTextRuns(doc.document)) {
      if (doc.script.pattern.test(text)) continue;
      if (!FOREIGN_WORD.test(text)) continue;
      v.push({
        rule: "native-script-text",
        path: doc.path,
        detail:
          `visible text with no ${doc.script.name} character at all: ` +
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
 *
 * ── THE HOLE IN `no-latin-aria`, WHICH IS THE COMMON CASE ─────────────────
 *
 * `no-latin-aria` reads nine ATTRIBUTES. But most controls in this library are
 * not named by an attribute at all — they are named by their CONTENT, or by a
 * `<label for>`, or by `aria-labelledby`, or by an `<img alt>` nested inside a
 * button, or by an `<input type="submit">`'s `value`. Every one of those is
 * announced, and every one of them was ungraded for language: the rule that
 * exists to stop English reaching a Persian reader could not see the name most
 * of this library's controls actually have.
 *
 * This rule computes the name the way a reader's software does — through
 * `dom-accessibility-api`, which the gate already depends on and which
 * `named-controls` already uses to ask the adjacent question ("is there a name
 * at all?"). The two rules are the pair: one grades that a name EXISTS, this
 * one grades what LANGUAGE it is in.
 *
 * ── IT PASSES TODAY, WHICH IS THE ARGUMENT FOR ADOPTING IT NOW ────────────
 *
 * Measured on the export, 12 Aug 2026, over documents in a non-Latin-script
 * locale:
 *
 *     controls with an accessible name        17,342
 *     …whose name holds no Persian character     474
 *     …not accounted for by data-lumo-latn         0
 *
 * All 474 are proper nouns: 380 are the four package-manager tabs
 * (`pnpm`/`npm`/`yarn`/`bun`, on 95 component pages) and 94 are component
 * slugs on the coverage page. Every one is already wrapped in
 * `<span dir="ltr" lang="en" data-lumo-latn="">`. The library holds this
 * property today; the cheapest moment to make a property enforceable is while
 * it holds, because there is no backlog to argue about.
 *
 * ── THE EXEMPTION MUST LOOK DOWN, NOT UP ──────────────────────────────────
 *
 * Every other rule in this file spells the hatch `el.closest("[data-lumo-latn]")`,
 * which asks about ANCESTORS. That spelling is wrong here and measurably so: a
 * name is composed from DESCENDANTS. The 94 coverage-page links are
 * `<a><code data-lumo-latn>alert</code></a>` — the mark is one level DOWN from
 * the named element, so `closest` reports 474 violations where there are none.
 *
 * So the test is: compute the name, then subtract the text of every marked
 * descendant. If what is left holds no foreign word, the foreign part of this
 * name is exactly the part somebody marked as deliberately foreign. It is a
 * subtraction rather than a skip for the same reason
 * `data-lumo-extra-tab-stop` discounts one stop rather than silencing a
 * widget: a button reading «Save پرونده» must still fire on `Save` when only
 * a sibling was marked, and the negative twin for that is in `gate.test.ts`.
 *
 * ── WHAT IT OVERLAPS, STATED RATHER THAN HIDDEN ───────────────────────────
 *
 * A control named by its own visible text also trips `native-script-text`,
 * because that text IS visible text. The overlap is real and is not a reason to
 * drop either: the rules disagree on everything that is not that case. This one
 * sees `value`, a nested `alt`, a `<label for>` across the document and a name
 * assembled from several elements; that one sees a heading, a cell or a
 * paragraph, which is not a control at all. When both fire, they are two true
 * statements about one defect — the text is wrong, and so is what is announced.
 */
function foreignResidue(el: Element, name: string): string {
  let residue = name;
  for (const marked of Array.from(el.querySelectorAll("[data-lumo-latn]"))) {
    const text = (marked.textContent ?? "").trim();
    if (text) residue = residue.split(text).join(" ");
  }
  return residue;
}

export const nativeScriptName: Rule = {
  id: "native-script-name",
  because:
    "no-latin-aria reads attributes, and most controls are named by their CONTENT, " +
    "a <label for>, a nested <img alt> or an <input value> — all announced, none " +
    "graded for language until this rule.",
  run: (doc) => {
    if (doc.script.property === "Latin") return [];
    const v: Violation[] = [];
    for (const el of Array.from(doc.document.querySelectorAll(INTERACTIVE))) {
      // Same inherited-hiding skip as `named-controls`, and for the same
      // reason: a control inside an aria-hidden subtree is never announced, so
      // the language of its name cannot reach a reader.
      if (el.closest?.('[aria-hidden="true"],[hidden]')) continue;
      if (el.closest?.("[data-lumo-latn]")) continue;
      // Deliberately NOT wrapped in try/catch — see `namedControls`, whose
      // first version swallowed a throw here and reported green forever.
      const name = computeAccessibleName(el as unknown as HTMLElement, COMPUTED_STYLE_SHIM).trim();
      // An unnamed control is `named-controls`' finding, not this one. Two
      // rules reporting one element teaches people to read neither.
      if (!name) continue;
      if (doc.script.pattern.test(name)) continue;
      if (!FOREIGN_WORD.test(foreignResidue(el, name))) continue;
      v.push({
        rule: "native-script-name",
        path: doc.path,
        detail:
          `<${el.tagName.toLowerCase()}> computes the accessible name ${JSON.stringify(name)}, ` +
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
 *
 * ── WHAT A READER ACTUALLY HEARS ──────────────────────────────────────────
 *
 * `aria-roledescription` REPLACES the spoken role: a `role="group"` carrying
 * `aria-roledescription="اسلاید"` is announced as «اسلاید» instead of «group».
 * That is its whole purpose and it is a good one — until the element has no
 * accessible name, at which point the announcement is the roledescription and
 * NOTHING ELSE. Ten slides in a carousel are announced as «اسلاید»,
 * «اسلاید», «اسلاید» … with nothing to tell them apart and no count. The
 * attribute has made the element sound MORE described while making it less
 * navigable, and ARIA's own guidance is explicit that a roledescription
 * requires a name.
 *
 * Nothing else in this file can see it. `named-controls` cannot: `role="group"`
 * is not an interactive role and is correctly absent from `INTERACTIVE`.
 * `no-latin-aria` cannot: the value is perfectly good Persian. `resolved-idrefs`
 * cannot: there is no idref. The markup is valid and the defect is audible.
 *
 * ── WHAT IT CATCHES TODAY ─────────────────────────────────────────────────
 *
 * Measured on the export, 12 Aug 2026, all locales:
 *
 *     elements with aria-roledescription        216
 *     …that compute an empty accessible name     44   (22 fa, 22 en)
 *
 * All of them are `Carousel.Item` — 18 on `fa/components/carousel`, 18 on the
 * English twin, plus the two preview routes and `product-detail`. The
 * component's own `aria-roledescription` is right; what is missing is the slide
 * name, and AUDIT §4.2 already has "every slide computes a non-empty name" as a
 * Phase 4 exit criterion. This rule is that criterion, made checkable.
 *
 * ── IT GRADES EVERY LOCALE, DELIBERATELY ──────────────────────────────────
 *
 * Unlike the script and digit rules, this one has no early return for `en-US`.
 * An unnamed slide is exactly as unnavigable in English, and the export proves
 * the point: the finding is 22 and 22, a perfect mirror. A rule that graded
 * only the Persian half would have called the English carousel correct.
 */
export const namedRoledescription: Rule = {
  id: "named-roledescription",
  because:
    "aria-roledescription REPLACES the spoken role, so an element with one and no " +
    "accessible name is announced as the roledescription and nothing else — ten " +
    "slides all called «اسلاید», with nothing to tell them apart.",
  run: (doc) => {
    const v: Violation[] = [];
    for (const el of Array.from(doc.document.querySelectorAll("[aria-roledescription]"))) {
      if (el.closest?.('[aria-hidden="true"],[hidden]')) continue;
      const name = computeAccessibleName(el as unknown as HTMLElement, COMPUTED_STYLE_SHIM).trim();
      if (name) continue;
      v.push({
        rule: "named-roledescription",
        path: doc.path,
        detail:
          `aria-roledescription=${JSON.stringify(el.getAttribute("aria-roledescription") ?? "")} ` +
          `on a <${el.tagName.toLowerCase()}> with no accessible name. The roledescription ` +
          `replaces the role, so this element is announced as that word and nothing else.`,
        snippet: el.outerHTML.slice(0, 140),
      });
    }
    return v;
  },
};

export const RULES: Rule[] = [langDir, noLatinDigits, noLatinAria, namedControls, resolvedIdrefs, compositeTabStop, compositeSingleTabStop, nativeCalendar, uniqueIds, nativeScriptText, nativeScriptName, namedRoledescription];
