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
 */

/** Physical direction utilities that break under `dir="rtl"`. */
const PHYSICAL = [
  // spacing
  "m[lr]-", "p[lr]-", "-m[lr]-", "space-x-",
  // position
  "(?<![a-z-])(left|right)-", "-?(left|right)-",
  // borders and radii
  "border-[lr]-", "border-[lr]$", "rounded-[tb][lr]-", "rounded-[lr]-",
  // text and float
  "text-(left|right)", "float-(left|right)", "clear-(left|right)",
  // scroll
  "scroll-m[lr]-", "scroll-p[lr]-",
  // insets
  "inset-x-",
];

/**
 * Sanctioned escapes. `ltr:`/`rtl:` variants are direction-specific BY
 * INTENTION, and `data-[placement=…]` carve-outs describe a computed side rather
 * than a physical one.
 */
const ALLOWED_PREFIX = "(?:.*(?:ltr:|rtl:|data-\\[[^\\]]*\\]:))";

const physicalPattern = `^(?!${ALLOWED_PREFIX})(?:.*\\s)?(?:${PHYSICAL.join("|")})`;

export const lumoRules = {
  "no-restricted-syntax": [
    "error",
    {
      selector: `Literal[value=/${physicalPattern}/]`,
      message:
        "Physical direction utility. Use the logical equivalent (ms-/me-/ps-/pe-/start-/end-/" +
        "border-s/border-e/rounded-ss/text-start). One ml-2 in a shared component breaks Persian " +
        "in every project that copied it, and it looks correct in review.",
    },
    {
      selector: `TemplateElement[value.raw=/${physicalPattern}/]`,
      message: "Physical direction utility inside a template literal. Use the logical equivalent.",
    },
    {
      // The mechanical cure for {day.day} — the line that shipped 77/77 Latin
      // digit calendar cells on a Persian page.
      selector:
        "JSXExpressionContainer > BinaryExpression[operator='+'] > .left[typeAnnotation=undefined]" +
        ":matches(NumericLiteral, Literal[value=/^[0-9]+$/])",
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
