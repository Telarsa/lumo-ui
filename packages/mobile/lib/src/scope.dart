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
  Widget wrap(Widget child) => LumoScope(locale: locale, brand: brand, brightness: brightness, light: brightness == Brightness.light ? colours : null, dark: brightness == Brightness.dark ? colours : null, child: child);
}

/// The root of a Lumo tree — the counterpart of `LumoNativeProvider` /
/// `LumoProvider`: `locale` is any BCP-47 tag; direction is DERIVED (there is no
/// `dir` parameter anywhere in Lumo); the scheme follows `brightness`.
///
/// A consumer's palette: `light` / `dark` replace the scheme's colours (the
/// mobile counterpart of overriding `--lumo-sys-*` custom properties on the
/// web — build them with `lightColours(brand).copyWith(accent: …)`); `brand`
/// alone turns hue and chroma on the generated ramps.
class LumoScope extends StatelessWidget {
  const LumoScope({super.key, required this.locale, required this.child, this.brand = LumoBrand.achromatic, this.brightness, this.light, this.dark});
  final String locale;
  final Widget child;
  final LumoBrand brand;
  /// Pin a scheme; default follows the platform.
  final Brightness? brightness;
  /// The light scheme's colours, if not the generated defaults for `brand`.
  final LumoSchemeColours? light;
  /// The dark scheme's colours, if not the generated defaults for `brand`.
  final LumoSchemeColours? dark;

  static LumoScopeData of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<_LumoInherited>();
    assert(scope != null, 'A Lumo widget was built outside LumoScope.');
    return scope!.data;
  }

  @override
  Widget build(BuildContext context) {
    final b = brightness ?? MediaQuery.maybePlatformBrightnessOf(context) ?? Brightness.light;
    final colours = b == Brightness.dark ? (dark ?? darkColours(brand)) : (light ?? lightColours(brand));
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


/// How a control answers a finger.
///
/// Material's default is a RIPPLE: a circle that grows from the touch point,
/// plus a highlight that lingers while the finger is down. It is a strong,
/// recognisably Material gesture, and it is not Lumo's — the web library
/// answers a press with an immediate flat change of fill, and the two platforms
/// should not feel like different products.
///
/// So Lumo picks [tint] by default and says so here rather than inheriting a
/// decision from the widget layer underneath. A consumer who WANTS the platform
/// gesture asks for [ripple]; one who wants nothing asks for [none].
enum LumoPressFeedback {
  /// No overlay at all. The control still changes state; nothing animates.
  none,

  /// Lumo's own: the surface takes the `surfaceHover` tint the instant the
  /// finger lands, and drops it when it lifts. No travelling circle, no
  /// lingering bloom — the same immediate answer the web library gives.
  tint,

  /// Material's ripple, for an app that wants to feel native to Android.
  ripple,
}

/// A Material `ThemeData` from the Lumo tokens — so Material's own widgets under
/// a `MaterialApp` (scaffold, dialogs, ink) wear the same palette. Their system,
/// our tokens: `ColorScheme` mapped from `--lumo-sys-*`.
ThemeData lumoThemeData({required Brightness brightness, LumoBrand brand = LumoBrand.achromatic, String? fontFamily, LumoSchemeColours? colours, LumoPressFeedback pressFeedback = LumoPressFeedback.tint}) {
  final c = colours ?? (brightness == Brightness.dark ? darkColours(brand) : lightColours(brand));
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
  // Press feedback is set on the THEME, not per widget: every `InkWell` in the
  // library reads these three, so one decision reaches all of them and a
  // consumer cannot end up with a rippling switch beside a flat button (which
  // is exactly what happened while `LumoButton` alone cleared its overlay).
  final tint = pressFeedback == LumoPressFeedback.none ? Colors.transparent : c.surfaceHover;
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: c.bg,
    fontFamily: fontFamily,
    visualDensity: VisualDensity.standard,
    splashFactory: pressFeedback == LumoPressFeedback.ripple ? InkRipple.splashFactory : NoSplash.splashFactory,
    // With NoSplash the splash colour is never painted; naming it transparent
    // keeps that true if a consumer swaps the factory back.
    splashColor: pressFeedback == LumoPressFeedback.ripple ? tint : Colors.transparent,
    highlightColor: tint,
    hoverColor: tint,
    focusColor: tint,
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
