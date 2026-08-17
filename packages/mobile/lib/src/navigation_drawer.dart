import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'button.dart';
import 'navigation_bar.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// A titled group of destinations inside a drawer — the web sidebar's
/// `SidebarGroup`. `label` is the group's visible heading and is announced as a
/// header; it is OPTIONAL and nullable (never defaulted), because a drawer of
/// five destinations needs no heading at all — the same shape `LumoSeparator`
/// takes for its optional name.
class LumoNavigationSection {
  const LumoNavigationSection({required this.items, this.label});
  /// The items to show, in reading order.
  final List<LumoNavigationItem> items;

  /// The group's heading, when the group has one.
  final String? label;
}

/// The side drawer: a panel that enters from the reading START — the RIGHT
/// under fa-IR, the LEFT under en-US — and mirrors entirely, including the
/// corner it rounds (only its inline-END corners are round; the edge it is
/// attached to is square).
///
/// `label` REQUIRED (it names the route and is the panel's heading) and
/// `closeLabel` REQUIRED (an ✕ is not a name). `sections` are groups of
/// `LumoNavigationItem` — the same item the bottom bar takes, so one app
/// declares its destinations once. `value` is the current destination's id.
///
/// NEVER Material's `Drawer` / `Scaffold.drawer`: that pair names itself from
/// `MaterialLocalizations` — `drawerLabel` («Navigation menu»), and the
/// hamburger's tooltip `openAppDrawerTooltip` («Open navigation menu») — English
/// no parameter of ours reaches, the same defect as the Material route helpers
/// `gate:flutter-contract` fails the build on. `showLumoNavigationDrawer` is
/// therefore the inline-axis sibling of `showLumoSheetRoute`: the same
/// `showGeneralDialog` route, the same re-provided `LumoScope`, the same
/// `closeLabel`-named scrim — only the travel axis differs, and it is the axis
/// that mirrors, so the slide's sign is read from `Directionality`.
///
/// Selecting a destination CLOSES the drawer and then reports it, the order
/// `LumoMenuTrigger` uses: an action that opens a screen should open it above
/// the app, not above the drawer.
class LumoNavigationDrawer extends StatelessWidget {
  const LumoNavigationDrawer({super.key, required this.label, required this.closeLabel, required this.sections, this.value, this.onChanged, this.header, this.footer, this.onClose, this.width = 300});

  /// Announced name of the drawer — it names the route and is drawn as the heading.
  final String label;

  /// Announced name of the ✕. Required.
  final String closeLabel;
  /// The sections, in reading order.
  final List<LumoNavigationSection> sections;

  /// The current destination's id.
  final String? value;
  /// Called with the new value when the user changes it. Omitting it makes the control read-only.
  final ValueChanged<String>? onChanged;

  /// Above the destinations — an account row, a logo.
  final Widget? header;

  /// Below the destinations — a sign-out row, a version line.
  final Widget? footer;

  /// What the ✕ does. Defaults to popping the route the drawer was shown in.
  final VoidCallback? onClose;
  /// Width in logical pixels.
  final double width;

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final close = onClose ?? () => Navigator.of(context).maybePop();
    return SizedBox(
      width: width,
      height: double.infinity,
      // `shadow-modal`: a drawer slides over the page and needs the same
      // separation a sheet does. Directional radius, so the shadow's rounded
      // corners follow the entry edge and mirror under RTL.
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: const BorderRadiusDirectional.horizontal(end: Radius.circular(LumoRadius.lg)),
          boxShadow: LumoShadow.modal(scope.brightness),
        ),
        child:   Material(
          color: c.surface,
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(
            // Only the corners AWAY from the entry edge are round — `end` is left
            // in Persian and right in English, and this line does not know which.
            borderRadius: const BorderRadiusDirectional.horizontal(end: Radius.circular(LumoRadius.lg)),
            side: BorderSide(color: c.border),
          ),
          child: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsetsDirectional.only(start: 16, end: 8, top: 8, bottom: 4),
                  child: Row(
                    children: [
                      // ONE node names the route AND is the heading — the words exist once in the tree.
                      Expanded(
                        child: Semantics(
                          namesRoute: true,
                          header: true,
                          child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: c.fg)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      LumoIconButton(
                        label: closeLabel,
                        size: LumoButtonSize.sm,
                        onPressed: close,
                        child: Icon(Icons.close, size: 16, color: c.fgMuted),
                      ),
                    ],
                  ),
                ),
                if (header != null) Padding(padding: const EdgeInsetsDirectional.only(start: 12, end: 12, bottom: 8), child: header),
                Expanded(
                  child: Semantics(
                    container: true,
                    explicitChildNodes: true,
                    role: SemanticsRole.navigation,
                    child: ListView(
                      padding: const EdgeInsetsDirectional.only(start: 8, end: 8, bottom: 8),
                      children: [
                        for (final section in sections) ...[
                          if (section.label != null)
                            Padding(
                              padding: const EdgeInsetsDirectional.only(start: 8, end: 8, top: 12, bottom: 4),
                              child: Semantics(
                                header: true,
                                child: Text(section.label!, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: c.fgSubtle)),
                              ),
                            ),
                          for (final item in section.items)
                            _DrawerRow(
                              item: item,
                              isSelected: item.id == value,
                              onTap: () {
                                close();
                                onChanged?.call(item.id);
                              },
                            ),
                        ],
                      ],
                    ),
                  ),
                ),
                if (footer != null) Padding(padding: const EdgeInsetsDirectional.only(start: 12, end: 12, top: 4, bottom: 8), child: footer),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DrawerRow extends StatelessWidget {
  const _DrawerRow({required this.item, required this.isSelected, required this.onTap});
  final LumoNavigationItem item;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final fg = isSelected ? c.accentFg : c.fg;
    final glyph = (isSelected ? item.selectedIcon : null) ?? item.icon;
    return Semantics(
      button: true,
      selected: isSelected,
      enabled: !item.isDisabled,
      // The count rides the NAME, as in the bottom bar: a bare «۳» beside a row says nothing.
      label: item.badge == null ? item.label : '${item.label} (${item.badge})',
      child: Opacity(
        opacity: item.isDisabled ? 0.5 : 1,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 1),
          child: InkWell(
            onTap: item.isDisabled ? null : onTap,
            canRequestFocus: !item.isDisabled,
            borderRadius: BorderRadius.circular(LumoRadius.md),
            child: ExcludeSemantics(
              child: Container(
                constraints: const BoxConstraints(minHeight: LumoControl.lg),
                padding: const EdgeInsetsDirectional.symmetric(horizontal: 12),
                decoration: BoxDecoration(color: isSelected ? c.accent : Colors.transparent, borderRadius: BorderRadius.circular(LumoRadius.md)),
                child: Row(
                  children: [
                    if (glyph != null) ...[
                      IconTheme.merge(data: IconThemeData(size: 18, color: fg), child: glyph),
                      const SizedBox(width: 12),
                    ],
                    Expanded(
                      child: Text(item.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400, color: fg)),
                    ),
                    if (item.badge != null) ...[
                      const SizedBox(width: 8),
                      Container(
                        constraints: const BoxConstraints(minWidth: 20),
                        padding: const EdgeInsetsDirectional.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: isSelected ? c.surface : c.surfaceSunken, borderRadius: BorderRadius.circular(LumoRadius.full)),
                        alignment: Alignment.center,
                        child: Text(item.badge!, style: TextStyle(fontSize: 11, height: 1.2, color: c.fgMuted)),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Shows [LumoNavigationDrawer] in Lumo's own route — the inline-axis sibling of
/// `showLumoSheetRoute`. The panel is aligned to the reading START
/// (`AlignmentDirectional.centerStart`) and slides in along the inline axis; the
/// sign of that travel is the only place direction is read, and it is read from
/// `Directionality`, not from a parameter. The scrim is named by `closeLabel`,
/// so the dismiss gesture has a name; the caller's `LumoScope` is re-provided
/// inside the route, since a route is built above the widget that opened it.
Future<T?> showLumoNavigationDrawer<T>(
  BuildContext context, {
  required String label,
  required String closeLabel,
  required List<LumoNavigationSection> sections,
  String? value,
  ValueChanged<String>? onChanged,
  Widget? header,
  Widget? footer,
  double width = 300,
  bool isDismissible = true,
}) {
  final scope = LumoScope.of(context);
  return showGeneralDialog<T>(
    context: context,
    barrierColor: scope.colours.scrim,
    barrierDismissible: isDismissible,
    barrierLabel: closeLabel,
    // «Reduce motion»: the drawer still appears, it just does not slide.
    transitionDuration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 250),
    transitionBuilder: (ctx, animation, secondary, child) => SlideTransition(
      // An `Offset` has no logical form: −1 is the left edge, +1 the right one.
      // Which of them is the reading START is what `Directionality` answers.
      position: Tween(
        begin: Offset(Directionality.of(ctx) == TextDirection.rtl ? 1 : -1, 0),
        end: Offset.zero,
      ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
      child: child,
    ),
    pageBuilder: (ctx, animation, secondary) => scope.wrap(
      Align(
        alignment: AlignmentDirectional.centerStart,
        child: LumoNavigationDrawer(label: label, closeLabel: closeLabel, sections: sections, value: value, onChanged: onChanged, header: header, footer: footer, width: width),
      ),
    ),
  );
}
