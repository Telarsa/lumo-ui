import 'package:flutter/material.dart';

import 'button.dart';
import 'format.dart';
import 'jalali.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// The month grid, in the reader's own calendar — `LumoCalendar` (one day) and
/// `LumoRangeCalendar` (a span), mirroring `packages/ui/src/calendar.tsx` and
/// `packages/ui/src/range-calendar.tsx`.
///
/// The web hands the grid to react-day-picker and hands react-day-picker a
/// `dateLib` (`calendar-datelib.ts`); Flutter has no such library, so the grid
/// is Lumo's own on `jalali.dart`'s arithmetic. Which calendar is
/// `calendarOf(locale)`, never a `calendar` parameter: Jalali under `fa-*` and
/// any `-u-ca-persian` tag, Gregorian otherwise. The week's first column is
/// SATURDAY under a Jalali calendar and the language's own first weekday
/// otherwise (`firstDayOfWeek`), and the columns mirror with the script, so
/// شنبه is the RIGHTMOST column under `fa-IR` and the leftmost under
/// `en-u-ca-persian`.
///
/// **Never Material's `CalendarDatePicker`/`showDatePicker`**: Gregorian by
/// construction, and every string it says («Select date», «Switch to calendar»,
/// the route and barrier names) comes from `MaterialLocalizations` — English on
/// any app that has not added a Persian delegate, and unreachable by a
/// parameter either way.
///
/// A day cell's announced name is the FULL date in the reader's calendar
/// (`LumoDateStyle.long` — «شنبه ۲۴ مرداد ۱۴۰۵»), never the bare number that is
/// painted in it: «۲۴» alone tells a reader nothing about which month it is in,
/// and the paint is `ExcludeSemantics`d for that reason.
///
/// Interaction shape from **forui**'s `FCalendar` (forui.dev) and Material's
/// own `CalendarDatePicker`: chevrons page one month, the caption is the
/// month-and-year heading, and (Lumo's addition, and the reason `todayLabel` is
/// required) a Today action sits under the grid. Nothing is copied — the
/// arithmetic, the tokens and the semantics are Lumo's.

// ---------------------------------------------------------------------------
// The month, calendar-agnostic
// ---------------------------------------------------------------------------

/// A month as the grid needs it: a caption, a length, the Gregorian `DateTime`
/// of each of its days, and paging. Two shapes — Jalali (Lumo's own
/// arithmetic) and Gregorian (Dart's `DateTime`) — so nothing above this line
/// knows which calendar it is drawing.
abstract class _Month {
  String caption(String locale);
  int get length;
  DateTime dayAt(int day);
  _Month get previous;
  _Month get next;
  bool contains(DateTime d);

  /// A total order over months of ONE system, for bounds and list building.
  int get ordinal;
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

  @override
  int get ordinal => year * 12 + month;
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
  @override
  int get ordinal => year * 12 + month;
}

_Month _monthOf(DateTime d, String locale) {
  if (calendarOf(locale) == LumoCalendarSystem.jalali) {
    final j = JalaliDate.fromDateTime(d);
    return _JalaliMonth(j.year, j.month);
  }
  return _GregorianMonth(d.year, d.month);
}

// ---------------------------------------------------------------------------
// A span of days
// ---------------------------------------------------------------------------

/// A span of days, both ends inclusive — the counterpart of the web's
/// `CalendarDateRange`, and its field names (`from`, `to`) rather than
/// start/end, so the two libraries read the same. `to` is absent while the
/// reader has picked only the first end, which is a real state the grid shows.
///
/// The ends are Gregorian `DateTime`s (Flutter's date type; the web's
/// `CalendarDate` has no Dart twin) of which only the local calendar day is
/// ever read. Everything a reader SEES of them goes through `formatLumoDate`.
@immutable
class LumoDateRange {
  const LumoDateRange({required this.from, this.to});

  /// The first day of the span.
  final DateTime from;

  /// The last day of the span; `null` while only the first end is picked.
  final DateTime? to;

  /// Whether both ends are picked.
  bool get isComplete => to != null;

  /// Whether `day` falls inside the span (both ends inclusive). A span with no
  /// `to` contains only `from`.
  bool contains(DateTime day) {
    final d = DateUtils.dateOnly(day);
    final a = DateUtils.dateOnly(from);
    if (to == null) return d == a;
    final b = DateUtils.dateOnly(to!);
    return !d.isBefore(a) && !d.isAfter(b);
  }

  LumoDateRange copyWith({DateTime? from, DateTime? to}) => LumoDateRange(from: from ?? this.from, to: to ?? this.to);

  @override
  bool operator ==(Object other) =>
      other is LumoDateRange && DateUtils.isSameDay(other.from, from) && (other.to == null) == (to == null) && (to == null || DateUtils.isSameDay(other.to, to));

  @override
  int get hashCode => Object.hash(DateUtils.dateOnly(from), to == null ? null : DateUtils.dateOnly(to!));

  @override
  String toString() => 'LumoDateRange(${DateUtils.dateOnly(from).toIso8601String()} .. ${to == null ? null : DateUtils.dateOnly(to!).toIso8601String()})';
}

// ---------------------------------------------------------------------------
// The shared view: nav, weekday header, grid, month/year chooser
// ---------------------------------------------------------------------------

/// Everything both grids do. There is exactly ONE month grid in this package;
/// `LumoCalendar`, `LumoRangeCalendar`, `LumoCalendarSheet`, `LumoDatePicker`
/// and `LumoDateRangePicker` all draw it from here, and a cell's appearance is
/// the only thing a subclass decides.
abstract class _CalendarViewState<W extends StatefulWidget> extends State<W> {
  /// The uncontrolled visible month, as day 1 of it. `null` until the reader pages.
  DateTime? _internalMonth;

  /// Whether the month/year list has replaced the grid.
  bool _choosing = false;

  final ScrollController _chooserScroll = ScrollController();

  // --- what a subclass supplies -------------------------------------------

  String get label;
  String get previousMonthLabel;
  String get nextMonthLabel;
  String get todayLabel;

  /// Name of the caption button that opens the month/year list. `null` leaves
  /// the caption a plain heading, which is the whole of the web's `"label"`
  /// caption layout.
  String? get selectMonthLabel;

  DateTime? get minDate;
  DateTime? get maxDate;
  DateTime? get todayInput;
  bool Function(DateTime date)? get isDateUnavailable;

  /// Marks days that carry something — a booking, a holiday — with a dot.
  bool Function(DateTime date)? get isDateMarked;

  /// What that dot MEANS, announced on the day it sits on. A dot is a colour,
  /// and a colour is not an announcement.
  String? get markedLabel;

  bool get isDisabled;

  /// The month to show when nothing else decides: the value, or today.
  DateTime get anchorDate;

  /// The controlled visible month, if the caller owns it.
  DateTime? get focusedMonth;
  ValueChanged<DateTime>? get onMonthChanged;

  /// One day cell, or `null` for a slot outside the month.
  Widget? buildCell(BuildContext context, DateTime date, int day, String locale, LumoSchemeColours c);

  /// Anything under the grid (the Today action, in `LumoCalendar`).
  List<Widget> buildFooter(BuildContext context, String locale, LumoSchemeColours c) => const [];

  // --- shared behaviour -----------------------------------------------------

  /// The day marked as today. Injectable so a screen (or a test) is
  /// deterministic — the web REQUIRES it for the same reason (SSR).
  DateTime get today => DateUtils.dateOnly(todayInput ?? DateTime.now());

  /// Whether `d` is inside `minDate`..`maxDate` (both ends selectable).
  bool inBounds(DateTime d) {
    final day = DateUtils.dateOnly(d);
    if (minDate != null && day.isBefore(DateUtils.dateOnly(minDate!))) return false;
    if (maxDate != null && day.isAfter(DateUtils.dateOnly(maxDate!))) return false;
    return true;
  }

  /// Whether a reader may pick `d`: inside the bounds, not marked unavailable,
  /// and the calendar itself enabled. The web passes these as two SEPARATE
  /// matchers to react-day-picker for the same reason they are two tests here —
  /// a bound and a holiday disable a day independently.
  bool selectable(DateTime d) => !isDisabled && inBounds(d) && !(isDateUnavailable?.call(DateUtils.dateOnly(d)) ?? false);

  /// Whether `d` carries a marker.
  bool marked(DateTime d) => isDateMarked?.call(DateUtils.dateOnly(d)) ?? false;

  /// The dot itself: decoration for the eye, excluded from the tree because
  /// `markedLabel` already says it in words.
  Widget markerDot(LumoSchemeColours c, {required bool onFilledCell}) => ExcludeSemantics(
        child: Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: onFilledCell ? c.accentFg : c.accent)),
      );

  _Month visibleMonth(String locale) => _monthOf(focusedMonth ?? _internalMonth ?? anchorDate, locale);

  /// Page to `m`: the internal month moves only when the caller is not driving
  /// `focusedMonth`, and `onMonthChanged` always fires, with day 1 of the month.
  void goToMonth(_Month m) {
    final first = m.dayAt(1);
    if (focusedMonth == null) {
      setState(() => _internalMonth = first);
    }
    onMonthChanged?.call(first);
  }

  void goToDay(DateTime d) {
    if (focusedMonth == null) {
      setState(() => _internalMonth = DateUtils.dateOnly(d));
    }
    onMonthChanged?.call(DateUtils.dateOnly(d));
  }

  @override
  void dispose() {
    _chooserScroll.dispose();
    super.dispose();
  }

  // --- the frame ------------------------------------------------------------

  Widget buildFrame(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final locale = scope.locale;
    final month = visibleMonth(locale);
    final first = firstDayOfWeek(locale);
    // Column of a day, 0 for the week's first: Dart's `%` is never negative.
    int column(DateTime d) => (d.weekday - first) % 7;
    final anchor = month.dayAt(1);
    final leading = column(anchor);
    final rows = ((leading + month.length + 6) ~/ 7).clamp(1, 6);
    // One header per column, from the week's first day on. Derived from the
    // month itself, never from the clock.
    final headers = List.generate(7, (i) => weekdayName(DateUtils.addDaysToDate(anchor, i - column(anchor)), locale, short: true));
    final rtl = Directionality.of(context) == TextDirection.rtl;

    return Semantics(
      // The grid's own name — the web puts the same string on `aria-label` of
      // the DayPicker root. A 42-cell grid needs a name of its own.
      container: true,
      // …and only the name: every cell, chevron and caption stays a node of its
      // own instead of being swallowed into one 42-day sentence.
      explicitChildNodes: true,
      label: label,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              // Previous at the inline START, next at the inline END: the Row
              // mirrors under RTL. Paging itself is NOT bounded by
              // `minDate`/`maxDate` — a bound bounds what may be SELECTED, and
              // a reader who cannot page past it cannot see why a day is
              // disabled. The glyph is chosen by direction rather than
              // rotated — "previous" points at the reader's past, which is the
              // right of the screen in Persian, and no transform flips a glyph
              // honestly (the web's `calendarChevron` picks the icon the same way).
              LumoIconButton(
                label: previousMonthLabel,
                size: LumoButtonSize.sm,
                isDisabled: isDisabled,
                // The month is re-read at TAP time, never captured from this
                // build: two taps inside one frame must page two months.
                onPressed: () => goToMonth(visibleMonth(locale).previous),
                child: Icon(rtl ? Icons.chevron_right : Icons.chevron_left, size: 20, color: c.fg),
              ),
              Expanded(child: _caption(context, month, locale, c)),
              LumoIconButton(
                label: nextMonthLabel,
                size: LumoButtonSize.sm,
                isDisabled: isDisabled,
                onPressed: () => goToMonth(visibleMonth(locale).next),
                child: Icon(rtl ? Icons.chevron_left : Icons.chevron_right, size: 20, color: c.fg),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_choosing)
            _chooser(context, month, locale, c)
          else ...[
            // Column headers: decoration for a reader, because every cell's own
            // name already carries its weekday.
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
                        child: _cellAt(context, r * 7 + col - leading + 1, month, locale, c),
                      ),
                    ),
                ],
              ),
            ...buildFooter(context, locale, c),
          ],
        ],
      ),
    );
  }

  Widget? _cellAt(BuildContext context, int day, _Month month, String locale, LumoSchemeColours c) {
    if (day < 1 || day > month.length) return null;
    return buildCell(context, month.dayAt(day), day, locale, c);
  }

  Widget _caption(BuildContext context, _Month month, String locale, LumoSchemeColours c) {
    final text = month.caption(locale);
    final style = TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: c.fg);
    if (selectMonthLabel == null) {
      return Semantics(header: true, child: Text(text, textAlign: TextAlign.center, style: style));
    }
    return Semantics(
      header: true,
      button: true,
      label: text,
      hint: selectMonthLabel,
      enabled: !isDisabled,
      child: InkWell(
        onTap: isDisabled
            ? null
            : () {
                setState(() => _choosing = !_choosing);
                if (_choosing) _scrollChooserTo(month, locale);
              },
        borderRadius: BorderRadius.circular(LumoRadius.md),
        child: ExcludeSemantics(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(child: Text(text, textAlign: TextAlign.center, style: style, overflow: TextOverflow.ellipsis)),
                Icon(_choosing ? Icons.arrow_drop_up : Icons.arrow_drop_down, size: 20, color: c.fgMuted),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Every month a reader may jump to, from the bounds when they exist and from
  /// the injected `today` when they do not — never from the clock during build,
  /// which is the hydration hazard the web solves by REQUIRING bounds for its
  /// year dropdown.
  List<_Month> _chooserMonths(String locale) {
    final startAnchor = minDate ?? DateTime(today.year - 100, today.month, 1);
    final endAnchor = maxDate ?? DateTime(today.year + 10, today.month, 1);
    var m = _monthOf(startAnchor, locale);
    final end = _monthOf(endAnchor, locale);
    final out = <_Month>[];
    while (m.ordinal <= end.ordinal && out.length < 2400) {
      out.add(m);
      m = m.next;
    }
    return out.isEmpty ? [_monthOf(anchorDate, locale)] : out;
  }

  static const double _chooserRow = 44;

  void _scrollChooserTo(_Month month, String locale) {
    final months = _chooserMonths(locale);
    final index = months.indexWhere((m) => m.ordinal == month.ordinal);
    if (index < 0) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_chooserScroll.hasClients) return;
      final target = (index * _chooserRow - _chooserRow * 2).clamp(0.0, _chooserScroll.position.maxScrollExtent);
      _chooserScroll.jumpTo(target);
    });
  }

  /// The month/year jump: ONE list of «month year» captions rather than two
  /// dropdowns. A dropdown pair needs two more announced strings and a second
  /// interaction model; a list of months names each row with exactly the
  /// caption the reader is already looking at, and a Jalali year needs no
  /// separate control because the caption already carries it.
  Widget _chooser(BuildContext context, _Month month, String locale, LumoSchemeColours c) {
    final months = _chooserMonths(locale);
    return SizedBox(
      height: 240,
      child: ListView.builder(
        controller: _chooserScroll,
        itemExtent: _chooserRow,
        itemCount: months.length,
        itemBuilder: (ctx, i) {
          final m = months[i];
          final selected = m.ordinal == month.ordinal;
          final caption = m.caption(locale);
          return Semantics(
            label: caption,
            button: true,
            selected: selected,
            child: InkWell(
              onTap: () {
                goToMonth(m);
                setState(() => _choosing = false);
              },
              borderRadius: BorderRadius.circular(LumoRadius.md),
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: 2),
                alignment: AlignmentDirectional.centerStart,
                padding: const EdgeInsetsDirectional.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: selected ? c.surfaceHover : Colors.transparent,
                  borderRadius: BorderRadius.circular(LumoRadius.md),
                ),
                child: ExcludeSemantics(
                  child: Text(caption, style: TextStyle(fontSize: 14, fontWeight: selected ? FontWeight.w600 : FontWeight.w400, color: c.fg)),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// LumoCalendar
// ---------------------------------------------------------------------------

/// A month grid that selects ONE day — `packages/ui/src/calendar.tsx`.
///
/// Announced strings, all REQUIRED: `label` (the grid's name),
/// `previousMonthLabel` / `nextMonthLabel` (the chevrons are icons) and
/// `todayLabel` (the Today action, and the hint on today's cell). The web has
/// no `previousMonthLabel`/`nextMonthLabel` because react-day-picker composes
/// its nav names from `LumoStrings`; Flutter has no such table, so they are
/// parameters again — which is the stricter of the two, not the weaker.
///
/// `value` is a Gregorian `DateTime` of which only the local calendar day is
/// read; `onChanged` receives local midnight of the chosen day. The grid is
/// CONTROLLED (`value` + `onChanged`), as the web's `Calendar` is; the
/// uncontrolled shape lives in `LumoDatePicker`, which owns the value.
class LumoCalendar extends StatefulWidget {
  const LumoCalendar({
    super.key,
    required this.label,
    required this.previousMonthLabel,
    required this.nextMonthLabel,
    required this.todayLabel,
    this.value,
    this.onChanged,
    this.minDate,
    this.maxDate,
    this.today,
    this.isDateUnavailable,
    this.isDateMarked,
    this.markedLabel,
    this.focusedMonth,
    this.onMonthChanged,
    this.selectMonthLabel,
    this.isDisabled = false,
    this.showTodayAction = true,
  }) : assert(isDateMarked == null || markedLabel != null, 'A marked day needs markedLabel: a dot is a colour, and a colour is not an announcement.');

  /// Announced name of the grid. Required.
  final String label;

  /// Names of the month-paging chevrons. Required — they are icons.
  final String previousMonthLabel;
  /// Announced name of the next-month control.
  final String nextMonthLabel;

  /// Name of the Today action, and the hint on today's cell. Required.
  final String todayLabel;

  /// The selected day; only its local year/month/day are read.
  final DateTime? value;

  /// Called with local midnight of the chosen day.
  final ValueChanged<DateTime>? onChanged;

  /// Earliest selectable DAY (itself selectable). Bounds SELECTION and paging.
  final DateTime? minDate;

  /// Latest selectable DAY (itself selectable).
  final DateTime? maxDate;

  /// The day marked as today; defaults to the device clock. Injectable so a
  /// screen (or a test) is deterministic — the web REQUIRES it for SSR.
  final DateTime? today;

  /// Marks individual days unselectable — holidays, booked days. The web's
  /// `isDateUnavailable`, receiving local midnight of the day in question.
  final bool Function(DateTime date)? isDateUnavailable;

  /// Marks days that carry something — the Khroos booking calendar's dot on a
  /// day that already has appointments. REQUIRES `markedLabel`. Not a web prop:
  /// the web draws such things with a `modifiers` class name, which a screen
  /// reader cannot hear; here the marker is announced.
  final bool Function(DateTime date)? isDateMarked;

  /// Announced on every marked day. Required as soon as `isDateMarked` is given.
  final String? markedLabel;

  /// The visible month, when the caller drives it (any day inside it). Leave
  /// `null` and the grid pages itself.
  final DateTime? focusedMonth;

  /// Fires with day 1 of the month the grid moved to.
  final ValueChanged<DateTime>? onMonthChanged;

  /// Name of the caption button that opens the month/year list — the web's
  /// `captionLayout: "dropdown"`. `null` (the default) leaves the caption a
  /// plain heading, the web's `"label"` layout.
  final String? selectMonthLabel;

  /// Whether the control is disabled.
  final bool isDisabled;

  /// Whether the Today action is shown under the grid. `todayLabel` still names
  /// today's cell when it is not.
  final bool showTodayAction;

  @override
  State<LumoCalendar> createState() => _LumoCalendarState();
}

class _LumoCalendarState extends _CalendarViewState<LumoCalendar> {
  @override
  String get label => widget.label;
  @override
  String get previousMonthLabel => widget.previousMonthLabel;
  @override
  String get nextMonthLabel => widget.nextMonthLabel;
  @override
  String get todayLabel => widget.todayLabel;
  @override
  String? get selectMonthLabel => widget.selectMonthLabel;
  @override
  DateTime? get minDate => widget.minDate;
  @override
  DateTime? get maxDate => widget.maxDate;
  @override
  DateTime? get todayInput => widget.today;
  @override
  bool Function(DateTime date)? get isDateUnavailable => widget.isDateUnavailable;
  @override
  bool Function(DateTime date)? get isDateMarked => widget.isDateMarked;
  @override
  String? get markedLabel => widget.markedLabel;
  @override
  bool get isDisabled => widget.isDisabled;
  @override
  DateTime get anchorDate => widget.value ?? today;
  @override
  DateTime? get focusedMonth => widget.focusedMonth;
  @override
  ValueChanged<DateTime>? get onMonthChanged => widget.onMonthChanged;

  @override
  Widget build(BuildContext context) => buildFrame(context);

  @override
  Widget buildCell(BuildContext context, DateTime date, int day, String locale, LumoSchemeColours c) {
    final isToday = DateUtils.isSameDay(date, today);
    final isSelected = widget.value != null && DateUtils.isSameDay(date, widget.value);
    final enabled = selectable(date);
    final isMarked = marked(date);
    // What is TRUE of this day beyond its date, in the order a reader wants it.
    final notes = <String>[if (isMarked) widget.markedLabel!, if (isToday) widget.todayLabel];
    return Semantics(
      // The FULL date, not the bare number painted in the cell.
      label: formatLumoDate(date, locale, style: LumoDateStyle.long),
      hint: notes.isEmpty ? null : notes.join('. '),
      button: true,
      selected: isSelected,
      enabled: enabled,
      child: Opacity(
        opacity: enabled ? 1 : 0.4,
        child: InkWell(
          onTap: enabled ? () => widget.onChanged?.call(date) : null,
          borderRadius: BorderRadius.circular(LumoRadius.md),
          child: Stack(
            children: [
              Container(
                margin: const EdgeInsets.all(2),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: isSelected ? c.accent : Colors.transparent,
                  borderRadius: BorderRadius.circular(LumoRadius.md),
                  border: Border.all(color: isToday && !isSelected ? c.accent : Colors.transparent, width: 1.5),
                ),
                child: ExcludeSemantics(
                  child: Text(
                    formatNumber(day, locale, grouping: false),
                    style: TextStyle(fontSize: 14, fontWeight: isToday || isSelected ? FontWeight.w600 : FontWeight.w400, color: isSelected ? c.accentFg : c.fg),
                  ),
                ),
              ),
              // The dot sits at the top inline END, so it mirrors with the script.
              if (isMarked) PositionedDirectional(top: 5, end: 6, child: markerDot(c, onFilledCell: isSelected)),
            ],
          ),
        ),
      ),
    );
  }

  @override
  List<Widget> buildFooter(BuildContext context, String locale, LumoSchemeColours c) {
    if (!widget.showTodayAction) return const [];
    return [
      const SizedBox(height: 12),
      Align(
        alignment: AlignmentDirectional.centerStart,
        child: LumoButton(
          variant: LumoButtonVariant.outline,
          size: LumoButtonSize.sm,
          isDisabled: !selectable(today),
          onPressed: () {
            // The grid follows the selection: a reader five months away who
            // asks for today should SEE today.
            goToDay(today);
            widget.onChanged?.call(today);
          },
          child: Text(widget.todayLabel),
        ),
      ),
    ];
  }
}

// ---------------------------------------------------------------------------
// LumoRangeCalendar
// ---------------------------------------------------------------------------

/// A month grid that selects a SPAN of days — `packages/ui/src/range-calendar.tsx`.
///
/// Everything `LumoCalendar` says about Jalali applies. What is specific to a
/// range is the band, and the band is the point: **a range drawn only as a
/// background colour does not exist for a reader**. Every day inside the span
/// is announced — `startLabel` on the first, `endLabel` on the last,
/// `inRangeLabel` on the days between — and all three are REQUIRED for that
/// reason. The band itself rounds on LOGICAL corners
/// (`BorderRadiusDirectional`), so it opens toward the reader in both scripts,
/// exactly as the web's `rounded-ss`/`rounded-es` do.
///
/// The tap rule is Material's `DateRangePickerDialog`'s, which is also
/// react-day-picker's practical behaviour: a tap with no range in progress, or
/// with a complete one, starts a new span; a tap on or after the open start
/// closes it; a tap BEFORE the open start moves the start instead of producing
/// an inverted range. `onChanged` fires on both — a span with no `to` is a real
/// intermediate state, which is why `LumoDateRange.to` is nullable.
///
/// `value` seeds the span and re-seeds it whenever the caller changes it, so
/// the grid works controlled (inside `LumoDateRangePicker`) and uncontrolled
/// (on its own) without a second parameter.
class LumoRangeCalendar extends StatefulWidget {
  const LumoRangeCalendar({
    super.key,
    required this.label,
    required this.previousMonthLabel,
    required this.nextMonthLabel,
    required this.todayLabel,
    required this.startLabel,
    required this.endLabel,
    required this.inRangeLabel,
    this.value,
    this.onChanged,
    this.minDate,
    this.maxDate,
    this.today,
    this.isDateUnavailable,
    this.isDateMarked,
    this.markedLabel,
    this.focusedMonth,
    this.onMonthChanged,
    this.selectMonthLabel,
    this.isDisabled = false,
  }) : assert(isDateMarked == null || markedLabel != null, 'A marked day needs markedLabel: a dot is a colour, and a colour is not an announcement.');

  /// Announced name of the grid. Required.
  final String label;

  /// Names of the month-paging chevrons. Required — they are icons.
  final String previousMonthLabel;
  /// Announced name of the next-month control.
  final String nextMonthLabel;

  /// The hint on today's cell. Required.
  final String todayLabel;

  /// Announced on the first day of the span. Required — see the header.
  final String startLabel;

  /// Announced on the last day of the span. Required.
  final String endLabel;

  /// Announced on every day BETWEEN the ends. Required: the band is a colour,
  /// and a colour is not an announcement.
  final String inRangeLabel;

  /// The selected span. Re-seeds the grid whenever it changes.
  final LumoDateRange? value;

  /// Fires with the span after every tap — with `to` absent while only the
  /// first end is picked.
  final ValueChanged<LumoDateRange>? onChanged;

  /// The earliest date that can be chosen.
  final DateTime? minDate;
  /// The latest date that can be chosen.
  final DateTime? maxDate;

  /// The day marked as today; defaults to the device clock. Injectable for determinism.
  final DateTime? today;

  /// Returns whether a day cannot be chosen — a closed day, a taken slot.
  final bool Function(DateTime date)? isDateUnavailable;

  /// Marks days that carry something, with a dot. REQUIRES `markedLabel`.
  final bool Function(DateTime date)? isDateMarked;

  /// Announced on every marked day. Required as soon as `isDateMarked` is given.
  final String? markedLabel;

  /// The month the grid opens on. Null starts at the selected date, or today.
  final DateTime? focusedMonth;
  /// Fires with day 1 of the month the grid moved to.
  final ValueChanged<DateTime>? onMonthChanged;

  /// Name of the caption button that opens the month/year list. `null` leaves
  /// the caption a plain heading.
  final String? selectMonthLabel;

  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  State<LumoRangeCalendar> createState() => _LumoRangeCalendarState();
}

class _LumoRangeCalendarState extends _CalendarViewState<LumoRangeCalendar> {
  LumoDateRange? _range;

  @override
  void initState() {
    super.initState();
    _range = widget.value;
  }

  @override
  void didUpdateWidget(LumoRangeCalendar old) {
    super.didUpdateWidget(old);
    if (widget.value != old.value) _range = widget.value;
  }

  @override
  String get label => widget.label;
  @override
  String get previousMonthLabel => widget.previousMonthLabel;
  @override
  String get nextMonthLabel => widget.nextMonthLabel;
  @override
  String get todayLabel => widget.todayLabel;
  @override
  String? get selectMonthLabel => widget.selectMonthLabel;
  @override
  DateTime? get minDate => widget.minDate;
  @override
  DateTime? get maxDate => widget.maxDate;
  @override
  DateTime? get todayInput => widget.today;
  @override
  bool Function(DateTime date)? get isDateUnavailable => widget.isDateUnavailable;
  @override
  bool Function(DateTime date)? get isDateMarked => widget.isDateMarked;
  @override
  String? get markedLabel => widget.markedLabel;
  @override
  bool get isDisabled => widget.isDisabled;
  @override
  DateTime get anchorDate => _range?.from ?? today;
  @override
  DateTime? get focusedMonth => widget.focusedMonth;
  @override
  ValueChanged<DateTime>? get onMonthChanged => widget.onMonthChanged;

  @override
  Widget build(BuildContext context) => buildFrame(context);

  void _tap(DateTime date) {
    final day = DateUtils.dateOnly(date);
    final open = _range;
    late final LumoDateRange next;
    if (open == null || open.isComplete || day.isBefore(DateUtils.dateOnly(open.from))) {
      next = LumoDateRange(from: day);
    } else {
      next = LumoDateRange(from: DateUtils.dateOnly(open.from), to: day);
    }
    setState(() => _range = next);
    widget.onChanged?.call(next);
  }

  @override
  Widget buildCell(BuildContext context, DateTime date, int day, String locale, LumoSchemeColours c) {
    final range = _range;
    final isToday = DateUtils.isSameDay(date, today);
    final enabled = selectable(date);
    final isFrom = range != null && DateUtils.isSameDay(date, range.from);
    final isTo = range != null && range.to != null && DateUtils.isSameDay(date, range.to);
    final inSpan = range != null && range.contains(date);
    final isMiddle = inSpan && !isFrom && !isTo;

    // The announcement, in the same slot `LumoCalendar` announces «امروز» in.
    final isMarked = marked(date);
    final roles = <String>[
      if (isFrom) widget.startLabel,
      if (isTo) widget.endLabel,
      if (isMiddle) widget.inRangeLabel,
      if (isMarked) widget.markedLabel!,
      if (isToday) widget.todayLabel,
    ];

    // The band under the endpoints: rounded on the LOGICAL corner that faces
    // outward, square where the span continues.
    final BorderRadiusGeometry bandRadius;
    if (isFrom && isTo) {
      bandRadius = BorderRadius.circular(LumoRadius.md);
    } else if (isFrom) {
      bandRadius = const BorderRadiusDirectional.horizontal(start: Radius.circular(LumoRadius.md));
    } else if (isTo) {
      bandRadius = const BorderRadiusDirectional.horizontal(end: Radius.circular(LumoRadius.md));
    } else {
      bandRadius = BorderRadius.zero;
    }
    final showBand = inSpan && range.isComplete;

    return Semantics(
      label: formatLumoDate(date, locale, style: LumoDateStyle.long),
      hint: roles.isEmpty ? null : roles.join('. '),
      button: true,
      selected: inSpan,
      enabled: enabled,
      child: Opacity(
        opacity: enabled ? 1 : 0.4,
        child: InkWell(
          onTap: enabled ? () => _tap(date) : null,
          child: Stack(
            children: [
              if (showBand)
                Positioned.fill(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: DecoratedBox(decoration: BoxDecoration(color: c.surfaceHover, borderRadius: bandRadius)),
                  ),
                ),
              Container(
                margin: const EdgeInsets.all(2),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: isFrom || isTo ? c.accent : Colors.transparent,
                  borderRadius: BorderRadius.circular(LumoRadius.md),
                  border: Border.all(color: isToday && !isFrom && !isTo ? c.accent : Colors.transparent, width: 1.5),
                ),
                child: ExcludeSemantics(
                  child: Text(
                    formatNumber(day, locale, grouping: false),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: isToday || inSpan ? FontWeight.w600 : FontWeight.w400,
                      color: isFrom || isTo ? c.accentFg : c.fg,
                    ),
                  ),
                ),
              ),
              if (isMarked) PositionedDirectional(top: 5, end: 6, child: markerDot(c, onFilledCell: isFrom || isTo)),
            ],
          ),
        ),
      ),
    );
  }
}
