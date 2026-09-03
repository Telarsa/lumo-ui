import 'dart:ui' show lerpDouble;

import 'package:flutter/foundation.dart' show listEquals, mapEquals;
import 'package:flutter/material.dart';

part 'styles.g.dart';

// THE STYLE VOCABULARY.
//
// These three enums key the maps below, so they belong to the style layer
// rather than to the widgets that happen to read them. They lived in
// `button.dart`, `card.dart` and `item.dart` until 31 Aug 2026, which made
// `styles.dart` import three widget files to name its own keys — a
// dependency pointing the wrong way, and the one thing standing between the
// token layer and shipping on its own. A consumer found it by vendoring the
// button: its copy re-declared the enums, and every `s.background?[variant]`
// in the copy silently indexed the theme's map with a type that could never
// match a key. The analyzer called that `collection_methods_unrelated_type`
// and it would have compiled to a null, i.e. to the fallback colour.

enum LumoButtonVariant { solid, outline, ghost, critical }

enum LumoButtonSize { sm, md, lg }

/// The frame treatment. `sunken` (a filled card on `surfaceSunken`) stands where
/// the web has `plain`: on mobile a bare card inside a bordered container reads
/// as no card at all, and a sunken fill is the mobile idiom for that slot.
/// `outline` is the web's `outlined`, spelled the way every other mobile
/// variant enum in this package spells it (`LumoBadgeVariant.outline`,
/// `LumoButtonVariant.outline`, `LumoAlertVariant.outline`) — same treatment,
/// one letter, and consistency inside the package wins over the web's spelling.
enum LumoCardVariant { outline, elevated, sunken }

/// **The appearance surface a consumer's own components read**, carried on
/// `ThemeData` the way Flutter carries every other design system's:
/// `lumoThemeData(styles: LumoStyles(...))`, read back with `LumoStyles.of`.
///
/// Every field is NULLABLE and means "leave this alone". A component resolves
/// each one as `style.x ?? <its own value>`, so supplying nothing renders
/// exactly what it rendered before — not a re-typed copy of it that can drift.
///
/// Until 0.3.0 the components reading this were Lumo's own. They are the
/// consumer's now, which changes who the audience is and nothing about the
/// mechanism: `LumoStyles.of(context).button` is the same call in a consumer's
/// own `AppButton` that it was in `LumoButton`.
///
/// Precedence, lowest to highest: the library's own value, `LumoStyles` on the
/// theme, the `style:` argument at the call site (`merge`d, so the two combine
/// rather than one replacing the other).
///
/// It rides on the THEME and not on `LumoScope` for two reasons. `Theme` sits
/// above the `Navigator`, so a dialog or a sheet inherits it without the
/// re-provision `LumoScopeData.wrap` exists for; and `ThemeData.lerp` is what
/// calls the `lerp` that `ThemeExtension` demands, so that method is
/// load-bearing rather than a requirement satisfied and never used. The one
/// trap: put it on `MaterialApp.theme`, above the navigator — a `Theme`
/// inserted below one does not reach a route.
///
/// **A style object carries APPEARANCE ONLY.** It cannot remove an announced
/// string, flip direction or change a semantic role, and that is a fact about
/// its TYPES, not a promise: `scripts/build-mobile-styles.mjs` can only emit
/// `lerp` for a colour, a length, a weight, a type, a shadow, a duration or a
/// per-step map of those, and a field of any other type fails the build with
/// the reason. `String` never gets in, so a name cannot live here; `Widget`
/// never does, so a slot cannot; `IconData` is refused by name, because
/// `Icons.chevron_right` carries `matchTextDirection` and an arbitrary glyph
/// does not.
class LumoStyles extends ThemeExtension<LumoStyles> with _$LumoStyles {
  const LumoStyles({this.button = const LumoButtonStyle(), this.card = const LumoCardStyle()});

  /// The styles a Lumo widget under this context should wear: the `LumoStyles`
  /// on the theme, or the library's own when a consumer supplied none. Never
  /// null and never asserts — a component outside a `Theme` still draws.
  static LumoStyles of(BuildContext context) => Theme.of(context).extension<LumoStyles>() ?? const LumoStyles();

  /// Appearance of the button family.
  @override
  final LumoButtonStyle button;

  /// Appearance of the card family.
  ///
  /// TWO families, where there were three, and the survivors were chosen by
  /// evidence rather than by taste: a family stays only while a consumer's own
  /// component resolves it. One Flutter consumer's `AppButton` reads `.button`;
  /// the other's `AppCard` reads `.card`. `LumoItemStyle` styled `LumoItem`, which 0.3.0
  /// does not ship and which neither app vendored, so it went.
  ///
  /// That is what this surface is FOR now: a consumer's own component taking
  /// its appearance from the shared theme instead of from a fork of a Lumo
  /// widget. The first pass at this retirement dropped `.card` too, on the
  /// grounds that nothing read it — true only because the second Flutter
  /// consumer had not been migrated yet, and its vendored card said otherwise
  /// an hour later.
  @override
  final LumoCardStyle card;
}

/// Appearance of `LumoCard`, `LumoCardHeader` and `LumoCardFooter`.
class LumoCardStyle with _$LumoCardStyle {
  const LumoCardStyle({
    this.padding,
    this.borderRadius,
    this.background,
    this.pressedBackground,
    this.borderColour,
    this.borderWidth,
    this.shadow,
    this.pressDuration,
    this.disabledOpacity,
    this.titleTextStyle,
    this.descriptionTextStyle,
    this.headerGap,
    this.headerDescriptionGap,
    this.headerActionGap,
    this.footerGap,
    this.footerActionGap,
    this.footerRuleColour,
  });

  /// Padding inside the surface, used when the call site gives none. Null keeps
  /// 16 on all sides.
  @override
  final EdgeInsetsGeometry? padding;

  /// Corner radius. Null keeps `LumoRadius.lg`.
  @override
  final BorderRadiusGeometry? borderRadius;

  /// Fill per variant. Omitted variants keep the token fill — `surfaceSunken`
  /// for `sunken`, `surface` for the rest.
  @override
  final Map<LumoCardVariant, Color>? background;

  /// Fill while the finger is down, every variant. Null keeps `surfaceHover`.
  @override
  final Color? pressedBackground;

  /// The frame's colour. Null keeps `border`. `sunken` draws no frame at any
  /// colour — the fill is what separates it.
  @override
  final Color? borderColour;

  /// The frame's width, and the footer rule's. Null keeps 1.
  @override
  final double? borderWidth;

  /// The shadow an `elevated` card casts. Null keeps `LumoShadow.raised`, which
  /// carries a separate DARK ramp; a hand-picked list here is one alpha for both
  /// schemes, and on a dark page that is close to painting nothing.
  @override
  final List<BoxShadow>? shadow;

  /// How long the press fill cross-fades. Null keeps 80ms. «Reduce motion»
  /// still wins: the platform collapses this to zero whatever it says.
  @override
  final Duration? pressDuration;

  /// Opacity of a disabled card. Null keeps 0.5.
  @override
  final double? disabledOpacity;

  /// The header title's type, MERGED over 16 / w600 / 1.4 — the fields it leaves
  /// null keep the default, so the app's own face still reaches the title.
  @override
  final TextStyle? titleTextStyle;

  /// The header description's type, merged over 14 in `fgMuted`.
  @override
  final TextStyle? descriptionTextStyle;

  /// Block-end gap under the header. Null keeps 12.
  @override
  final double? headerGap;

  /// Block gap between the header's title and its description. Null keeps 4.
  @override
  final double? headerDescriptionGap;

  /// Inline gap between the header's text and its action. Null keeps 16.
  @override
  final double? headerActionGap;

  /// Block gap above and below the footer's rule. Null keeps 12.
  @override
  final double? footerGap;

  /// Gap between footer actions, on both axes. Null keeps 8.
  @override
  final double? footerActionGap;

  /// The footer's block-start rule. Null keeps `border`.
  @override
  final Color? footerRuleColour;
}

/// Appearance of a button. Every field is an override:
/// null keeps the library's value, and a map keeps the library's value for each
/// step or variant it does not mention.
class LumoButtonStyle with _$LumoButtonStyle {
  const LumoButtonStyle({
    this.height,
    this.inlinePadding,
    this.fontSize,
    this.fontWeight,
    this.borderRadius,
    this.background,
    this.pressedBackground,
    this.foreground,
    this.borderColour,
    this.borderWidth,
    this.disabledOpacity,
    this.minTapTarget,
  });

  /// Drawn height per size step, in logical pixels. A step this map omits keeps
  /// the shared control scale (`LumoControl.sm/md/lg` — 29 / 36 / 44).
  @override
  final Map<LumoButtonSize, double>? height;

  /// Padding on the inline axis (start and end together) per size step. Omitted
  /// steps keep 12 / 16 / 24.
  @override
  final Map<LumoButtonSize, double>? inlinePadding;

  /// Label size per size step. Omitted steps keep 14 / 14 / 16.
  @override
  final Map<LumoButtonSize, double>? fontSize;

  /// Label weight. Null keeps `FontWeight.w500`. The FAMILY is never a style
  /// object's to set: it comes from the app's typography, always.
  @override
  final FontWeight? fontWeight;

  /// Corner radius. Null keeps `LumoRadius.md`.
  @override
  final BorderRadiusGeometry? borderRadius;

  /// Fill per variant, at rest. Omitted variants keep the token fill.
  @override
  final Map<LumoButtonVariant, Color>? background;

  /// Fill per variant while the finger is down. Omitted variants keep the
  /// token's «hover» fill, which is what a press takes across this library.
  @override
  final Map<LumoButtonVariant, Color>? pressedBackground;

  /// Label colour per variant. Omitted variants keep the token foreground.
  @override
  final Map<LumoButtonVariant, Color>? foreground;

  /// Border colour per variant. Omitted variants keep `borderControl` on
  /// `outline` and a transparent edge everywhere else.
  @override
  final Map<LumoButtonVariant, Color>? borderColour;

  /// Border width. Null keeps 1.
  @override
  final double? borderWidth;

  /// Opacity of a disabled button. Null keeps 0.5.
  @override
  final double? disabledOpacity;

  /// A FLOOR under `LumoIconButton`'s hit area, in logical pixels — it can only
  /// GROW the target. The resolution takes the largest of this, the drawn size
  /// and the 44 px platform floor, so nothing set here can shrink a touch
  /// target below what the device run measured (docs/evidence/mobile-device.md).
  @override
  final double? minTapTarget;
}

