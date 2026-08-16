# lumo_ui_mobile — Lumo UI Mobile

The mobile UI component library of Lumo UI, in Flutter (decision §30, 17 Aug 2026: best in class per platform — web
stays Base UI + Tailwind + tokens; **mobile is Flutter**). Same contract as the
web library, in Dart:

- **Every announced string is a required named parameter.** `LumoIconButton(label:)`,
  `LumoSelect(closeLabel:)`, `LumoDialogTrigger(label:, closeLabel:)`; a
  `LumoSwitch` asserts it has a visible `label` or an `accessibilityLabel`. Dart's
  null-safety is the type-level guard, the constructor asserts the runtime one.
- **Direction from the locale**, never a flag: `LumoScope(locale:)` sets
  `Directionality`; every widget uses `AlignmentDirectional`/`EdgeInsetsDirectional`.
- **One token source**: `lib/src/tokens.g.dart` is GENERATED from
  `packages/theme/src/tokens.css` by `node scripts/build-flutter-tokens.mjs`;
  `pnpm run gate:flutter-tokens` fails when it is stale.
- **Formatted digits**: `formatNumber(n, locale)` through `intl` (Persian digits
  and separators). Dates: `intl` is Gregorian-only — Jalali is a Lumo utility
  to come, decided with the first date component.
- **Proof**: semantics-tree tests (`test/`) are the mobile counterpart of the
  served-HTML gate; `pnpm run gate:flutter` runs `flutter analyze` + `flutter test`.
  No screen-reader claims without runs.

## Consume (path A, a git dependency pinned to a tag)
```yaml
dependencies:
  lumo_ui_mobile:
    git:
      url: https://github.com/Telarsa/lumo-ui.git
      ref: v0.2.2          # a tag; every package moves together
      path: flutter/lumo_ui_mobile
```
Then `LumoScope(locale: 'fa-IR', brightness: …, child: …)` at the root of every
route (`MaterialApp.builder`), `theme: lumoThemeData(brightness: …)`, and the
widgets: `LumoButton`, `LumoIconButton`, `LumoSwitch`, `LumoTextField`,
`LumoSelect`, `LumoDialogTrigger`/`showLumoDialog`. Reference app:
`example-projects/lumo-app-flutter` (with the 2,000-row bench).

## Develop
Flutter is not on this machine's PATH: `export PATH=/opt/homebrew/share/flutter/bin:$PATH`.
`flutter pub get && flutter analyze && flutter test` here, or `pnpm run gate:flutter`
from the repo root (set `LUMO_SKIP_FLUTTER=1` only on a machine without Flutter,
and say so in the PR).
