import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// The web's four steps, to the pixel: `size-6`/`size-8`/`size-10`/`size-14`.
enum LumoAvatarSize { sm, md, lg, xl }

/// `circle` is the web's look — `avatarVariants` is `rounded-full` at every
/// size and has no shape axis at all. `rounded` is the MOBILE ADDITION: a phone
/// list row showing organisations (a bank, a shop) rather than people wants a
/// squircle, because a circular logo reads as a person; the web's avatar slots
/// are all people. `LumoRadius.md`, the same corner a small tile takes.
enum LumoAvatarShape { circle, rounded }

/// What the presence dot means, in the product's terms; `statusLabel` says it
/// in words (WCAG 1.4.1 — colour alone says nothing). Colours: online → positive,
/// busy → critical, offline → muted foreground.
///
/// These are PRESENCE names where the web's `avatarStatusVariants` uses the
/// status ramp's colour names (`positive`/`critical`/`neutral`/`caution`) — a
/// dot on a person means a state, not a severity, and «آنلاین» is what the
/// `statusLabel` has to say anyway. The web's fourth tone, `caution`, has NO
/// counterpart here: the amber "away" step is a gap, not a decision.
enum LumoAvatarStatus { online, offline, busy }

const _side = {LumoAvatarSize.sm: 24.0, LumoAvatarSize.md: 32.0, LumoAvatarSize.lg: 40.0, LumoAvatarSize.xl: 56.0};
const _font = {LumoAvatarSize.sm: 10.0, LumoAvatarSize.md: 12.0, LumoAvatarSize.lg: 14.0, LumoAvatarSize.xl: 18.0};
const _dot = {LumoAvatarSize.sm: 8.0, LumoAvatarSize.md: 10.0, LumoAvatarSize.lg: 12.0, LumoAvatarSize.xl: 14.0};

/// The fallback glyphs for a name: the first letter of the first two words,
/// joined by a ZERO-WIDTH NON-JOINER so Arabic-script letters keep their
/// isolated forms («س‌م», not the cursive «سم») while Latin initials stay
/// «KN». No upper-casing: Arabic script has no letter case.
String lumoInitials(String label) {
  final words = label.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty).take(2);
  return words.map((w) => String.fromCharCode(w.runes.first)).join('\u200c');
}

/// A person or organisation, as a picture or as initials — the web `Avatar`.
/// `label` is REQUIRED: the name, announced (`Semantics(image: true)`), and the
/// source of the initials shown when there is no `image` (or behind it while
/// it loads). A `status` needs a `statusLabel` (asserted): the dot sits at the
/// inline-END bottom corner (`PositionedDirectional`, so bottom-LEFT in
/// Persian) and its meaning is announced after the name — person, then state,
/// as one node.
class LumoAvatar extends StatelessWidget {
  const LumoAvatar({super.key, required this.label, this.image, this.size = LumoAvatarSize.md, this.shape = LumoAvatarShape.circle, this.status, this.statusLabel})
      : assert(status == null || statusLabel != null, 'An avatar with a `status` needs a `statusLabel` — the state in words.');
  /// The name of who or what this is. Announced; the initials come from it.
  final String label;
  final ImageProvider? image;
  final LumoAvatarSize size;
  final LumoAvatarShape shape;
  final LumoAvatarStatus? status;
  /// What the dot MEANS, e.g. «آنلاین». Required with `status`.
  final String? statusLabel;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final side = _side[size]!;
    final radius = shape == LumoAvatarShape.circle ? BorderRadius.circular(side) : BorderRadius.circular(LumoRadius.md);
    final circle = Container(
      width: side,
      height: side,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(color: c.surfaceSunken, borderRadius: radius, border: Border.all(color: c.border)),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Center(child: Text(lumoInitials(label), style: TextStyle(fontSize: _font[size], fontWeight: FontWeight.w500, color: c.fgMuted))),
          if (image != null) Image(image: image!, fit: BoxFit.cover),
        ],
      ),
    );
    final dotColour = switch (status) {
      LumoAvatarStatus.online => c.positive,
      LumoAvatarStatus.busy => c.critical,
      LumoAvatarStatus.offline => c.fgMuted,
      null => Colors.transparent,
    };
    // MergeSemantics: one node — the name (image), then the status word.
    return MergeSemantics(
      child: Semantics(
        image: true,
        label: label,
        child: SizedBox(
          width: side,
          height: side,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              ExcludeSemantics(child: circle),
              if (status != null)
                PositionedDirectional(
                  end: 0,
                  bottom: 0,
                  child: Semantics(
                    label: statusLabel,
                    child: Container(
                      width: _dot[size],
                      height: _dot[size],
                      // A 2px ring in the page colour: the cut-out against the portrait.
                      decoration: BoxDecoration(color: dotColour, shape: BoxShape.circle, border: Border.all(color: c.bg, width: 2)),
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
