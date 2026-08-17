import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'scope.dart';
import 'tokens.g.dart';

/// One destination of a navigation surface — the bottom bar and the drawer
/// share it, as the web's sidebar and navigation-menu share their item shape.
///
/// `id` is what the surface reports; `label` is REQUIRED — it is the visible
/// text AND the announced name (an icon is not a name, which is the whole
/// reason `LumoNavigationBar` exists rather than a `Row` of icon buttons).
/// `selectedIcon` is the filled twin drawn while the destination is current
/// (Material's `NavigationDestination.selectedIcon`); `badge` is a
/// PRE-FORMATTED String — the app ran `formatNumber(n, locale)`, because a raw
/// `int` painted into a Persian bar would show Latin digits.
class LumoNavigationItem {
  const LumoNavigationItem({required this.id, required this.label, this.icon, this.selectedIcon, this.badge, this.isDisabled = false});
  /// A stable identity for this item — used for selection and equality, never shown or announced.
  final String id;
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// Decoration in the leading slot; the label carries the meaning.
  final Widget? icon;
  /// Drawn instead of [icon] while this destination is the current one.
  final Widget? selectedIcon;
  /// A count, already formatted for the reader's digits. Announced WITH the name.
  final String? badge;
  /// Whether the control is disabled.
  final bool isDisabled;
}

/// The bottom tab bar: N equal columns, one per destination, laid out by a
/// `Row` — so the FIRST destination sits at the reading start (the RIGHT under
/// fa-IR) and the whole bar mirrors without a single physical offset.
///
/// `label` is REQUIRED: the bar is one `navigation` landmark and an unnamed one
/// announces as bare "navigation". Controlled (`value` + `onChanged`) or
/// uncontrolled (`defaultValue`, else the first item) — the same pair as
/// `LumoTabs` and the web's `value`/`defaultValue`.
///
/// TWO indicator shapes, because the two references disagree and both are
/// right. `LumoNavigationBarIndicator.pill` is Material's `NavigationBar` and
/// forui's `FBottomNavigationBar`: a rounded pill drawn UNDER the icon (behind
/// it, in z-order), the label under the icon. `mark` is what the Khroos app
/// hand-rolled in `KTabBar` (`khroos/shell/shell.dart`): a short accent bar
/// across the TOP of the destination, the icon and label taking the accent
/// colour rather than sitting on it. The pill is the default because it is what
/// `LumoTabs`'s `pill` variant already draws, so the library's selected states
/// look like one decision; an app with Khroos's chrome asks for `mark` and gets
/// its bar back to the pixel. Either way the SELECTED ICON LIFTS a hair
/// (`AnimatedSlide`, the gesture `KTabBar` uses to answer a press).
///
/// That a real app had to hand-roll all of this — the per-item badge, the
/// active mark, the icon lift, the safe-area inset — is why this family exists.
///
/// Semantics: the bar is a `navigation` container named by `label`; every
/// destination is ONE button node with `selected` and `enabled`, its visible
/// copy excluded so the name is heard once. A badge is folded INTO that name
/// («پیام‌ها (۳)») rather than left as a second node beside it — a floating
/// «۳» a reader meets on its own says nothing, which is what `KTabBar` had
/// already worked out.
///
/// Safe-area aware at the bottom: the bar reserves the home indicator's inset,
/// never less than 8 logical pixels.
enum LumoNavigationBarIndicator {
  /// Material 3 / forui: a rounded pill behind the selected icon.
  pill,

  /// Khroos's `KTabBar`: a short bar across the top of the selected destination.
  mark,
}

class LumoNavigationBar extends StatefulWidget {
  const LumoNavigationBar({super.key, required this.label, required this.items, this.value, this.defaultValue, this.onChanged, this.indicator = LumoNavigationBarIndicator.pill, this.isDisabled = false});

  /// Announced name of the navigation landmark. Required.
  final String label;
  /// The items to show, in reading order.
  final List<LumoNavigationItem> items;

  /// The current destination's id (controlled).
  final String? value;

  /// The first-frame destination's id (uncontrolled).
  final String? defaultValue;
  /// Called with the new value when the user changes it. Omitting it makes the control read-only.
  final ValueChanged<String>? onChanged;

  /// Which selected-state shape the bar draws.
  final LumoNavigationBarIndicator indicator;
  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  State<LumoNavigationBar> createState() => _LumoNavigationBarState();
}

class _LumoNavigationBarState extends State<LumoNavigationBar> {
  late String? _uncontrolled = widget.defaultValue;

  String get _current => widget.value ?? _uncontrolled ?? widget.items.first.id;

  void _select(String id) {
    if (id == _current) return;
    if (widget.value == null) setState(() => _uncontrolled = id);
    widget.onChanged?.call(id);
  }

  /// How a cramped bar gives ground, in the house order (`segmented_control.dart`
  /// `_fit()`): the indicator pill's inline padding shrinks FIRST, down to 4, so
  /// the widest label keeps as much room as the column can give it before any
  /// word is cut. Only when a bare label will not fit does it ellipsize — at
  /// that width the honest outcome. Unbounded width takes the base padding.
  double _pillPadding(BuildContext context, double maxWidth) {
    const base = 12.0;
    if (!maxWidth.isFinite || widget.items.isEmpty) return base;
    final per = maxWidth / widget.items.length;
    final style = DefaultTextStyle.of(context).style.copyWith(fontSize: 11, fontWeight: FontWeight.w500);
    var widest = 0.0;
    for (final i in widget.items) {
      final tp = TextPainter(text: TextSpan(text: i.label, style: style), textDirection: Directionality.of(context), maxLines: 1)..layout();
      widest = math.max(widest, tp.width);
    }
    return ((per - widest - 0.5) / 2).clamp(4.0, base);
  }

  @override
  Widget build(BuildContext context) {
    // Not a constructor assert: `List.length` is not constant-evaluable and the widget stays `const`-constructible.
    assert(widget.items.isNotEmpty, 'LumoNavigationBar needs at least one destination.');
    final c = LumoScope.of(context).colours;
    final safeBottom = MediaQuery.paddingOf(context).bottom;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label,
      role: SemanticsRole.navigation,
      child: DecoratedBox(
        decoration: BoxDecoration(color: c.surface, border: Border(top: BorderSide(color: c.border))),
        child: Padding(
          // Block-axis insets only: `top`/`bottom` do not mirror, there is nothing logical to say here.
          padding: EdgeInsets.only(top: 6, bottom: math.max(8, safeBottom)),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final padding = _pillPadding(context, constraints.maxWidth);
              return Row(
                children: [
                  for (final item in widget.items)
                    Expanded(
                      child: _Destination(
                        item: item,
                        isSelected: item.id == _current,
                        isDisabled: widget.isDisabled || item.isDisabled,
                        indicator: widget.indicator,
                        pillPadding: padding,
                        onTap: () => _select(item.id),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _Destination extends StatelessWidget {
  const _Destination({required this.item, required this.isSelected, required this.isDisabled, required this.indicator, required this.pillPadding, required this.onTap});
  final LumoNavigationItem item;
  final bool isSelected;
  final bool isDisabled;
  final LumoNavigationBarIndicator indicator;
  final double pillPadding;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    // «Reduce motion» is the platform's answer, not a parameter of ours: the
    // indicator still MOVES to the selected destination, it just arrives at
    // once. Same spelling as `disclosure.dart` and `card.dart`.
    final motion = MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 150);
    final pill = indicator == LumoNavigationBarIndicator.pill;
    // On the pill the icon sits ON the accent; on the mark the icon IS the accent —
    // Khroos's `KTabBar` colours the active glyph `k.primary` and draws no fill.
    final iconColour = isSelected ? (pill ? c.accentFg : c.accent) : c.fgMuted;
    final labelColour = isSelected ? (pill ? c.fg : c.accent) : c.fgMuted;
    final glyph = (isSelected ? item.selectedIcon : null) ?? item.icon;
    return Semantics(
      button: true,
      selected: isSelected,
      enabled: !isDisabled,
      // The badge rides the NAME: a count announced as its own node is a bare number.
      label: item.badge == null ? item.label : '${item.label} (${item.badge})',
      child: Opacity(
        opacity: isDisabled ? 0.5 : 1,
        child: InkWell(
          onTap: isDisabled ? null : onTap,
          canRequestFocus: !isDisabled,
          borderRadius: BorderRadius.circular(LumoRadius.md),
          // The name is announced above; the visible copy is excluded so it is heard ONCE.
          child: ExcludeSemantics(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!pill) ...[
                    // Khroos's top mark: a short accent bar across the TOP of the
                    // active destination. Always in the layout (transparent when
                    // idle), so nothing shifts when the selection moves.
                    AnimatedContainer(
                      duration: motion,
                      curve: Curves.easeOut,
                      width: 22,
                      height: 3,
                      decoration: BoxDecoration(color: isSelected ? c.accent : Colors.transparent, borderRadius: BorderRadius.circular(LumoRadius.full)),
                    ),
                    const SizedBox(height: 6),
                  ],
                  Stack(
                    clipBehavior: Clip.none,
                    alignment: Alignment.center,
                    children: [
                      // The active indicator: a pill UNDER the icon (behind it), the
                      // shape Material's NavigationBar draws, in Lumo's accent. On the
                      // `mark` shape the fill is transparent and only the icon lifts.
                      AnimatedContainer(
                        duration: motion,
                        curve: Curves.easeOut,
                        height: 28,
                        padding: EdgeInsetsDirectional.symmetric(horizontal: pill ? pillPadding : 0),
                        decoration: BoxDecoration(color: isSelected && pill ? c.accent : Colors.transparent, borderRadius: BorderRadius.circular(LumoRadius.full)),
                        alignment: Alignment.center,
                        // The selected glyph rises a hair — `KTabBar`'s AnimatedSlide,
                        // a block-axis move, so there is nothing to mirror.
                        child: AnimatedSlide(
                          offset: isSelected ? const Offset(0, -0.04) : Offset.zero,
                          duration: motion,
                          curve: Curves.easeOut,
                          child: IconTheme.merge(
                            data: IconThemeData(size: 20, color: iconColour),
                            child: glyph ?? const SizedBox(width: 20, height: 20),
                          ),
                        ),
                      ),
                      if (item.badge != null)
                        // The count, at the inline END top of the icon — `end` is left in Persian, and nothing here says so.
                        PositionedDirectional(
                          top: -1,
                          end: 0,
                          child: Container(
                            constraints: const BoxConstraints(minWidth: 16),
                            height: 16,
                            padding: const EdgeInsetsDirectional.symmetric(horizontal: 4),
                            decoration: BoxDecoration(color: c.critical, borderRadius: BorderRadius.circular(LumoRadius.full), border: Border.all(color: c.surface, width: 1.5)),
                            alignment: Alignment.center,
                            child: Text(item.badge!, style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, height: 1, color: c.bg)),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Padding(
                    padding: const EdgeInsetsDirectional.symmetric(horizontal: 2),
                    child: Text(
                      item.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 11, height: 1.2, fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400, color: labelColour),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
