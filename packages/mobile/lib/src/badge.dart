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
class LumoBadge extends StatelessWidget {
  const LumoBadge({super.key, required this.label, this.icon, this.tone = LumoBadgeTone.neutral, this.variant = LumoBadgeVariant.subtle, this.size = LumoBadgeSize.md}) : _dot = false;

  /// The count form: a round pill, `solid` by construction, `label` the
  /// already-formatted count (`formatNumber(3, locale)` → «۳»).
  const LumoBadge.dot({super.key, required this.label, this.tone = LumoBadgeTone.accent, this.size = LumoBadgeSize.md})
      : icon = null,
        variant = LumoBadgeVariant.solid,
        _dot = true;

  final String label;
  /// A leading icon (decorative; the label names the badge).
  final Widget? icon;
  final LumoBadgeTone tone;
  final LumoBadgeVariant variant;
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
    return Semantics(
      label: label,
      child: ExcludeSemantics(
        child: Container(
          height: height,
          constraints: BoxConstraints(minWidth: _dot ? height : 0),
          padding: EdgeInsetsDirectional.symmetric(horizontal: _dot ? (sm ? 4 : 6) : (sm ? 6 : 8)),
          decoration: BoxDecoration(color: bg, border: Border.all(color: border), borderRadius: BorderRadius.circular(_dot ? 999 : LumoRadius.sm)),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            spacing: 4,
            children: [
              if (icon != null) IconTheme(data: IconThemeData(size: sm ? 10 : 12, color: fg), child: icon!),
              Text(label, maxLines: 1, style: TextStyle(fontSize: sm ? 11 : 12, fontWeight: FontWeight.w500, height: 1, color: fg)),
            ],
          ),
        ),
      ),
    );
  }
}
