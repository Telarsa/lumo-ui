import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// A checkbox — the web `Checkbox` on Flutter's semantics: named by its visible
/// `label` or an explicit `accessibilityLabel` (a select-all cell legitimately
/// has none), the constructor asserts one is present. The box sits at the
/// inline START (right in Persian, by `Directionality`), the row is
/// centre-aligned as on the web (Persian line boxes are taller). Controlled
/// (`isSelected`) and uncontrolled (`defaultSelected`) like the web;
/// `isIndeterminate` is the one field a switch does not have and is announced
/// as the MIXED state. `errorMessage` is for a STANDALONE checkbox — a rule
/// about the answer belongs on the group.
///
/// **The hit area is at least [LumoControl.lg] (44) square.** The web's
/// `checkboxVariants` is `w-fit` and unheighted; measured in a 360 dp column a
/// box labelled «ای» was 56.5×36 around a drawn 20×20 indicator, which a
/// pointer hits and a thumb misses. The floor is a MINIMUM, so a long label
/// still sizes to its words and nothing drawn moves — the box stays at the
/// inline start with the label beside it and only transparent row grows. Same
/// rule, same numbers, as `radio_group.dart`.
class LumoCheckbox extends StatefulWidget {
  const LumoCheckbox({
    super.key,
    this.label,
    this.accessibilityLabel,
    this.description,
    this.errorMessage,
    this.isSelected,
    this.defaultSelected = false,
    this.isIndeterminate = false,
    this.onChanged,
    this.isDisabled = false,
    this.isInvalid,
    this.isReadOnly = false,
  }) : assert(label != null || accessibilityLabel != null, 'A checkbox needs a visible label or an accessibilityLabel — never neither.');
  /// The name this control is announced by, and painted where the family shows one.
  final String? label;
  /// The announced name, for when it must differ from the visible text.
  final String? accessibilityLabel;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// An error for this checkbox alone; supplying one marks it invalid.
  final String? errorMessage;
  /// Controlled selection; `null` leaves the state to the widget (`defaultSelected`).
  final bool? isSelected;
  /// The starting state for an uncontrolled checkbox.
  final bool defaultSelected;
  /// Whether the box shows the mixed state — some children checked, not all.
  final bool isIndeterminate;
  /// Called with the new value when the user changes it. Omitting it makes the control read-only.
  final ValueChanged<bool>? onChanged;
  /// Whether the control is disabled.
  final bool isDisabled;
  /// Overrides the invalid state derived from `errorMessage` (or the group's).
  final bool? isInvalid;
  /// Whether the input can be selected but not changed by the user.
  final bool isReadOnly;

  @override
  State<LumoCheckbox> createState() => _LumoCheckboxState();
}

class _LumoCheckboxState extends State<LumoCheckbox> {
  late bool _uncontrolled = widget.defaultSelected;
  bool get _selected => widget.isSelected ?? _uncontrolled;

  void _toggle() {
    // A mixed box resolves to checked, as Base UI's `indeterminate` → `checked` press does.
    final next = widget.isIndeterminate ? true : !_selected;
    if (widget.isSelected == null) setState(() => _uncontrolled = next);
    widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final group = LumoCheckboxGroupScope.maybeOf(context);
    final disabled = widget.isDisabled || (group?.isDisabled ?? false);
    final invalid = widget.isInvalid ?? (widget.errorMessage != null || (group?.isInvalid ?? false));
    final selected = _selected;
    final marked = selected || widget.isIndeterminate;
    final box = SizedBox(
      width: 20,
      height: 20,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: marked ? c.accent : c.surface,
          border: Border.all(color: invalid ? c.critical : marked ? c.accent : c.borderControl),
          borderRadius: BorderRadius.circular(LumoRadius.sm),
        ),
        // Both marks exist on the web and are toggled by CSS; here one Icon is
        // enough since Flutter re-lays out cheaply. Indeterminate wins.
        child: marked ? Icon(widget.isIndeterminate ? Icons.remove : Icons.check, size: 14, color: c.accentFg) : null,
      ),
    );
    final row = Semantics(
      // `checked` + `mixed`: the reader gets "partially checked" for the mixed
      // box (`hasCheckedState` with `isCheckStateMixed`), never a bare boolean.
      checked: widget.isIndeterminate ? false : selected,
      mixed: widget.isIndeterminate,
      enabled: !disabled,
      readOnly: widget.isReadOnly,
      label: widget.accessibilityLabel ?? widget.label,
      // Description and error are read after the name (the web's `aria-describedby`).
      hint: [if (widget.description != null) widget.description!, if (widget.errorMessage != null) widget.errorMessage!].join('. '),
      child: InkWell(
        onTap: disabled || widget.isReadOnly ? null : _toggle,
        borderRadius: BorderRadius.circular(LumoRadius.md),
        child: ConstrainedBox(
          // The 44 px touch floor on BOTH axes — see the docblock.
          constraints: const BoxConstraints(minWidth: LumoTouch.floor, minHeight: LumoTouch.floor),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // The visible text is excluded: the node above carries the name, so it is announced ONCE.
              ExcludeSemantics(child: box),
              if (widget.label != null) const SizedBox(width: 8),
              if (widget.label != null) Flexible(child: ExcludeSemantics(child: Text(widget.label!, style: TextStyle(fontSize: 14, color: c.fg)))),
            ],
          ),
        ),
      ),
    );
    return Opacity(
      opacity: disabled ? 0.5 : 1,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          row,
          // Indented past the box (20 + 8) on the inline axis, as the web's `ps-7`. Outside the
          // clickable row, as on the web (the label row is indicator + label; the description is not a target).
          if (widget.description != null) Padding(padding: const EdgeInsetsDirectional.only(start: 28, top: 4), child: ExcludeSemantics(child: Text(widget.description!, style: TextStyle(fontSize: 12, color: c.fgMuted)))),
          if (widget.errorMessage != null)
            Padding(padding: const EdgeInsetsDirectional.only(start: 28, top: 4), child: Semantics(liveRegion: true, child: Text(widget.errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)))),
        ],
      ),
    );
  }
}

/// What a group hands its checkboxes: disabled and invalid flow DOWN, as the
/// web's `Field.Root` pushes `data-disabled` / `data-invalid` onto each control.
class LumoCheckboxGroupScope extends InheritedWidget {
  const LumoCheckboxGroupScope({super.key, required this.isDisabled, required this.isInvalid, required super.child});
  final bool isDisabled;
  final bool isInvalid;

  static LumoCheckboxGroupScope? maybeOf(BuildContext context) => context.dependOnInheritedWidgetOfExactType<LumoCheckboxGroupScope>();

  @override
  bool updateShouldNotify(LumoCheckboxGroupScope old) => old.isDisabled != isDisabled || old.isInvalid != isInvalid;
}

/// A group of checkboxes with one shared `label` (REQUIRED — the checkboxes name
/// the options, not the question), one description and one error. Each child
/// keeps its own `isSelected`/`onChanged`: the web's `value: string[]` exists
/// for form submission, which Flutter has no counterpart of, so the group does
/// not re-declare state it could not deliver. `isDisabled` and the invalid
/// state (from `errorMessage`, or `isInvalid`) reach every child.
class LumoCheckboxGroup extends StatelessWidget {
  const LumoCheckboxGroup({super.key, required this.label, required this.children, this.description, this.errorMessage, this.isInvalid, this.isDisabled = false});
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// The children, in reading order.
  final List<Widget> children;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// Supplying one marks the group invalid.
  final String? errorMessage;
  /// Overrides the invalid state derived from `errorMessage`.
  final bool? isInvalid;
  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final invalid = isInvalid ?? errorMessage != null;
    return Semantics(
      container: true,
      // The name reaches the group, not each option — `explicitChildNodes` keeps
      // the checkboxes their own nodes so «روش تماس» is announced ONCE.
      explicitChildNodes: true,
      label: label,
      hint: description,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          ExcludeSemantics(child: Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg))),
          const SizedBox(height: 8),
          LumoCheckboxGroupScope(
            isDisabled: isDisabled,
            isInvalid: invalid,
            // The web's group list is `flex flex-col gap-2` — 8, not 4.
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, spacing: 8, children: children),
          ),
          if (description != null) Padding(padding: const EdgeInsets.only(top: 6), child: ExcludeSemantics(child: Text(description!, style: TextStyle(fontSize: 12, color: c.fgMuted)))),
          if (errorMessage != null) Padding(padding: const EdgeInsets.only(top: 6), child: Semantics(liveRegion: true, child: Text(errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)))),
        ],
      ),
    );
  }
}
