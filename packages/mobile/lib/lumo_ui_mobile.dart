/// Lumo UI for Flutter — the correctness layer, and no components.
///
/// Material owns the widgets. This package owns the four things Material has no
/// opinion about, all of which a Persian-first product gets wrong by default:
///
/// - **Direction from the locale.** `LumoScope(locale:)` sets `Directionality`,
///   so a layout mirrors because the language changed and not because someone
///   remembered to flip a flag.
/// - **One token source.** `tokens.g.dart` is GENERATED from
///   `packages/theme/src/tokens.css`, the same file the web reads;
///   `pnpm run gate:flutter-tokens` fails when it is stale. `lumoThemeData`
///   binds those tokens into Material's own `ColorScheme`, so a plain
///   `FilledButton` is already the right colour.
/// - **Native digits and the Jalali calendar.** `formatNumber(n, locale)` and
///   `formatLumoDate(date, locale)`. Flutter's `intl` is Gregorian-only, which
///   is the single largest gap on this platform.
/// - **A grader.** `package:lumo_ui_mobile/testing.dart` walks the semantics
///   tree — what the platform hands a screen reader — and applies the same
///   rules the web gate applies to served bytes.
///
/// **The widget roster was retired in 0.3.0** (decision §53). It was 73 files
/// and 21,326 lines re-implementing what Material already ships, and keeping it
/// on par was work that bought nothing a consumer could not get upstream. Apps
/// pinned to v0.2.6 still have it; apps on 0.3.0 own their components, which is
/// how the web side has always worked with shadcn. A consumer's copies live in
/// its own `lib/<app>/ui/` and read every token, style and scope type from here.
library;

export 'src/format.dart';
export 'src/jalali.dart';
export 'src/latn.dart';
export 'src/scope.dart';
export 'src/styles.dart';
export 'src/tokens.g.dart';
