import 'package:flutter/material.dart';

import 'phone_input.dart' show lumoPhoneDigits;
import 'scope.dart';
import 'sheet.dart';
import 'text_field.dart';
import 'tokens.g.dart';

/// One preset colour and, crucially, its NAME — the web's `ColorSwatch`
/// (`color-picker.tsx`), where `label` is required for the same reason.
///
/// `name` is optional here and not a loophole: when it is absent the swatch is
/// announced by its HEX (`#1E90FF`), which is a fact about the colour a reader
/// can act on. What a swatch is never announced as is «رنگ» — a grid of nine
/// controls all called "colour" is a grid of nine controls a reader cannot
/// choose between.
@immutable
class LumoColorSwatch {
  const LumoColorSwatch({required this.color, this.name});

  final Color color;

  /// The colour's own name («آبی نفتی», «قرمز خروسی»). Falls back to the hex.
  final String? name;

  /// What a reader hears for this swatch.
  String get accessibleName => name ?? lumoColorHex(color);
}

/// `#RRGGBB`, upper case — or `#RRGGBBAA` when the colour is not opaque, the
/// CSS order the web's `formatHex8` produces.
String lumoColorHex(Color color) {
  final argb = color.toARGB32();
  String pair(int v) => v.toRadixString(16).padLeft(2, '0').toUpperCase();
  final rgb = '#${pair((argb >> 16) & 0xFF)}${pair((argb >> 8) & 0xFF)}${pair(argb & 0xFF)}';
  final alpha = (argb >> 24) & 0xFF;
  return alpha == 0xFF ? rgb : '$rgb${pair(alpha)}';
}

final RegExp _hex = RegExp(r'^#?([0-9a-fA-F]{3,8})$');

/// Text → colour, or `null` when it is not one — the web's `normalizeColor`,
/// narrowed to hex. Accepts `#RGB`, `#RGBA`, `#RRGGBB` and `#RRGGBBAA`, with or
/// without the `#`, and **folds Persian digits first**: «‎#۱۲۳۴۵۶» is what a
/// Persian keyboard actually produces, and a parser that only knows
/// U+0030–0039 rejects it silently.
///
/// Named colour keywords (`red`, `rebeccapurple`) are deliberately absent: they
/// are English words, and a field that accepts them in English only is a field
/// that works for some of its readers.
Color? lumoParseColor(String text, {String locale = 'en'}) {
  final folded = StringBuffer();
  for (final rune in text.trim().runes) {
    final ch = String.fromCharCode(rune);
    final digit = lumoPhoneDigits(ch, locale: locale);
    folded.write(digit.isEmpty ? ch : digit);
  }
  final match = _hex.firstMatch(folded.toString());
  if (match == null) return null;
  var body = match.group(1)!;
  if (body.length == 3 || body.length == 4) {
    body = [for (final ch in body.split('')) '$ch$ch'].join();
  }
  if (body.length != 6 && body.length != 8) return null;
  final rgb = int.parse(body.substring(0, 6), radix: 16);
  final alpha = body.length == 8 ? int.parse(body.substring(6), radix: 16) : 0xFF;
  return Color((alpha << 24) | rgb);
}

/// A grid of preset colours, one of which is chosen — the web `ColorPicker`
/// (`color-picker.tsx`), which is a `role="radiogroup"` of `<input
/// type="radio">`s wearing colours, and so is this.
///
/// **There is no hue wheel.** A continuous 2-D gradient is chosen by dragging a
/// point, and a drag is a gesture a switch user, a keyboard user and a screen
/// reader user cannot perform — the web file reaches for the platform's own
/// `<input type="color">` for exactly that reason, which a phone does not have.
/// A finite set of NAMED swatches is a control every one of those readers can
/// operate, and the caller who needs an arbitrary colour types it as hex
/// ([LumoColorInput]). Taken from the same trade `forui` and Material's own
/// pickers make on a phone: discrete, named, tappable.
///
/// Selection is announced as state, never by colour alone (WCAG 1.4.1): the
/// chosen swatch draws a tick, in black or white by the swatch's own
/// luminance, plus a ring — and the semantics node says `checked`.
class LumoColorPicker extends StatelessWidget {
  const LumoColorPicker({super.key, required this.label, required this.swatches, this.value, this.onChanged, this.isDisabled = false});

  /// Names the group. REQUIRED — the swatches name the COLOURS, not the question.
  final String label;
  final List<LumoColorSwatch> swatches;

  /// The chosen colour, controlled.
  final Color? value;
  final ValueChanged<Color>? onChanged;
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    // Checked here, not in the const constructor: `length` is not a constant
    // expression, and an assert that uses one makes `const LumoColorPicker(…)`
    // a COMPILE error at every call site (`segmented_control.dart` learned this
    // first).
    assert(swatches.isNotEmpty, 'A picker with no swatches offers nothing.');
    final c = LumoScope.of(context).colours;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: label,
      enabled: !isDisabled,
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: [
          for (final swatch in swatches)
            _Swatch(
              swatch: swatch,
              isSelected: value != null && value!.toARGB32() == swatch.color.toARGB32(),
              isDisabled: isDisabled,
              border: c.borderControl,
              ring: c.focus,
              onTap: onChanged == null ? null : () => onChanged!(swatch.color),
            ),
        ],
      ),
    );
  }
}

class _Swatch extends StatelessWidget {
  const _Swatch({required this.swatch, required this.isSelected, required this.isDisabled, required this.border, required this.ring, required this.onTap});
  final LumoColorSwatch swatch;
  final bool isSelected;
  final bool isDisabled;
  final Color border;
  final Color ring;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    // The tick must be legible ON the swatch, whatever the swatch is.
    final tick = ThemeData.estimateBrightnessForColor(swatch.color) == Brightness.dark ? const Color(0xFFFFFFFF) : const Color(0xFF000000);
    return Semantics(
      inMutuallyExclusiveGroup: true,
      checked: isSelected,
      enabled: !isDisabled,
      // The colour's own name, or its hex — never a word meaning "colour".
      label: swatch.accessibleName,
      child: Opacity(
        opacity: isDisabled ? 0.5 : 1,
        child: InkWell(
          onTap: isDisabled ? null : onTap,
          customBorder: const CircleBorder(),
          // 44 logical pixels: the smallest target a thumb reliably hits.
          child: SizedBox(
            width: LumoControl.lg,
            height: LumoControl.lg,
            child: Center(
              child: Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: swatch.color,
                  shape: BoxShape.circle,
                  border: Border.all(color: isSelected ? ring : border, width: isSelected ? LumoFocus.width : 1),
                ),
                child: isSelected ? ExcludeSemantics(child: Icon(Icons.check, size: 18, color: tick)) : null,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// A colour field: a trigger showing the current colour and its NAME, opening a
/// sheet of swatches and an optional hex box — the web `ColorInput`
/// (`color-input.tsx`) in the shape a phone can hold.
///
/// The web puts a text field and a native `<input type="color">` side by side
/// and hangs the swatches under them. A phone has no native colour control and
/// no room beside a field, so the picker lives in a **`showLumoSheet` route**
/// (never Material's `showModalBottomSheet`, whose route names itself «Dialog»
/// and its barrier «Dismiss» in English) — the same decision `LumoMultiSelect`
/// and `LumoSelect` made.
///
/// **The trigger is never a coloured square alone.** It shows the swatch AND
/// the colour's name (or its hex), because a square is not a value: a reader
/// who cannot see it, and a reader looking at a screen in sunlight, both need
/// the words. The node is announced as `label` with the colour as its VALUE.
///
/// **Hex is an LTR island.** `#1E90FF` is a code, and a code reads
/// left-to-right in Persian too — the same treatment `LumoMaskInput` and
/// `LumoPhoneInput` give their contents (the web writes it `dir="ltr"` +
/// `data-lumo-latn` on the same control). The box itself stays where the form
/// put it.
///
/// Required announced strings: `label` (the field, and the sheet's route),
/// `pickerLabel` (the swatch group inside the sheet — a second, different name,
/// so nothing is announced twice). `hexLabel` and `invalidColorMessage` are ONE decision — the
/// constructor asserts them together, because a hex box that cannot say "that
/// is not a colour" is a box that silently discards what was typed. `closeLabel`
/// names the sheet's ✕ and its scrim.
///
/// Web props not carried: `format: "hex" | "hex8"` (alpha is carried when the
/// colour has it, so the two are not a choice the caller has to make), and
/// `name` (nothing is posted by the platform).
class LumoColorInput extends StatefulWidget {
  const LumoColorInput({
    super.key,
    required this.label,
    required this.pickerLabel,
    required this.closeLabel,
    this.swatches = const [],
    this.hexLabel,
    this.invalidColorMessage,
    this.value,
    this.defaultValue,
    this.onChanged,
    this.description,
    this.errorMessage,
    this.isDisabled = false,
    this.showLabel = true,
  }) : assert((hexLabel == null) == (invalidColorMessage == null), 'hexLabel and invalidColorMessage are one decision: both or neither.');

  /// Announced (and, unless `showLabel` is false, displayed) name. REQUIRED.
  final String label;

  /// Names the sheet and the swatch group inside it. REQUIRED.
  final String pickerLabel;

  /// Names the sheet's ✕ and its scrim. REQUIRED.
  final String closeLabel;

  /// The presets. May be empty when the hex box is the only way in.
  final List<LumoColorSwatch> swatches;

  /// Names the hex box. Its presence is what puts the box in the sheet.
  final String? hexLabel;

  /// Announced when the typed text is not a colour. Required with [hexLabel].
  final String? invalidColorMessage;

  /// The colour, controlled.
  final Color? value;

  /// The colour, uncontrolled.
  final Color? defaultValue;
  final ValueChanged<Color>? onChanged;
  final String? description;

  /// Shown under the trigger and carried in its `hint`; marks it invalid.
  final String? errorMessage;
  final bool isDisabled;
  final bool showLabel;

  @override
  State<LumoColorInput> createState() => _LumoColorInputState();
}

class _LumoColorInputState extends State<LumoColorInput> {
  /// The optimistic mirror of `value`: the sheet is a ROUTE built above this
  /// widget, so it writes here and the trigger repaints from the same source —
  /// the shape `LumoMultiSelect` uses for the same reason.
  late final ValueNotifier<Color?> _shown = ValueNotifier<Color?>(widget.value ?? widget.defaultValue);

  @override
  void didUpdateWidget(LumoColorInput old) {
    super.didUpdateWidget(old);
    if (widget.value != null && widget.value != _shown.value) _shown.value = widget.value;
  }

  @override
  void dispose() {
    _shown.dispose();
    super.dispose();
  }

  void _set(Color next) {
    _shown.value = next;
    widget.onChanged?.call(next);
  }

  /// The colour's name if a swatch carries one, otherwise its hex.
  String _nameOf(Color color) {
    for (final swatch in widget.swatches) {
      if (swatch.color.toARGB32() == color.toARGB32()) return swatch.accessibleName;
    }
    return lumoColorHex(color);
  }

  Future<void> _open() => showLumoSheet<void>(
        context,
        // The ROUTE takes the field's own name; `pickerLabel` names the swatch
        // GROUP inside it. Two different names, each announced exactly once —
        // the same name on both would be heard twice on the way in.
        label: widget.label,
        closeLabel: widget.closeLabel,
        body: (ctx) => _ColorSheet(
          pickerLabel: widget.pickerLabel,
          swatches: widget.swatches,
          hexLabel: widget.hexLabel,
          invalidColorMessage: widget.invalidColorMessage,
          selected: _shown,
          onPicked: _set,
        ),
      );

  @override
  Widget build(BuildContext context) {
    // See LumoColorPicker.build: a `length` assert in a const constructor is a
    // compile error at every const call site, not a runtime check.
    assert(widget.swatches.isNotEmpty || widget.hexLabel != null, 'A colour input with no swatches and no hex box offers no way to choose a colour.');
    final c = LumoScope.of(context).colours;
    final invalid = widget.errorMessage != null;
    return ValueListenableBuilder<Color?>(
      valueListenable: _shown,
      builder: (context, colour, _) {
        final name = colour == null ? null : _nameOf(colour);
        return Opacity(
          opacity: widget.isDisabled ? 0.5 : 1,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.showLabel) ...[
                ExcludeSemantics(child: Text(widget.label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg))),
                const SizedBox(height: 6),
              ],
              Semantics(
                label: widget.label,
                // The colour IS the value: the name, or the hex read out.
                value: name,
                button: true,
                enabled: !widget.isDisabled,
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
                      spacing: 10,
                      children: [
                        ExcludeSemantics(
                          child: Container(
                            width: 20,
                            height: 20,
                            decoration: BoxDecoration(
                              color: colour ?? c.surfaceSunken,
                              shape: BoxShape.circle,
                              border: Border.all(color: c.borderControl),
                            ),
                          ),
                        ),
                        Expanded(
                          child: ExcludeSemantics(
                            // A hex code reads left-to-right in every script.
                            child: Directionality(
                              textDirection: name != null && name.startsWith('#') ? TextDirection.ltr : Directionality.of(context),
                              child: Text(
                                name ?? '',
                                textAlign: TextAlign.start,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(fontSize: 14, color: colour == null ? c.fgSubtle : c.fg),
                              ),
                            ),
                          ),
                        ),
                        ExcludeSemantics(child: Icon(Icons.expand_more, size: 18, color: c.fgMuted)),
                      ],
                    ),
                  ),
                ),
              ),
              if (widget.description != null)
                Padding(padding: const EdgeInsets.only(top: 6), child: ExcludeSemantics(child: Text(widget.description!, style: TextStyle(fontSize: 12, color: c.fgMuted)))),
              if (invalid)
                Padding(padding: const EdgeInsets.only(top: 6), child: ExcludeSemantics(child: Text(widget.errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)))),
            ],
          ),
        );
      },
    );
  }
}

/// The sheet's body: the swatches, then the hex box when there is one. The
/// route is named by the FIELD; the group here is named by `pickerLabel`, so
/// the two names are different and neither is heard twice.
class _ColorSheet extends StatefulWidget {
  const _ColorSheet({required this.pickerLabel, required this.swatches, required this.hexLabel, required this.invalidColorMessage, required this.selected, required this.onPicked});
  final String pickerLabel;
  final List<LumoColorSwatch> swatches;
  final String? hexLabel;
  final String? invalidColorMessage;
  final ValueNotifier<Color?> selected;
  final ValueChanged<Color> onPicked;

  @override
  State<_ColorSheet> createState() => _ColorSheetState();
}

class _ColorSheetState extends State<_ColorSheet> {
  final TextEditingController _hex = TextEditingController();
  bool _invalid = false;

  @override
  void initState() {
    super.initState();
    final current = widget.selected.value;
    if (current != null) _hex.text = lumoColorHex(current);
  }

  @override
  void dispose() {
    _hex.dispose();
    super.dispose();
  }

  void _onHex(String text, String locale) {
    if (text.trim().isEmpty) {
      setState(() => _invalid = false);
      return;
    }
    final parsed = lumoParseColor(text, locale: locale);
    setState(() => _invalid = parsed == null);
    if (parsed != null) widget.onPicked(parsed);
  }

  @override
  Widget build(BuildContext context) {
    final locale = LumoScope.of(context).locale;
    return ValueListenableBuilder<Color?>(
      valueListenable: widget.selected,
      builder: (context, colour, _) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (widget.swatches.isNotEmpty)
            LumoColorPicker(
              label: widget.pickerLabel,
              swatches: widget.swatches,
              value: colour,
              onChanged: (next) {
                _hex.text = lumoColorHex(next);
                setState(() => _invalid = false);
                widget.onPicked(next);
              },
            ),
          if (widget.hexLabel != null) ...[
            const SizedBox(height: 16),
            LumoTextField(
              label: widget.hexLabel!,
              controller: _hex,
              errorMessage: _invalid ? widget.invalidColorMessage : null,
              onChanged: (text) => _onHex(text, locale),
              // The LTR-island flag (a data-type fact, not a direction one):
              // a hex code is Latin, left-to-right content. `keyboardType` goes
              // back to text because a hex code has letters in it.
              isNumeric: true,
              keyboardType: TextInputType.text,
            ),
          ],
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
