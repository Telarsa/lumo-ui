import 'package:flutter/material.dart';
import 'button.dart';
import 'format.dart';
import 'jalali.dart';
import 'scope.dart';
import 'tokens.g.dart';

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
  final String nextMonthLabel;
  /// Name of the Today action (selects today, when in range). Required.
  final String todayLabel;
  /// The selected day; only its local year/month/day are read.
  final DateTime? value;
  /// Called with local midnight of the chosen day.
  final ValueChanged<DateTime>? onChanged;
  /// Shown in the field when there is no value.
  final String? placeholder;
  final String? description;
  /// Shown under the field and announced. Supplying one marks it invalid.
  final String? errorMessage;
  final bool isRequired;
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
    final invalid = errorMessage != null;
    final text = value == null ? (placeholder ?? '') : formatLumoDate(value!, scope.locale, style: style);
    return Opacity(
      opacity: isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text.rich(TextSpan(text: label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg), children: [if (isRequired) TextSpan(text: ' *', style: TextStyle(color: c.critical))])),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                // The field: named by the label, its value the formatted date, read-only
                // (typing is the picker's job); tapping it opens the picker too.
                child: Semantics(
                  label: label,
                  value: text,
                  hint: [if (description != null) description, if (errorMessage != null) errorMessage].join('. '),
                  textField: true,
                  readOnly: true,
                  enabled: !isDisabled,
                  child: InkWell(
                    onTap: isDisabled ? null : () => _open(context),
                    borderRadius: BorderRadius.circular(LumoRadius.md),
                    child: Container(
                      height: LumoControl.md,
                      alignment: AlignmentDirectional.centerStart,
                      padding: const EdgeInsetsDirectional.symmetric(horizontal: 12),
                      decoration: BoxDecoration(color: c.surface, border: Border.all(color: invalid ? c.critical : c.borderControl), borderRadius: BorderRadius.circular(LumoRadius.md)),
                      child: ExcludeSemantics(child: Text(text, style: TextStyle(fontSize: 14, color: value == null ? c.fgSubtle : c.fg), overflow: TextOverflow.ellipsis)),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // The calendar button, at the inline END by the Row's own mirroring.
              LumoIconButton(label: openLabel, variant: LumoButtonVariant.outline, isDisabled: isDisabled, onPressed: () => _open(context), child: Icon(Icons.calendar_today, size: 18, color: c.fg)),
            ],
          ),
          if (description != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(description!, style: TextStyle(fontSize: 12, color: c.fgMuted))),
          if (invalid) Padding(padding: const EdgeInsets.only(top: 6), child: Semantics(liveRegion: true, child: Text(errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)))),
        ],
      ),
    );
  }

  Future<void> _open(BuildContext context) async {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final chosen = await showModalBottomSheet<DateTime>(
      context: context,
      backgroundColor: c.surface,
      barrierColor: c.scrim,
      barrierLabel: closeLabel,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(LumoRadius.lg))),
      // The sheet is a route above the caller's LumoScope: re-provide it (with the direction).
      builder: (ctx) => scope.wrap(SafeArea(
        child: LumoCalendarSheet(
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
      )),
    );
    if (chosen != null) onChanged?.call(chosen);
  }
}

/// A month, calendar-agnostic, as the grid needs it: a caption, a length, the
/// Gregorian `DateTime` of each day, and paging. Two shapes: Jalali (Lumo's
/// own arithmetic) and Gregorian (Dart's `DateTime`).
abstract class _Month {
  String caption(String locale);
  int get length;
  DateTime dayAt(int day);
  _Month get previous;
  _Month get next;
  bool contains(DateTime d);
}

class _JalaliMonth extends _Month {
  _JalaliMonth(this.year, this.month);
  final int year;
  final int month;
  @override
  String caption(String locale) => formatJalaliMonth(year, month, locale);
  @override
  int get length => JalaliDate.monthLengthOf(year, month);
  @override
  DateTime dayAt(int day) => JalaliDate(year, month, day).toDateTime();
  @override
  _Month get previous => month == 1 ? _JalaliMonth(year - 1, 12) : _JalaliMonth(year, month - 1);
  @override
  _Month get next => month == 12 ? _JalaliMonth(year + 1, 1) : _JalaliMonth(year, month + 1);
  @override
  bool contains(DateTime d) {
    final j = JalaliDate.fromDateTime(d);
    return j.year == year && j.month == month;
  }
}

class _GregorianMonth extends _Month {
  _GregorianMonth(this.year, this.month);
  final int year;
  final int month;
  @override
  String caption(String locale) => formatGregorianMonth(year, month, locale);
  @override
  int get length => DateUtils.getDaysInMonth(year, month);
  @override
  DateTime dayAt(int day) => DateTime(year, month, day);
  @override
  _Month get previous => month == 1 ? _GregorianMonth(year - 1, 12) : _GregorianMonth(year, month - 1);
  @override
  _Month get next => month == 12 ? _GregorianMonth(year + 1, 1) : _GregorianMonth(year, month + 1);
  @override
  bool contains(DateTime d) => d.year == year && d.month == month;
}

_Month _monthOf(DateTime d, String locale) {
  if (calendarOf(locale) == LumoCalendarSystem.jalali) {
    final j = JalaliDate.fromDateTime(d);
    return _JalaliMonth(j.year, j.month);
  }
  return _GregorianMonth(d.year, d.month);
}

/// The picker's body: month caption (a header), previous/next chevrons named
/// by the required labels with previous at the inline START, a 7-column grid
/// whose first column is Saturday under a Jalali locale and the language's
/// first weekday under Gregorian, day cells as buttons named by the FULL date
/// (`LumoDateStyle.long`, so a reader hears the weekday), today marked (and
/// hinted with `todayLabel`), the selected day marked, out-of-range days
/// disabled, and a Today action. Public so an app can host it in its own
/// route; `LumoDateField` shows it in a bottom sheet.
class LumoCalendarSheet extends StatefulWidget {
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

  final String label;
  final String closeLabel;
  final String previousMonthLabel;
  final String nextMonthLabel;
  final String todayLabel;
  final DateTime today;
  final ValueChanged<DateTime> onSelected;
  final DateTime? value;
  final DateTime? minDate;
  final DateTime? maxDate;

  @override
  State<LumoCalendarSheet> createState() => _LumoCalendarSheetState();
}

class _LumoCalendarSheetState extends State<LumoCalendarSheet> {
  _Month? _visible;

  bool _inRange(DateTime d) {
    final day = DateUtils.dateOnly(d);
    if (widget.minDate != null && day.isBefore(DateUtils.dateOnly(widget.minDate!))) return false;
    if (widget.maxDate != null && day.isAfter(DateUtils.dateOnly(widget.maxDate!))) return false;
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final locale = scope.locale;
    final month = _visible ??= _monthOf(widget.value ?? widget.today, locale);
    final first = firstDayOfWeek(locale);
    // Column of a day: 0 for the week's first day, by `DateTime.weekday` (Dart's `%` is non-negative).
    int column(DateTime d) => (d.weekday - first) % 7;
    final leading = column(month.dayAt(1));
    final rows = ((leading + month.length + 6) ~/ 7).clamp(1, 6);
    // Header names, one per column, from the week's first day on.
    final headers = List.generate(7, (i) => weekdayName(DateUtils.addDaysToDate(widget.today, i - column(widget.today)), locale, short: true));

    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 16, end: 16, top: 12, bottom: 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(child: Text(widget.label, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: c.fg))),
              LumoIconButton(label: widget.closeLabel, size: LumoButtonSize.sm, onPressed: () => Navigator.of(context).pop(), child: Icon(Icons.close, size: 16, color: c.fgMuted)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              // Previous at the inline start, next at the inline end — the Row mirrors under RTL,
              // and the chevrons are `matchTextDirection` icons, so they point the reading way.
              LumoIconButton(label: widget.previousMonthLabel, size: LumoButtonSize.sm, onPressed: () => setState(() => _visible = (_visible ?? month).previous), child: Icon(Icons.chevron_left, size: 20, color: c.fg)),
              Expanded(child: Semantics(header: true, child: Text(month.caption(locale), textAlign: TextAlign.center, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: c.fg)))),
              LumoIconButton(label: widget.nextMonthLabel, size: LumoButtonSize.sm, onPressed: () => setState(() => _visible = (_visible ?? month).next), child: Icon(Icons.chevron_right, size: 20, color: c.fg)),
            ],
          ),
          const SizedBox(height: 8),
          // Column headers: decorative for a reader (each cell's name carries its weekday).
          ExcludeSemantics(
            child: Row(children: [for (final h in headers) Expanded(child: Text(h, textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: c.fgMuted)))]),
          ),
          const SizedBox(height: 4),
          for (var r = 0; r < rows; r++)
            Row(
              children: [
                for (var col = 0; col < 7; col++)
                  Expanded(
                    child: SizedBox(
                      height: 40,
                      child: _cell(context, r * 7 + col - leading + 1, month, locale, c),
                    ),
                  ),
              ],
            ),
          const SizedBox(height: 12),
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: LumoButton(
              variant: LumoButtonVariant.outline,
              size: LumoButtonSize.sm,
              isDisabled: !_inRange(widget.today),
              onPressed: () => widget.onSelected(DateUtils.dateOnly(widget.today)),
              child: Text(widget.todayLabel),
            ),
          ),
        ],
      ),
    );
  }

  Widget? _cell(BuildContext context, int day, _Month month, String locale, LumoSchemeColours c) {
    if (day < 1 || day > month.length) return null;
    final date = month.dayAt(day);
    final isToday = DateUtils.isSameDay(date, widget.today);
    final isSelected = widget.value != null && DateUtils.isSameDay(date, widget.value);
    final enabled = _inRange(date);
    return Semantics(
      label: formatLumoDate(date, locale, style: LumoDateStyle.long),
      hint: isToday ? widget.todayLabel : null,
      button: true,
      selected: isSelected,
      enabled: enabled,
      child: Opacity(
        opacity: enabled ? 1 : 0.4,
        child: InkWell(
          onTap: enabled ? () => widget.onSelected(date) : null,
          borderRadius: BorderRadius.circular(LumoRadius.md),
          child: Container(
            margin: const EdgeInsets.all(2),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isSelected ? c.accent : Colors.transparent,
              borderRadius: BorderRadius.circular(LumoRadius.md),
              border: Border.all(color: isToday && !isSelected ? c.accent : Colors.transparent, width: 1.5),
            ),
            child: ExcludeSemantics(
              child: Text(formatNumber(day, locale, grouping: false), style: TextStyle(fontSize: 14, fontWeight: isToday || isSelected ? FontWeight.w600 : FontWeight.w400, color: isSelected ? c.accentFg : c.fg)),
            ),
          ),
        ),
      ),
    );
  }
}
