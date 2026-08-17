import 'package:flutter/material.dart';
import 'popover.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// One entry of a menu: an item, a checkbox item, a separator or a titled
/// section. A sealed hierarchy — the menu's builder switches exhaustively.
sealed class LumoMenuEntry {
  const LumoMenuEntry();
}

/// One action. `label` REQUIRED — the visible text IS the announced name (a
/// bare icon is not one); `icon` is decoration in the leading slot;
/// `isDestructive` colours the label `critical` (a colour is a hint, the word
/// carries the meaning — put it in the label). Selecting closes the menu, then
/// calls `onSelected` (so an action that opens a dialog opens it above nothing).
class LumoMenuItem extends LumoMenuEntry {
  const LumoMenuItem({required this.label, this.icon, this.onSelected, this.isDisabled = false, this.isDestructive = false});
  final String label;
  final Widget? icon;
  final VoidCallback? onSelected;
  final bool isDisabled;
  final bool isDestructive;
}

/// A toggle inside a menu — the web's `menuitemcheckbox`: one control, checked
/// state announced, NOT a checkbox nested in an item (two controls). CONTROLLED
/// (`isSelected` + `onChanged`): a menu of toggles is a view of state that lives
/// elsewhere. Ticking keeps the menu open (the web's `closeOnClick` default:
/// toggling three columns should not reopen the menu three times).
class LumoMenuCheckboxItem extends LumoMenuEntry {
  const LumoMenuCheckboxItem({required this.label, required this.isSelected, this.onChanged, this.isDisabled = false});
  final String label;
  final bool isSelected;
  final ValueChanged<bool>? onChanged;
  final bool isDisabled;
}

/// A rule between items. Decoration: excluded from semantics.
class LumoMenuSeparator extends LumoMenuEntry {
  const LumoMenuSeparator();
}

/// A titled group. `label` REQUIRED — the web's `Menu.GroupLabel` names the
/// group; here it is a header node the reader lands on before the group's items.
class LumoMenuSection extends LumoMenuEntry {
  const LumoMenuSection({required this.label, required this.items});
  final String label;
  final List<LumoMenuEntry> items;
}

/// A menu of actions on Lumo's popover surface (`showLumoPopover`), anchored
/// to the trigger at `bottomStart` — the web `MenuPopover`'s default — which
/// mirrors under RTL. `label` REQUIRED: the menu's announced name (names the
/// route; the web names the popup by its trigger). Items are buttons, a
/// checkbox item carries the checked state, a section starts with a header,
/// separators are silent. The list is re-read on every rebuild of this widget,
/// so a checkbox item toggled by the caller's `setState` updates while open.
///
/// No `isOpen`/`defaultOpen` (routes are pushed, not rendered — as
/// `LumoDialogTrigger`), no submenus (`SubmenuTrigger`: nested popovers on a
/// phone are a sheet's job), no link items (`href`: no router seam here).
class LumoMenuTrigger extends StatefulWidget {
  const LumoMenuTrigger({super.key, required this.label, required this.trigger, required this.items, this.placement = LumoPlacement.bottomStart, this.onOpenChange, this.isDisabled = false});
  final String label;
  final List<LumoMenuEntry> items;
  final LumoPlacement placement;
  final ValueChanged<bool>? onOpenChange;
  final bool isDisabled;

  /// Built with the press that opens the menu.
  final Widget Function(VoidCallback? open) trigger;

  @override
  State<LumoMenuTrigger> createState() => _LumoMenuTriggerState();
}

class _LumoMenuTriggerState extends State<LumoMenuTrigger> {
  /// Bumped on every update so the open menu (a route built once) re-reads `widget.items`.
  final _version = ValueNotifier<int>(0);

  @override
  void didUpdateWidget(LumoMenuTrigger old) {
    super.didUpdateWidget(old);
    // After this frame: the open menu is another route, not a descendant — it may not be dirtied mid-build.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _version.value++;
    });
  }

  @override
  void dispose() {
    _version.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // The Builder's render object IS the trigger's box — the anchor.
    return Builder(
      builder: (ctx) => widget.trigger(
        widget.isDisabled
            ? null
            : () async {
                widget.onOpenChange?.call(true);
                await showLumoPopover<void>(
                  ctx,
                  anchor: ctx.findRenderObject()! as RenderBox,
                  label: widget.label,
                  placement: widget.placement,
                  padded: false,
                  content: (menuCtx) => ValueListenableBuilder<int>(
                    valueListenable: _version,
                    builder: (_, _, _) => _LumoMenuBody(entries: widget.items),
                  ),
                );
                widget.onOpenChange?.call(false);
              },
      ),
    );
  }
}

class _LumoMenuBody extends StatelessWidget {
  const _LumoMenuBody({required this.entries});
  final List<LumoMenuEntry> entries;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return ConstrainedBox(
      // 12rem minimum as the web's `menuPopoverVariants`; half the screen at most, then it scrolls.
      constraints: BoxConstraints(minWidth: 192, maxHeight: MediaQuery.sizeOf(context).height * 0.5),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(4),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [for (final e in entries) _entry(context, e, c)]),
      ),
    );
  }

  Widget _entry(BuildContext context, LumoMenuEntry e, LumoSchemeColours c) {
    switch (e) {
      case LumoMenuItem():
        return _LumoMenuRow(
          label: e.label,
          isDisabled: e.isDisabled,
          leading: e.icon,
          colour: e.isDestructive ? c.critical : c.fg,
          onTap: () {
            Navigator.of(context).pop();
            e.onSelected?.call();
          },
        );
      case LumoMenuCheckboxItem():
        return _LumoMenuRow(
          label: e.label,
          isDisabled: e.isDisabled,
          isChecked: e.isSelected,
          // The tick is a real slot drawn whether or not it is ticked, so labels keep one column.
          // `c.accent`, not `c.fg`: the web's `menuCheckboxIndicatorVariants`
          // is `grid size-4 place-items-center text-accent` — the indicator is
          // the ACCENT role, and reading it as foreground made the tick and
          // the label the same colour in both schemes.
          leading: SizedBox(width: 16, height: 16, child: e.isSelected ? Icon(Icons.check, size: 14, color: c.accent) : null),
          colour: c.fg,
          onTap: () => e.onChanged?.call(!e.isSelected),
        );
      case LumoMenuSeparator():
        return ExcludeSemantics(
          child: Container(height: 1, margin: const EdgeInsets.symmetric(vertical: 4), color: c.border),
        );
      case LumoMenuSection():
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: Semantics(
                header: true,
                child: Text(
                  e.label,
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: c.fgSubtle),
                ),
              ),
            ),
            for (final i in e.items) _entry(context, i, c),
          ],
        );
    }
  }
}

/// One row: a button (or a checked control) named by its visible label; the
/// leading slot is decoration.
class _LumoMenuRow extends StatelessWidget {
  const _LumoMenuRow({required this.label, required this.isDisabled, required this.colour, required this.onTap, this.leading, this.isChecked});
  final String label;
  final bool isDisabled;
  final Color colour;
  final VoidCallback onTap;
  final Widget? leading;
  final bool? isChecked;

  @override
  Widget build(BuildContext context) {
    return MergeSemantics(
      child: Semantics(
        button: isChecked == null,
        checked: isChecked,
        enabled: !isDisabled,
        child: Opacity(
          opacity: isDisabled ? 0.5 : 1,
          // No `hoverColor`/`highlightColor`/`splashColor` here: press feedback
          // is the THEME's one decision (`lumoThemeData(pressFeedback:)`, which
          // sets all three on `ThemeData`). Naming them per widget made
          // `LumoPressFeedback.none` a lie for menu rows alone.
          child: InkWell(
            onTap: isDisabled ? null : onTap,
            borderRadius: BorderRadius.circular(LumoRadius.sm),
            child: Container(
              // `LumoControl.lg`, not `.md`. The web's `menuItemVariants` sets
              // no min-height at all (`px-2 py-1.5 text-sm` ≈ 32px); a mouse
              // hits 32px, a thumb in a list of eight rows does not. The house
              // already says 44 for a tappable list row — `item.dart` and
              // `phone_input.dart`'s picker both use `LumoControl.lg`. The
              // PADDING stays the web's `px-2 py-1.5`.
              constraints: const BoxConstraints(minHeight: LumoControl.lg),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: Row(
                children: [
                  if (leading != null) ...[
                    ExcludeSemantics(
                      child: IconTheme.merge(
                        data: IconThemeData(size: 16, color: colour),
                        child: SizedBox(width: 16, height: 16, child: Center(child: leading)),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: Text(label, style: TextStyle(fontSize: 14, color: colour)),
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
