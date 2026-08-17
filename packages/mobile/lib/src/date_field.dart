import 'package:flutter/material.dart';
import 'button.dart';
import 'calendar.dart';
import 'date_value_box.dart';
import 'jalali.dart';
import 'scope.dart';

/// A date field with a calendar behind a button — the mobile counterpart of the
/// web's `DatePicker` (`DateInput` + `Calendar`): a read-only field showing the
/// value through `formatLumoDate` (Jalali under `fa-*` and any `-u-ca-persian`
/// tag, Gregorian otherwise — `calendarOf`), and a calendar button at the
/// inline END that opens the picker as a bottom sheet route. The grid is
/// Lumo's own: Material's `showDatePicker` is Gregorian-only and its strings
/// default to English. Announced strings, all REQUIRED: `label`, `openLabel`
/// (the calendar button is an icon), `closeLabel` (the sheet's ✕ and scrim),
/// `previousMonthLabel` / `nextMonthLabel` (icon chevrons, previous at the
/// inline START), `todayLabel` (the Today action; also the hint on today's cell).
/// The web's `openCalendarLabel` is `openLabel` here; the web has no
/// `previousMonthLabel`/`nextMonthLabel` because react-day-picker composes them
/// from `LumoStrings` — Flutter has no such table, so they are props again.
/// `value` is a Gregorian `DateTime` (Flutter's date type; the web's
/// `CalendarDate` has no Dart twin) of which only the local calendar day is
/// read; `onChanged` receives local midnight of the chosen day. Segment typing
/// (`DateInput`) is not carried: a mobile keyboard's date entry is the picker.
class LumoDateField extends StatelessWidget {
  const LumoDateField({
    super.key,
    required this.label,
    required this.openLabel,
    required this.closeLabel,
    required this.previousMonthLabel,
    required this.nextMonthLabel,
    required this.todayLabel,
    this.value,
    this.onChanged,
    this.placeholder,
    this.description,
    this.errorMessage,
    this.isRequired = false,
    this.isDisabled = false,
    this.minDate,
    this.maxDate,
    this.today,
    this.style = LumoDateStyle.medium,
  });

  /// Announced and displayed name. Required: an unnamed field is a defect.
  final String label;
  /// Name of the button that opens the calendar. Required — it is an icon.
  final String openLabel;
  /// Name of the sheet's close button and its scrim. Required.
  final String closeLabel;
  /// Names of the month-paging chevrons. Required — they are icons.
  final String previousMonthLabel;
  /// Announced name of the next-month control.
  final String nextMonthLabel;
  /// Name of the Today action (selects today, when in range). Required.
  final String todayLabel;
  /// The selected day; only its local year/month/day are read.
  final DateTime? value;
  /// Called with local midnight of the chosen day.
  final ValueChanged<DateTime>? onChanged;
  /// Shown in the field when there is no value.
  final String? placeholder;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// Shown under the field and announced. Supplying one marks it invalid.
  final String? errorMessage;
  /// Whether user input is required before the form is submitted.
  final bool isRequired;
  /// Whether the control is disabled.
  final bool isDisabled;
  /// Earliest selectable DAY (itself selectable). Days before it are disabled.
  final DateTime? minDate;
  /// Latest selectable DAY (itself selectable). Days after it are disabled.
  final DateTime? maxDate;
  /// The day marked as today; defaults to the device clock. Injectable so a
  /// screen (or a test) is deterministic — the web REQUIRES it for SSR.
  final DateTime? today;
  /// How the value is written in the field.
  final LumoDateStyle style;

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final text = value == null ? (placeholder ?? '') : formatLumoDate(value!, scope.locale, style: style);
    return LumoDateFieldFrame(
      label: label,
      description: description,
      errorMessage: errorMessage,
      isRequired: isRequired,
      isDisabled: isDisabled,
      control: Row(
        children: [
          // The field: named by the label, its value the formatted date,
          // read-only (typing is the picker's job); tapping it opens the picker.
          Expanded(
            child: LumoDateValueBox(
              label: label,
              text: text,
              isEmpty: value == null,
              hint: LumoDateFieldFrame.hintFor(description, errorMessage),
              isInvalid: errorMessage != null,
              isDisabled: isDisabled,
              onTap: () => _open(context),
            ),
          ),
          const SizedBox(width: 8),
          // The calendar button, at the inline END by the Row's own mirroring.
          LumoIconButton(label: openLabel, variant: LumoButtonVariant.outline, isDisabled: isDisabled, onPressed: () => _open(context), child: Icon(Icons.calendar_today, size: 18, color: c.fg)),
        ],
      ),
    );
  }

  Future<void> _open(BuildContext context) async {
    // Lumo's own sheet route, never Material's — `showLumoDateSheet` is the one
    // surface the three date controls share.
    final chosen = await showLumoDateSheet<DateTime>(
      context,
      closeLabel: closeLabel,
      body: (ctx) => LumoCalendarSheet(
        label: label,
        closeLabel: closeLabel,
        previousMonthLabel: previousMonthLabel,
        nextMonthLabel: nextMonthLabel,
        todayLabel: todayLabel,
        value: value,
        minDate: minDate,
        maxDate: maxDate,
        today: today ?? DateTime.now(),
        onSelected: (d) => Navigator.of(ctx).pop(d),
      ),
    );
    if (chosen != null) onChanged?.call(chosen);
  }
}

/// The picker's body: the sheet's title and ✕, and `LumoCalendar` — month
/// caption, previous/next chevrons with previous at the inline START, the
/// 7-column grid whose first column is Saturday under a Jalali locale, day
/// cells named by the FULL date, today hinted with `todayLabel`, the selected
/// day marked, out-of-range days disabled, and the Today action.
///
/// The grid itself is NOT rewritten here: `LumoCalendar` (calendar.dart) is the
/// one month grid in this package, and this widget is its sheet chrome. Public
/// so an app can host it in its own route; `LumoDateField` shows it in a bottom
/// sheet.
class LumoCalendarSheet extends StatelessWidget {
  const LumoCalendarSheet({
    super.key,
    required this.label,
    required this.closeLabel,
    required this.previousMonthLabel,
    required this.nextMonthLabel,
    required this.todayLabel,
    required this.today,
    required this.onSelected,
    this.value,
    this.minDate,
    this.maxDate,
  });

  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// Announced name of the close affordance. An icon is not a name.
  final String closeLabel;
  /// Announced name of the previous-month control.
  final String previousMonthLabel;
  /// Announced name of the next-month control.
  final String nextMonthLabel;
  /// Announced marker for today, e.g. «امروز».
  final String todayLabel;
  /// Which day counts as today, so a test can pin it.
  final DateTime today;
  /// Called with local midnight of the chosen day.
  final ValueChanged<DateTime> onSelected;
  /// The current value. Supply it with `onChanged` for a controlled widget; omit both and the widget owns its own.
  final DateTime? value;
  /// The earliest date that can be chosen.
  final DateTime? minDate;
  /// The latest date that can be chosen.
  final DateTime? maxDate;

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
              // The visible title is the DECORATIVE copy of the name: the grid
              // below announces `label` as its own (the web puts the same string
              // on the DayPicker's `aria-label`), so this one is excluded and
              // the name is heard exactly once.
              Expanded(
                child: ExcludeSemantics(
                  child: Text(label, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: c.fg)),
                ),
              ),
              LumoIconButton(label: closeLabel, size: LumoButtonSize.sm, onPressed: () => Navigator.of(context).pop(), child: Icon(Icons.close, size: 16, color: c.fgMuted)),
            ],
          ),
          const SizedBox(height: 8),
          LumoCalendar(
            label: label,
            previousMonthLabel: previousMonthLabel,
            nextMonthLabel: nextMonthLabel,
            todayLabel: todayLabel,
            value: value,
            minDate: minDate,
            maxDate: maxDate,
            today: today,
            onChanged: onSelected,
          ),
        ],
      ),
    );
  }
}
