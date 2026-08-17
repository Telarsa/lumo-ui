import 'package:flutter/material.dart';

import 'button.dart';
import 'chip.dart';
import 'format.dart';
import 'scope.dart';
import 'sheet.dart';
import 'tokens.g.dart';

/// One choice inside a [LumoFilterGroup]: `id` is what the bar reports,
/// `label` the announced and displayed text.
@immutable
class LumoFilterOption {
  const LumoFilterOption({required this.id, required this.label, this.isPinned = false});

  /// A stable identity for this item — used for selection and equality, never shown or announced.
  final String id;
  /// The name this control is announced by, and painted where the family shows one.
  final String label;

  /// Keep this option on the BAR even while it is off — a quick filter.
  /// The Khroos results screen (`discovery_screens.dart`) puts «۴+ امتیاز»,
  /// «نزدیک‌ترین» and «پاسخ سریع» in the row above the results and leaves them
  /// visible whether or not they are on, because a filter a reader cannot see
  /// is a filter a reader will not use. Unpinned options reach the bar only
  /// once they are chosen.
  final bool isPinned;
}

/// A named set of choices — «مرتب‌سازی», «فقط تأییدشده», «دسته‌بندی».
@immutable
class LumoFilterGroup {
  const LumoFilterGroup({required this.id, required this.label, required this.options, this.isMultiple = true, this.description});

  /// A stable identity for this item — used for selection and equality, never shown or announced.
  final String id;

  /// The group's name: a header in the sheet, announced there once.
  final String label;
  /// The options to choose from, in reading order.
  final List<LumoFilterOption> options;

  /// `false` makes the group exclusive — a sort order, where choosing one
  /// option drops the last.
  final bool isMultiple;

  /// Help text under the group's header in the sheet.
  final String? description;
}

/// The active filters, as a bar over a result list, plus the sheet that edits
/// them — the web `Filters` (`filters.tsx`) in the shape a phone has room for.
///
/// **What the web has that this does not, and why.** `filters.tsx` builds a
/// clause model: field, operator, value — «قیمت» «بیشتر از» «۵۰۰٬۰۰۰», rows of
/// three `Select`s and a text box. That is a desktop query builder: four
/// controls per clause across a row 640 pixels wide, on a screen that is 360.
/// So the model here is CHOICES rather than clauses — a group, its options, and
/// which are on — which is what a phone filter sheet has always actually been,
/// and precisely what the Khroos app hand-rolled (`inquiry_screens.dart`'s
/// `FiltersBody`: two switches with helper text and a `Wrap` of selectable
/// chips over a sort order). The operator axis is deliberately gone, not
/// forgotten; an app that needs it wants a screen, not a sheet.
///
/// **The bar's chips are TOGGLES, not removable tags.** A selectable
/// `LumoChip` announces its own selected state, is one tap in both directions,
/// and gives a thumb the whole chip instead of a 20-pixel ✕ — so the bar needs
/// no `removeLabel` and never grows an unnamed glyph. Pinned options stay on
/// the bar while off (see [LumoFilterOption.isPinned]); everything else appears
/// there once chosen.
///
/// **Announced strings, all REQUIRED**: `label` (names the bar as a region),
/// `editLabel` (the control that opens the sheet), `closeLabel` (the sheet's ✕
/// and its scrim), `clearAllLabel`, `applyLabel` (the sheet's primary, which
/// CLOSES — choices apply as they are made, so confirming is a dismissal, not a
/// commit, exactly as in `LumoMultiSelect`), and `countLabel`, a FUNCTION of the
/// already-formatted count, because «۳ فیلتر» is not English with the words
/// swapped. The count goes through `formatNumber`; a bare number never reaches
/// the screen, and the count is one node with its own words rather than a digit
/// glued to a button.
///
/// `extra` is the slot the app cannot do without: the Khroos filter sheet also
/// holds a radius `LumoSlider` and switch rows with helper text — controls that
/// are not a set of options and never will be. Whatever the builder returns is
/// drawn under the groups, inside the same sheet.
///
/// Selection is CONTROLLED (`values` + `onChanged`); the widget mirrors it
/// optimistically so the sheet and the bar answer a tap before the caller's
/// `setState` lands — the sheet is a ROUTE built above this widget and cannot
/// see a `widget` field change.
class LumoFilters extends StatefulWidget {
  const LumoFilters({
    super.key,
    required this.label,
    required this.groups,
    required this.values,
    required this.editLabel,
    required this.closeLabel,
    required this.clearAllLabel,
    required this.applyLabel,
    required this.countLabel,
    this.onChanged,
    this.extra,
    this.isDisabled = false,
  });

  /// Names the bar as a region. REQUIRED — announced, not drawn.
  final String label;
  /// The filter groups, in reading order.
  final List<LumoFilterGroup> groups;

  /// The chosen option ids per group id. Controlled, as the web's `value`.
  final Map<String, List<String>> values;

  /// Called with the whole map after every change.
  final ValueChanged<Map<String, List<String>>>? onChanged;

  /// Names the control that opens the sheet. REQUIRED.
  final String editLabel;

  /// Names the sheet's ✕ and its scrim. REQUIRED.
  final String closeLabel;

  /// Names the clear-everything control, on the bar and in the sheet. REQUIRED.
  final String clearAllLabel;

  /// Names the sheet's primary, which closes it. REQUIRED.
  final String applyLabel;

  /// Builds the count sentence from the ALREADY FORMATTED number of active
  /// filters («۳»). REQUIRED — a bare number announces nothing.
  final String Function(String count) countLabel;

  /// Extra controls for the sheet: a radius slider, a switch with helper text.
  final WidgetBuilder? extra;

  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  State<LumoFilters> createState() => _LumoFiltersState();
}

Map<String, List<String>> _copy(Map<String, List<String>> values) => {for (final e in values.entries) e.key: List<String>.of(e.value)};

class _LumoFiltersState extends State<LumoFilters> {
  late final ValueNotifier<Map<String, List<String>>> _shown = ValueNotifier<Map<String, List<String>>>(_copy(widget.values));

  @override
  void didUpdateWidget(LumoFilters old) {
    super.didUpdateWidget(old);
    if (!_sameAs(old.values, widget.values) && !_sameAs(_shown.value, widget.values)) _shown.value = _copy(widget.values);
  }

  bool _sameAs(Map<String, List<String>> a, Map<String, List<String>> b) {
    for (final group in widget.groups) {
      final left = a[group.id] ?? const <String>[];
      final right = b[group.id] ?? const <String>[];
      if (left.length != right.length) return false;
      for (var i = 0; i < left.length; i++) {
        if (left[i] != right[i]) return false;
      }
    }
    return true;
  }

  void _set(Map<String, List<String>> next) {
    _shown.value = next;
    widget.onChanged?.call(next);
  }

  void _toggle(LumoFilterGroup group, LumoFilterOption option, bool on) {
    final next = _copy(_shown.value);
    final chosen = next.putIfAbsent(group.id, () => <String>[]);
    if (!on) {
      chosen.remove(option.id);
    } else if (group.isMultiple) {
      if (!chosen.contains(option.id)) chosen.add(option.id);
    } else {
      // Exclusive: the new choice replaces the old one.
      chosen
        ..clear()
        ..add(option.id);
    }
    _set(next);
  }

  void _clearAll() => _set({for (final group in widget.groups) group.id: <String>[]});

  int _countOf(Map<String, List<String>> values) {
    var count = 0;
    for (final group in widget.groups) {
      for (final option in group.options) {
        if ((values[group.id] ?? const <String>[]).contains(option.id)) count++;
      }
    }
    return count;
  }

  Future<void> _open() => showLumoSheet<void>(
        context,
        label: widget.label,
        closeLabel: widget.closeLabel,
        body: (ctx) => _FiltersSheet(groups: widget.groups, selected: _shown, onToggle: _toggle, extra: widget.extra),
        actions: (ctx) => [
          ValueListenableBuilder<Map<String, List<String>>>(
            valueListenable: _shown,
            builder: (context, values, _) => LumoButton(
              variant: LumoButtonVariant.ghost,
              size: LumoButtonSize.sm,
              isDisabled: _countOf(values) == 0,
              onPressed: _clearAll,
              child: Text(widget.clearAllLabel),
            ),
          ),
          LumoButton(size: LumoButtonSize.sm, onPressed: () => Navigator.of(ctx).pop(), child: Text(widget.applyLabel)),
        ],
      );

  @override
  Widget build(BuildContext context) {
    // Checked here, not in the const constructor: a `length` assert there is a
    // COMPILE error at every const call site (`segmented_control.dart` first).
    assert(widget.groups.isNotEmpty, 'A filter bar with no groups filters nothing.');
    final scope = LumoScope.of(context);
    final c = scope.colours;
    return ValueListenableBuilder<Map<String, List<String>>>(
      valueListenable: _shown,
      builder: (context, values, _) {
        final count = _countOf(values);
        // Pinned first, in declaration order, then everything else that is on.
        final onBar = <(LumoFilterGroup, LumoFilterOption)>[
          for (final group in widget.groups)
            for (final option in group.options)
              if (option.isPinned || (values[group.id] ?? const <String>[]).contains(option.id)) (group, option),
        ];
        return Semantics(
          container: true,
          explicitChildNodes: true,
          label: widget.label,
          child: Opacity(
            opacity: widget.isDisabled ? 0.5 : 1,
            child: SizedBox(
              height: LumoControl.lg,
              // Horizontal, so a long run of filters scrolls instead of pushing
              // the list off the screen. The scroll axis is the INLINE one and
              // mirrors: under fa-IR the row starts at the right, by `Directionality`.
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  Center(
                    child: LumoButton(
                      variant: LumoButtonVariant.outline,
                      size: LumoButtonSize.sm,
                      isDisabled: widget.isDisabled,
                      onPressed: _open,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        spacing: 6,
                        children: [
                          ExcludeSemantics(child: Icon(Icons.tune, size: 14, color: c.fg)),
                          Text(widget.editLabel),
                        ],
                      ),
                    ),
                  ),
                  if (count > 0) ...[
                    const SizedBox(width: 8),
                    // Its own node with its own words: how many filters are on,
                    // in the reader's digits, inside the caller's sentence.
                    Center(child: Text(widget.countLabel(formatNumber(count, scope.locale)), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c.fgMuted))),
                    const SizedBox(width: 8),
                    Center(
                      child: LumoButton(
                        variant: LumoButtonVariant.ghost,
                        size: LumoButtonSize.sm,
                        isDisabled: widget.isDisabled,
                        onPressed: _clearAll,
                        child: Text(widget.clearAllLabel),
                      ),
                    ),
                  ],
                  for (final (group, option) in onBar) ...[
                    const SizedBox(width: 8),
                    Center(
                      child: LumoChip(
                        label: option.label,
                        size: LumoChipSize.sm,
                        isDisabled: widget.isDisabled,
                        isSelected: (values[group.id] ?? const <String>[]).contains(option.id),
                        onChanged: (on) => _toggle(group, option, on),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _shown.dispose();
    super.dispose();
  }
}

/// The sheet's body: each group as a header with its options as selectable
/// chips, then whatever `extra` builds. Choices apply as they are made, so
/// nothing here holds a draft — the same decision `LumoMultiSelect` made, and
/// the reason the footer's primary is a dismissal rather than a commit.
class _FiltersSheet extends StatelessWidget {
  const _FiltersSheet({required this.groups, required this.selected, required this.onToggle, required this.extra});
  final List<LumoFilterGroup> groups;
  final ValueNotifier<Map<String, List<String>>> selected;
  final void Function(LumoFilterGroup group, LumoFilterOption option, bool on) onToggle;
  final WidgetBuilder? extra;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return ValueListenableBuilder<Map<String, List<String>>>(
      valueListenable: selected,
      builder: (context, values, _) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final group in groups) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Semantics(
                header: true,
                child: Text(group.label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: c.fgMuted)),
              ),
            ),
            if (group.description != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(group.description!, style: TextStyle(fontSize: 12, color: c.fgSubtle)),
              ),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final option in group.options)
                  LumoChip(
                    label: option.label,
                    isSelected: (values[group.id] ?? const <String>[]).contains(option.id),
                    onChanged: (on) => onToggle(group, option, on),
                  ),
              ],
            ),
            const SizedBox(height: 20),
          ],
          if (extra != null) extra!(context),
        ],
      ),
    );
  }
}
