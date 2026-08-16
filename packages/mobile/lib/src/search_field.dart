import 'package:flutter/material.dart';
import 'button.dart';
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
/// `clearLabel` — the glyph is decoration and excluded.
class LumoSearchField extends StatefulWidget {
  const LumoSearchField({super.key, required this.label, required this.clearLabel, this.showLabel = true, this.placeholder, this.value, this.defaultValue, this.controller, this.onChanged, this.onSubmitted, this.onClear, this.description, this.errorMessage, this.isDisabled = false, this.autoFocus = false})
      : assert(value == null || controller == null, 'Pass `value` (controlled) or `controller`, not both.');
  /// Announced (and, unless `showLabel` is false, displayed) name. REQUIRED.
  final String label;
  /// The clear button's accessible name. REQUIRED — a default would be English.
  final String clearLabel;
  /// Hide the label row; the name stays on the field.
  final bool showLabel;
  final String? placeholder;
  /// Controlled text; the field follows it on every build.
  final String? value;
  /// Uncontrolled initial text.
  final String? defaultValue;
  /// The app's own controller, when it wants one; exclusive with `value`.
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  /// Fires with the text when the keyboard's search key is pressed.
  final ValueChanged<String>? onSubmitted;
  /// Fires after the ✕ emptied the field (`onChanged('')` fires too).
  final VoidCallback? onClear;
  final String? description;
  final String? errorMessage;
  final bool isDisabled;
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
      _controller.value = TextEditingValue(text: widget.value!, selection: TextSelection.collapsed(offset: widget.value!.length));
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
    return Opacity(
      opacity: widget.isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.showLabel) ...[
            Text(widget.label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg)),
            const SizedBox(height: 6),
          ],
          Stack(
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
                      errorText: widget.errorMessage,
                      errorStyle: TextStyle(color: c.critical, fontSize: 12),
                      // Room for the glyph at the start and the ✕ at the end — logical, so both mirror.
                      contentPadding: const EdgeInsetsDirectional.only(start: 36, end: 36, top: 8, bottom: 8),
                    ),
                  ),
                ),
              ),
              // The glyph: decoration at the inline start, never a name.
              PositionedDirectional(
                start: 12,
                top: 0,
                height: LumoControl.md,
                child: ExcludeSemantics(child: IgnorePointer(child: Icon(Icons.search, size: 16, color: c.fgSubtle))),
              ),
              // The ✕: only while filled, at the inline end, named by clearLabel.
              if (filled)
                PositionedDirectional(
                  end: 4,
                  top: 0,
                  height: LumoControl.md,
                  child: Center(
                    child: LumoIconButton(label: widget.clearLabel, size: LumoButtonSize.sm, isDisabled: widget.isDisabled, onPressed: _clear, child: Icon(Icons.close, size: 16, color: c.fgMuted)),
                  ),
                ),
            ],
          ),
          if (widget.description != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(widget.description!, style: TextStyle(fontSize: 12, color: c.fgMuted))),
        ],
      ),
    );
  }
}
