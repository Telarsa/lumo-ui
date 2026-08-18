import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsValidationResult;
import 'scope.dart';
import 'tokens.g.dart';

/// A search field — the counterpart of the web `SearchField`: a text field with
/// a search glyph at the inline START and a clear ✕ at the inline END, shown
/// only while there is text. `label` REQUIRED (the field's name; `showLabel:
/// false` keeps it for the reader and drops the visible row — the name never
/// leaves), `clearLabel` REQUIRED (an ✕ is not a name). The keyboard's action
/// key is `TextInputAction.search` and fires `onSubmitted`. As on the web the
/// glyph and the ✕ are laid OVER the field (`PositionedDirectional`) so the
/// border and focus ring stay on the element that takes focus; the field's
/// padding reserves the two overlays logically. Semantics: ONE text-field node
/// named by `label` (`MergeSemantics`), and the ✕ a separate button named by
/// `clearLabel` — the glyph is decoration and excluded, and so is the painted
/// label row (the name lives on the field's node; without the exclusion it was
/// heard TWICE).
///
/// **The ✕ draws the web's `IconButton size="sm"` — `LumoControl.sm` square,
/// 16-px glyph, 4 px in from the inline end — but it HITS `LumoControl.lg`.**
/// A stated mobile deviation: 29 × 29 is under every touch guideline, and the
/// extra px are transparent, so the input row reserves `LumoControl.lg` and
/// the box draws centred inside it. The message therefore leaves
/// `InputDecoration` for a row of its own (as in combobox.dart and
/// time_field.dart): the box has to stay one fixed height for the two overlays
/// to sit on its centre line, and `errorText` grew it.
///
/// `isInvalid` and `isRequired` are the web's own props (`SearchFieldProps`),
/// and they reach the reader as STATE — `SemanticsValidationResult.invalid`
/// and `SemanticsFlag.isRequired` — not merely as words in a hint.
class LumoSearchField extends StatefulWidget {
  const LumoSearchField({
    super.key,
    required this.label,
    required this.clearLabel,
    this.showLabel = true,
    this.placeholder,
    this.value,
    this.defaultValue,
    this.controller,
    this.onChanged,
    this.onSubmitted,
    this.onClear,
    this.description,
    this.errorMessage,
    this.isInvalid,
    this.isRequired = false,
    this.isDisabled = false,
    this.autoFocus = false,
  }) : assert(value == null || controller == null, 'Pass `value` (controlled) or `controller`, not both.');

  /// Announced (and, unless `showLabel` is false, displayed) name. REQUIRED.
  final String label;

  /// The clear button's accessible name. REQUIRED — a default would be English.
  final String clearLabel;

  /// Hide the label row; the name stays on the field.
  final bool showLabel;
  /// Placeholder text shown while the field is empty. Never a substitute for the label.
  final String? placeholder;

  /// Controlled text; the field follows it on every build.
  final String? value;

  /// Uncontrolled initial text.
  final String? defaultValue;

  /// The app's own controller, when it wants one; exclusive with `value`.
  final TextEditingController? controller;
  /// Called with the new value when the user changes it. Omitting it makes the control read-only.
  final ValueChanged<String>? onChanged;

  /// Fires with the text when the keyboard's search key is pressed.
  final ValueChanged<String>? onSubmitted;

  /// Fires after the ✕ emptied the field (`onChanged('')` fires too).
  final VoidCallback? onClear;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// An error message for the field. Announced as the control's hint and marks it invalid.
  final String? errorMessage;

  /// Marks the field wrong WITHOUT a sentence (the web's `isInvalid`). Null
  /// derives it from `errorMessage`.
  final bool? isInvalid;

  /// The web's `isRequired`. Draws the « *» marker and sets the reader's
  /// `required` state.
  final bool isRequired;
  /// Whether the control is disabled.
  final bool isDisabled;
  /// Whether the control takes focus when it first appears.
  final bool autoFocus;

  @override
  State<LumoSearchField> createState() => _LumoSearchFieldState();
}

class _LumoSearchFieldState extends State<LumoSearchField> {
  TextEditingController? _own;
  final _focus = FocusNode();
  TextEditingController get _controller => widget.controller ?? (_own ??= TextEditingController(text: widget.value ?? widget.defaultValue));

  @override
  void initState() {
    super.initState();
    // Repaint on every edit: the ✕ exists only while the field is filled.
    _controller.addListener(_onText);
  }

  void _onText() => setState(() {});

  @override
  void didUpdateWidget(LumoSearchField old) {
    super.didUpdateWidget(old);
    if (old.controller != widget.controller) {
      (old.controller ?? _own)?.removeListener(_onText);
      _controller.addListener(_onText);
    }
    if (widget.value != null && widget.value != _controller.text) {
      _controller.value = TextEditingValue(
        text: widget.value!,
        selection: TextSelection.collapsed(offset: widget.value!.length),
      );
    }
  }

  @override
  void dispose() {
    widget.controller?.removeListener(_onText);
    _own?.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _clear() {
    _controller.clear();
    widget.onChanged?.call('');
    widget.onClear?.call();
    _focus.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final filled = _controller.text.isNotEmpty;
    final invalid = widget.isInvalid ?? (widget.errorMessage != null);
    return Opacity(
      opacity: widget.isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.showLabel) ...[
            // Excluded: the name lives on the field's node, so it is heard ONCE.
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
          // The input ROW is `LumoControl.lg` tall even though the box draws
          // `LumoControl.md`: that is where the ✕'s touch target comes from.
          ConstrainedBox(
            constraints: const BoxConstraints(minHeight: LumoTouch.floor),
            child: Stack(
              alignment: AlignmentDirectional.centerStart,
              children: [
                // `MergeSemantics`: name + editable = ONE text-field node (a bare `Semantics(label:)`
                // would leave the name on a parent the reader lands on separately from the field).
                MergeSemantics(
                  child: Semantics(
                    label: widget.label,
                    hint: [if (widget.description != null) widget.description, if (widget.errorMessage != null) widget.errorMessage].join('. '),
                    textField: true,
                    enabled: !widget.isDisabled,
                    // `null`, not `false`: an optional field carries no required state.
                    isRequired: widget.isRequired ? true : null,
                    validationResult: invalid ? SemanticsValidationResult.invalid : SemanticsValidationResult.none,
                    child: TextField(
                      controller: _controller,
                      focusNode: _focus,
                      enabled: !widget.isDisabled,
                      autofocus: widget.autoFocus,
                      onChanged: widget.onChanged,
                      onSubmitted: widget.onSubmitted,
                      textInputAction: TextInputAction.search,
                      style: TextStyle(fontSize: 14, color: c.fg),
                      decoration: InputDecoration(
                        hintText: widget.placeholder,
                        hintStyle: TextStyle(color: c.fgSubtle),
                        // Room for the glyph at the start and the ✕ at the end — logical, so both mirror.
                        // `ps-9 pe-9` on the web; the ✕'s transparent margin sits outside it.
                        contentPadding: const EdgeInsetsDirectional.only(start: 36, end: 36, top: 8, bottom: 8),
                        // Invalid is drawn here rather than by `errorText`, which
                        // would also grow the box and announce the words twice.
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(LumoRadius.md),
                          borderSide: BorderSide(color: invalid ? c.critical : c.borderControl),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(LumoRadius.md),
                          borderSide: BorderSide(color: invalid ? c.critical : c.focus, width: LumoFocus.width),
                        ),
                      ),
                    ),
                  ),
                ),
                // The glyph: decoration at the inline start, never a name.
                PositionedDirectional(
                  start: 12,
                  top: 0,
                  bottom: 0,
                  child: ExcludeSemantics(
                    child: IgnorePointer(
                      child: Center(child: Icon(Icons.search, size: 16, color: c.fgSubtle)),
                    ),
                  ),
                ),
                // The ✕: only while filled, at the inline end, named by clearLabel.
                // Its own gesture rather than `LumoIconButton`, because a button
                // sized `sm` IS its hit area — the target has to be the outer box.
                if (filled)
                  PositionedDirectional(
                    end: 0,
                    top: 0,
                    bottom: 0,
                    child: Semantics(
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
                          // The TARGET is the touch floor; the ✕ inside it is
                          // still drawn at the `sm` step.
                          child: SizedBox(
                            width: LumoTouch.floor,
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
                  ),
              ],
            ),
          ),
          // Excluded: the description is already this node's hint (text_field.dart
          // states the rule) — visible once, announced once.
          if (widget.description != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: ExcludeSemantics(
                child: Text(widget.description!, style: TextStyle(fontSize: 12, color: c.fgMuted)),
              ),
            ),
          // Excluded for the same reason, and a live region so a message that
          // ARRIVES is spoken; the words are the field's hint already.
          if (widget.errorMessage != null)
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
