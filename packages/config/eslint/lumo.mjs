/**
 * Lumo's lint rules — the mechanical half of the RTL and Persian contract.
 *
 * Every rule here exists because a real prototype shipped the defect it catches,
 * and every one is a `no-restricted-syntax` selector over string literals rather
 * than a plugin. That is deliberate: zero dependencies means a consuming repo
 * installs one file and gets the whole policy, and there is no plugin version to
 * drift.
 *
 * The known limit, stated rather than hidden: these selectors see STRING
 * LITERALS and template chunks. A class name assembled through a variable —
 * `"m" + side + "-4"` — is invisible to them, and to `shadcn migrate rtl` too.
 * That is why the HTML gate exists downstream; lint is the fast filter, not the
 * proof.
 *
 * ── 12 Aug 2026: the physical-utility rule was WIRED IN AND MEASURED ────────
 *
 * It had never been executed. The first real run over this repository produced
 * 37 physical-utility errors, of which 34 were PROSE — «right-click»,
 * «right-to-left», «bottom-right», and a dozen doc sentences that say
 * "text-start rather than text-left" precisely to teach the rule this file
 * states. Three were class strings, and all three were false positives too
 * (see `inset-x-` below). Net: the rule as written found nothing real and would
 * have taught every reader that lint output is noise.
 *
 * It also MISSED the dangerous direction. `after:-inset-x-2` and `md:ml-4` did
 * not match, because the old token boundary was `(?:.*\s)?` — literal
 * whitespace — so any Tailwind variant prefix hid the utility behind it. A rule
 * that fires on English prose and stays silent on `md:ml-4` is inverted.
 *
 * Two changes, both narrowing:
 *
 * 1. CONTEXT. These are CLASS rules, so they now only look inside class
 *    positions: a `className`/`classNames` JSX attribute, or an argument to
 *    `cva`/`cn`/`clsx`/`cx`/`tv`/`twMerge`/`twJoin` (360 `cn(` and 359 `cva(`
 *    call sites here — that is where classes live). Prose is invisible, which
 *    is right: a sentence about `text-left` is documentation, not a defect.
 *    The cost is stated: a class string parked in a bare `const` is now
 *    unseen. There were none in `packages/ui/src` or `packages/blocks/src` when
 *    this landed, verified by scanning every string literal in both trees.
 *
 * 2. TOKENS. The pattern now matches a whitespace-delimited CLASS TOKEN and
 *    skips over any variant prefixes on it, so `md:ml-4`, `after:-ml-2` and
 *    `group-hover:text-right` are caught, and the `ltr:`/`rtl:`/`data-[…]:`
 *    escape applies to the TOKEN that carries it rather than disabling the
 *    whole string it appears in.
 */

/**
 * Physical direction utilities that break under `dir="rtl"`.
 *
 * Every entry was compiled against the pinned tailwindcss 4.3.3 on 12 Aug 2026
 * and kept only if its output names a physical side. `ml-2` → `margin-left`,
 * `rounded-tl-md` → `border-top-left-radius`, `text-left` → `text-align: left`.
 *
 * TWO ENTRIES WERE REMOVED because that compile showed they are already
 * logical, and a rule that is factually wrong is worse than a missing one — it
 * spends the reader's trust:
 *
 *   inset-x-0   → `inset-inline: 0px`                    (not left/right)
 *   space-x-4   → `margin-inline-start` / `-end`         (not margin-left)
 *
 * `inset-x-` was the entry that flagged all three class-string hits in the
 * first run — `calendar.variants.ts:75` and `resizable.tsx:97-98`. The audit
 * called them "arguably false positives since inset-x-0 is symmetric". The
 * compiler says something stronger than symmetric: on Tailwind 4 the utility
 * does not emit `left`/`right` at all, and there is no logical replacement to
 * migrate those sites TO. So the rule changed, not the three call sites.
 * (`space-x-` was margin-left on Tailwind 3. If this repo ever moves back,
 * both entries come back with it.)
 *
 * Sign and token boundaries are handled by `TOKEN` below, so entries here are
 * written bare: no leading `-?`, no `^`, no `$`.
 */
const PHYSICAL = [
  // spacing
  "m[lr]-", "p[lr]-",
  // position
  "(?:left|right)-",
  // borders and radii. `border-[lr]` must not swallow `border-red-500`.
  "border-[lr](?![a-z])", "rounded-[tb][lr]-", "rounded-[lr]-",
  // text and float
  "text-(?:left|right)", "float-(?:left|right)", "clear-(?:left|right)",
  // scroll
  "scroll-m[lr]-", "scroll-p[lr]-",
];

/**
 * Sanctioned escapes. `ltr:`/`rtl:` variants are direction-specific BY
 * INTENTION, and `data-[placement=…]` carve-outs describe a computed side rather
 * than a physical one.
 *
 * Scoped to `\S*` — the token that carries the escape — so one `rtl:` class no
 * longer excuses every other class in the same string.
 */
const ALLOWED_PREFIX = "(?:ltr:|rtl:|data-\\[[^\\]]*\\]:)";

/**
 * One Tailwind class token: a whitespace boundary, no sanctioned escape on this
 * token, any number of variant prefixes (`md:`, `hover:`, `after:`,
 * `group-focus:`), an optional negative sign, then the utility.
 */
const physicalPattern =
  `(?:^|\\s)(?!\\S*${ALLOWED_PREFIX})(?:[^\\s:]+:)*-?(?:${PHYSICAL.join("|")})`;

/**
 * Where class strings live. A physical utility is only a defect in one of
 * these; everywhere else the same characters are prose.
 */
const CLASS_ATTRIBUTE = "JSXAttribute[name.name=/[Cc]lassNames?$/]";
const CLASS_CALL = "CallExpression[callee.name=/^(?:cva|cn|clsx|cx|tv|twMerge|twJoin)$/]";

export const lumoRules = {
  "no-restricted-syntax": [
    "error",
    {
      selector: `:matches(${CLASS_ATTRIBUTE}, ${CLASS_CALL}) Literal[value=/${physicalPattern}/]`,
      message:
        "Physical direction utility. Use the logical equivalent (ms-/me-/ps-/pe-/start-/end-/" +
        "border-s/border-e/rounded-ss/text-start). One ml-2 in a shared component breaks Persian " +
        "in every project that copied it, and it looks correct in review.",
    },
    {
      selector: `:matches(${CLASS_ATTRIBUTE}, ${CLASS_CALL}) TemplateElement[value.raw=/${physicalPattern}/]`,
      message: "Physical direction utility inside a template literal. Use the logical equivalent.",
    },
    {
      /*
       * A number literal rendered as a JSX CHILD.
       *
       * This selector matched NOTHING until 12 Aug 2026, which the first real
       * lint run exposed. Three faults, all in the same line:
       *
       *   `Literal[value=/…/]`  esquery only applies a regex to a STRING
       *                         attribute. A numeric literal's `value` is a
       *                         number, so the test was never even attempted;
       *                         `raw` is the string form and does match.
       *   `NumericLiteral`      a Babel node type. ESTree has no such node.
       *   `.left`               only the LEFT operand of a `+`, so `{n + 1}`
       *                         was invisible.
       *
       * It is also scoped now: `JSXExpressionContainer` alone includes
       * ATTRIBUTE values, where `maxLength={6}` is correct and common. Only a
       * child of a JSXElement/JSXFragment renders.
       *
       * The honest limit, since the old comment claimed more than the rule
       * could do: `{day.day}` is an identifier, and no selector can know it
       * holds a number. That case is cured by the TYPE — `children?: LumoNode`,
       * which does not accept `number` — and it is the type, not this rule,
       * that CONTRIBUTING.md should be read as promising.
       */
      selector:
        ":matches(JSXElement, JSXFragment) > JSXExpressionContainer > Literal[raw=/^[0-9]/], " +
        ":matches(JSXElement, JSXFragment) > JSXExpressionContainer > BinaryExpression > " +
        "Literal[raw=/^[0-9]/]",
      message:
        "A raw number in JSX renders Latin digits. Format it: formatNumber(value, locale) from " +
        "@lumo-ui/core, or <Num value={…} />.",
    },
    {
      // <html lang> must come from LumoHtml, which derives dir from the locale.
      selector: "JSXOpeningElement[name.name='html']",
      message:
        "Do not write <html> directly. Use <LumoHtml lang={locale}> from @lumo-ui/core, which " +
        "derives dir from Intl.Locale.getTextInfo() so a wrong direction is unrepresentable. " +
        "A prototype shipped <html lang=\"en\"> on 55 Persian pages this way.",
    },
    {
      // Intl called without an explicit locale silently uses the HOST's locale,
      // which is the developer's machine in dev and the server's in production.
      selector:
        ":matches(NewExpression, CallExpression)[callee.object.object.name='Intl'], " +
        "NewExpression[callee.object.name='Intl'][arguments.length=0]",
      message:
        "Intl without an explicit locale uses the host locale, not the user's. Use formatNumber/" +
        "formatDate from @lumo-ui/core, which pass FORMAT_LOCALE (with -u-ca-persian-nu-arabext).",
    },
  ],
};

/** Flat-config fragment a consuming repo can spread into its own config. */
export default [
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    rules: lumoRules,
  },
  {
    // Tests and fixtures deliberately contain the defects they assert against.
    files: ["**/*.test.{ts,tsx}", "**/fixtures/**", "**/*.type-test.tsx"],
    rules: { "no-restricted-syntax": "off" },
  },
];
