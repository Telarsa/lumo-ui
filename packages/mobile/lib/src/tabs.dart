import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'scope.dart';
import 'tokens.g.dart';

enum LumoTabsVariant { underline, pill }

/// One tab: `id` is the key its panel is matched to; `label` is REQUIRED — the
/// tab's visible text and its announced name (an icon is not a name). `badge`
/// is a pre-formatted String (the app ran `formatNumber`), announced as the
/// tab's value.
class LumoTab {
  const LumoTab({required this.id, required this.label, this.icon, this.badge, this.isDisabled = false});
  /// A stable identity for this item — used for selection and equality, never shown or announced.
  final String id;
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// A leading icon. Decorative — it is not announced, so it never carries meaning on its own.
  final Widget? icon;
  /// A short count or marker shown on the tab.
  final String? badge;
  /// Whether the control is disabled.
  final bool isDisabled;
}

/// Tabs — the web `Tabs`/`TabList`/`Tab`/`TabPanel` as one self-contained
/// widget: `label` REQUIRED (an unnamed tab list announces as bare "tab list"),
/// the tabs in reading order (a `Row`, so the FIRST tab sits at the RIGHT
/// under fa-IR), the active indicator under the selected tab, moving along
/// the inline axis because each tab paints its own — nothing here is
/// positioned by a physical offset. Controlled (`value` + `onChanged`) or
/// uncontrolled (`defaultValue`, else the first tab — the web derives the same
/// default). Panels come from `views` (by id) or `builder` (the selected id);
/// only the selected panel is built, in an `AnimatedSwitcher` — no
/// `DefaultTabController`, no `TabBarView`, no swipe (a swipe is physical).
///
/// Semantics: the list is a `tabBar` group named by `label`; every tab is a
/// `tab` with `selected`, `enabled`, its name announced ONCE (the visible text
/// is excluded); the panel is a `tabPanel`.
///
/// Motion: the panel cross-fade, the pill fill and the underline all collapse
/// to `Duration.zero` under `MediaQuery.disableAnimationsOf` — a tab switch
/// under «Reduce motion» is one frame, not a quick one.
class LumoTabs extends StatefulWidget {
  const LumoTabs({super.key, required this.label, required this.tabs, this.value, this.defaultValue, this.onChanged, this.views, this.builder, this.variant = LumoTabsVariant.underline, this.isScrollable = false, this.isDisabled = false})
      : assert(views == null || builder == null, 'Give the panels as `views` or as `builder`, not both.');
  /// Announced name of the tab list. Required.
  final String label;
  /// The tabs, in reading order.
  final List<LumoTab> tabs;
  /// The selected tab's id (controlled).
  final String? value;
  /// The selected tab's id (uncontrolled).
  final String? defaultValue;
  /// Called with the new value when the user changes it. Omitting it makes the control read-only.
  final ValueChanged<String>? onChanged;
  /// The panel per tab id.
  final Map<String, WidgetBuilder>? views;
  /// The panel for the selected id, when the panels are not a fixed map.
  final Widget Function(BuildContext context, String selectedId)? builder;
  /// The visual variant.
  final LumoTabsVariant variant;
  /// Scroll the tab list along the inline axis instead of squeezing the tabs.
  final bool isScrollable;
  /// Whether the whole tab set is disabled.
  final bool isDisabled;

  @override
  State<LumoTabs> createState() => _LumoTabsState();
}

class _LumoTabsState extends State<LumoTabs> {
  late String _selected = widget.value ?? widget.defaultValue ?? widget.tabs.first.id;

  String get _current => widget.value ?? _selected;

  void _select(String id) {
    if (id == _current) return;
    if (widget.value == null) setState(() => _selected = id);
    widget.onChanged?.call(id);
  }

  @override
  Widget build(BuildContext context) {
    // Not a constructor assert: `List.length` is not constant-evaluable, and the widget must stay `const`-constructible.
    assert(widget.tabs.isNotEmpty, 'LumoTabs needs at least one tab.');
    final c = LumoScope.of(context).colours;
    // «Reduce motion» is the platform's answer, not a parameter of ours — the
    // same spelling as `disclosure.dart`.
    final motion = !MediaQuery.disableAnimationsOf(context);
    final selectedTab = widget.tabs.where((t) => t.id == _current).firstOrNull ?? widget.tabs.first;
    final tabRow = Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label,
      role: SemanticsRole.tabBar,
      child: Row(
        mainAxisSize: widget.isScrollable ? MainAxisSize.min : MainAxisSize.max,
        children: [
          for (final t in widget.tabs)
            widget.isScrollable
                ? _TabButton(tab: t, isSelected: t.id == _current, isDisabled: widget.isDisabled || t.isDisabled, variant: widget.variant, onTap: () => _select(t.id))
                : Expanded(child: _TabButton(tab: t, isSelected: t.id == _current, isDisabled: widget.isDisabled || t.isDisabled, variant: widget.variant, onTap: () => _select(t.id))),
        ],
      ),
    );
    final panel = widget.views != null ? widget.views![_current]?.call(context) : widget.builder?.call(context, _current);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        DecoratedBox(
          // The underline variant's hairline; the pill variant has no rule under its list.
          decoration: BoxDecoration(border: widget.variant == LumoTabsVariant.underline ? Border(bottom: BorderSide(color: c.border)) : null),
          child: widget.isScrollable
              // The scroll view starts at the reading start (its axis direction follows Directionality); the tabBar node sits INSIDE it so its children are the tabs.
              ? SingleChildScrollView(scrollDirection: Axis.horizontal, child: tabRow)
              : tabRow,
        ),
        if (panel != null)
          Semantics(
            container: true,
            role: SemanticsRole.tabPanel,
            label: selectedTab.label,
            explicitChildNodes: true,
            child: AnimatedSwitcher(
              duration: motion ? const Duration(milliseconds: 120) : Duration.zero,
              child: KeyedSubtree(key: ValueKey(_current), child: panel),
            ),
          ),
      ],
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({required this.tab, required this.isSelected, required this.isDisabled, required this.variant, required this.onTap});
  final LumoTab tab;
  final bool isSelected;
  final bool isDisabled;
  final LumoTabsVariant variant;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final pill = variant == LumoTabsVariant.pill;
    final motion = !MediaQuery.disableAnimationsOf(context);
    final fg = pill && isSelected ? c.accentFg : (isSelected ? c.fg : c.fgMuted);
    final content = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (tab.icon != null) IconTheme(data: IconThemeData(size: 16, color: fg), child: tab.icon!),
        if (tab.icon != null) const SizedBox(width: 6),
        Flexible(child: Text(tab.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: isSelected ? FontWeight.w500 : FontWeight.w400, color: fg))),
        if (tab.badge != null) const SizedBox(width: 6),
        if (tab.badge != null)
          Container(
            padding: const EdgeInsetsDirectional.symmetric(horizontal: 6, vertical: 1),
            decoration: BoxDecoration(color: pill && isSelected ? c.accentHover : c.surfaceSunken, borderRadius: BorderRadius.circular(LumoRadius.full)),
            child: Text(tab.badge!, style: TextStyle(fontSize: 11, color: fg)),
          ),
      ],
    );
    return Semantics(
      role: SemanticsRole.tab,
      selected: isSelected,
      enabled: !isDisabled,
      label: tab.label,
      value: tab.badge,
      child: Opacity(
        opacity: isDisabled ? 0.5 : 1,
        child: InkWell(
          onTap: isDisabled ? null : onTap,
          canRequestFocus: !isDisabled,
          borderRadius: BorderRadius.circular(pill ? 999 : LumoRadius.sm),
          // The name is announced from the Semantics above; the visible text is excluded so it is heard ONCE.
          child: ExcludeSemantics(
            child: pill
                ? AnimatedContainer(
                    duration: motion ? const Duration(milliseconds: 120) : Duration.zero,
                    constraints: const BoxConstraints(minHeight: LumoControl.sm),
                    margin: const EdgeInsets.all(4),
                    padding: const EdgeInsetsDirectional.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(color: isSelected ? c.accent : Colors.transparent, borderRadius: BorderRadius.circular(LumoRadius.full)),
                    alignment: Alignment.center,
                    child: content,
                  )
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(constraints: const BoxConstraints(minHeight: LumoControl.md), padding: const EdgeInsetsDirectional.symmetric(horizontal: 16, vertical: 8), alignment: Alignment.center, child: content),
                      // The indicator: under THIS tab, so it is wherever the tab is — the Row put the tab at the reading position.
                      AnimatedContainer(duration: motion ? const Duration(milliseconds: 120) : Duration.zero, height: 2, color: isSelected ? c.accent : Colors.transparent),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
