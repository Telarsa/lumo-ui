import 'package:flutter/foundation.dart' show listEquals;
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole, SemanticsValidationResult;

import 'button.dart';
import 'checkbox.dart';
import 'combobox.dart' show lumoFoldForSearch;
import 'chip.dart';
import 'format.dart';
import 'scope.dart';
import 'sheet.dart';
import 'text_field.dart';
import 'tokens.g.dart';

/// One option of a `LumoMultiSelect`: `id` is what the field reports, `label`
/// the announced and displayed text (the web's `{ value, label, disabled }`).
class LumoMultiSelectOption {
  const LumoMultiSelectOption({required this.id, required this.label, this.isDisabled = false});

  /// The stable key handed back through `onChanged` — the web's `value`.
  final String id;

  /// The announced and displayed text of the option.
  final String label;
  /// Whether the control is disabled.
  final bool isDisabled;
}

/// Several choices from a list — the web `MultiSelect`, in the shape a phone
/// can actually hold. The web anchors a filtered popup under an input full of
/// chips; a phone has no room beside a control and its keyboard covers the
/// bottom half of the screen, so the options live in a **`showLumoSheet`
/// route** (never Material's `showModalBottomSheet`, whose route names itself
/// «Dialog»/«Dismiss» in English) and the chips stay under the trigger where
/// the keyboard cannot hide them. The same decision the Khroos app reached by
/// hand (`DropSelect`).
///
/// Announced strings, all REQUIRED: `label` (the field's name), `closeLabel`
/// (the sheet's ✕ and its scrim), `confirmLabel` (the footer's primary — it
/// closes the sheet; selection is applied as it happens, so confirming is a
/// dismissal, not a commit), `clearAllLabel`, `countLabel` (a FUNCTION of the
/// already-formatted count, because «۳ مورد انتخاب شده» is not English with
/// the words swapped) and `removeLabel` (a function of the chip's own text —
/// the same shape as `LumoTagGroup.removeLabel`). `searchLabel` and
/// `emptyLabel` are REQUIRED when `isSearchable` — the constructor asserts it.
///
/// Selection is CONTROLLED (`values` + `onChanged`, the web's `value` +
/// `onValueChange`); the widget mirrors it optimistically so the sheet and the
/// chips answer a tap even before the caller's `setState` lands, and
/// `didUpdateWidget` hands authority straight back to `values`.
///
/// Numbers: the footer count goes through `formatNumber`, and the overflow
/// chip past `maxChips` is «+۳» — digits only, no word in any language.
///
/// The sheet's FOOTER measures itself (the `_fit()` pattern of
/// segmented_control.dart): count sentence and two buttons share one row while
/// they fit, and the count moves to a line of its own when they do not. With
/// real Persian labels at 320 dp the single row overflowed by 36 px, and a
/// footer that sheds its arrangement is the house answer — words are never
/// truncated to keep a Row.
///
/// `isRequired` is the web's own prop (`MultiSelectProps.isRequired`); it and
/// `errorMessage` reach the reader as STATE (`SemanticsFlag.isRequired`,
/// `SemanticsValidationResult.invalid`), which is what the web spells
/// `required` and `aria-invalid`. There is no `isInvalid`: the web has none.
class LumoMultiSelect extends StatefulWidget {
  const LumoMultiSelect({
    super.key,
    required this.label,
    required this.options,
    required this.values,
    required this.closeLabel,
    required this.confirmLabel,
    required this.clearAllLabel,
    required this.countLabel,
    required this.removeLabel,
    this.onChanged,
    this.placeholder,
    this.isSearchable = false,
    this.searchLabel,
    this.emptyLabel,
    this.description,
    this.errorMessage,
    this.maxChips,
    this.isRequired = false,
    this.isDisabled = false,
  }) : assert(
         !isSearchable || (searchLabel != null && emptyLabel != null),
         'A searchable multi-select needs a searchLabel (it names the search box) and an emptyLabel (what a reader is told when nothing matches).',
       ),
       assert(maxChips == null || maxChips > 0, 'maxChips is how many chips are drawn; zero would hide every chosen value.');

  /// Announced and displayed name. REQUIRED — an unnamed field is a defect.
  final String label;
  /// The options to choose from, in reading order.
  final List<LumoMultiSelectOption> options;

  /// The chosen option ids. Controlled, as the web's `value`.
  final List<String> values;

  /// Called with the full id list after every change (the web's `onValueChange`).
  final ValueChanged<List<String>>? onChanged;

  /// Shown in the trigger while nothing is chosen.
  final String? placeholder;

  /// Name of the sheet's ✕ and of its scrim. REQUIRED.
  final String closeLabel;

  /// Name of the footer's primary button, which closes the sheet. REQUIRED.
  final String confirmLabel;

  /// Name of the footer's clear-everything button. REQUIRED.
  final String clearAllLabel;

  /// Builds the footer sentence from the ALREADY FORMATTED count («۳»).
  /// REQUIRED — a bare number announces nothing.
  final String Function(String count) countLabel;

  /// Builds each chip's remove-button name from that chip's own text.
  /// REQUIRED — an ✕ is not a name.
  final String Function(String optionLabel) removeLabel;

  /// Adds a search box above the options. `searchLabel` and `emptyLabel` become required.
  final bool isSearchable;

  /// Name of the search box (used as its placeholder too). REQUIRED when `isSearchable`.
  final String? searchLabel;

  /// What the reader is told when the query matches nothing. REQUIRED when `isSearchable`.
  final String? emptyLabel;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;

  /// Shown under the field and announced. Supplying one marks it invalid.
  final String? errorMessage;

  /// How many chips are drawn before the rest collapse into a «+۳» chip.
  final int? maxChips;

  /// The web's `isRequired`: draws the « *» marker and sets the reader's
  /// `required` state.
  final bool isRequired;
  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  State<LumoMultiSelect> createState() => _LumoMultiSelectState();
}

class _LumoMultiSelectState extends State<LumoMultiSelect> {
  /// The optimistic mirror of `values`: a tap paints immediately, the caller's
  /// next `values` overrules it. The sheet is a ROUTE built above this widget,
  /// so it listens to this rather than reading a `widget` it cannot see change.
  late final ValueNotifier<List<String>> _shown = ValueNotifier<List<String>>(List<String>.of(widget.values));

  @override
  void didUpdateWidget(LumoMultiSelect old) {
    super.didUpdateWidget(old);
    if (!listEquals(old.values, widget.values) && !listEquals(_shown.value, widget.values)) {
      _shown.value = List<String>.of(widget.values);
    }
  }

  @override
  void dispose() {
    _shown.dispose();
    super.dispose();
  }

  void _set(List<String> next) {
    _shown.value = next;
    widget.onChanged?.call(next);
  }

  void _toggle(String id, bool on) {
    final next = List<String>.of(_shown.value);
    if (on) {
      if (!next.contains(id)) next.add(id);
    } else {
      next.remove(id);
    }
    _set(next);
  }

  Future<void> _open() => showLumoSheet<void>(
    context,
    label: widget.label,
    closeLabel: widget.closeLabel,
    body: (ctx) => _MultiSelectSheet(
      options: widget.options,
      selected: _shown,
      isSearchable: widget.isSearchable,
      searchLabel: widget.searchLabel,
      emptyLabel: widget.emptyLabel,
      confirmLabel: widget.confirmLabel,
      clearAllLabel: widget.clearAllLabel,
      countLabel: widget.countLabel,
      onToggle: _toggle,
      onClearAll: () => _set(const <String>[]),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final invalid = widget.errorMessage != null;
    return ValueListenableBuilder<List<String>>(
      valueListenable: _shown,
      builder: (context, values, _) {
        final chosen = widget.options.where((o) => values.contains(o.id)).toList();
        final count = chosen.length;
        final shownChips = widget.maxChips == null ? chosen : chosen.take(widget.maxChips!).toList();
        final hidden = chosen.length - shownChips.length;
        final summary = count == 0 ? widget.placeholder : widget.countLabel(formatNumber(count, scope.locale));
        return Opacity(
          opacity: widget.isDisabled ? 0.5 : 1,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Excluded: the name lives on the trigger node, so it is announced ONCE.
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
              Semantics(
                label: widget.label,
                value: summary,
                button: true,
                enabled: !widget.isDisabled,
                isRequired: widget.isRequired ? true : null,
                validationResult: invalid ? SemanticsValidationResult.invalid : SemanticsValidationResult.none,
                hint: [if (widget.description != null) widget.description!, if (widget.errorMessage != null) widget.errorMessage!].join('. '),
                child: InkWell(
                  onTap: widget.isDisabled ? null : _open,
                  borderRadius: BorderRadius.circular(LumoRadius.md),
                  child: Container(
                    constraints: const BoxConstraints(minHeight: LumoControl.md),
                    padding: const EdgeInsetsDirectional.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: c.surface,
                      border: Border.all(color: invalid ? c.critical : c.borderControl),
                      borderRadius: BorderRadius.circular(LumoRadius.md),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: ExcludeSemantics(
                            child: Text(
                              summary ?? '',
                              style: TextStyle(fontSize: 14, color: count == 0 ? c.fgSubtle : c.fg),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                        ExcludeSemantics(child: Icon(Icons.expand_more, size: 18, color: c.fgMuted)),
                      ],
                    ),
                  ),
                ),
              ),
              if (shownChips.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final o in shownChips)
                        LumoChip(label: o.label, size: LumoChipSize.sm, isDisabled: widget.isDisabled, removeLabel: widget.removeLabel(o.label), onRemove: () => _toggle(o.id, false)),
                      // Digits, no word: «+۳» reads the same in every language.
                      if (hidden > 0) LumoChip(label: '+${formatNumber(hidden, scope.locale, grouping: false)}', size: LumoChipSize.sm, isDisabled: widget.isDisabled),
                    ],
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
      },
    );
  }
}

/// The sheet's body: an optional search box, the options as `LumoCheckbox`
/// rows inside a named list, and a footer whose count sits at the reading
/// START with the actions at the reading END. The query lives here (it dies
/// with the sheet); the SELECTION lives in the field's notifier, so the rows
/// repaint from the same source the chips do.
class _MultiSelectSheet extends StatefulWidget {
  const _MultiSelectSheet({
    required this.options,
    required this.selected,
    required this.isSearchable,
    required this.searchLabel,
    required this.emptyLabel,
    required this.confirmLabel,
    required this.clearAllLabel,
    required this.countLabel,
    required this.onToggle,
    required this.onClearAll,
  });

  final List<LumoMultiSelectOption> options;
  final ValueNotifier<List<String>> selected;
  final bool isSearchable;
  final String? searchLabel;
  final String? emptyLabel;
  final String confirmLabel;
  final String clearAllLabel;
  final String Function(String count) countLabel;
  final void Function(String id, bool on) onToggle;
  final VoidCallback onClearAll;

  @override
  State<_MultiSelectSheet> createState() => _MultiSelectSheetState();
}

class _MultiSelectSheetState extends State<_MultiSelectSheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final query = lumoFoldForSearch(_query.trim());
    final visible = query.isEmpty ? widget.options : widget.options.where((o) => lumoFoldForSearch(o.label).contains(query)).toList();
    return ValueListenableBuilder<List<String>>(
      valueListenable: widget.selected,
      builder: (context, values, _) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (widget.isSearchable) ...[
            LumoTextField(
              label: widget.searchLabel!,
              showLabel: false,
              placeholder: widget.searchLabel,
              prefix: Icon(Icons.search, size: 16, color: c.fgSubtle),
              onChanged: (v) => setState(() => _query = v),
            ),
            const SizedBox(height: 8),
          ],
          if (visible.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Text(
                widget.emptyLabel!,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: c.fgMuted),
              ),
            )
          else
            // `SemanticsRole.list`: the group of options is a list to a reader.
            // It carries NO name of its own — the sheet's route name is the
            // field's label and repeating it would announce the name twice.
            Semantics(
              container: true,
              explicitChildNodes: true,
              role: SemanticsRole.list,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 320),
                child: ListView(
                  shrinkWrap: true,
                  children: [for (final o in visible) LumoCheckbox(label: o.label, isSelected: values.contains(o.id), isDisabled: o.isDisabled, onChanged: (on) => widget.onToggle(o.id, on))],
                ),
              ),
            ),
          Container(
            margin: const EdgeInsets.only(top: 12),
            padding: const EdgeInsetsDirectional.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: c.surfaceSunken,
              border: Border.all(color: c.border),
              borderRadius: BorderRadius.circular(LumoRadius.md),
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final count = Text(
                  widget.countLabel(formatNumber(values.length, scope.locale)),
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c.fgMuted),
                );
                final clear = LumoButton(variant: LumoButtonVariant.ghost, size: LumoButtonSize.sm, isDisabled: values.isEmpty, onPressed: widget.onClearAll, child: Text(widget.clearAllLabel));
                final confirm = LumoButton(size: LumoButtonSize.sm, onPressed: () => Navigator.of(context).pop(), child: Text(widget.confirmLabel));
                // What the three actually need, measured — not guessed.
                final needed =
                    _measure(context, widget.countLabel(formatNumber(values.length, scope.locale)), 12, FontWeight.w600) +
                    8 +
                    _buttonWidth(context, widget.clearAllLabel) +
                    8 +
                    _buttonWidth(context, widget.confirmLabel);
                // A Row mirrors: the count takes the reading START, the actions the END.
                if (!constraints.maxWidth.isFinite || needed <= constraints.maxWidth) {
                  return Row(
                    spacing: 8,
                    children: [
                      Expanded(child: count),
                      clear,
                      confirm,
                    ],
                  );
                }
                // Too tight for one row: the count takes a line of its own rather
                // than being squeezed into an ellipsis. The buttons `Wrap` so even
                // two long labels cannot overflow.
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    count,
                    const SizedBox(height: 8),
                    Align(
                      alignment: AlignmentDirectional.centerEnd,
                      child: Wrap(alignment: WrapAlignment.end, spacing: 8, runSpacing: 8, children: [clear, confirm]),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// One line of text at this size, as it will really be painted — the measuring
/// half of the `_fit()` pattern (segmented_control.dart).
double _measure(BuildContext context, String text, double size, FontWeight weight) => (TextPainter(
  text: TextSpan(
    text: text,
    style: DefaultTextStyle.of(context).style.copyWith(fontSize: size, fontWeight: weight),
  ),
  textDirection: Directionality.of(context),
  maxLines: 1,
)..layout()).width;

/// What a `LumoButton(size: sm)` will be: its label plus the size's own inline
/// padding on both sides (button.dart's `_padding[sm]`).
double _buttonWidth(BuildContext context, String label) => _measure(context, label, 14, FontWeight.w500) + 24;
