import 'package:flutter/material.dart';
import 'button.dart';
import 'scope.dart';

/// The screen header: a leading slot (a back button, or the caller's own
/// widget), the title, and actions at the inline end.
///
/// `title` is REQUIRED and is announced as a `header` — the node a reader jumps
/// to when it asks for the headings of a screen. `onBack` brings `backLabel`
/// with it (asserted): a chevron is a shape, not a name, and «Back» is the
/// English default this library exists to prevent.
///
/// The back chevron is DIRECTIONAL. It is `Icons.chevron_left`, whose
/// `IconData.matchTextDirection` is true, so the `Icon` widget mirrors the
/// glyph itself under an RTL `Directionality` — back points LEFT in English and
/// RIGHT in Persian, because "back" is the way the reading order came from.
/// (The Khroos app hand-rolled this as `AppHeader` and had to hard-code
/// `chevron-right`, since its icon set is a name table with no direction in it.
/// That hard-coding is the defect this widget removes.)
///
/// Implements `PreferredSizeWidget`, so it drops straight into
/// `Scaffold(appBar:)` — where the Scaffold adds the status-bar inset and this
/// widget's own `SafeArea` consumes it — and it works equally as the first
/// child of a `Column`, which is how Khroos used its hand-rolled twin.
///
/// Not Material's `AppBar`: that widget builds a `BackButton` whose tooltip and
/// announced name come from `MaterialLocalizations.backButtonTooltip` («Back»),
/// English no parameter of ours reaches — the same defect as the Material route
/// helpers `gate:flutter-contract` fails the build on.
class LumoAppBar extends StatelessWidget implements PreferredSizeWidget {
  const LumoAppBar({super.key, required this.title, this.subtitle, this.leading, this.onBack, this.backLabel, this.actions, this.centerTitle})
    : assert(onBack == null || backLabel != null, 'A back button needs a backLabel — a chevron is not a name.'),
      assert(leading == null || onBack == null, 'The leading slot holds the back button or your own widget, not both.');

  /// The screen's name. Required, and announced as a header.
  final String title;

  /// A second line under the title — a place, a count, a state.
  final String? subtitle;

  /// The caller's own leading widget, when the slot is not a back button.
  final Widget? leading;

  /// Pressing the back chevron. Requires [backLabel].
  final VoidCallback? onBack;

  /// Announced name of the back chevron. REQUIRED when [onBack] is set.
  final String? backLabel;

  /// Controls at the inline END — already-named widgets (`LumoIconButton`).
  final List<Widget>? actions;

  /// Centre the title. Defaults to centring only when there is a back button —
  /// the shape Khroos's `AppHeader` settled on, and iOS's own.
  final bool? centerTitle;

  static const double _bar = 56;
  static const double _barWithSubtitle = 64;

  @override
  Size get preferredSize => Size.fromHeight((subtitle == null ? _bar : _barWithSubtitle) + 1);

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final centred = centerTitle ?? (onBack != null);
    final titleColumn = Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: centred ? CrossAxisAlignment.center : CrossAxisAlignment.start,
      children: [
        Semantics(
          header: true,
          child: Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: centred ? TextAlign.center : TextAlign.start,
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, height: 1.3, color: c.fg),
          ),
        ),
        if (subtitle != null)
          Text(
            subtitle!,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: centred ? TextAlign.center : TextAlign.start,
            style: TextStyle(fontSize: 12, height: 1.3, color: c.fgMuted),
          ),
      ],
    );
    final leadingSlot = onBack != null
        ? LumoIconButton(
            label: backLabel!,
            size: LumoButtonSize.lg,
            onPressed: onBack,
            // `matchTextDirection` on this IconData is what mirrors the glyph — the
            // direction is read from `Directionality`, never from a flag of ours.
            child: Icon(Icons.chevron_left, size: 24, color: c.fg),
          )
        : leading;
    final trailingSlot = (actions == null || actions!.isEmpty) ? null : Row(mainAxisSize: MainAxisSize.min, spacing: 4, children: actions!);
    return SafeArea(
      bottom: false,
      child: DecoratedBox(
        decoration: BoxDecoration(color: c.surface, border: Border(bottom: BorderSide(color: c.border))),
        child: SizedBox(
          height: subtitle == null ? _bar : _barWithSubtitle,
          child: Padding(
            padding: const EdgeInsetsDirectional.symmetric(horizontal: 8),
            // `NavigationToolbar` is Flutter's own three-slot row and it lays the
            // slots out by `Directionality` — leading at the reading START (right
            // under fa-IR), trailing at the END. Nothing here names an edge.
            child: NavigationToolbar(
              leading: leadingSlot,
              middle: titleColumn,
              trailing: trailingSlot,
              centerMiddle: centred,
              middleSpacing: 12,
            ),
          ),
        ),
      ),
    );
  }
}
