import 'dart:ui' show lerpDouble;

import 'package:flutter/foundation.dart' show listEquals, mapEquals;
import 'package:flutter/material.dart';

import 'button.dart';
import 'card.dart';
import 'item.dart';

part 'styles.g.dart';

/// **The per-widget customisation surface**, one style object per FAMILY FILE,
/// carried on `ThemeData` the way Flutter carries every other design system's:
/// `lumoThemeData(styles: LumoStyles(...))`, read back with `LumoStyles.of`.
///
/// Every field of every style object is NULLABLE and means "leave this alone".
/// A widget resolves each one as `style.x ?? <the value that was hard-coded
/// here>`, so a consumer who supplies nothing gets the current look exactly —
/// not a re-typed copy of it that can drift.
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
  const LumoStyles({this.button = const LumoButtonStyle(), this.card = const LumoCardStyle(), this.item = const LumoItemStyle()});

  /// The styles a Lumo widget under this context should wear: the `LumoStyles`
  /// on the theme, or the library's own when a consumer supplied none. Never
  /// null and never asserts — a Lumo widget outside a `Theme` still draws.
  static LumoStyles of(BuildContext context) => Theme.of(context).extension<LumoStyles>() ?? const LumoStyles();

  /// Appearance of the button family — `LumoButton`, `LumoIconButton`.
  @override
  final LumoButtonStyle button;

  /// Appearance of the card family — `LumoCard`, `LumoCardHeader`, `LumoCardFooter`.
  @override
  final LumoCardStyle card;

  /// Appearance of the item family — `LumoItem`, `LumoItemGroup`, `LumoListBox`.
  @override
  final LumoItemStyle item;
}

/// Appearance of `LumoButton` and `LumoIconButton`. Every field is an override:
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

/// Appearance of `LumoItem`, `LumoItemGroup` and `LumoListBox`.
class LumoItemStyle with _$LumoItemStyle {
  const LumoItemStyle({
    this.gap,
    this.inlinePadding,
    this.blockPadding,
    this.minHeight,
    this.borderRadius,
    this.background,
    this.selectedBackground,
    this.pressedBackground,
    this.borderColour,
    this.borderWidth,
    this.titleTextStyle,
    this.descriptionTextStyle,
    this.textGap,
    this.iconTheme,
    this.chevronColour,
    this.chevronSize,
    this.dividerColour,
    this.dividerThickness,
    this.disabledOpacity,
    this.groupLabelTextStyle,
    this.groupLabelGap,
    this.groupGap,
    this.listPadding,
    this.listGap,
    this.emptyTextStyle,
    this.selectedIconColour,
  });

  /// Inline gap between a row's slots, per size step. Omitted steps keep 10 / 14.
  @override
  final Map<LumoItemSize, double>? gap;

  /// Padding on the inline axis, per size step. Omitted steps keep 12 / 16.
  @override
  final Map<LumoItemSize, double>? inlinePadding;

  /// Padding on the block axis, per size step. Omitted steps keep 10 / 14.
  @override
  final Map<LumoItemSize, double>? blockPadding;

  /// A FLOOR under a row's height — it can only GROW the row. The resolution
  /// takes the larger of this and the 44 px platform floor, so nothing set here
  /// can make a row a smaller touch target than the device run demands.
  @override
  final double? minHeight;

  /// Corner radius. Null keeps `LumoRadius.md`.
  @override
  final BorderRadiusGeometry? borderRadius;

  /// Fill per variant. Omitted variants keep the token fill.
  @override
  final Map<LumoItemVariant, Color>? background;

  /// Fill of a SELECTED row. Null keeps `surfaceSunken`. Selection is announced
  /// as state as well, so a colour is never the only thing carrying it.
  @override
  final Color? selectedBackground;

  /// Fill while the finger is down. Null keeps `surfaceHover`.
  @override
  final Color? pressedBackground;

  /// The frame an `outlined` row draws. Null keeps `border`.
  @override
  final Color? borderColour;

  /// The frame's width, and the divider's default. Null keeps 1.
  @override
  final double? borderWidth;

  /// The title's type, merged over 14 / w500 / 1.375.
  @override
  final TextStyle? titleTextStyle;

  /// The description's type, merged over 14 / 1.5 in `fgMuted`.
  @override
  final TextStyle? descriptionTextStyle;

  /// Block gap between the title and the description. Null keeps 2.
  @override
  final double? textGap;

  /// Size and colour of the leading and trailing slots' icons, merged over 16
  /// in `fgMuted`.
  @override
  final IconThemeData? iconTheme;

  /// Colour of the «go» chevron. Null keeps `fgSubtle`. The GLYPH is not
  /// settable: `Icons.chevron_right` carries `matchTextDirection`, and one that
  /// does not would point the wrong way the moment the app is read in Persian.
  @override
  final Color? chevronColour;

  /// Size of the «go» chevron. Null keeps 16.
  @override
  final double? chevronSize;

  /// The hairline under a row and between grouped rows. Null keeps `border`.
  @override
  final Color? dividerColour;

  /// The hairline's thickness. Null keeps 1.
  @override
  final double? dividerThickness;

  /// Opacity of a disabled row or list. Null keeps 0.5.
  @override
  final double? disabledOpacity;

  /// A group's section header type, merged over 12 / w500 in `fgSubtle`.
  @override
  final TextStyle? groupLabelTextStyle;

  /// Block gap under a group's section header. Null keeps 8.
  @override
  final double? groupLabelGap;

  /// Block gap between rows in a group that draws no dividers. Null keeps 8.
  @override
  final double? groupGap;

  /// Padding around a list box's options. Null keeps 4 on all sides.
  @override
  final EdgeInsetsGeometry? listPadding;

  /// Block gap between a list box's options. Null keeps 2.
  @override
  final double? listGap;

  /// The empty message's type, merged over 14 in `fgMuted`.
  @override
  final TextStyle? emptyTextStyle;

  /// Colour of the check on a selected option. Null keeps `accent`.
  @override
  final Color? selectedIconColour;
}
