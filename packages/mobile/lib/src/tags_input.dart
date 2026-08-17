import 'package:flutter/material.dart';

import 'button.dart';
import 'chip.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// A field whose value is a LIST of short strings the reader writes: skills,
/// neighbourhoods, keywords — the web `TagsInput` (`tags-input.tsx`).
///
/// The tags are `LumoChip`s, imported from `chip.dart` rather than redrawn:
/// a tag here and a tag in a `LumoTagGroup` are the same object to a reader,
/// and two implementations of a chip is how they stop being.
///
/// **Announced strings, all REQUIRED**: `label` (the field's name),
/// `addLabel` (the ✚ — a glyph is not a name) and `removeLabel`, a FUNCTION of
/// the tag's own text, because «حذف تهران» is not English with the words
/// swapped — the same shape as `LumoTagGroup.removeLabel` and
/// `LumoMultiSelect.removeLabel`.
///
/// **Committing a tag** has two doors on a phone, and it needs both: the
/// keyboard's action key (`TextInputAction.done`, which is where a thumb
/// already is) and a real ✚ button (which is where a reader who cannot see the
/// keyboard's action key looks, and the only door a switch user has). The web
/// commits on Enter alone because a physical keyboard is a given there. Pasted
/// or typed text containing one of `splitCharacters` becomes several tags at
/// once, as on the web.
///
/// **Duplicates and the cap** are silent on the web — the addition simply does
/// not happen, which on a phone reads as a broken button. So a rejection can
/// say why: `duplicateMessage` and `maxTagsMessage` are optional (nothing is
/// announced if the app has nothing to say) and, when given, are announced as
/// a live region the moment the rejection happens.
///
/// Semantics: ONE text-field node named by `label`, carrying `description` and
/// `errorMessage` in its own `hint` — Flutter has no `aria-describedby`, so the
/// field's hint IS the binding (`text_field.dart` states the rule). The chips
/// are their own nodes in a container with no name of its own; the ✚ is a named
/// button; the drawn label, description and error are `ExcludeSemantics`, so
/// each is heard exactly once.
///
/// Web props not carried: `suggestions`/`suggestionsLabel` (an
/// `aria-activedescendant` listbox under an input is a pointer/arrow-key
/// pattern with no phone counterpart — a phone picks from a list in a sheet,
/// which is `LumoMultiSelect`, and offering a half version here would be a
/// second, worse picker) and `name` (nothing is posted by the platform).
class LumoTagsInput extends StatefulWidget {
  const LumoTagsInput({
    super.key,
    required this.label,
    required this.values,
    required this.addLabel,
    required this.removeLabel,
    this.onChanged,
    this.placeholder,
    this.maxTags,
    this.duplicateMessage,
    this.maxTagsMessage,
    this.description,
    this.errorMessage,
    this.splitCharacters = const [','],
    this.isDuplicate,
    this.isDisabled = false,
    this.showLabel = true,
  }) : assert(maxTags == null || maxTags > 0, 'maxTags is how many tags may exist; zero would make the field unusable.');

  /// Announced (and, unless `showLabel` is false, displayed) name. REQUIRED.
  final String label;

  /// The tags, controlled — the web's `value`. The widget holds only the draft.
  final List<String> values;

  /// Called with the WHOLE list after every addition or removal.
  final ValueChanged<List<String>>? onChanged;

  /// Announced name of the ✚ that commits the draft. REQUIRED.
  final String addLabel;

  /// Builds each chip's remove-button name from that chip's own text. REQUIRED.
  final String Function(String tag) removeLabel;

  /// Shown in the empty draft box.
  final String? placeholder;

  /// Upper bound on how many tags may exist; further additions are refused.
  final int? maxTags;

  /// Announced when an addition is refused because the tag is already there.
  final String? duplicateMessage;

  /// Announced when an addition is refused because [maxTags] is reached.
  final String? maxTagsMessage;

  /// Help text — drawn under the field and carried in its `hint`.
  final String? description;

  /// The error — drawn under the field, carried in its `hint`, and it marks
  /// the box invalid.
  final String? errorMessage;

  /// Characters that split typed or pasted text into separate tags.
  final List<String> splitCharacters;

  /// Decides whether a candidate is already present. Default: exact match.
  /// A Persian app usually wants `lumoFoldForSearch` on both sides.
  final bool Function(String candidate, List<String> current)? isDuplicate;

  /// Whether the control is disabled.
  final bool isDisabled;

  /// Hides the label row; the name stays on the field.
  final bool showLabel;

  @override
  State<LumoTagsInput> createState() => _LumoTagsInputState();
}

class _LumoTagsInputState extends State<LumoTagsInput> {
  final TextEditingController _draft = TextEditingController();
  final FocusNode _focus = FocusNode();

  /// The last refusal, announced once and cleared by the next edit.
  String? _notice;

  @override
  void dispose() {
    _draft.dispose();
    _focus.dispose();
    super.dispose();
  }

  bool _duplicate(String candidate, List<String> current) {
    final test = widget.isDuplicate;
    return test == null ? current.contains(candidate) : test(candidate, current);
  }

  void _commit(List<String> next, {String? notice}) {
    setState(() => _notice = notice);
    widget.onChanged?.call(next);
  }

  void _add(String input) {
    var pieces = <String>[input];
    for (final separator in widget.splitCharacters) {
      pieces = [for (final piece in pieces) ...piece.split(separator)];
    }
    final candidates = [for (final piece in pieces) piece.trim()]..removeWhere((p) => p.isEmpty);
    if (candidates.isEmpty) return;
    final next = List<String>.of(widget.values);
    String? notice;
    for (final candidate in candidates) {
      if (widget.maxTags != null && next.length >= widget.maxTags!) {
        notice ??= widget.maxTagsMessage;
        continue;
      }
      if (_duplicate(candidate, next)) {
        notice ??= widget.duplicateMessage;
        continue;
      }
      next.add(candidate);
    }
    _draft.clear();
    _commit(next, notice: notice);
    // The keyboard stays: a reader adding tags is adding more than one.
    _focus.requestFocus();
  }

  void _remove(int index) {
    final next = List<String>.of(widget.values)..removeAt(index);
    _commit(next);
  }

  @override
  Widget build(BuildContext context) {
    // Checked here, not in the const constructor: a `length` assert there is a
    // COMPILE error at every const call site (`segmented_control.dart` first).
    assert(widget.splitCharacters.isNotEmpty, 'Pass at least one separator, or the field can never split a paste.');
    final c = LumoScope.of(context).colours;
    final invalid = widget.errorMessage != null;
    final full = widget.maxTags != null && widget.values.length >= widget.maxTags!;
    final hint = [if (widget.description != null) widget.description!, if (widget.errorMessage != null) widget.errorMessage!].join('. ');
    return Opacity(
      opacity: widget.isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.showLabel) ...[
            // The name is on the field's own node below; the drawn copy is excluded.
            ExcludeSemantics(child: Text(widget.label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg))),
            const SizedBox(height: 6),
          ],
          Container(
            padding: const EdgeInsetsDirectional.symmetric(horizontal: 8, vertical: 6),
            decoration: BoxDecoration(
              color: c.surface,
              border: Border.all(color: invalid ? c.critical : c.borderControl),
              borderRadius: BorderRadius.circular(LumoRadius.md),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (widget.values.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    // No name of its own: the field is already named, and a
                    // second name here would announce it twice.
                    child: Semantics(
                      container: true,
                      explicitChildNodes: true,
                      child: Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          for (final (index, tag) in widget.values.indexed)
                            LumoChip(
                              label: tag,
                              size: LumoChipSize.sm,
                              isDisabled: widget.isDisabled,
                              removeLabel: widget.removeLabel(tag),
                              onRemove: () => _remove(index),
                            ),
                        ],
                      ),
                    ),
                  ),
                Row(
                  children: [
                    Expanded(
                      // The name and the two descriptions live on THIS node —
                      // the one the reader lands on when the field takes focus.
                      child: Semantics(
                        label: widget.label,
                        hint: hint,
                        textField: true,
                        enabled: !widget.isDisabled && !full,
                        child: TextField(
                          controller: _draft,
                          focusNode: _focus,
                          enabled: !widget.isDisabled && !full,
                          textInputAction: TextInputAction.done,
                          onChanged: (_) {
                            if (_notice != null) setState(() => _notice = null);
                          },
                          onSubmitted: _add,
                          style: TextStyle(fontSize: 14, color: c.fg),
                          decoration: InputDecoration(
                            isDense: true,
                            filled: false,
                            hintText: widget.values.isEmpty ? widget.placeholder : null,
                            hintStyle: TextStyle(color: c.fgSubtle),
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            disabledBorder: InputBorder.none,
                            contentPadding: const EdgeInsetsDirectional.symmetric(horizontal: 4, vertical: 8),
                          ),
                        ),
                      ),
                    ),
                    LumoIconButton(
                      label: widget.addLabel,
                      size: LumoButtonSize.sm,
                      isDisabled: widget.isDisabled || full,
                      onPressed: () => _add(_draft.text),
                      child: Icon(Icons.add, size: 16, color: c.fgMuted),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Drawn once, announced once: both of these are already the field's hint.
          if (widget.description != null)
            Padding(padding: const EdgeInsets.only(top: 6), child: ExcludeSemantics(child: Text(widget.description!, style: TextStyle(fontSize: 12, color: c.fgMuted)))),
          if (widget.errorMessage != null)
            Padding(padding: const EdgeInsets.only(top: 6), child: ExcludeSemantics(child: Text(widget.errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)))),
          // The refusal: its own node, carrying its own words, flagged live —
          // a live region with no label of its own announces nothing.
          if (_notice != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Semantics(liveRegion: true, child: Text(_notice!, style: TextStyle(fontSize: 12, color: c.caution))),
            ),
        ],
      ),
    );
  }
}
