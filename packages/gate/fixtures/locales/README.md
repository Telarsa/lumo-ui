# `fixtures/locales/` — the parametrisation fixtures

The files one directory up are the RULE poison: exactly one per rule, and the
self-test asserts that set matches `RULES` with no orphans. Adding a locale
fixture there would look like an orphaned rule, so locale fixtures live here.

These grade the same rules against a SECOND non-Latin-numbering locale. They
exist because a parametrisation with one instantiation is indistinguishable from
a hardwire: the digit rules read `Doc.digits` now, and the only proof that they
read it — rather than still grepping a Persian range that happens to be right —
is a page whose digits are natively something else.

The pair that carries the argument is the crossed one:

- `ar-SA.persian-digits.bad.html` — correct Arabic prose, numbered in Persian
  digits. Contains no Latin digit, so `no-latin-digits` is silent; it fails the
  floor, because U+06F0–U+06F9 is not what an Arabic reader's digits are.
- `fa-IR.arabic-indic-digits.bad.html` — the mirror. Proves the Persian floor was
  parametrised, not widened to "any Arabic-script digit" — the vacuous check this
  rule's own `because` field criticises in a sibling project.
