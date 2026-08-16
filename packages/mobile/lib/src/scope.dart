import 'package:flutter/material.dart';
import 'tokens.g.dart';

/// Right-to-left languages by primary subtag (CLDR characterOrder) — the same
/// table `@lumo-ui/core` falls back to. Flutter's own localizations know the
/// direction of the languages they carry; this covers any BCP-47 tag.
const _rtlPrimary = {'ar', 'arc', 'ckb', 'dv', 'fa', 'he', 'iw', 'khw', 'ks', 'ku', 'nqo', 'ps', 'rhg', 'sd', 'syr', 'ug', 'ur', 'yi'};

TextDirection directionOf(String locale) =>
    _rtlPrimary.contains(locale.toLowerCase().split(RegExp('[-_]')).first) ? TextDirection.rtl : TextDirection.ltr;

/// What every Lumo widget reads: locale, direction, the scheme's colours.
class LumoScopeData {
  const LumoScopeData({required this.locale, required this.direction, required this.colours, required this.brand, required this.brightness});
  final String locale;
  final TextDirection direction;
  final LumoSchemeColours colours;
  final LumoBrand brand;
  final Brightness brightness;

  /// Re-provide this scope in a NEW ROUTE (dialog, sheet): routes are built above
  /// the widget that opened them, so an inherited scope does not reach them —
  /// the same reason a route needs its own `Directionality`.
  Widget wrap(Widget child) => LumoScope(locale: locale, brand: brand, brightness: brightness, child: child);
}

/// The root of a Lumo tree — the counterpart of `LumoNativeProvider` /
/// `LumoProvider`: `locale` is any BCP-47 tag; direction is DERIVED (there is no
/// `dir` parameter anywhere in Lumo); the scheme follows `brightness`.
class LumoScope extends StatelessWidget {
  const LumoScope({super.key, required this.locale, required this.child, this.brand = LumoBrand.achromatic, this.brightness});
  final String locale;
  final Widget child;
  final LumoBrand brand;
  /// Pin a scheme; default follows the platform.
  final Brightness? brightness;

  static LumoScopeData of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<_LumoInherited>();
    assert(scope != null, 'A Lumo widget was built outside LumoScope.');
    return scope!.data;
  }

  @override
  Widget build(BuildContext context) {
    final b = brightness ?? MediaQuery.maybePlatformBrightnessOf(context) ?? Brightness.light;
    final colours = b == Brightness.dark ? darkColours(brand) : lightColours(brand);
    final direction = directionOf(locale);
    return _LumoInherited(
      data: LumoScopeData(locale: locale, direction: direction, colours: colours, brand: brand, brightness: b),
      child: Directionality(textDirection: direction, child: child),
    );
  }
}

class _LumoInherited extends InheritedWidget {
  const _LumoInherited({required this.data, required super.child});
  final LumoScopeData data;
  @override
  bool updateShouldNotify(_LumoInherited old) => old.data.locale != data.locale || old.data.colours != data.colours;
}

/// A Material `ThemeData` from the Lumo tokens — so Material's own widgets under
/// a `MaterialApp` (scaffold, dialogs, ink) wear the same palette. Their system,
/// our tokens: `ColorScheme` mapped from `--lumo-sys-*`.
ThemeData lumoThemeData({required Brightness brightness, LumoBrand brand = LumoBrand.achromatic, String? fontFamily}) {
  final c = brightness == Brightness.dark ? darkColours(brand) : lightColours(brand);
  final scheme = ColorScheme(
    brightness: brightness,
    primary: c.accent,
    onPrimary: c.accentFg,
    secondary: c.fgMuted,
    onSecondary: c.bg,
    error: c.critical,
    onError: c.bg,
    surface: c.surface,
    onSurface: c.fg,
    outline: c.borderControl,
    outlineVariant: c.border,
    surfaceContainerHighest: c.surfaceSunken,
    onSurfaceVariant: c.fgMuted,
    scrim: c.scrim,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: c.bg,
    fontFamily: fontFamily,
    visualDensity: VisualDensity.standard,
    dialogTheme: DialogThemeData(backgroundColor: c.surface, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(LumoRadius.lg))),
    inputDecorationTheme: InputDecorationTheme(
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(LumoRadius.md), borderSide: BorderSide(color: c.borderControl)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(LumoRadius.md), borderSide: BorderSide(color: c.borderControl)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(LumoRadius.md), borderSide: BorderSide(color: c.focus, width: LumoFocus.width)),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(LumoRadius.md), borderSide: BorderSide(color: c.critical)),
      focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(LumoRadius.md), borderSide: BorderSide(color: c.critical, width: LumoFocus.width)),
      fillColor: c.surface,
      filled: true,
    ),
  );
}
