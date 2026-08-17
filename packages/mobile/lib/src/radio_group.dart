import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

enum LumoRadioOrientation { vertical, horizontal }

/// What the group hands each option: the selection, the setter, the flags.
class _LumoRadioGroupScope extends InheritedWidget {
  const _LumoRadioGroupScope({required this.value, required this.select, required this.isDisabled, required this.isInvalid, required this.isReadOnly, required super.child});
  final String? value;
  final ValueChanged<String>? select;
  /// Whether the control is disabled.
  final bool isDisabled;
  final bool isInvalid;
  /// Whether the input can be selected but not changed by the user.
  final bool isReadOnly;

  static _LumoRadioGroupScope of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<_LumoRadioGroupScope>();
    assert(scope != null, 'A LumoRadio was built outside a LumoRadioGroup.');
    return scope!;
  }

  @override
  bool updateShouldNotify(_LumoRadioGroupScope old) => old.value != value || old.isDisabled != isDisabled || old.isInvalid != isInvalid || old.isReadOnly != isReadOnly;
}

/// A group of mutually exclusive options — the web `RadioGroup`: named by the
/// visible `label` or an explicit `accessibilityLabel` (the constructor asserts
/// one is present; the radios name the OPTIONS, not the question). Controlled
/// (`value`) and uncontrolled (`defaultValue`) like the web; `onChanged` hands
/// over the chosen option's `value`. `orientation` is purely visual, as on the
/// web (a widening WAI-ARIA permits). Validation belongs to the group by
/// construction: `errorMessage` marks every option invalid.
class LumoRadioGroup extends StatefulWidget {
  const LumoRadioGroup({
    super.key,
    this.label,
    this.accessibilityLabel,
    required this.children,
    this.description,
    this.errorMessage,
    this.isInvalid,
    this.value,
    this.defaultValue,
    this.onChanged,
    this.orientation = LumoRadioOrientation.vertical,
    this.isDisabled = false,
    this.isReadOnly = false,
  }) : assert(label != null || accessibilityLabel != null, 'A radio group needs a visible label or an accessibilityLabel — never neither.');
  /// The name this control is announced by, and painted where the family shows one.
  final String? label;
  /// The announced name, for when it must differ from the visible text.
  final String? accessibilityLabel;
  /// The children, in reading order.
  final List<Widget> children;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// Supplying one marks the group invalid.
  final String? errorMessage;
  /// Overrides the invalid state derived from `errorMessage`.
  final bool? isInvalid;
  /// Controlled selection; `null` leaves the state to the widget (`defaultValue`).
  final String? value;
  /// The starting value for an uncontrolled control.
  final String? defaultValue;
  /// Called with the new value when the user changes it. Omitting it makes the control read-only.
  final ValueChanged<String>? onChanged;
  /// Which axis the control runs along.
  final LumoRadioOrientation orientation;
  /// Whether the control is disabled.
  final bool isDisabled;
  /// Whether the input can be selected but not changed by the user.
  final bool isReadOnly;

  @override
  State<LumoRadioGroup> createState() => _LumoRadioGroupState();
}

class _LumoRadioGroupState extends State<LumoRadioGroup> {
  late String? _uncontrolled = widget.defaultValue;
  String? get _value => widget.value ?? _uncontrolled;

  void _select(String next) {
    if (widget.value == null) setState(() => _uncontrolled = next);
    widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final invalid = widget.isInvalid ?? widget.errorMessage != null;
    final list = widget.orientation == LumoRadioOrientation.horizontal
        // Wrap lays out along the inline axis and mirrors under Directionality — `gap`, never a margin on the option.
        ? Wrap(spacing: 24, runSpacing: 8, children: widget.children)
        // The web's `radioListVariants` vertical arm is `flex-col gap-2` — 8, not 4.
        : Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, spacing: 8, children: widget.children);
    return Semantics(
      container: true,
      // The name reaches the GROUP; the options stay their own nodes.
      explicitChildNodes: true,
      label: widget.accessibilityLabel ?? widget.label,
      hint: widget.description,
      child: Opacity(
        opacity: widget.isDisabled ? 0.5 : 1,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.label != null) ExcludeSemantics(child: Text(widget.label!, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg))),
            if (widget.label != null) const SizedBox(height: 8),
            _LumoRadioGroupScope(value: _value, select: _select, isDisabled: widget.isDisabled, isInvalid: invalid, isReadOnly: widget.isReadOnly, child: list),
            if (widget.description != null) Padding(padding: const EdgeInsets.only(top: 6), child: ExcludeSemantics(child: Text(widget.description!, style: TextStyle(fontSize: 12, color: c.fgMuted)))),
            if (widget.errorMessage != null) Padding(padding: const EdgeInsets.only(top: 6), child: Semantics(liveRegion: true, child: Text(widget.errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)))),
          ],
        ),
      ),
    );
  }
}

/// One option: `value` REQUIRED (what the group reports), `label` REQUIRED (each
/// radio names ITSELF — inheriting the group's name would announce five options
/// all called «روش پرداخت»). The circle sits at the inline START; the dot
/// scales from the centre, direction-neutrally. Announced as a member of an
/// exclusive group with its checked state. No `errorMessage` here — validation
/// belongs to the group.
///
/// **The hit area is at least [LumoControl.lg] (44) square.** The web's
/// `radioVariants` is `w-fit` and unheighted, which under a pointer is right and
/// under a thumb is not: measured in a 360 dp column an option labelled «ای» was
/// 56.5×36 and the drawn circle inside it is 20×20. The floor is applied as a
/// MINIMUM on the row, so a long option still sizes to its words and nothing
/// drawn moves — the circle is still at the inline start and the label still
/// beside it; only transparent row grows. The dot's scale stands still under
/// `disableAnimations`.
class LumoRadio extends StatelessWidget {
  const LumoRadio({super.key, required this.value, required this.label, this.description, this.isDisabled = false});
  /// The current value. Supply it with `onChanged` for a controlled widget; omit both and the widget owns its own.
  final String value;
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final group = _LumoRadioGroupScope.of(context);
    // «Reduce motion» is the platform's answer, not a parameter of ours — the
    // same spelling as `disclosure.dart`: the dot appears at full size at once.
    final motion = !MediaQuery.disableAnimationsOf(context);
    final selected = group.value == value;
    final disabled = isDisabled || group.isDisabled;
    final inert = disabled || group.isReadOnly;
    final circle = SizedBox(
      width: 20,
      height: 20,
      child: DecoratedBox(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: selected ? c.accent : c.surface,
          border: Border.all(color: group.isInvalid ? c.critical : selected ? c.accent : c.borderControl),
        ),
        child: Center(
          child: AnimatedScale(
            scale: selected ? 1 : 0,
            duration: motion ? const Duration(milliseconds: 120) : Duration.zero,
            child: Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: c.accentFg)),
          ),
        ),
      ),
    );
    final row = Semantics(
      inMutuallyExclusiveGroup: true,
      checked: selected,
      enabled: !disabled,
      label: label,
      hint: description,
      child: InkWell(
        onTap: inert ? null : () => group.select?.call(value),
        borderRadius: BorderRadius.circular(LumoRadius.md),
        child: ConstrainedBox(
          // The 44 px touch floor on BOTH axes — see the docblock.
          constraints: const BoxConstraints(minWidth: LumoControl.lg, minHeight: LumoControl.lg),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // The visible text is excluded: the node above carries the name, so it is announced ONCE.
              ExcludeSemantics(child: circle),
              const SizedBox(width: 8),
              Flexible(child: ExcludeSemantics(child: Text(label, style: TextStyle(fontSize: 14, color: c.fg)))),
            ],
          ),
        ),
      ),
    );
    return Opacity(
      opacity: disabled && !group.isDisabled ? 0.5 : 1,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          row,
          // Indented past the circle (20 + 8) on the inline axis, as the web's `ps-7`; read as the hint.
          if (description != null) Padding(padding: const EdgeInsetsDirectional.only(start: 28, top: 4), child: ExcludeSemantics(child: Text(description!, style: TextStyle(fontSize: 12, color: c.fgMuted)))),
        ],
      ),
    );
  }
}
