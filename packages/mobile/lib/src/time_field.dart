import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:intl/date_symbol_data_custom.dart' as intl_custom;
import 'package:intl/date_symbol_data_local.dart' as intl_local;
import 'package:intl/date_symbols.dart';
import 'package:intl/date_time_patterns.dart' as intl_patterns;
import 'package:intl/intl.dart' hide TextDirection;

import 'button.dart';
import 'format.dart';
import 'scope.dart';
import 'sheet.dart';
import 'tokens.g.dart';

/// A time behind a button — the mobile counterpart of the web `TimeField`.
///
/// The web types a time segment by segment (`DateInput` over
/// `useTimeFieldState`); a phone keyboard has no segment navigation, so the
/// field here is READ-ONLY and the value is picked from columns, the shape the
/// Khroos app reached by hand (`_TimePicker`). Everything else is the web's:
/// the hour cycle is the LOCALE's decision, the digits are the reader's.
///
/// **Not Material's `showTimePicker`.** Its every string comes from
/// `MaterialLocalizations` — English on any app that has not added the Persian
/// delegate, and unreachable by a parameter either way — and its dial is
/// Material's design, not Lumo's. The picker is a `showLumoSheet` route.
///
/// Announced strings, all REQUIRED: `label` (the field's name), `openLabel`
/// (the picker button is an icon), `closeLabel` (the sheet's ✕ and scrim),
/// `hourLabel` and `minuteLabel` (the columns' headers). The 12-hour day
/// period is NOT a parameter: its two words are read out of `intl`'s
/// `DateSymbols.AMPMS` for the locale — derived, like the web reads them from
/// `Intl.formatToParts`, so «ق.ظ.»/«ب.ظ.» are never English by default.
///
/// `use24Hour` defaults to what the LOCALE does — `lumoLocaleUses24Hour`, which
/// asks `intl` for the locale's own `jm` pattern (`fa` → `H:mm`, so Persian is
/// 24-hour; `en-US` → `h:mm a`). It is never defaulted to the English
/// convention, and a caller may still override it: an hour cycle is a
/// user-visible convention, exactly as on the web.
///
/// The formatted time is an LTR island: a clock time reads left-to-right in
/// every script (the same data-type rule as `LumoTextField(isNumeric:)`),
/// while the box itself stays at the reading start.
class LumoTimeField extends StatefulWidget {
  const LumoTimeField({
    super.key,
    required this.label,
    required this.openLabel,
    required this.closeLabel,
    required this.hourLabel,
    required this.minuteLabel,
    this.value,
    this.onChanged,
    this.description,
    this.errorMessage,
    this.minuteStep = 15,
    this.use24Hour,
    this.isDisabled = false,
    this.placeholder,
  })  : assert(minuteStep > 0 && minuteStep <= 60, 'minuteStep is how far apart the offered minutes are: 1..60.'),
        assert(60 % minuteStep == 0, 'minuteStep must divide the hour, or the last step would be short.');

  /// Announced and displayed name. REQUIRED — an unnamed field is a defect.
  final String label;

  /// Name of the button that opens the picker. REQUIRED — it is an icon.
  final String openLabel;

  /// Name of the sheet's ✕ and of its scrim. REQUIRED.
  final String closeLabel;

  /// Header of the hour column. REQUIRED.
  final String hourLabel;

  /// Header of the minute column. REQUIRED.
  final String minuteLabel;

  /// The chosen time. Controlled; `null` is an empty field.
  final TimeOfDay? value;

  /// Called with the time after every pick. A pick on one column completes the
  /// other with zero, so a half-made time is never reported.
  final ValueChanged<TimeOfDay>? onChanged;
  final String? description;

  /// Shown under the field and announced. Supplying one marks it invalid.
  final String? errorMessage;

  /// How far apart the offered minutes are. Must divide the hour.
  final int minuteStep;

  /// Overrides the locale's own clock. Null derives it (`lumoLocaleUses24Hour`).
  final bool? use24Hour;
  final bool isDisabled;

  /// Shown in the field while there is no value.
  final String? placeholder;

  @override
  State<LumoTimeField> createState() => _LumoTimeFieldState();
}

class _LumoTimeFieldState extends State<LumoTimeField> {
  /// The optimistic mirror of `value`: the sheet is a ROUTE built above this
  /// widget, so it listens here rather than reading a `widget` it cannot see
  /// change. `didUpdateWidget` hands authority straight back to `value`.
  late final ValueNotifier<TimeOfDay?> _shown = ValueNotifier<TimeOfDay?>(widget.value);

  @override
  void didUpdateWidget(LumoTimeField old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value && _shown.value != widget.value) _shown.value = widget.value;
  }

  @override
  void dispose() {
    _shown.dispose();
    super.dispose();
  }

  void _pick(TimeOfDay next) {
    _shown.value = next;
    widget.onChanged?.call(next);
  }

  Future<void> _open(bool use24) => showLumoSheet<void>(
        context,
        label: widget.label,
        closeLabel: widget.closeLabel,
        body: (ctx) => _TimeSheet(
          selected: _shown,
          hourLabel: widget.hourLabel,
          minuteLabel: widget.minuteLabel,
          minuteStep: widget.minuteStep,
          use24Hour: use24,
          onPick: _pick,
        ),
      );

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final use24 = widget.use24Hour ?? lumoLocaleUses24Hour(scope.locale);
    final invalid = widget.errorMessage != null;
    return ValueListenableBuilder<TimeOfDay?>(
      valueListenable: _shown,
      builder: (context, value, _) {
        final text = value == null ? (widget.placeholder ?? '') : formatLumoTime(value, scope.locale, use24Hour: use24);
        return Opacity(
          opacity: widget.isDisabled ? 0.5 : 1,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Excluded: the name lives on the field node, so it is announced ONCE.
              ExcludeSemantics(child: Text(widget.label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg))),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    // The field: named by the label, its value the formatted time,
                    // read-only (typing is the picker's job); tapping opens it too.
                    child: Semantics(
                      label: widget.label,
                      value: text,
                      textField: true,
                      readOnly: true,
                      enabled: !widget.isDisabled,
                      hint: [if (widget.description != null) widget.description!, if (widget.errorMessage != null) widget.errorMessage!].join('. '),
                      child: InkWell(
                        onTap: widget.isDisabled ? null : () => _open(use24),
                        borderRadius: BorderRadius.circular(LumoRadius.md),
                        child: Container(
                          height: LumoControl.md,
                          alignment: AlignmentDirectional.centerStart,
                          padding: const EdgeInsetsDirectional.symmetric(horizontal: 12),
                          decoration: BoxDecoration(color: c.surface, border: Border.all(color: invalid ? c.critical : c.borderControl), borderRadius: BorderRadius.circular(LumoRadius.md)),
                          // The LTR island: the clock time keeps its order in every script.
                          child: ExcludeSemantics(child: Text(text, textDirection: TextDirection.ltr, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, color: value == null ? c.fgSubtle : c.fg))),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // The picker button, at the inline END by the Row's own mirroring.
                  LumoIconButton(label: widget.openLabel, variant: LumoButtonVariant.outline, isDisabled: widget.isDisabled, onPressed: () => _open(use24), child: Icon(Icons.schedule, size: 18, color: c.fg)),
                ],
              ),
              if (widget.description != null)
                Padding(padding: const EdgeInsets.only(top: 6), child: ExcludeSemantics(child: Text(widget.description!, style: TextStyle(fontSize: 12, color: c.fgMuted)))),
              if (invalid)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Semantics(liveRegion: true, child: ExcludeSemantics(child: Text(widget.errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)))),
                ),
            ],
          ),
        );
      },
    );
  }
}

/// The picker's body: an hour column and a minute column side by side (plus a
/// day-period column on a 12-hour clock), each headed by its required label and
/// scrolling on its own. A Row, so the hour column takes the reading START —
/// right under `fa-IR`, left under `en-US`.
class _TimeSheet extends StatelessWidget {
  const _TimeSheet({required this.selected, required this.hourLabel, required this.minuteLabel, required this.minuteStep, required this.use24Hour, required this.onPick});

  final ValueNotifier<TimeOfDay?> selected;
  final String hourLabel;
  final String minuteLabel;
  final int minuteStep;
  final bool use24Hour;
  final ValueChanged<TimeOfDay> onPick;

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final periods = lumoDayPeriodNames(scope.locale);
    return ValueListenableBuilder<TimeOfDay?>(
      valueListenable: selected,
      builder: (context, value, _) {
        // A pick on one column completes the other with zero — never a half time.
        final base = value ?? const TimeOfDay(hour: 0, minute: 0);
        final hours = use24Hour ? [for (var h = 0; h < 24; h++) h] : [12, for (var h = 1; h < 12; h++) h];
        final minutes = [for (var m = 0; m < 60; m += minuteStep) m];
        final isPm = base.hour >= 12;
        return SizedBox(
          height: 260,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 8,
            children: [
              Expanded(
                child: _Column(
                  header: hourLabel,
                  // Open with the current hour in view: a 24-row column whose
                  // value sits off-screen is a picker that hides its own state.
                  initialIndex: hours.indexOf(use24Hour ? base.hour : (base.hourOfPeriod == 0 ? 12 : base.hourOfPeriod)),
                  cells: [
                    for (final h in hours)
                      _Cell(
                        text: use24Hour ? _pad2(h, scope.locale) : formatNumber(h, scope.locale, grouping: false),
                        name: formatNumber(h, scope.locale, grouping: false),
                        isSelected: use24Hour ? base.hour == h : (base.hourOfPeriod == 0 ? 12 : base.hourOfPeriod) == h,
                        onTap: () => onPick(TimeOfDay(hour: use24Hour ? h : (h % 12) + (isPm ? 12 : 0), minute: base.minute)),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: _Column(
                  header: minuteLabel,
                  initialIndex: minutes.indexOf(base.minute),
                  cells: [
                    for (final m in minutes)
                      _Cell(
                        text: _pad2(m, scope.locale),
                        name: formatNumber(m, scope.locale, grouping: false),
                        isSelected: base.minute == m,
                        onTap: () => onPick(TimeOfDay(hour: base.hour, minute: m)),
                      ),
                  ],
                ),
              ),
              if (!use24Hour)
                Expanded(
                  child: _Column(
                    // The day period has no header of its own: its two cells ARE
                    // its name, and inventing a word for it would be a string
                    // Lumo could not derive from the locale.
                    header: null,
                    initialIndex: 0,
                    cells: [
                      for (var i = 0; i < 2; i++)
                        _Cell(
                          text: periods[i],
                          name: periods[i],
                          isSelected: (i == 1) == isPm,
                          onTap: () => onPick(TimeOfDay(hour: base.hour % 12 + (i == 1 ? 12 : 0), minute: base.minute)),
                        ),
                    ],
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

/// One column: a header (when it has a name) over its own scroll, opened with
/// the current value in view. The controller is built ONCE (in `initState`):
/// re-seeding it on every pick would drag the column back under the finger.
class _Column extends StatefulWidget {
  const _Column({required this.header, required this.initialIndex, required this.cells});
  final String? header;
  final int initialIndex;
  final List<Widget> cells;

  @override
  State<_Column> createState() => _ColumnState();
}

class _ColumnState extends State<_Column> {
  static const _cell = 44.0; // 40 high + 4 of gap
  late final ScrollController _controller = ScrollController(initialScrollOffset: (widget.initialIndex <= 1 ? 0 : widget.initialIndex - 1) * _cell);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final header = widget.header;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 24,
          child: header == null
              ? null
              : Semantics(header: true, child: Text(header, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c.fgMuted))),
        ),
        Expanded(
          child: Semantics(
            container: true,
            explicitChildNodes: true,
            role: SemanticsRole.list,
            child: ListView(controller: _controller, padding: const EdgeInsets.symmetric(vertical: 4), children: widget.cells),
          ),
        ),
      ],
    );
  }
}

/// One value: a button named by its number in the reader's digits, announced
/// with its selected state; the drawn text is an LTR island (a padded «۰۹»).
class _Cell extends StatelessWidget {
  const _Cell({required this.text, required this.name, required this.isSelected, required this.onTap});
  final String text;
  final String name;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Semantics(
        label: name,
        button: true,
        selected: isSelected,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(LumoRadius.md),
          child: Container(
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isSelected ? c.accent : c.surface,
              border: Border.all(color: isSelected ? c.accent : c.border),
              borderRadius: BorderRadius.circular(LumoRadius.md),
            ),
            child: ExcludeSemantics(
              child: Text(text, textDirection: TextDirection.ltr, style: TextStyle(fontSize: 14, fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500, color: isSelected ? c.accentFg : c.fg)),
            ),
          ),
        ),
      ),
    );
  }
}

/// A time in the reader's digits and the locale's clock — the counterpart of
/// the web's formatted `TimeField` value. 24-hour: «۲۳:۴۵». 12-hour: the hour,
/// the minutes and the locale's own day-period word («3:30 PM»).
String formatLumoTime(TimeOfDay time, String locale, {bool? use24Hour}) {
  final use24 = use24Hour ?? lumoLocaleUses24Hour(locale);
  if (use24) return '${_pad2(time.hour, locale)}:${_pad2(time.minute, locale)}';
  final h = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
  final period = lumoDayPeriodNames(locale)[time.period == DayPeriod.am ? 0 : 1];
  return '${formatNumber(h, locale, grouping: false)}:${_pad2(time.minute, locale)} $period';
}

/// Whether `locale` writes the clock 0–23. Asked of `intl`: the locale's own
/// `jm` pattern carries `h`/`K` only when it uses a 12-hour cycle (`fa` →
/// `H:mm`, `de` → `HH:mm`, `en_US` → `h:mm a`). The counterpart of the web's
/// `resolvedOptions().hourCycle`. NEVER defaulted to the English convention.
bool lumoLocaleUses24Hour(String locale) => !(DateFormat.jm(_intlTag(locale)).pattern ?? '').contains(RegExp('[hK]'));

/// The locale's two day-period words, read out of `intl`'s symbols — the
/// counterpart of the web reading them from `Intl.formatToParts`. Never a
/// parameter, and never English by default.
List<String> lumoDayPeriodNames(String locale) => List<String>.of(DateFormat.jm(_intlTag(locale)).dateSymbols.AMPMS);

/// Two digits in the reader's numbering system, one at a time through
/// `formatNumber` — «۰۹», not «9».
String _pad2(int value, String locale) {
  final ascii = value.toString().padLeft(2, '0');
  final out = StringBuffer();
  for (final rune in ascii.runes) {
    out.write(formatNumber(rune - 0x30, locale, grouping: false));
  }
  return out.toString();
}

Map<String, DateSymbols>? _allSymbols;
Map<String, Map<String, String>>? _allPatterns;

/// The locale tag intl resolves for `locale`, with its date symbols loaded —
/// the same fill-in `jalali.dart` performs: `initializeDateFormatting()`
/// (idempotent) loads the whole table when nothing has, and a locale that an
/// app's `flutter_localizations` delegates did not pre-load is filled in from
/// intl's own table, so a `LumoScope` locale never throws `LocaleDataException`.
String _intlTag(String locale) {
  intl_local.initializeDateFormatting();
  final tag = formatLocale(locale.replaceAll('_', '-').split('-u-').first);
  var resolved = Intl.verifiedLocale(tag, DateFormat.localeExists, onFailure: (_) => '');
  if (resolved == null || resolved.isEmpty) {
    final all = _allSymbols ??= intl_local.dateTimeSymbolMap();
    final patterns = _allPatterns ??= intl_patterns.dateTimePatternMap();
    resolved = Intl.verifiedLocale(tag, all.containsKey, onFailure: (_) => 'en')!;
    intl_custom.initializeDateFormattingCustom(locale: resolved, symbols: all[resolved], patterns: patterns[resolved]);
  }
  return resolved;
}
