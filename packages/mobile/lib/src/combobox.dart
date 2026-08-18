import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole, SemanticsValidationResult;

import 'scope.dart';
import 'tokens.g.dart';

/// One suggestion of a `LumoCombobox`: `id` is what the field reports, `label`
/// the announced and displayed text (the web's `ComboBoxItem` `id` + children).
class LumoComboboxOption {
  const LumoComboboxOption({required this.id, required this.label, this.isDisabled = false});

  /// The stable key handed back through `onChanged`.
  final String id;

  /// The announced and displayed text, and what the built-in filter matches.
  final String label;
  /// Whether the control is disabled.
  final bool isDisabled;
}

/// A text field that filters a list — the web `ComboBox` (Base UI's Combobox),
/// with `autocomplete.tsx`'s Persian folding as the built-in filter. ONE widget
/// for both web components: `Autocomplete` is the same control minus the
/// trigger button, and a phone has no room for two shapes of the same field.
///
/// **The list is INLINE, under the field — not `showLumoPopover`.** A popover
/// is a `PopupRoute`: pushing it takes focus off the `TextField`, which ends
/// the typing that is the whole point of a combobox, and on a phone the
/// keyboard already covers the space an anchored surface would take. So the
/// suggestions render in the field's own subtree while it has focus, the
/// keyboard pushes both, and nothing is announced as a route. Consequence,
/// stated because it is a real divergence from the web: the list takes layout
/// space and moves what sits below it.
///
/// Announced strings, all REQUIRED: `label` (the field's name),
/// `suggestionsLabel` (the list's name — the web's, and Base UI names nothing),
/// `emptyLabel` (what a reader is told when nothing matches) and `clearLabel`
/// (an ✕ is not a name).
///
/// Semantics: the field is a **`textField`**, not `SemanticsRole.comboBox` —
/// checked against Flutter 3.35.2, where `comboBox` is one of the roles whose
/// debug validator is still `_unimplemented` and THROWS
/// («Missing checks for role SemanticsRole.comboBox») the moment a node carries
/// it. The list is a named `SemanticsRole.list` and the option matching `value`
/// is announced `selected`, which is what a reader needs from either shape.
///
/// The ✕ and the option rows are `LumoControl.lg` of HIT AREA around drawings
/// that keep the web's scale (`IconButton size="sm"`; `px-2 py-1.5` on a row).
/// A stated mobile deviation: the web's 29-px ✕ and ~32-px row are mouse sizes.
/// `isRequired` is the web's own prop (`ComboBoxProps.isRequired`) and reaches
/// the reader as `SemanticsFlag.isRequired`; `errorMessage` also puts
/// `SemanticsValidationResult.invalid` on the field, the state the web spells
/// `aria-invalid`. There is no `isInvalid`: the web `ComboBox` has none either.
///
/// `onSearch` hands the query to the caller AND turns the built-in filter off:
/// a caller that fetches its own matches owns `options` outright, and filtering
/// an already-filtered list a second time only hides rows.
class LumoCombobox extends StatefulWidget {
  const LumoCombobox({
    super.key,
    required this.label,
    required this.options,
    required this.suggestionsLabel,
    required this.emptyLabel,
    required this.clearLabel,
    this.value,
    this.onChanged,
    this.placeholder,
    this.allowsCustomValue = false,
    this.onSearch,
    this.description,
    this.errorMessage,
    this.isRequired = false,
    this.isDisabled = false,
  });

  /// Announced and displayed name. REQUIRED — an unnamed field is a defect.
  final String label;
  /// The options to choose from, in reading order.
  final List<LumoComboboxOption> options;

  /// Name of the suggestion list. REQUIRED — the web's `suggestionsLabel`.
  final String suggestionsLabel;

  /// What the list shows when nothing matches. REQUIRED.
  final String emptyLabel;

  /// Name of the ✕ that empties the field. REQUIRED.
  final String clearLabel;

  /// The selected option id, or a raw string when `allowsCustomValue`.
  /// Controlled when non-null; leaving it null lets the widget keep its own
  /// choice, the way `LumoSearchField` and `LumoCheckbox` do.
  final String? value;

  /// Called with the chosen id, with the typed text when `allowsCustomValue`
  /// accepts one, and with `null` when the field is cleared.
  final ValueChanged<String?>? onChanged;
  /// Placeholder text shown while the field is empty. Never a substitute for the label.
  final String? placeholder;

  /// Accept text that matches no option: submitting commits it as the value.
  final bool allowsCustomValue;

  /// Called with the query on every keystroke. Providing it turns the built-in
  /// filter OFF — the caller's `options` are taken as already matched.
  final ValueChanged<String>? onSearch;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;

  /// Shown under the field and announced. Supplying one marks it invalid.
  final String? errorMessage;

  /// The web's `isRequired`: draws the « *» marker and sets the reader's
  /// `required` state.
  final bool isRequired;
  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  State<LumoCombobox> createState() => _LumoComboboxState();
}

class _LumoComboboxState extends State<LumoCombobox> {
  final _controller = TextEditingController();
  final _focus = FocusNode();
  bool _typed = false;

  /// The widget's own choice, used only while `value` is null — a caller that
  /// controls the field always wins, and `didUpdateWidget` hands authority back.
  String? _uncontrolled;
  String? get _value => widget.value ?? _uncontrolled;

  @override
  void initState() {
    super.initState();
    _controller.text = _labelOf(_value) ?? '';
    _focus.addListener(() {
      if (!_focus.hasFocus) {
        // Leaving without a match: a strict combobox snaps back to the value it
        // reports, so the text can never claim a selection that is not there.
        if (!widget.allowsCustomValue) _controller.text = _labelOf(_value) ?? '';
        _typed = false;
      }
      setState(() {});
    });
  }

  @override
  void didUpdateWidget(LumoCombobox old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value) {
      _uncontrolled = widget.value;
      if (!_focus.hasFocus) _controller.text = _labelOf(_value) ?? '';
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  String? _labelOf(String? id) {
    if (id == null) return null;
    for (final o in widget.options) {
      if (o.id == id) return o.label;
    }
    return widget.allowsCustomValue ? id : null;
  }

  List<LumoComboboxOption> get _visible {
    // The caller filters when it asked for the query; otherwise the fold does.
    if (widget.onSearch != null) return widget.options;
    final query = lumoFoldForSearch(_controller.text.trim());
    if (query.isEmpty || !_typed) return widget.options;
    return widget.options.where((o) => lumoFoldForSearch(o.label).contains(query)).toList();
  }

  void _select(LumoComboboxOption option) {
    _uncontrolled = option.id;
    _controller.text = option.label;
    _typed = false;
    _focus.unfocus();
    widget.onChanged?.call(option.id);
  }

  void _clear() {
    _uncontrolled = null;
    _controller.clear();
    _typed = false;
    widget.onSearch?.call('');
    widget.onChanged?.call(null);
    setState(() {});
  }

  void _submit(String text) {
    final trimmed = text.trim();
    for (final o in _visible) {
      if (!o.isDisabled && o.label == trimmed) {
        _select(o);
        return;
      }
    }
    if (widget.allowsCustomValue && trimmed.isNotEmpty) {
      _uncontrolled = trimmed;
      _typed = false;
      _focus.unfocus();
      widget.onChanged?.call(trimmed);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final invalid = widget.errorMessage != null;
    final open = _focus.hasFocus && !widget.isDisabled;
    final visible = _visible;
    return Opacity(
      opacity: widget.isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Excluded: the name lives on the field node, so it is announced ONCE.
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
          // The input ROW is `LumoControl.lg` tall even though the box draws
          // `LumoControl.md`: that is where the ✕'s touch target comes from.
          ConstrainedBox(
            constraints: const BoxConstraints(minHeight: LumoTouch.floor),
            child: Stack(
              alignment: AlignmentDirectional.centerStart,
              children: [
                // `MergeSemantics`: name + editable = ONE text-field node.
                MergeSemantics(
                  child: Semantics(
                    label: widget.label,
                    textField: true,
                    enabled: !widget.isDisabled,
                    isRequired: widget.isRequired ? true : null,
                    validationResult: invalid ? SemanticsValidationResult.invalid : SemanticsValidationResult.none,
                    hint: [if (widget.description != null) widget.description!, if (widget.errorMessage != null) widget.errorMessage!].join('. '),
                    child: TextField(
                      controller: _controller,
                      focusNode: _focus,
                      enabled: !widget.isDisabled,
                      onChanged: (v) {
                        _typed = true;
                        widget.onSearch?.call(v);
                        setState(() {});
                      },
                      onSubmitted: _submit,
                      textInputAction: TextInputAction.search,
                      style: TextStyle(fontSize: 14, color: c.fg),
                      decoration: InputDecoration(
                        hintText: widget.placeholder,
                        hintStyle: TextStyle(color: c.fgSubtle),
                        // Room for the ✕ and the chevron at the end — logical, so both mirror.
                        contentPadding: const EdgeInsetsDirectional.only(start: 12, end: 60, top: 8, bottom: 8),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(LumoRadius.md),
                          borderSide: BorderSide(color: invalid ? c.critical : c.borderControl),
                        ),
                      ),
                    ),
                  ),
                ),
                PositionedDirectional(
                  end: 0,
                  top: 0,
                  bottom: 0,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // The ✕ owns its gesture rather than being a `LumoIconButton`,
                      // because a button sized `sm` IS its own 29-px hit area — the
                      // target has to be the outer box, and the pill draws inside it.
                      if (_controller.text.isNotEmpty)
                        Semantics(
                          container: true,
                          button: true,
                          enabled: !widget.isDisabled,
                          label: widget.clearLabel,
                          child: Tooltip(
                            message: widget.clearLabel,
                            excludeFromSemantics: true,
                            child: InkWell(
                              onTap: widget.isDisabled ? null : _clear,
                              borderRadius: BorderRadius.circular(LumoRadius.md),
                              child: SizedBox(
                                width: LumoControl.lg,
                                height: LumoControl.lg,
                                child: Center(
                                  child: SizedBox(
                                    width: LumoControl.sm,
                                    height: LumoControl.sm,
                                    child: ExcludeSemantics(child: Icon(Icons.close, size: 16, color: c.fgMuted)),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      // Decoration: the field itself opens the list, so the chevron is not a control.
                      // No inline-start padding: the ✕'s own transparent margin is the gap.
                      ExcludeSemantics(
                        child: IgnorePointer(
                          child: Padding(
                            padding: const EdgeInsetsDirectional.only(end: 6),
                            child: Icon(Icons.expand_more, size: 18, color: c.fgMuted),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (open)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: c.surface,
                  border: Border.all(color: c.border),
                  borderRadius: BorderRadius.circular(LumoRadius.md),
                ),
                child: visible.isEmpty
                    ? Padding(
                        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                        // A REAL live region, and the one kind that earns it: «no
                        // matches» is not on the field's hint, and it appears while
                        // the user is typing — so the node must carry the words
                        // itself. (Contrast the errorMessage below, which the hint
                        // already announces.)
                        child: Semantics(liveRegion: true, child: Text(widget.emptyLabel, style: TextStyle(fontSize: 13, color: c.fgMuted))),
                      )
                    : Semantics(
                        container: true,
                        explicitChildNodes: true,
                        label: widget.suggestionsLabel,
                        role: SemanticsRole.list,
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxHeight: 240),
                          child: ListView(
                            shrinkWrap: true,
                            padding: const EdgeInsets.all(4),
                            children: [for (final o in visible) _Option(option: o, isSelected: o.id == _value, onTap: () => _select(o))],
                          ),
                        ),
                      ),
              ),
            ),
          if (widget.description != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: ExcludeSemantics(
                child: Text(widget.description!, style: TextStyle(fontSize: 12, color: c.fgMuted)),
              ),
            ),
          if (invalid)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: // ExcludeSemantics, and deliberately NOT `Semantics(liveRegion: true, …)`: the message is already announced as part of the field's semantic `hint` just above, so a second node carrying the same words would say it twice. A `liveRegion` wrapped round an EXCLUDED subtree — which is what stood here — announces nothing at all: it reads as an accessibility feature and is a no-op. See test/house_rules_test.dart.
              ExcludeSemantics(
                child: Text(widget.errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)),
              ),
            ),
        ],
      ),
    );
  }
}

/// One suggestion row: a button named by its own text, announced `selected`
/// when it is the field's value, the tick at the inline END.
class _Option extends StatelessWidget {
  const _Option({required this.option, required this.isSelected, required this.onTap});
  final LumoComboboxOption option;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Semantics(
      label: option.label,
      button: true,
      selected: isSelected,
      enabled: !option.isDisabled,
      child: Opacity(
        opacity: option.isDisabled ? 0.5 : 1,
        child: InkWell(
          onTap: option.isDisabled ? null : onTap,
          borderRadius: BorderRadius.circular(LumoRadius.sm),
          child: Container(
            // The web row is `px-2 py-1.5` and lands at ~32 px, a mouse size.
            // The padding is kept; the row is floored at `LumoControl.lg` so a
            // finger has a target. Stated deviation, not drift.
            constraints: const BoxConstraints(minHeight: LumoTouch.floor),
            padding: const EdgeInsetsDirectional.symmetric(horizontal: 8, vertical: 10),
            decoration: BoxDecoration(color: isSelected ? c.surfaceSunken : Colors.transparent, borderRadius: BorderRadius.circular(LumoRadius.sm)),
            child: Row(
              children: [
                Expanded(
                  child: ExcludeSemantics(
                    child: Text(
                      option.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 14, fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400, color: c.fg),
                    ),
                  ),
                ),
                if (isSelected) ExcludeSemantics(child: Icon(Icons.check, size: 16, color: c.accent)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// What no collator folds in one pass, applied to BOTH sides of a search — the
/// Dart twin of the web's `foldPersian` (`autocomplete.tsx`): tashkeel dropped
/// first (so a mark cannot survive a remap), Arabic ك/ي/آ mapped to Persian
/// ک/ی/ا (Unicode normalisation does not relate them), ZWNJ dropped, Persian and
/// Arabic-Indic digits folded to ASCII, then lower-cased for the Latin scripts.
String lumoFoldForSearch(String text) {
  final out = StringBuffer();
  for (final rune in text.runes) {
    // Tashkeel (U+064B–U+065F, U+0670) and ZWNJ (U+200C) carry no search signal.
    if ((rune >= 0x064B && rune <= 0x065F) || rune == 0x0670 || rune == 0x200C) continue;
    if (rune >= 0x06F0 && rune <= 0x06F9) {
      out.write(rune - 0x06F0);
      continue;
    }
    if (rune >= 0x0660 && rune <= 0x0669) {
      out.write(rune - 0x0660);
      continue;
    }
    switch (rune) {
      case 0x0643: // ك Arabic kaf → ک Persian keheh
        out.writeCharCode(0x06A9);
      case 0x064A: // ي Arabic yeh → ی Persian yeh
        out.writeCharCode(0x06CC);
      case 0x0622: // آ alef madda → ا bare alef
        out.writeCharCode(0x0627);
      default:
        out.writeCharCode(rune);
    }
  }
  return out.toString().toLowerCase();
}
