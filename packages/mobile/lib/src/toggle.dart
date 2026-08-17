import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// The frame a standalone toggle's pressed state paints against — the web
/// `toggleVariants`' `variant`.
enum LumoToggleVariant {
  /// No resting chrome; the ON state is the only fill.
  ghost,

  /// A resting outline, for a toggle that sits alone. `borderControl`: WCAG
  /// 1.4.11 wants 3:1 for the boundary of a control.
  outline,
}

/// The size step on the shared control scale.
enum LumoToggleSize { sm, md, lg }

/// How many items of a `LumoToggleGroup` may be on at once — the web's
/// `selectionMode`. Maps onto Base UI's `multiple`; it does NOT change the
/// role, which is why this is not a radio group.
enum LumoToggleSelectionMode { single, multiple }

const _height = {LumoToggleSize.sm: LumoControl.sm, LumoToggleSize.md: LumoControl.md, LumoToggleSize.lg: LumoControl.lg};
// The web's `px-2.5 / px-3 / px-4` on a standalone toggle.
const _pad = {LumoToggleSize.sm: 10.0, LumoToggleSize.md: 12.0, LumoToggleSize.lg: 16.0};
// The web's `px-3 / px-4 / px-6` on a group member — a strip needs wider hit areas.
const _groupPad = {LumoToggleSize.sm: 12.0, LumoToggleSize.md: 16.0, LumoToggleSize.lg: 24.0};
const _font = {LumoToggleSize.sm: 14.0, LumoToggleSize.md: 14.0, LumoToggleSize.lg: 16.0};

/// ONE two-state button — the web `Toggle`/`IconToggle`. Bold on / bold off,
/// muted / unmuted, pinned / unpinned.
///
/// **This is a button, not a switch.** The state is announced as `toggled`
/// (Flutter's counterpart of `aria-pressed`), which is what a pressed BUTTON
/// carries; a `LumoSwitch` announces a switch's on/off, and the two are not
/// interchangeable to a reader — a switch takes effect the moment it moves and
/// describes a SETTING, a toggle button describes the state of the thing it
/// acts on and belongs beside other buttons. Choosing the wrong one is silent
/// on screen and wrong in the ear.
///
/// `label` is REQUIRED — the web splits `IconToggle` out of `Toggle` for
/// exactly this, since a nameless toggle announces "button, pressed", which
/// sounds like information and is not. **The name does not change with the
/// state** («بی‌صدا», never «بی‌صدا کردن»): `toggled` carries the state, and a
/// voice-control user must be able to say the same name twice. `iconOnly`
/// draws only the icon and keeps the name for the reader.
///
/// Controlled (`isSelected`) and uncontrolled (`defaultSelected`), as on the
/// web. No press feedback of its own: a toggle's press CHANGES ITS STATE, so
/// the tap answers itself — that is the web's rule too. The fill cross-fade
/// collapses to nothing under `disableAnimations`, so under «Reduce motion»
/// the state change is instant, not merely faster.
class LumoToggle extends StatefulWidget {
  const LumoToggle({super.key, required this.label, this.isSelected, this.defaultSelected = false, this.onChanged, this.icon, this.iconOnly = false, this.variant = LumoToggleVariant.ghost, this.size = LumoToggleSize.md, this.isDisabled = false}) : assert(!iconOnly || icon != null, 'An icon-only toggle needs an icon.');

  /// The announced name — and the visible text unless `iconOnly`. Required.
  final String label;

  /// Whether the toggle is on (controlled); `null` leaves the state here.
  final bool? isSelected;

  /// Whether the toggle is on to begin with (uncontrolled).
  final bool defaultSelected;

  /// Called with the NEXT on-state.
  final ValueChanged<bool>? onChanged;

  /// A glyph beside the words, or the whole content with `iconOnly`.
  final Widget? icon;

  /// Draw only the icon; the label stays for the reader.
  final bool iconOnly;

  /// The visual variant.
  final LumoToggleVariant variant;
  /// The size step, from the shared control scale.
  final LumoToggleSize size;
  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  State<LumoToggle> createState() => _LumoToggleState();
}

class _LumoToggleState extends State<LumoToggle> {
  late bool _uncontrolled = widget.defaultSelected;

  bool get _selected => widget.isSelected ?? _uncontrolled;

  void _press() {
    final next = !_selected;
    if (widget.isSelected == null) setState(() => _uncontrolled = next);
    widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final enabled = !widget.isDisabled;
    final on = _selected;
    final height = _height[widget.size]!;
    // «Reduce motion» is the platform's answer, not a parameter of ours — the
    // same spelling as `disclosure.dart`: the ON fill arrives on the same frame.
    final motion = !MediaQuery.disableAnimationsOf(context);
    // The ON fill is the accent TINT, a different hue from every neutral,
    // because `surfaceSunken` and `surfaceHover` are the same token on the
    // light theme. NOT the solid accent — that one belongs to a group member.
    final fill = on ? c.accent.withValues(alpha: 0.1) : (widget.variant == LumoToggleVariant.outline ? c.surface : Colors.transparent);
    final fg = on ? c.accent : c.fgMuted;
    return Semantics(
      container: true,
      button: true,
      toggled: on,
      enabled: enabled,
      label: widget.label,
      onTap: enabled ? _press : null,
      child: Opacity(
        opacity: enabled ? 1 : 0.5,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          // The tap is on the node above; the detector's own would form a second, nameless one.
          excludeFromSemantics: true,
          onTap: enabled ? _press : null,
          child: AnimatedContainer(
            duration: motion ? const Duration(milliseconds: 120) : Duration.zero,
            height: height,
            width: widget.iconOnly ? height : null,
            alignment: Alignment.center,
            padding: widget.iconOnly ? EdgeInsets.zero : EdgeInsetsDirectional.symmetric(horizontal: _pad[widget.size]!),
            decoration: BoxDecoration(
              color: fill,
              borderRadius: BorderRadius.circular(LumoRadius.md),
              border: widget.variant == LumoToggleVariant.outline ? Border.all(color: c.borderControl) : null,
            ),
            // The name is on the node above; the drawn copy is excluded so it is heard ONCE.
            child: ExcludeSemantics(
              child: IconTheme(
                data: IconThemeData(size: 16, color: fg),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  // The web's `gap-2`.
                  spacing: widget.icon == null || widget.iconOnly ? 0 : 8,
                  children: [
                    if (widget.icon != null) widget.icon!,
                    if (!widget.iconOnly)
                      Flexible(
                        child: Text(
                          widget.label,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: _font[widget.size], fontWeight: FontWeight.w500, color: fg),
                        ),
                      ),
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

/// One member of a `LumoToggleGroup`: `id` REQUIRED (the key the group
/// reports), `label` REQUIRED (the announced name — an icon is not a name).
class LumoToggleItem {
  const LumoToggleItem({required this.id, required this.label, this.icon, this.iconOnly = false, this.isDisabled = false}) : assert(!iconOnly || icon != null, 'An icon-only toggle needs an icon.');
  /// A stable identity for this item — used for selection and equality, never shown or announced.
  final String id;
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// A leading icon. Decorative — it is not announced, so it never carries meaning on its own.
  final Widget? icon;
  /// Whether only the icon is painted. The label is still announced.
  final bool iconOnly;
  /// Whether the control is disabled.
  final bool isDisabled;
}

/// A strip of two-state buttons — the web `ToggleButtonGroup`. `label` is
/// REQUIRED because the engine renders `role="group"`, which names nothing.
///
/// A member's ON state is the SOLID accent (`accent` / `accentFg`), not the
/// standalone toggle's 10% tint — that difference is the web's, and it is what
/// makes a strip read as a strip. Each member is still announced with
/// `toggled`, never `selected`: Base UI emits `aria-pressed` in single AND
/// multiple mode, which is precisely why the web's `SegmentedControl` moved off
/// this family onto a radio group. Reach for `LumoSegmentedControl` when the
/// options are mutually exclusive VIEWS of the same thing and for this when
/// they are independent switches that happen to sit together.
///
/// The rounding lives on the GROUP, never on the first and last children,
/// which would round the wrong corners under RTL; the dividers are inline-start
/// borders, so they land between the right pair in either direction.
///
/// Selection is one `Set<String>` in both modes, as on the web
/// (`selectedKeys`); `value`/`defaultValue` are the single-mode conveniences
/// and the constructor refuses them alongside `values`/`defaultValues` or in
/// multiple mode. `onChanged` is handed the whole next set.
///
/// A cramped strip **sheds decoration before it truncates words** — the house
/// `_fit` pattern: padding first (down to 4), then the icons, and only a bare
/// label that still will not fit ellipsizes.
///
/// The member fill cross-fade collapses to nothing under `disableAnimations`.
class LumoToggleGroup extends StatefulWidget {
  const LumoToggleGroup({super.key, required this.label, required this.items, this.value, this.defaultValue, this.values, this.defaultValues, this.onChanged, this.selectionMode = LumoToggleSelectionMode.single, this.disallowEmptySelection = false, this.size = LumoToggleSize.md, this.isDisabled = false})
    : assert(value == null || values == null, 'Give the selection as `value` or as `values`, not both.'),
      assert(defaultValue == null || defaultValues == null, 'Give the initial selection as `defaultValue` or as `defaultValues`, not both.'),
      assert(value == null || selectionMode == LumoToggleSelectionMode.single, '`value` holds one key: use `values` in multiple mode.'),
      assert(defaultValue == null || selectionMode == LumoToggleSelectionMode.single, '`defaultValue` holds one key: use `defaultValues` in multiple mode.');

  /// Announced name of the group, e.g. «چیدمان». Required.
  final String label;
  /// The items to show, in reading order.
  final List<LumoToggleItem> items;

  /// The pressed key in single mode (controlled).
  final String? value;

  /// The pressed key in single mode (uncontrolled).
  final String? defaultValue;

  /// The pressed keys (controlled) — the web's `selectedKeys`.
  final Set<String>? values;

  /// The pressed keys (uncontrolled) — the web's `defaultSelectedKeys`.
  final Set<String>? defaultValues;

  /// Called with the whole next selection.
  final ValueChanged<Set<String>>? onChanged;

  /// Whether one item may be selected, or many.
  final LumoToggleSelectionMode selectionMode;

  /// Refuse to empty the group — the web prop of the same name.
  final bool disallowEmptySelection;

  /// The size step, from the shared control scale.
  final LumoToggleSize size;
  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  State<LumoToggleGroup> createState() => _LumoToggleGroupState();
}

class _LumoToggleGroupState extends State<LumoToggleGroup> {
  late Set<String> _uncontrolled = {
    ...?widget.defaultValues,
    ...?(widget.defaultValue == null ? null : {widget.defaultValue!}),
  };

  Set<String> get _selection => widget.values ?? (widget.value == null ? null : {widget.value!}) ?? _uncontrolled;

  void _press(String id) {
    final current = _selection;
    final Set<String> next;
    if (widget.selectionMode == LumoToggleSelectionMode.single) {
      next = current.contains(id) && !widget.disallowEmptySelection ? <String>{} : <String>{id};
    } else {
      next = {...current};
      if (next.contains(id)) {
        if (next.length > 1 || !widget.disallowEmptySelection) next.remove(id);
      } else {
        next.add(id);
      }
    }
    if (widget.values == null && widget.value == null) setState(() => _uncontrolled = next);
    widget.onChanged?.call(next);
  }

  /// How a cramped strip gives ground, in order: **padding first** (down to 4),
  /// **then the icons** — a label is the item's name and meaning, an icon
  /// beside it is decoration, so the words are the last thing to go. Returns
  /// the base padding when the width is unbounded: there is nothing to fit into.
  ({double padding, bool showIcon}) _fit(BuildContext context, double maxWidth, double base) {
    if (!maxWidth.isFinite) return (padding: base, showIcon: true);
    final n = widget.items.length;
    // The strip's own border plus one divider between each pair.
    final per = (maxWidth - 2 - (n - 1)) / n;
    final style = DefaultTextStyle.of(context).style.copyWith(fontSize: _font[widget.size], fontWeight: FontWeight.w500);
    var labels = 0.0; // the widest label on its own
    var withIcons = 0.0; // the widest label plus its icon and gap
    for (final item in widget.items) {
      if (item.iconOnly) {
        labels = math.max(labels, 16);
        withIcons = math.max(withIcons, 16);
        continue;
      }
      final tp = TextPainter(
        text: TextSpan(text: item.label, style: style),
        textDirection: Directionality.of(context),
        maxLines: 1,
      )..layout();
      labels = math.max(labels, tp.width);
      withIcons = math.max(withIcons, tp.width + (item.icon == null ? 0 : 24));
    }
    // Half a pixel of slack: a label that fits exactly must not ellipsize.
    final showIcon = withIcons + 8 <= per - 0.5;
    final needed = showIcon ? withIcons : labels;
    return (padding: ((per - needed - 0.5) / 2).clamp(4.0, base), showIcon: showIcon);
  }

  @override
  Widget build(BuildContext context) {
    // In build, not the constructor: `List.length` is not constant-evaluable.
    assert(widget.items.isNotEmpty, 'A toggle group needs at least one item.');
    final c = LumoScope.of(context).colours;
    final selection = _selection;
    final radius = BorderRadius.circular(LumoRadius.md);
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label,
      enabled: !widget.isDisabled,
      child: Opacity(
        opacity: widget.isDisabled ? 0.5 : 1,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final bounded = constraints.maxWidth.isFinite;
            final fit = _fit(context, constraints.maxWidth, _groupPad[widget.size]!);
            final divider = SizedBox(
              width: 1,
              height: _height[widget.size]!,
              child: ColoredBox(color: c.borderControl),
            );
            final children = <Widget>[];
            for (var i = 0; i < widget.items.length; i++) {
              if (i > 0) children.add(divider);
              final item = widget.items[i];
              final button = _GroupItem(item: item, isSelected: selection.contains(item.id), isDisabled: widget.isDisabled || item.isDisabled, size: widget.size, padding: fit.padding, showIcon: fit.showIcon, onTap: () => _press(item.id));
              // `Flexible` needs a bounded width to divide; unbounded, the strip
              // is content-sized as the web's `inline-flex` is.
              children.add(bounded ? Flexible(child: button) : button);
            }
            return Container(
              decoration: BoxDecoration(
                color: c.surface,
                borderRadius: radius,
                border: Border.all(color: c.borderControl),
              ),
              // The rounding is the GROUP's; `first:`/`last:` corners would be the wrong ones under RTL.
              child: ClipRRect(
                borderRadius: radius,
                child: Row(mainAxisSize: MainAxisSize.min, children: children),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _GroupItem extends StatelessWidget {
  const _GroupItem({required this.item, required this.isSelected, required this.isDisabled, required this.size, required this.padding, required this.showIcon, required this.onTap});
  final LumoToggleItem item;
  final bool isSelected;
  final bool isDisabled;
  final LumoToggleSize size;

  /// Symmetric inline padding, computed by the group so every label fits.
  final double padding;

  /// False when the group had to drop icons to keep the labels whole.
  final bool showIcon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    // A member's ON state is the SOLID accent — see the group's docblock.
    final fg = isSelected ? c.accentFg : c.fg;
    final motion = !MediaQuery.disableAnimationsOf(context);
    return Semantics(
      button: true,
      toggled: isSelected,
      enabled: !isDisabled,
      label: item.label,
      onTap: isDisabled ? null : onTap,
      child: Opacity(
        opacity: isDisabled ? 0.5 : 1,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          excludeFromSemantics: true,
          onTap: isDisabled ? null : onTap,
          // The FILL animates; the geometry does not. A padding that animated
          // would still be the previous frame's when the strip is re-laid out
          // narrower, and the label would ellipsize for a frame — which is the
          // exact defect `_fit` exists to prevent.
          child: AnimatedContainer(
            duration: motion ? const Duration(milliseconds: 120) : Duration.zero,
            height: _height[size]!,
            alignment: Alignment.center,
            color: isSelected ? c.accent : Colors.transparent,
            child: Padding(
              padding: EdgeInsetsDirectional.symmetric(horizontal: padding),
              child: ExcludeSemantics(
                child: IconTheme(
                  data: IconThemeData(size: 16, color: fg),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    spacing: item.icon == null || !(showIcon || item.iconOnly) ? 0 : 8,
                    children: [
                      // An icon-only item always keeps its icon — it is all it has.
                      if (item.icon != null && (showIcon || item.iconOnly)) item.icon!,
                      if (!item.iconOnly)
                        Flexible(
                          child: Text(
                            item.label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: _font[size], fontWeight: FontWeight.w500, color: fg),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
