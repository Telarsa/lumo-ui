import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show NumberFormat;
import 'format.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// Names one cell of the code row: `(index, length)` → e.g. «رقم ۱ از ۶». The
/// app formats the two numbers with `formatNumber` — a widget never renders a
/// raw number and never invents an English phrase.
typedef LumoOtpCellLabel = String Function(int index, int length);

/// A one-time code, entered into a row of boxes — the counterpart of the web
/// `InputOtp`. ONE hidden `TextField` holds the value (one focus stop, one
/// name, one paste, the platform's SMS autofill through
/// `AutofillHints.oneTimeCode`); the boxes are painted decoration showing each
/// digit through `formatNumber` (Persian digits under `fa-*`), the caret box
/// wearing the focus ring. The row is wrapped in
/// `Directionality(textDirection: TextDirection.ltr)` in BOTH locales ON
/// PURPOSE: a code is a number and a number is a left-to-right run in every
/// script — the one place a physical direction is written deliberately, as on
/// the web. `onChanged`/`onCompleted` hand back ASCII whatever digits were
/// typed (Persian, Arabic-Indic, the locale's own — learned from `intl`, never
/// tabled). Semantics: the field is one text field named by `label` whose value
/// is the entered digits (in the reader's numerals); each box is a read-only
/// node named by the REQUIRED `cellLabel` so a reader walking the row hears
/// «رقم ۱ از ۶، ۳» rather than a bare digit.
class LumoOtpField extends StatefulWidget {
  const LumoOtpField({super.key, required this.label, required this.cellLabel, this.length = 6, this.value, this.defaultValue, this.onChanged, this.onCompleted, this.description, this.errorMessage, this.isDisabled = false, this.autoFocus = false}) : assert(length > 0, 'An OTP row needs at least one cell.');

  /// Announced and displayed name. REQUIRED — one field, one name.
  final String label;

  /// Names each cell for a reader walking the row. REQUIRED — a box is not a name.
  final LumoOtpCellLabel cellLabel;

  /// How many boxes. Six is the Iranian SMS default.
  final int length;

  /// Controlled value, ASCII. Non-digits are dropped, characters past `length` ignored.
  final String? value;

  /// Uncontrolled initial value, ASCII.
  final String? defaultValue;

  /// Fires with the ASCII code on every change, complete or not.
  final ValueChanged<String>? onChanged;

  /// Fires once the last box is filled, with the ASCII code — separate from `onChanged` so no caller writes `>=`.
  final ValueChanged<String>? onCompleted;
  final String? description;

  /// Shown and announced when the code is rejected; sets the invalid border on every box.
  final String? errorMessage;
  final bool isDisabled;
  final bool autoFocus;

  @override
  State<LumoOtpField> createState() => _LumoOtpFieldState();
}

class _LumoOtpFieldState extends State<LumoOtpField> {
  final _controller = TextEditingController();
  final _focus = FocusNode();
  String _uncontrolled = '';
  String _locale = 'en';
  bool _focused = false;

  String get _code => widget.value == null ? _uncontrolled : _otpDigits(widget.value!, widget.length, _locale);

  @override
  void initState() {
    super.initState();
    _uncontrolled = _otpDigits(widget.defaultValue ?? '', widget.length, _locale);
    _focus.addListener(() => setState(() => _focused = _focus.hasFocus));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _locale = LumoScope.of(context).locale;
    // The locale's own digits are learned now, so a value typed in them reads back as ASCII.
    if (widget.value == null) _uncontrolled = _otpDigits(_uncontrolled, widget.length, _locale);
    _syncController();
  }

  @override
  void didUpdateWidget(LumoOtpField old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value || old.length != widget.length) _syncController();
  }

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  /// What the hidden field holds: the LOCALISED string, so its own semantics value
  /// and character count agree with the boxes. Autofill writes ASCII, `_otpDigits`
  /// accepts it, and the localised form is written back — derived, not stored.
  void _syncController() {
    final rendered = _render(_code, _locale);
    if (_controller.text != rendered) _controller.value = TextEditingValue(text: rendered, selection: TextSelection.collapsed(offset: rendered.length));
  }

  void _commit(String next) {
    final previous = _code;
    final digits = _otpDigits(next, widget.length, _locale);
    if (widget.value == null) setState(() => _uncontrolled = digits);
    final rendered = _render(digits, _locale);
    if (_controller.text != rendered) _controller.value = TextEditingValue(text: rendered, selection: TextSelection.collapsed(offset: rendered.length));
    widget.onChanged?.call(digits);
    if (previous.length < widget.length && digits.length == widget.length) widget.onCompleted?.call(digits);
  }

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final code = _code;
    final invalid = widget.errorMessage != null;
    // The caret sits in the first EMPTY box (the last once full) — derived from the value, not from the selection.
    final activeIndex = code.length < widget.length ? code.length : widget.length - 1;

    Widget cell(int i) {
      final digit = i < code.length ? code[i] : null;
      final shown = digit == null ? null : formatNumber(int.parse(digit), scope.locale, grouping: false);
      final active = _focused && !widget.isDisabled && i == activeIndex;
      return Semantics(
        label: widget.cellLabel(i, widget.length),
        value: shown,
        readOnly: true,
        child: ExcludeSemantics(
          child: Container(
            key: ValueKey('lumo-otp-cell-$i'),
            width: LumoControl.md,
            height: LumoControl.md,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: widget.isDisabled ? c.surfaceSunken : c.surface,
              borderRadius: BorderRadius.circular(LumoRadius.md),
              border: Border.all(
                color: invalid
                    ? c.critical
                    : active
                    ? c.accent
                    : c.borderControl,
              ),
              boxShadow: active ? [BoxShadow(color: c.accent.withValues(alpha: 0.3), spreadRadius: LumoFocus.width)] : null,
            ),
            child: shown != null
                ? Text(
                    shown,
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: widget.isDisabled ? c.fgSubtle : c.fg),
                  )
                : active
                // The drawn caret; the field's own is transparent so it is not doubled.
                ? Container(width: 1, height: 20, color: c.fg)
                : null,
          ),
        ),
      );
    }

    return Opacity(
      opacity: widget.isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.label,
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg),
          ),
          const SizedBox(height: 6),
          // `TextDirection.ltr` on purpose and only here — see the class docblock.
          Directionality(
            textDirection: TextDirection.ltr,
            child: Stack(
              children: [
                Row(mainAxisSize: MainAxisSize.min, spacing: 6, children: [for (var i = 0; i < widget.length; i++) cell(i)]),
                // The one real field, transparent and stretched over the row so it receives the tap.
                // `MergeSemantics`: the name and the editable's own node (value, actions) become ONE
                // text-field node — a bare `Semantics(label:)` would leave the name on a parent
                // the reader lands on separately from the field.
                Positioned.fill(
                  child: MergeSemantics(
                    child: Semantics(
                      label: widget.label,
                      hint: [if (widget.description != null) widget.description, if (widget.errorMessage != null) widget.errorMessage].join('. '),
                      textField: true,
                      enabled: !widget.isDisabled,
                      child: TextSelectionTheme(
                        data: const TextSelectionThemeData(cursorColor: Colors.transparent, selectionColor: Colors.transparent, selectionHandleColor: Colors.transparent),
                        child: TextField(
                          controller: _controller,
                          focusNode: _focus,
                          enabled: !widget.isDisabled,
                          autofocus: widget.autoFocus,
                          onChanged: _commit,
                          // `number`, and the platform's one-time-code suggestion — the whole reason this is one field.
                          keyboardType: TextInputType.number,
                          autofillHints: const [AutofillHints.oneTimeCode],
                          showCursor: false,
                          cursorColor: Colors.transparent,
                          style: const TextStyle(color: Colors.transparent, fontSize: 14),
                          decoration: const InputDecoration(isCollapsed: true, border: InputBorder.none, filled: false, contentPadding: EdgeInsets.zero),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (widget.description != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(widget.description!, style: TextStyle(fontSize: 12, color: c.fgMuted)),
            ),
          if (invalid)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Semantics(
                liveRegion: true,
                child: Text(widget.errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)),
              ),
            ),
        ],
      ),
    );
  }
}

/// Everything that is a digit, as ASCII; everything else dropped (a pasted
/// «کد شما: ۱۲۳۴۵۶» still works); at most `length` of them.
String _otpDigits(String input, int length, String locale) {
  final map = _digitMap(locale);
  final out = StringBuffer();
  for (final rune in input.runes) {
    final ascii = map[String.fromCharCode(rune)];
    if (ascii != null) out.write(ascii);
    if (out.length == length) break;
  }
  return out.toString();
}

String _render(String code, String locale) => code.split('').map((d) => formatNumber(int.parse(d), locale, grouping: false)).join();

/// The reader's digits → ASCII, learned from `intl` (never a hardcoded U+06F0–06F9
/// table): the built-in systems always, plus `locale`'s on first use.
final _digitMaps = <String, Map<String, String>>{};
Map<String, String> _digitMap(String locale) => _digitMaps.putIfAbsent(locale, () {
  final map = <String, String>{};
  for (final tag in {'en', 'fa', 'ar', formatLocale(locale)}) {
    final f = NumberFormat.decimalPattern(tag)..turnOffGrouping();
    for (var d = 0; d < 10; d++) {
      map[f.format(d)] = '$d';
    }
  }
  return map;
});
