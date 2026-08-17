import 'package:flutter/material.dart';

import 'button.dart';
import 'calendar.dart';
import 'date_value_box.dart';
import 'jalali.dart';
import 'scope.dart';

/// A date field with a calendar in a sheet, and the two things a phone picker
/// needs that a bare grid does not: **presets** and a **month/year jump** —
/// `packages/ui/src/date-picker.tsx`.
///
/// **How this differs from `LumoDateField`, and why both exist.** They share
/// one grid (`LumoCalendar`); there is no second month grid anywhere in this
/// package. `LumoDateField` is the plain control — the field, the sheet, the
/// grid, six required strings — and it is what the Khroos booking flow already
/// uses. `LumoDatePicker` is the RICH one: it adds the presets that Khroos's
/// `_SchedulePicker` had to hand-roll as its own «امروز / فردا» chips beside
/// `LumoDateField`, adds the month/year jump (the web's
/// `captionLayout: "dropdown"`, which a Jalali date of birth needs so a reader
/// is not paging 1200 months), adds `isDateUnavailable` (a booked day) and
/// `isDateMarked` (the dot the Khroos business calendar draws on days that
/// already have appointments), and owns its value controlled OR uncontrolled.
/// Making `LumoDateField` the rich one instead would have forced four more
/// required strings on every plain date field in the app; splitting them keeps
/// the cheap case cheap and the expensive case possible.
///
/// Announced strings, all REQUIRED: `label`, `openLabel` (the calendar button
/// is an icon), `closeLabel` (the sheet's ✕ and its scrim), `previousMonthLabel`
/// / `nextMonthLabel` (icon chevrons), `todayLabel` (the Today action and the
/// hint on today's cell) and `selectMonthLabel` (the caption is a button here).
/// Each preset carries its OWN required label. `markedLabel` is required as
/// soon as `isDateMarked` is given.
///
/// `value` is a Gregorian `DateTime` of which only the local calendar day is
/// read; `onChanged` receives local midnight of the chosen day. Segment typing
/// (the web's `DateInput`) is not carried: a phone keyboard has no segment
/// navigation, so the picker IS the entry, and the field is read-only.

/// One shortcut under the calendar — «امروز», «فردا», «هفتهٔ بعد». `label` is
/// REQUIRED and is the whole of what a reader hears: a preset with no words is
/// an unnamed button.
@immutable
class LumoDatePreset {
  const LumoDatePreset({required this.label, required this.date});

  /// Announced and displayed. Required.
  final String label;

  /// The day this preset selects; only its local calendar day is read.
  final DateTime date;
}

class LumoDatePicker extends StatefulWidget {
  const LumoDatePicker({
    super.key,
    required this.label,
    required this.openLabel,
    required this.closeLabel,
    required this.previousMonthLabel,
    required this.nextMonthLabel,
    required this.todayLabel,
    required this.selectMonthLabel,
    this.value,
    this.defaultValue,
    this.onChanged,
    this.presets = const [],
    this.placeholder,
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

  /// Announced and displayed name. Required.
  final String label;

  /// Name of the button that opens the calendar. Required — it is an icon.
  final String openLabel;

  /// Name of the sheet's ✕ and of its scrim. Required.
  final String closeLabel;

  /// Names of the month-paging chevrons. Required — they are icons.
  final String previousMonthLabel;
  final String nextMonthLabel;

  /// Name of the Today action, and the hint on today's cell. Required.
  final String todayLabel;

  /// Name of the caption button that opens the month/year list. Required —
  /// the caption is a control here, not a heading.
  final String selectMonthLabel;

  /// The selected day, when controlled.
  final DateTime? value;

  /// The initial day, when the value is uncontrolled.
  final DateTime? defaultValue;

  /// Called with local midnight of the chosen day.
  final ValueChanged<DateTime>? onChanged;

  /// Shortcuts shown above the grid. Empty by default.
  final List<LumoDatePreset> presets;

  /// Shown in the field when there is no value.
  final String? placeholder;

  final String? description;

  /// Shown under the field and announced. Supplying one marks it invalid.
  final String? errorMessage;

  final bool isRequired;
  final bool isDisabled;

  /// Earliest selectable DAY (itself selectable). Also the first month in the list.
  final DateTime? minDate;

  /// Latest selectable DAY (itself selectable). Also the last month in the list.
  final DateTime? maxDate;

  /// The day marked as today; defaults to the device clock. Injectable so a
  /// screen (or a test) is deterministic.
  final DateTime? today;

  /// Marks individual days unselectable — holidays, booked days.
  final bool Function(DateTime date)? isDateUnavailable;

  /// Marks days that carry something, with an announced dot.
  final bool Function(DateTime date)? isDateMarked;

  /// What the dot means. Required as soon as `isDateMarked` is given.
  final String? markedLabel;

  /// How the value is written in the field.
  final LumoDateStyle style;

  @override
  State<LumoDatePicker> createState() => _LumoDatePickerState();
}

class _LumoDatePickerState extends State<LumoDatePicker> {
  late DateTime? _uncontrolled = widget.defaultValue;
  DateTime? get _value => widget.value ?? _uncontrolled;

  void _commit(DateTime next) {
    final day = DateUtils.dateOnly(next);
    if (widget.value == null) setState(() => _uncontrolled = day);
    widget.onChanged?.call(day);
  }

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final value = _value;
    final text = value == null ? (widget.placeholder ?? '') : formatLumoDate(value, scope.locale, style: widget.style);
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
              label: widget.label,
              text: text,
              isEmpty: value == null,
              hint: LumoDateFieldFrame.hintFor(widget.description, widget.errorMessage),
              isInvalid: widget.errorMessage != null,
              isDisabled: widget.isDisabled,
              onTap: () => _open(context),
            ),
          ),
          const SizedBox(width: 8),
          // The calendar button, at the inline END by the Row's own mirroring.
          LumoIconButton(label: widget.openLabel, variant: LumoButtonVariant.outline, isDisabled: widget.isDisabled, onPressed: () => _open(context), child: Icon(Icons.calendar_today, size: 18, color: c.fg)),
        ],
      ),
    );
  }

  Future<void> _open(BuildContext context) async {
    final chosen = await showLumoDateSheet<DateTime>(
      context,
      closeLabel: widget.closeLabel,
      body: (ctx) => _DatePickerSheet(
        picker: widget,
        value: _value,
        onSelected: (d) => Navigator.of(ctx).pop(d),
      ),
    );
    if (chosen != null) _commit(chosen);
  }
}

/// The sheet: title and ✕, the presets, then the ONE month grid.
class _DatePickerSheet extends StatelessWidget {
  const _DatePickerSheet({required this.picker, required this.value, required this.onSelected});

  final LumoDatePicker picker;
  final DateTime? value;
  final ValueChanged<DateTime> onSelected;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 16, end: 16, top: 12, bottom: 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              // Decorative copy of the name: the grid below announces `label`
              // as its own, so it is heard exactly once.
              Expanded(child: ExcludeSemantics(child: Text(picker.label, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: c.fg)))),
              LumoIconButton(label: picker.closeLabel, size: LumoButtonSize.sm, onPressed: () => Navigator.of(context).pop(), child: Icon(Icons.close, size: 16, color: c.fgMuted)),
            ],
          ),
          if (picker.presets.isNotEmpty) ...[
            const SizedBox(height: 10),
            // A rail, not a Row: three Persian preset words in a narrow sheet
            // must wrap rather than truncate (the house rule a cramped control
            // sheds decoration before it truncates words).
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final p in picker.presets)
                  LumoButton(
                    variant: LumoButtonVariant.outline,
                    size: LumoButtonSize.sm,
                    isDisabled: !_selectable(p.date),
                    onPressed: () => onSelected(DateUtils.dateOnly(p.date)),
                    child: Text(p.label),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 8),
          LumoCalendar(
            label: picker.label,
            previousMonthLabel: picker.previousMonthLabel,
            nextMonthLabel: picker.nextMonthLabel,
            todayLabel: picker.todayLabel,
            selectMonthLabel: picker.selectMonthLabel,
            value: value,
            minDate: picker.minDate,
            maxDate: picker.maxDate,
            today: picker.today,
            isDateUnavailable: picker.isDateUnavailable,
            isDateMarked: picker.isDateMarked,
            markedLabel: picker.markedLabel,
            // The Today action is one of the presets' job here; the sheet keeps
            // it only when the caller offered no presets of its own.
            showTodayAction: picker.presets.isEmpty,
            onChanged: onSelected,
          ),
        ],
      ),
    );
  }

  bool _selectable(DateTime d) {
    final day = DateUtils.dateOnly(d);
    if (picker.minDate != null && day.isBefore(DateUtils.dateOnly(picker.minDate!))) return false;
    if (picker.maxDate != null && day.isAfter(DateUtils.dateOnly(picker.maxDate!))) return false;
    return !(picker.isDateUnavailable?.call(day) ?? false);
  }
}
