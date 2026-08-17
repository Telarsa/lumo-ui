import 'package:flutter/material.dart';
import 'format.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// WHICH MEANING the tile carries — the library's one status ramp, the same
/// five names as `LumoBadgeTone`.
enum LumoIconTileTone { neutral, accent, positive, critical, caution }

/// HOW FILLED — the same two names and the same treatments as the badge's.
enum LumoIconTileVariant { subtle, solid }

/// The tile's edge-length step (the web `size-8` / `size-10` / `size-12`).
enum LumoIconTileSize { sm, md, lg }

/// The tile's corner. `rounded` is the web's `rounded-lg`; `circle` is the
/// mobile addition — a round tile beside a list row is the phone idiom and the
/// web has no slot that needs it.
enum LumoIconTileShape { rounded, circle }

const _tileSide = {LumoIconTileSize.sm: 32.0, LumoIconTileSize.md: 40.0, LumoIconTileSize.lg: 48.0};

/// An icon in a tinted square — the thing at the top of a feature card, or
/// beside a list row. The web `IconTile`.
///
/// **DECORATIVE BY DEFAULT.** `accessibilityLabel` is null unless the tile is
/// the SOLE carrier of its meaning, and when it is null the tile is removed
/// from the semantics tree entirely (`ExcludeSemantics` — the web's
/// `aria-hidden="true"`, not a nameless node). A tile sitting beside its own
/// label — the icon next to «احراز هویت» in a settings row, next to a card's
/// heading — IS decorative: naming it makes a reader hear the same fact twice,
/// and «icon» is not a fact at all. Name it only when there is no text.
///
/// The icon is a Widget, sized by the tile to HALF its edge (the web's
/// `[&>svg]:size-1/2`) through `IconTheme`, and coloured by the tone pair; a
/// widget that is not an `Icon` should read `IconTheme.of(context)` itself.
class LumoIconTile extends StatelessWidget {
  const LumoIconTile({
    super.key,
    required this.icon,
    this.accessibilityLabel,
    this.tone = LumoIconTileTone.neutral,
    this.variant = LumoIconTileVariant.subtle,
    this.size = LumoIconTileSize.md,
    this.shape = LumoIconTileShape.rounded,
  });

  /// The glyph. Sized and coloured by the tile.
  final Widget icon;

  /// A name, ONLY when the tile is the sole carrier of meaning. Null = decorative.
  final String? accessibilityLabel;

  /// The semantic tone the colour carries.
  final LumoIconTileTone tone;
  /// The visual variant.
  final LumoIconTileVariant variant;
  /// The size step, from the shared control scale.
  final LumoIconTileSize size;
  /// The shape variant.
  final LumoIconTileShape shape;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final side = _tileSide[size]!;
    final toneColour = switch (tone) {
      LumoIconTileTone.neutral => c.fgMuted,
      LumoIconTileTone.accent => c.accent,
      LumoIconTileTone.positive => c.positive,
      LumoIconTileTone.critical => c.critical,
      LumoIconTileTone.caution => c.caution,
    };
    // Lifted from `badge.dart`, which lifted it from `badgeVariants`: the solid
    // fills use `bg`, not white, because the status tokens swap lightness
    // between schemes and `bg` swaps with them; the accent has its own pair.
    final (Color bg, Color fg) = switch (variant) {
      LumoIconTileVariant.solid => (
          toneColour,
          tone == LumoIconTileTone.accent ? c.accentFg : c.bg,
        ),
      LumoIconTileVariant.subtle => tone == LumoIconTileTone.neutral
          ? (c.surfaceSunken, c.fgMuted)
          : (toneColour.withValues(alpha: 0.10), toneColour),
    };

    final tile = Container(
      width: side,
      height: side,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: bg,
        shape: shape == LumoIconTileShape.circle ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: shape == LumoIconTileShape.circle ? null : BorderRadius.circular(LumoRadius.lg),
      ),
      child: IconTheme(data: IconThemeData(size: side / 2, color: fg), child: icon),
    );

    // Named → a real image with a name. Unnamed → gone from the tree. No third state.
    if (accessibilityLabel == null) return ExcludeSemantics(child: tile);
    return Semantics(
      container: true,
      image: true,
      label: accessibilityLabel,
      child: ExcludeSemantics(child: tile),
    );
  }
}

/// The member-chip diameter step (the web `size-6` / `size-8` / `size-10`).
enum LumoIconStackSize { sm, md, lg }

const _stackSide = {LumoIconStackSize.sm: 24.0, LumoIconStackSize.md: 32.0, LumoIconStackSize.lg: 40.0};

/// Overlapping avatars or icons with a «+۲» for the rest — the web `IconStack`.
///
/// ONE fact, ONE name: the whole stack is a single named image node and the
/// members carry no names of their own, because "سارا، رضا، مینا، و ۲ نفر دیگر"
/// read out one chip at a time is noise, not information. `label` is REQUIRED
/// for that reason (the web requires it too); `overflowLabel(remaining)` is
/// optional and, when given, is appended to that one name — it is not a second
/// node.
///
/// The overlap is `-ms-2` on the web: a LOGICAL inline offset, so the deck
/// leans the reader's way. Here it is `PositionedDirectional`, which mirrors the
/// same way — under fa-IR the FIRST member is on the right and each next one
/// tucks under it to the left. The «+N» goes through `formatNumber` with the
/// scope's locale («+۲», never «+2»); the web takes the locale as a prop, the
/// mobile scope already has it.
class LumoIconStack extends StatelessWidget {
  const LumoIconStack({
    super.key,
    required this.label,
    required this.items,
    this.max = 4,
    this.overflowLabel,
    this.size = LumoIconStackSize.md,
  });

  /// What the stack MEANS, e.g. «۵ عضو». REQUIRED — the members are silent beneath it.
  final String label;

  /// The members, in reading order. Each is clipped to the step's circle.
  final List<Widget> items;

  /// How many to show before the rest collapse into a count.
  final int max;

  /// Says the remainder in words, e.g. `(n) => '$n نفر دیگر'`. Appended to `label`.
  final String Function(int remaining)? overflowLabel;

  /// The size step, from the shared control scale.
  final LumoIconStackSize size;

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final side = _stackSide[size]!;
    // The web's `-ms-2` against `size-8`: a quarter of the step, at every step.
    final overlap = side / 4;
    final step = side - overlap;
    final shown = items.take(max).toList();
    final remaining = items.length - shown.length;
    final chips = shown.length + (remaining > 0 ? 1 : 0);

    Widget ringed(Widget child) => Container(
          width: side,
          height: side,
          // `ring-2 ring-bg`: the cut-out that separates one member from the next.
          decoration: BoxDecoration(shape: BoxShape.circle, color: c.bg, border: Border.all(color: c.bg, width: 2)),
          child: ClipOval(child: child),
        );

    return Semantics(
      container: true,
      image: true,
      label: [label, if (remaining > 0 && overflowLabel != null) overflowLabel!(remaining)].join('\n'),
      child: ExcludeSemantics(
        child: SizedBox(
          width: chips == 0 ? 0 : (chips - 1) * step + side,
          height: side,
          child: Stack(
            children: [
              for (var i = 0; i < shown.length; i++)
                PositionedDirectional(start: i * step, top: 0, child: ringed(shown[i])),
              if (remaining > 0)
                PositionedDirectional(
                  start: shown.length * step,
                  top: 0,
                  child: ringed(
                    ColoredBox(
                      color: c.surfaceSunken,
                      child: Center(
                        // Through `formatNumber`, never a bare `$remaining`.
                        child: Text(
                          '+${formatNumber(remaining, scope.locale)}',
                          style: TextStyle(
                            fontSize: side * 0.34,
                            fontWeight: FontWeight.w500,
                            color: c.fgMuted,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
