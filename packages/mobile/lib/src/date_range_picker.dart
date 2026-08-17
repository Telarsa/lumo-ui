import 'package:flutter/material.dart';

import 'button.dart';
import 'calendar.dart';
import 'date_value_box.dart';
import 'jalali.dart';
import 'scope.dart';

/// Two dates and a range grid behind one button —
/// `packages/ui/src/date-range-picker.tsx`, which is `date-picker.tsx`'s
/// composition twice. The two halves are separate boxes named by `startLabel`
/// and `endLabel` (REQUIRED), so a reader hears «تاریخ شروع» before the value
/// rather than one field holding two dates.
///
/// The separator is an EN DASH and it is `ExcludeSemantics`d, exactly as the
/// web hides it: an arrow would claim which date comes first ON SCREEN, and
/// that flips with the script while the meaning does not.
///
/// The sheet closes when the span is COMPLETE. A partial span (a start with no
/// end) is a real state — it is announced, it is painted, and `onChanged` fires
/// with it — so a reader who taps once and then ✕ keeps what they picked. There
/// is no Done button, and therefore no seventh announced string; the shape is
/// forui's `FCalendar` range and Material's `DateRangePickerDialog` minus its
/// Save/Cancel chrome, which Material only needs because it is a full-screen
/// route.
///
/// No validation engine produces «end before start» — the tap rule makes it
/// unreachable (a tap before the open start MOVES the start), and
/// `errorMessage` stays the caller's own sentence.
class LumoDateRangePicker extends StatefulWidget {
  const LumoDateRangePicker({
    super.key,
    required this.label,
    required this.startLabel,
    required this.endLabel,
    required this.inRangeLabel,
    required this.openLabel,
    required this.closeLabel,
    required this.previousMonthLabel,
    required this.nextMonthLabel,
    required this.todayLabel,
    required this.selectMonthLabel,
    this.value,
    this.defaultValue,
    this.onChanged,
    this.startPlaceholder,
    this.endPlaceholder,
    this.description,
    this.errorMessage,
    this.isRequired = false,
    this.isDisabled = false,
    this.minDate,
    this.maxDate,
    this.today,
    this.isDateUnavailable,
    this.isDateMarked,
    this.markedLabel,
    this.style = LumoDateStyle.medium,
  }) : assert(isDateMarked == null || markedLabel != null, 'A marked day needs markedLabel: a dot is a colour, and a colour is not an announcement.');

  /// Announced and displayed name of the whole range. Required.
  final String label;

  /// Names the start half, e.g. «تاریخ شروع». Required — see the header.
  final String startLabel;

  /// Names the end half, e.g. «تاریخ پایان». Required.
  final String endLabel;

  /// Announced on every day BETWEEN the ends. Required: the band is a colour.
  final String inRangeLabel;

  /// Name of the button that opens the calendar. Required — it is an icon.
  final String openLabel;

  /// Name of the sheet's ✕ and of its scrim. Required.
  final String closeLabel;

  /// Names of the month-paging chevrons. Required — they are icons.
  final String previousMonthLabel;
  final String nextMonthLabel;

  /// The hint on today's cell. Required.
  final String todayLabel;

  /// Name of the caption button that opens the month/year list. Required.
  final String selectMonthLabel;

  /// The span, when controlled.
  final LumoDateRange? value;

  /// The initial span, when uncontrolled.
  final LumoDateRange? defaultValue;

  /// Fires after every tap in the grid, with `to` absent while only the first
  /// end is picked.
  final ValueChanged<LumoDateRange>? onChanged;

  /// Shown in the start half when it is empty.
  final String? startPlaceholder;

  /// Shown in the end half when it is empty.
  final String? endPlaceholder;

  final String? description;

  /// Shown under the field and announced. Supplying one marks it invalid.
  final String? errorMessage;

  final bool isRequired;
  final bool isDisabled;

  final DateTime? minDate;
  final DateTime? maxDate;

  /// The day marked as today; defaults to the device clock. Injectable for determinism.
  final DateTime? today;

  final bool Function(DateTime date)? isDateUnavailable;

  /// Marks days that carry something, with an announced dot.
  final bool Function(DateTime date)? isDateMarked;

  /// What the dot means. Required as soon as `isDateMarked` is given.
  final String? markedLabel;

  /// How each end is written in its box.
  final LumoDateStyle style;

  @override
  State<LumoDateRangePicker> createState() => _LumoDateRangePickerState();
}

class _LumoDateRangePickerState extends State<LumoDateRangePicker> {
  late LumoDateRange? _uncontrolled = widget.defaultValue;
  LumoDateRange? get _value => widget.value ?? _uncontrolled;

  void _commit(LumoDateRange next) {
    if (widget.value == null) setState(() => _uncontrolled = next);
    widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final range = _value;
    final from = range?.from;
    final to = range?.to;
    final startText = from == null ? (widget.startPlaceholder ?? '') : formatLumoDate(from, scope.locale, style: widget.style);
    final endText = to == null ? (widget.endPlaceholder ?? '') : formatLumoDate(to, scope.locale, style: widget.style);
    final hint = LumoDateFieldFrame.hintFor(widget.description, widget.errorMessage);
    return LumoDateFieldFrame(
      label: widget.label,
      description: widget.description,
      errorMessage: widget.errorMessage,
      isRequired: widget.isRequired,
      isDisabled: widget.isDisabled,
      control: Row(
        children: [
          Expanded(
            child: LumoDateValueBox(
              label: widget.startLabel,
              text: startText,
              isEmpty: from == null,
              hint: hint,
              isInvalid: widget.errorMessage != null,
              isDisabled: widget.isDisabled,
              onTap: () => _open(context),
            ),
          ),
          // A dash, not an arrow: an arrow encodes a direction that flips with
          // the script while the meaning does not. Hidden from the tree because
          // each half already announces which end it is.
          const ExcludeSemantics(child: Padding(padding: EdgeInsetsDirectional.symmetric(horizontal: 6), child: Text('–'))),
          Expanded(
            child: LumoDateValueBox(
              label: widget.endLabel,
              text: endText,
              isEmpty: to == null,
              hint: hint,
              isInvalid: widget.errorMessage != null,
              isDisabled: widget.isDisabled,
              onTap: () => _open(context),
            ),
          ),
          const SizedBox(width: 8),
          LumoIconButton(label: widget.openLabel, variant: LumoButtonVariant.outline, isDisabled: widget.isDisabled, onPressed: () => _open(context), child: Icon(Icons.calendar_today, size: 18, color: c.fg)),
        ],
      ),
    );
  }

  Future<void> _open(BuildContext context) async {
    if (widget.isDisabled) return;
    await showLumoDateSheet<void>(
      context,
      closeLabel: widget.closeLabel,
      body: (ctx) => _RangeSheet(
        picker: widget,
        value: _value,
        onChanged: (r) {
          _commit(r);
          // A complete span is the end of the interaction; a partial one is
          // kept and the sheet stays open for the second end.
          if (r.isComplete) Navigator.of(ctx).pop();
        },
      ),
    );
  }
}

/// The sheet: title and ✕, then the ONE range grid.
class _RangeSheet extends StatefulWidget {
  const _RangeSheet({required this.picker, required this.value, required this.onChanged});

  final LumoDateRangePicker picker;
  final LumoDateRange? value;
  final ValueChanged<LumoDateRange> onChanged;

  @override
  State<_RangeSheet> createState() => _RangeSheetState();
}

class _RangeSheetState extends State<_RangeSheet> {
  late LumoDateRange? _shown = widget.value;

  @override
  Widget build(BuildContext context) {
    final picker = widget.picker;
    final c = LumoScope.of(context).colours;
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 16, end: 16, top: 12, bottom: 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              // Decorative copy of the name — the grid announces it.
              Expanded(child: ExcludeSemantics(child: Text(picker.label, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: c.fg)))),
              LumoIconButton(label: picker.closeLabel, size: LumoButtonSize.sm, onPressed: () => Navigator.of(context).pop(), child: Icon(Icons.close, size: 16, color: c.fgMuted)),
            ],
          ),
          const SizedBox(height: 8),
          LumoRangeCalendar(
            label: picker.label,
            previousMonthLabel: picker.previousMonthLabel,
            nextMonthLabel: picker.nextMonthLabel,
            todayLabel: picker.todayLabel,
            startLabel: picker.startLabel,
            endLabel: picker.endLabel,
            inRangeLabel: picker.inRangeLabel,
            selectMonthLabel: picker.selectMonthLabel,
            value: _shown,
            minDate: picker.minDate,
            maxDate: picker.maxDate,
            today: picker.today,
            isDateUnavailable: picker.isDateUnavailable,
            isDateMarked: picker.isDateMarked,
            markedLabel: picker.markedLabel,
            onChanged: (r) {
              setState(() => _shown = r);
              widget.onChanged(r);
            },
          ),
        ],
      ),
    );
  }
}
