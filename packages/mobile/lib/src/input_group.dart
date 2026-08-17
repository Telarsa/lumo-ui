import 'package:flutter/material.dart';
import 'button.dart';
import 'scope.dart';
import 'tokens.g.dart';

enum LumoInputGroupSize { sm, md, lg }

const _groupHeight = {LumoInputGroupSize.sm: LumoControl.sm, LumoInputGroupSize.md: LumoControl.md, LumoInputGroupSize.lg: LumoControl.lg};

/// A text field with ADDONS attached at the reading edges of the box —
/// `packages/ui/src/input-group.tsx`.
///
///     LumoInputGroup(label: 'مبلغ', isNumeric: true, trailing: Text('تومان'))
///     LumoInputGroup(label: 'نشانی صفحه', trailing: LumoInputGroupButton(label: 'رونوشت نشانی', …))
///
/// COMPOSED, not compositional: `label` is REQUIRED and is the field's name,
/// the same decision `text_field.dart` and the web's `InputGroup` take against
/// the shadcn vendors' unlabelled input.
///
/// The web pins its adornments as absolute overlays inside the input's padding;
/// a phone has less room, so here they are ATTACHED boxes sharing the field's
/// border — the shape Material's `TextField` prefix and forui's
/// `FTextField.prefixBuilder` draw, and what the «تومان» suffix of a Persian
/// amount field actually wants.
///
/// THE CORNER TRAP IS THE SAME ONE AS `button_group.dart`. An addon at the
/// reading START must round the two corners on the START side and leave the
/// pair at the seam square — `BorderRadiusDirectional.horizontal(start:)`,
/// which is the RIGHT pair under fa-IR and the LEFT pair under en-US. The
/// divider between an addon and the input is a `BorderDirectional`, so it too
/// lands on the seam and not on a named edge.
///
/// Semantics: ONE text-field node named by `label`, with `description` and
/// `errorMessage` as its hint; the visible copies of both are excluded so a
/// reader hears each once (the rule `text_field.dart` records). An addon is
/// rendered as given: a decorative glyph is the caller's to wrap in
/// `ExcludeSemantics`, and a control must carry its own name — the same
/// contract as `LumoTextField.suffix`.
class LumoInputGroup extends StatefulWidget {
  const LumoInputGroup({
    super.key,
    required this.label,
    this.leading,
    this.trailing,
    this.description,
    this.errorMessage,
    this.placeholder,
    this.controller,
    this.onChanged,
    this.onSubmitted,
    this.focusNode,
    this.keyboardType,
    this.textInputAction,
    this.size = LumoInputGroupSize.md,
    this.isRequired = false,
    this.isDisabled = false,
    this.isReadOnly = false,
    this.isInvalid,
    this.isNumeric = false,
    this.obscureText = false,
    this.autofocus = false,
    this.autofillHints,
    this.showLabel = true,
  });

  /// Announced and displayed name. Required: an unnamed field is a defect.
  final String label;

  /// The addon at the reading START — a unit, a prefix, a glyph.
  final Widget? leading;

  /// The addon at the reading END — a unit, or a `LumoInputGroupButton`.
  final Widget? trailing;

  /// Help text under the box; also the node's hint.
  final String? description;

  /// Supplying one marks the field invalid, as on the web.
  final String? errorMessage;
  final String? placeholder;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final FocusNode? focusNode;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final LumoInputGroupSize size;
  final bool isRequired;
  final bool isDisabled;
  final bool isReadOnly;

  /// Overrides the invalid state derived from [errorMessage].
  final bool? isInvalid;

  /// The value is digits (an amount, a code): laid out left-to-right inside an
  /// RTL form and given a numeric keyboard. A data-type fact, not a direction
  /// flag — the same parameter `LumoTextField` carries, for the same reason.
  final bool isNumeric;
  final bool obscureText;
  final bool autofocus;
  final Iterable<String>? autofillHints;

  /// The label is always the field's NAME; `false` hides it visually and keeps
  /// it announced.
  final bool showLabel;

  @override
  State<LumoInputGroup> createState() => _LumoInputGroupState();
}

class _LumoInputGroupState extends State<LumoInputGroup> {
  FocusNode? _own;
  FocusNode get _node => widget.focusNode ?? (_own ??= FocusNode());
  bool _focused = false;

  @override
  void initState() {
    super.initState();
    _node.addListener(_onFocus);
  }

  @override
  void didUpdateWidget(LumoInputGroup old) {
    super.didUpdateWidget(old);
    if (old.focusNode != widget.focusNode) {
      old.focusNode?.removeListener(_onFocus);
      _own?.removeListener(_onFocus);
      _node.addListener(_onFocus);
    }
  }

  void _onFocus() {
    if (mounted && _focused != _node.hasFocus) setState(() => _focused = _node.hasFocus);
  }

  @override
  void dispose() {
    widget.focusNode?.removeListener(_onFocus);
    _own?.removeListener(_onFocus);
    _own?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final invalid = widget.isInvalid ?? (widget.errorMessage != null);
    final height = _groupHeight[widget.size]!;
    // One pixel inside the outer curve, so the addon's fill follows the border rather than crossing it.
    const inner = Radius.circular(LumoRadius.md - 1);
    final borderColour = invalid
        ? c.critical
        : _focused
        ? c.focus
        : c.borderControl;

    Widget addon(Widget child, {required bool atStart}) => Container(
      padding: const EdgeInsetsDirectional.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: c.surfaceSunken,
        // The START addon rounds its START corners and squares the seam. Which
        // physical pair that is, `Directionality` decides — never this line.
        borderRadius: atStart ? const BorderRadiusDirectional.horizontal(start: inner) : const BorderRadiusDirectional.horizontal(end: inner),
        // The divider sits on the seam: the END side of a start addon, the START side of an end addon.
        border: atStart ? BorderDirectional(end: BorderSide(color: c.border)) : BorderDirectional(start: BorderSide(color: c.border)),
      ),
      child: Center(
        widthFactor: 1,
        child: DefaultTextStyle.merge(
          style: TextStyle(fontSize: 14, color: c.fgMuted),
          child: IconTheme.merge(
            data: IconThemeData(size: 16, color: c.fgMuted),
            child: child,
          ),
        ),
      ),
    );

    return Opacity(
      opacity: widget.isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.showLabel) ...[
            ExcludeSemantics(
              child: Text.rich(
                TextSpan(
                  text: widget.label,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg),
                  children: [
                    if (widget.isRequired)
                      TextSpan(
                        text: ' *',
                        style: TextStyle(color: c.critical),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 6),
          ],
          Container(
            height: height,
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: BorderRadius.circular(LumoRadius.md),
              border: Border.all(color: borderColour, width: _focused ? LumoFocus.width : 1),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (widget.leading != null) addon(widget.leading!, atStart: true),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsetsDirectional.symmetric(horizontal: 10),
                    child: Center(
                      // The name sits on the FIELD, not on the box: an addon is
                      // its own node (a «تومان» is information, a button is a
                      // control), and a name that swallowed them would announce
                      // «مبلغ سفارش تومان» as though that were the field's name.
                      child: Semantics(
                        label: widget.label,
                        hint: [if (widget.description != null) widget.description, if (widget.errorMessage != null) widget.errorMessage].join('. '),
                        textField: true,
                        enabled: !widget.isDisabled,
                        child: TextField(
                          controller: widget.controller,
                          focusNode: _node,
                          onChanged: widget.onChanged,
                          onSubmitted: widget.onSubmitted,
                          enabled: !widget.isDisabled,
                          readOnly: widget.isReadOnly,
                          autofocus: widget.autofocus,
                          autofillHints: widget.autofillHints,
                          obscureText: widget.obscureText,
                          keyboardType: widget.keyboardType ?? (widget.isNumeric ? TextInputType.number : null),
                          textInputAction: widget.textInputAction,
                          // Digits read left-to-right in every script; the box stays where the form put it.
                          textDirection: widget.isNumeric ? TextDirection.ltr : null,
                          style: TextStyle(fontSize: 14, color: c.fg),
                          decoration: InputDecoration(
                            isDense: true,
                            filled: false,
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            disabledBorder: InputBorder.none,
                            contentPadding: EdgeInsets.zero,
                            hintText: widget.placeholder,
                            hintStyle: TextStyle(color: c.fgSubtle),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                if (widget.trailing != null) addon(widget.trailing!, atStart: false),
              ],
            ),
          ),
          // The visible copies are EXCLUDED: both are already this node's hint,
          // so without this a reader hears each of them twice.
          if (widget.description != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: ExcludeSemantics(
                child: Text(widget.description!, style: TextStyle(fontSize: 12, color: c.fgMuted)),
              ),
            ),
          if (widget.errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: ExcludeSemantics(
                child: Text(widget.errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)),
              ),
            ),
        ],
      ),
    );
  }
}

/// An icon-only control inside an addon slot — the web's `InputGroupButton`.
/// `label` stays REQUIRED (an icon is not a name); ghost and small by default,
/// because the group already draws the box.
class LumoInputGroupButton extends StatelessWidget {
  const LumoInputGroupButton({super.key, required this.label, required this.child, this.onPressed, this.variant = LumoButtonVariant.ghost, this.isDisabled = false});
  final String label;
  final Widget child;
  final VoidCallback? onPressed;
  final LumoButtonVariant variant;
  final bool isDisabled;

  @override
  Widget build(BuildContext context) => LumoIconButton(label: label, size: LumoButtonSize.sm, variant: variant, isDisabled: isDisabled, onPressed: onPressed, child: child);
}
