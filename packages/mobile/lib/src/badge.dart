import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

enum LumoBadgeTone { neutral, accent, positive, critical, caution }
/// `solid` and `subtle` are the web's names; `outline` is the mobile addition
/// (a quiet marker on a photo or a coloured surface).
enum LumoBadgeVariant { solid, subtle, outline }
enum LumoBadgeSize { sm, md }

/// A status marker — the web `Badge`: `label` REQUIRED and a String (the web's
/// `children` is `LumoNode`, so a bare count is a type error there; here the
/// String is the type-level guard — a count is passed already formatted with
/// `formatNumber`). `tone` × `variant`, two sizes; a plain text node for the
/// reader (no live region: one would re-announce every badge at load, and no
/// button — a badge is not pressable). `LumoBadge.dot` is the count form: a
/// round `solid` pill for «۳» unread, still a formatted String.
///
/// **`size` is the mobile addition** (the web `Badge` is `text-xs px-2 py-0.5`
/// and nothing else): `md` IS that web scale, `sm` is the denser step for a
/// badge riding inside a list row or a tab label, where the web's only badge
/// slot is beside body copy. `variant.outline` is the second addition — a quiet
/// marker on a photo or an already-coloured surface, which the web has no slot
/// for. `tone` and the `solid`/`subtle` treatments are the web's, verbatim.
///
/// **Cramped behaviour.** Given a bounded width the badge SHEDS ITS ICON before
/// it touches the words — `segmented_control.dart`'s `_fit()`, the house
/// pattern — and only ellipsizes the label when even the bare label does not
/// fit. It ellipsizes rather than wrapping because a badge is a fixed-height
/// pill (the web's `whitespace-nowrap`) and a second line would break the row
/// it rides in; nothing is LOST by that truncation, because the announced name
/// is the `Semantics` label above the drawing and always carries the full
/// string. Given an unbounded width — a badge in a `Row` with no `Flexible`,
/// the ordinary case — it keeps the icon and grows, exactly as `w-fit` does.
/// Before this, a long label made the inner `Row` overflow: measured «گزارش
/// عملکرد سه‌ماههٔ چهارم شرکت» + an icon at 320 dp = "A RenderFlex overflowed
/// by 82 pixels".
class LumoBadge extends StatelessWidget {
  const LumoBadge({super.key, required this.label, this.icon, this.tone = LumoBadgeTone.neutral, this.variant = LumoBadgeVariant.subtle, this.size = LumoBadgeSize.md}) : _dot = false;

  /// The count form: a round pill, `solid` by construction, `label` the
  /// already-formatted count (`formatNumber(3, locale)` → «۳»).
  const LumoBadge.dot({super.key, required this.label, this.tone = LumoBadgeTone.accent, this.size = LumoBadgeSize.md})
      : icon = null,
        variant = LumoBadgeVariant.solid,
        _dot = true;

  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// A leading icon (decorative; the label names the badge).
  final Widget? icon;
  /// The semantic tone the colour carries.
  final LumoBadgeTone tone;
  /// The visual variant.
  final LumoBadgeVariant variant;
  /// The size step, from the shared control scale.
  final LumoBadgeSize size;
  final bool _dot;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final toneColour = switch (tone) {
      LumoBadgeTone.neutral => c.fgMuted,
      LumoBadgeTone.accent => c.accent,
      LumoBadgeTone.positive => c.positive,
      LumoBadgeTone.critical => c.critical,
      LumoBadgeTone.caution => c.caution,
    };
    // Solid fills use `bg`, not white: the status tokens swap lightness between
    // schemes and `bg` swaps with them; the accent has its own `accentFg`.
    final solidFg = tone == LumoBadgeTone.accent ? c.accentFg : c.bg;
    final (Color bg, Color fg, Color border) = switch (variant) {
      LumoBadgeVariant.solid => (toneColour, solidFg, Colors.transparent),
      LumoBadgeVariant.subtle => tone == LumoBadgeTone.neutral
          ? (c.surfaceSunken, c.fgMuted, c.border)
          // The web's `bg-accent/10 border-accent/25`: the token at reduced alpha.
          : (toneColour.withValues(alpha: 0.10), toneColour, toneColour.withValues(alpha: 0.25)),
      LumoBadgeVariant.outline => (Colors.transparent, toneColour, tone == LumoBadgeTone.neutral ? c.borderStrong : toneColour),
    };
    final sm = size == LumoBadgeSize.sm;
    final height = sm ? 18.0 : 22.0;
    final hPad = _dot ? (sm ? 4.0 : 6.0) : (sm ? 6.0 : 8.0);
    final iconSide = sm ? 10.0 : 12.0;
    final style = TextStyle(fontSize: sm ? 11 : 12, fontWeight: FontWeight.w500, height: 1, color: fg);
    return Semantics(
      label: label,
      child: ExcludeSemantics(
        // The badge's own incoming constraints are what `_fit` reads; the
        // builder shrink-wraps to its child, so an unbounded badge is the same
        // pill it always was.
        child: LayoutBuilder(builder: (context, constraints) {
          final fit = _fit(context, constraints.maxWidth, style, hPad, iconSide);
          final text = Text(label, maxLines: 1, softWrap: false, overflow: TextOverflow.ellipsis, style: style);
          return Container(
            height: height,
            constraints: BoxConstraints(minWidth: _dot ? height : 0),
            padding: EdgeInsetsDirectional.symmetric(horizontal: hPad),
            decoration: BoxDecoration(color: bg, border: Border.all(color: border), borderRadius: BorderRadius.circular(_dot ? 999 : LumoRadius.sm)),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              spacing: 4,
              children: [
                if (fit.showIcon) IconTheme(data: IconThemeData(size: iconSide, color: fg), child: icon!),
                // `Flexible` only where the width is bounded: a flex child under
                // unbounded constraints is a layout error, not a narrow badge.
                if (fit.constrain) Flexible(child: text) else text,
              ],
            ),
          );
        }),
      ),
    );
  }

  /// Decoration first, words last — `segmented_control.dart`'s `_fit()`. Returns
  /// whether the icon still earns its place, and whether the label needs to be
  /// flexible (i.e. whether there is a finite width to be flexible within).
  ({bool showIcon, bool constrain}) _fit(BuildContext context, double maxWidth, TextStyle style, double hPad, double iconSide) {
    if (!maxWidth.isFinite) return (showIcon: icon != null, constrain: false);
    if (icon == null) return (showIcon: false, constrain: true);
    final tp = TextPainter(text: TextSpan(text: label, style: style), textDirection: Directionality.of(context), maxLines: 1)..layout();
    // 2 for the hairline on both sides, then the padding, then the label.
    final room = maxWidth - 2 - 2 * hPad - tp.width;
    // The icon plus the 4px gap that follows it.
    return (showIcon: room >= iconSide + 4, constrain: true);
  }
}
