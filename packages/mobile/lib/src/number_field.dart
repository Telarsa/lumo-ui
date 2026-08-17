import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show NumberFormat;
import 'format.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// A number field — the counterpart of the web `NumberField`: a text field whose
/// display is `formatNumber(value, locale)` (Persian digits and separators
/// under `fa-*`) and whose input is parsed back to a `num` from ANY digits the
/// reader types (Persian, Arabic-Indic, the locale's own — learned from `intl`,
/// never tabled), plus a stepper pair stacked on the BLOCK axis at the inline
/// END (up is more in both scripts; a horizontal `[-][+]` would encode a
/// left-to-right number line), exactly as on the web. `label`,
/// `incrementLabel`, `decrementLabel` REQUIRED — Base UI's three English leaks
/// are three required parameters here. The digits are an LTR island: the
/// field's own `textDirection` is `ltr` so a sign and a decimal keep their
/// place, while `textAlign` keeps the number at the reading START. Never
/// `TextInputType.number` alone: the keyboard is numeric, but the parser, not
/// the platform, decides what a digit is. `onChanged` hands back `null` for an
/// empty or unparsable field (the web's `NaN`). Semantics: ONE text-field node
/// named by `label` (`MergeSemantics`) whose value is the formatted number, and
/// two buttons named by the stepper labels — disabled at the bound.
///
/// **The steppers' hit area.** The web paints the column `end-1 inset-y-1 w-6`,
/// so each stepper is 24x14 — measured on mobile too, the smallest pair of
/// buttons in the library. The chevrons still PAINT exactly there; the tappable
/// cell is widened to `LumoControl.lg` (44) and given the control's FULL
/// height, so each stepper is 44x18 instead of 24x14. It cannot be 44 TALL: two
/// steppers stacked inside one 36 px control is the web's geometry, and 88 px of
/// stacked target would be a different component. The extra 44−28 px of width
/// eats into the input's `pe-8` gutter, which is empty — the number is at the
/// reading START.
class LumoNumberField extends StatefulWidget {
  const LumoNumberField({super.key, required this.label, required this.incrementLabel, required this.decrementLabel, this.value, this.defaultValue, this.onChanged, this.min, this.max, this.step = 1, this.description, this.errorMessage, this.placeholder, this.isDisabled = false, this.isReadOnly = false, this.isRequired = false})
      : assert(step > 0, 'step must be positive.'),
        assert(min == null || max == null || min <= max, 'min must not exceed max.');
  /// Announced and displayed name. REQUIRED.
  final String label;
  /// Name of the increment button. REQUIRED.
  final String incrementLabel;
  /// Name of the decrement button. REQUIRED.
  final String decrementLabel;
  /// Controlled value. Null leaves the field uncontrolled; `double.nan` is a controlled EMPTY field (the web's NaN).
  final num? value;
  /// Uncontrolled initial value.
  final num? defaultValue;
  /// Fires with the parsed number, or null when the field is empty/unparsable.
  final ValueChanged<num?>? onChanged;
  /// The lowest value the control accepts.
  final num? min;
  /// The highest value the control accepts.
  final num? max;
  /// One stepper tick. Web `step`.
  final num step;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// An error message for the field. Announced as the control's hint and marks it invalid.
  final String? errorMessage;
  /// Placeholder text shown while the field is empty. Never a substitute for the label.
  final String? placeholder;
  /// Whether the control is disabled.
  final bool isDisabled;
  /// Whether the input can be selected but not changed by the user.
  final bool isReadOnly;
  /// Whether user input is required before the form is submitted.
  final bool isRequired;

  @override
  State<LumoNumberField> createState() => _LumoNumberFieldState();
}

class _LumoNumberFieldState extends State<LumoNumberField> {
  final _controller = TextEditingController();
  final _focus = FocusNode();
  num? _uncontrolled;
  String _locale = 'en';

  // `value` null = uncontrolled (the web's `undefined`); `double.nan` = controlled and EMPTY (the web's NaN).
  num? get _value => widget.value == null ? _uncontrolled : (widget.value!.isNaN ? null : widget.value);

  @override
  void initState() {
    super.initState();
    _uncontrolled = widget.defaultValue;
    // Blur: the typed text becomes the formatted, clamped number.
    _focus.addListener(() {
      if (!_focus.hasFocus && !widget.isDisabled) _commitText();
      setState(() {});
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _locale = LumoScope.of(context).locale;
    if (!_focus.hasFocus) _showValue(_value);
  }

  @override
  void didUpdateWidget(LumoNumberField old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value && (!_focus.hasFocus || widget.isDisabled)) _showValue(_value);
  }

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _showValue(num? v) {
    final text = v == null || v.isNaN ? '' : formatNumber(v, _locale);
    if (_controller.text != text) _controller.value = TextEditingValue(text: text, selection: TextSelection.collapsed(offset: text.length));
  }

  num? _clamp(num? v) {
    if (v == null) return null;
    var out = v;
    if (widget.min != null && out < widget.min!) out = widget.min!;
    if (widget.max != null && out > widget.max!) out = widget.max!;
    return out;
  }

  void _set(num? next) {
    if (widget.value == null) setState(() => _uncontrolled = next);
    widget.onChanged?.call(next);
  }

  /// While typing: report the parsed number on every edit, leave the text alone
  /// (reformatting mid-edit fights the caret); the format lands on blur.
  void _onText(String text) => _set(_parseNumber(text, _locale));

  void _commitText() {
    final v = _clamp(_parseNumber(_controller.text, _locale));
    if (v != _value) _set(v);
    _showValue(v ?? _value);
  }

  void _stepBy(num delta) {
    final v = _clamp((_value ?? _clamp(0) ?? 0) + delta);
    _set(v);
    _showValue(v);
  }

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final v = _value;
    final canStep = !widget.isDisabled && !widget.isReadOnly;
    final canUp = canStep && (widget.max == null || v == null || v < widget.max!);
    final canDown = canStep && (widget.min == null || v == null || v > widget.min!);
    return Opacity(
      opacity: widget.isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text.rich(TextSpan(text: widget.label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg), children: [if (widget.isRequired) TextSpan(text: ' *', style: TextStyle(color: c.critical))])),
          const SizedBox(height: 6),
          Stack(
            children: [
              // `MergeSemantics`: name + editable = ONE text-field node (a bare `Semantics(label:)`
              // would leave the name on a parent the reader lands on separately from the field).
              MergeSemantics(
                child: Semantics(
                  label: widget.label,
                  hint: [if (widget.description != null) widget.description, if (widget.errorMessage != null) widget.errorMessage].join('. '),
                  textField: true,
                  enabled: !widget.isDisabled,
                  child: TextField(
                    controller: _controller,
                    focusNode: _focus,
                    enabled: !widget.isDisabled,
                    readOnly: widget.isReadOnly,
                    onChanged: _onText,
                    onSubmitted: (_) => _commitText(),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                    // The LTR island; the number stays at the reading start.
                    textDirection: TextDirection.ltr,
                    textAlign: scope.direction == TextDirection.rtl ? TextAlign.end : TextAlign.start,
                    style: TextStyle(fontSize: 14, color: c.fg),
                    decoration: InputDecoration(
                      hintText: widget.placeholder,
                      hintStyle: TextStyle(color: c.fgSubtle),
                      errorText: widget.errorMessage,
                      errorStyle: TextStyle(color: c.critical, fontSize: 12),
                      // Room for the stepper column at the end — logical, so it mirrors.
                      contentPadding: const EdgeInsetsDirectional.only(start: 12, end: 32, top: 8, bottom: 8),
                    ),
                  ),
                ),
              ),
              // The stepper column: pinned to the inline end, over the control's
              // full height and `LumoControl.lg` wide, so each half clears the
              // touch floor on the inline axis. Each stepper draws its chevron
              // where the web puts it — see `_Stepper`.
              PositionedDirectional(
                end: 0,
                top: 0,
                width: LumoControl.lg,
                height: LumoControl.md,
                child: Column(children: [
                  Expanded(child: _Stepper(label: widget.incrementLabel, icon: Icons.keyboard_arrow_up, isEnabled: canUp, onTap: () => _stepBy(widget.step), alignment: AlignmentDirectional.bottomEnd)),
                  Expanded(child: _Stepper(label: widget.decrementLabel, icon: Icons.keyboard_arrow_down, isEnabled: canDown, onTap: () => _stepBy(-widget.step), alignment: AlignmentDirectional.topEnd)),
                ]),
              ),
            ],
          ),
          if (widget.description != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(widget.description!, style: TextStyle(fontSize: 12, color: c.fgMuted))),
        ],
      ),
    );
  }
}

/// One stepper button: named, a button, disabled at the bound; the chevron is
/// decoration. Its own widget rather than `LumoIconButton` because two of them
/// stack inside one control height.
///
/// The whole cell is the target; the 24x14 box the web paints is pinned inside
/// it by `alignment` (bottom-end for increment, top-end for decrement) plus the
/// 4 px inset, so growing the target moved no pixel of the chevron.
class _Stepper extends StatelessWidget {
  const _Stepper({required this.label, required this.icon, required this.isEnabled, required this.onTap, required this.alignment});
  final String label;
  final IconData icon;
  final bool isEnabled;
  final VoidCallback onTap;
  final AlignmentDirectional alignment;
  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Semantics(
      label: label,
      button: true,
      enabled: isEnabled,
      child: Tooltip(
        message: label,
        excludeFromSemantics: true,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: isEnabled ? onTap : null,
            borderRadius: BorderRadius.circular(LumoRadius.sm),
            child: Align(
              alignment: alignment,
              child: Padding(
                padding: const EdgeInsetsDirectional.only(end: 4),
                child: SizedBox(
                  width: 24,
                  height: (LumoControl.md - 8) / 2,
                  child: Center(child: ExcludeSemantics(child: Icon(icon, size: 14, color: isEnabled ? c.fgMuted : c.fgSubtle))),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

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

/// Text in any digits, with the locale's (or the common) separators, to a `num`;
/// null when nothing parses. Grouping is dropped, the decimal separator is the
/// locale's (plus «.» and «٫» when they are not its grouping mark), signs are
/// «-»/«−».
num? _parseNumber(String text, String locale) {
  final digits = _digitMap(locale);
  final symbols = NumberFormat.decimalPattern(formatLocale(locale)).symbols;
  final decimals = {symbols.DECIMAL_SEP, '.', '٫'}..remove(symbols.GROUP_SEP);
  final ascii = StringBuffer();
  for (final rune in text.runes) {
    final ch = String.fromCharCode(rune);
    final d = digits[ch];
    if (d != null) {
      ascii.write(d);
    } else if (decimals.contains(ch)) {
      ascii.write('.');
    } else if (ch == '-' || ch == '−') {
      if (ascii.isEmpty) ascii.write('-');
    }
    // Anything else (grouping marks, spaces, bidi marks, letters) is dropped.
  }
  final s = ascii.toString();
  if (s.isEmpty || s == '-' || s == '.' || s == '-.') return null;
  return s.contains('.') ? double.tryParse(s) : int.tryParse(s);
}
