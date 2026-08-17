import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole, SemanticsValidationResult;
import 'package:intl/intl.dart' show NumberFormat;

import 'combobox.dart' show lumoFoldForSearch;
import 'format.dart';
import 'scope.dart';
import 'sheet.dart';
import 'text_field.dart';
import 'tokens.g.dart';

/// One entry of a phone plan — the web's `PhoneCountry`. `dial` carries NO
/// plus. `names` is per locale tag because a country name is an announced
/// string and Lumo never defaults one to English: an unnamed language falls
/// back to the ISO `code`, never to another language — the web's rule, where
/// the names live in `LumoStrings["phoneInput"].countries`, which Flutter has
/// no counterpart of, so they are data here.
class LumoPhoneCountry {
  const LumoPhoneCountry({required this.code, required this.dial, this.names = const {}, this.nationalLength});

  /// ISO 3166-1 alpha-2, uppercase.
  final String code;

  /// Dial code WITHOUT the plus, e.g. `98`.
  final String dial;

  /// The country's name per locale tag (`fa`, `fa-IR`, `en`, …).
  final Map<String, String> names;

  /// National number length, excluding the trunk prefix. The only validation claimed.
  final int? nationalLength;

  /// The name for `locale`: the exact tag, then the language, then the CODE —
  /// never another language's word.
  String nameFor(String locale) {
    final tag = locale.replaceAll('_', '-');
    return names[tag] ?? names[tag.split('-').first.toLowerCase()] ?? code;
  }
}

/// The shipped plan. Iran first, deliberately — not alphabetical, exactly as
/// the web's `COUNTRIES`. A consumer with a longer list passes its own through
/// `LumoPhoneInput(countries:)`.
const List<LumoPhoneCountry> kLumoPhoneCountries = [
  LumoPhoneCountry(code: 'IR', dial: '98', nationalLength: 10, names: {'fa': 'ایران', 'en': 'Iran'}),
  LumoPhoneCountry(code: 'AE', dial: '971', nationalLength: 9, names: {'fa': 'امارات متحدهٔ عربی', 'en': 'United Arab Emirates'}),
  LumoPhoneCountry(code: 'TR', dial: '90', nationalLength: 10, names: {'fa': 'ترکیه', 'en': 'Türkiye'}),
  LumoPhoneCountry(code: 'DE', dial: '49', names: {'fa': 'آلمان', 'en': 'Germany'}),
  LumoPhoneCountry(code: 'GB', dial: '44', nationalLength: 10, names: {'fa': 'بریتانیا', 'en': 'United Kingdom'}),
  LumoPhoneCountry(code: 'US', dial: '1', nationalLength: 10, names: {'fa': 'ایالات متحده', 'en': 'United States'}),
];

/// The reader's digits → ASCII, learned from `intl` (never a hardcoded
/// U+06F0–06F9 table), the way `LumoNumberField` parses: the built-in systems
/// always, plus `locale`'s on first use. Punctuation, spaces, the plus and
/// bidi marks are dropped — the web's `phoneDigits`.
String lumoPhoneDigits(String input, {String? locale}) {
  final map = _digitMap(locale ?? 'en');
  final out = StringBuffer();
  for (final rune in input.runes) {
    final ascii = map[String.fromCharCode(rune)];
    if (ascii != null) out.write(ascii);
  }
  return out.toString();
}

/// The national number: the ITU international prefix, the dial code and the
/// trunk zero removed, IN THAT ORDER — `00` must go before the trunk-zero rule
/// or one zero survives. The web's `toNational`.
String lumoPhoneNational(String input, String dial, {String? locale}) {
  var digits = lumoPhoneDigits(input, locale: locale);
  if (digits.startsWith('00')) digits = digits.substring(2);
  if (digits.startsWith(dial)) digits = digits.substring(dial.length);
  // The trunk prefix, last. This is the line the whole widget exists for.
  if (digits.startsWith('0')) digits = digits.substring(1);
  return digits;
}

/// `+` + dial code + national number, or `''` when there is nothing to build.
/// The web's `toE164`.
String lumoPhoneE164(String input, String dial, {String? locale}) {
  final national = lumoPhoneNational(input, dial, locale: locale);
  return national.isEmpty ? '' : '+$dial$national';
}

/// True when the number has the length its country's plan expects — the ONLY
/// validation claimed (the web's `isValidPhone`). A country with no
/// `nationalLength` accepts any non-empty length.
bool lumoPhoneIsValid(String e164, {List<LumoPhoneCountry> countries = kLumoPhoneCountries}) {
  final digits = lumoPhoneDigits(e164);
  if (digits.isEmpty) return false;
  // Longest dial code first, so «1» does not shadow «98».
  final sorted = [...countries]..sort((a, b) => b.dial.length.compareTo(a.dial.length));
  for (final country in sorted) {
    if (!digits.startsWith(country.dial)) continue;
    final national = digits.substring(country.dial.length);
    if (national.isEmpty) return false;
    return country.nationalLength == null || national.length == country.nationalLength;
  }
  return false;
}

/// A phone number, entered the way Iranians actually type one: «۰۹۱۲…» with a
/// trunk zero, in either numeral system, handed to the caller as E.164
/// (`+989121234567`) with the zero stripped — Persian digits on screen, ASCII
/// on the wire. The web `PhoneInput`.
///
/// **The number is ALWAYS an LTR island.** A phone number reads left-to-right
/// in every script, so the dial prefix and the digits sit in their own
/// `Directionality(ltr)` — the `<bdi dir="ltr">` of the web component, and the
/// same data-type rule as `LumoTextField(isNumeric:)`. It is not a direction
/// flag: the ROW still mirrors, so the country selector takes the reading
/// start (right under `fa-IR`, left under `en-US`).
///
/// Announced strings, all REQUIRED: `label` (the field's name), `countryLabel`
/// (names the country selector — a second control inside one field),
/// `closeLabel` (the country sheet's ✕ and scrim) and `searchLabel` (names the
/// sheet's search box). Country NAMES come from the `countries` data per
/// locale and fall back to the ISO code, never to English.
///
/// `keyboardType` is `phone`, never a numeric one that would reject the digits
/// a Persian keyboard produces; the parser, not the platform, decides what a
/// digit is.
///
/// State: `errorMessage` is the ONLY validity input, exactly as on the web
/// (`phone-input.tsx` has no `isInvalid` and derives `aria-invalid` from the
/// message alone), and it reaches the reader as `SemanticsValidationResult
/// .invalid` on the number field — the state, not only the sentence. The web
/// has no `isRequired` here either, so neither does this.
///
/// The country selector is 132 logical px wide where the web's is `w-36`
/// (144): a stated mobile deviation. At 320 dp the row must still leave the
/// number field room for a dial prefix and ten digits, and 144 does not.
class LumoPhoneInput extends StatefulWidget {
  const LumoPhoneInput({
    super.key,
    required this.label,
    required this.countryLabel,
    required this.closeLabel,
    required this.searchLabel,
    this.value,
    this.onChanged,
    this.description,
    this.errorMessage,
    this.isDisabled = false,
    this.defaultCountry = 'IR',
    this.countries = kLumoPhoneCountries,
    this.placeholder,
  });

  /// Announced and displayed name. REQUIRED — an unnamed field is a defect.
  final String label;

  /// Names the country selector. REQUIRED — it is a second control in one field.
  final String countryLabel;

  /// Names the country sheet's ✕ and its scrim. REQUIRED.
  final String closeLabel;

  /// Names the country sheet's search box. REQUIRED.
  final String searchLabel;

  /// Controlled value, always E.164 (`+989121234567`). Null leaves the number
  /// to the widget.
  final String? value;

  /// Fires with E.164, or `''` when the field is emptied.
  final ValueChanged<String>? onChanged;
  final String? description;

  /// Shown under the field and announced. Supplying one marks it invalid.
  final String? errorMessage;
  final bool isDisabled;

  /// ISO code whose dial code is selected first.
  final String defaultCountry;

  /// Overrides the shipped plan.
  final List<LumoPhoneCountry> countries;
  final String? placeholder;

  @override
  State<LumoPhoneInput> createState() => _LumoPhoneInputState();
}

class _LumoPhoneInputState extends State<LumoPhoneInput> {
  final _controller = TextEditingController();
  late String _code = _inferCode(widget.value) ?? widget.defaultCountry;
  String? _uncontrolled;
  String? _draft;
  String _locale = 'en';

  String get _e164 => widget.value ?? _uncontrolled ?? '';

  LumoPhoneCountry get _country {
    for (final c in widget.countries) {
      if (c.code == _code) return c;
    }
    return widget.countries.isEmpty ? const LumoPhoneCountry(code: 'IR', dial: '98') : widget.countries.first;
  }

  String? _inferCode(String? value) {
    if (value == null || !value.trimLeft().startsWith('+')) return null;
    final digits = lumoPhoneDigits(value);
    final sorted = [...widget.countries]..sort((a, b) => b.dial.length.compareTo(a.dial.length));
    for (final c in sorted) {
      if (digits.startsWith(c.dial)) return c.code;
    }
    return null;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _locale = LumoScope.of(context).locale;
    _sync();
  }

  @override
  void didUpdateWidget(LumoPhoneInput old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value) {
      final inferred = _inferCode(widget.value);
      if (inferred != null) _code = inferred;
      _sync();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// What the field SHOWS is derived from the E.164 value, never stored beside
  /// it — a caller setting `value` from outside cannot desynchronise it. The
  /// draft exists for ONE keystroke, the trunk zero, which a purely derived
  /// field would strip under the user's finger; it wins only while it still
  /// parses to the same value.
  void _sync() {
    final dial = _country.dial;
    final draftHolds = _draft != null && lumoPhoneE164(_draft!, dial, locale: _locale) == _e164;
    final text = draftHolds ? _draft! : _renderDigits(lumoPhoneNational(_e164, dial, locale: _locale), _locale);
    if (_controller.text != text) {
      _controller.value = TextEditingValue(
        text: text,
        selection: TextSelection.collapsed(offset: text.length),
      );
    }
  }

  void _emit(String e164) {
    if (widget.value == null) _uncontrolled = e164;
    widget.onChanged?.call(e164);
  }

  void _onText(String text) {
    _draft = text;
    _emit(lumoPhoneE164(text, _country.dial, locale: _locale));
    setState(() {});
  }

  void _pickCountry(String code) {
    final national = lumoPhoneNational(_e164, _country.dial, locale: _locale);
    setState(() {
      _code = code;
      _draft = null;
    });
    _emit(national.isEmpty ? '' : '+${_country.dial}$national');
    _sync();
  }

  Future<void> _openCountries() => showLumoSheet<void>(
    context,
    label: widget.countryLabel,
    closeLabel: widget.closeLabel,
    body: (ctx) => _CountrySheet(
      countries: widget.countries,
      selected: _code,
      searchLabel: widget.searchLabel,
      onPick: (code) {
        Navigator.of(ctx).pop();
        _pickCountry(code);
      },
    ),
  );

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final country = _country;
    final invalid = widget.errorMessage != null;
    final dial = '+${_renderDigits(country.dial, scope.locale)}';
    return Opacity(
      opacity: widget.isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Excluded: the name lives on the number field's node, announced ONCE.
          ExcludeSemantics(
            child: Text(
              widget.label,
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg),
            ),
          ),
          const SizedBox(height: 6),
          // The ROW mirrors: the country selector takes the reading start.
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 8,
            children: [
              SizedBox(
                width: 132,
                child: Semantics(
                  label: widget.countryLabel,
                  value: '${country.nameFor(scope.locale)} $dial',
                  button: true,
                  enabled: !widget.isDisabled,
                  child: InkWell(
                    onTap: widget.isDisabled ? null : _openCountries,
                    borderRadius: BorderRadius.circular(LumoRadius.md),
                    child: Container(
                      height: LumoControl.md,
                      padding: const EdgeInsetsDirectional.only(start: 10, end: 6),
                      decoration: BoxDecoration(
                        color: c.surface,
                        border: Border.all(color: c.borderControl),
                        borderRadius: BorderRadius.circular(LumoRadius.md),
                      ),
                      child: ExcludeSemantics(
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                country.nameFor(scope.locale),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(fontSize: 13, color: c.fg),
                              ),
                            ),
                            Icon(Icons.expand_more, size: 16, color: c.fgMuted),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              // The LTR island: the dial prefix keeps its place to the LEFT of the
              // digits in every script, because a phone number reads left-to-right.
              Expanded(
                child: Directionality(
                  textDirection: TextDirection.ltr,
                  child: Row(
                    spacing: 6,
                    children: [
                      ExcludeSemantics(
                        child: Text(dial, style: TextStyle(fontSize: 13, color: c.fgMuted)),
                      ),
                      Expanded(
                        child: MergeSemantics(
                          child: Semantics(
                            label: widget.label,
                            textField: true,
                            enabled: !widget.isDisabled,
                            validationResult: invalid ? SemanticsValidationResult.invalid : SemanticsValidationResult.none,
                            hint: [if (widget.description != null) widget.description!, if (widget.errorMessage != null) widget.errorMessage!].join('. '),
                            child: TextField(
                              controller: _controller,
                              enabled: !widget.isDisabled,
                              onChanged: _onText,
                              // `phone`, never a numeric type that rejects Persian digits.
                              keyboardType: TextInputType.phone,
                              autofillHints: const [AutofillHints.telephoneNumberNational],
                              textDirection: TextDirection.ltr,
                              style: TextStyle(fontSize: 14, color: c.fg),
                              decoration: InputDecoration(
                                hintText: widget.placeholder,
                                hintStyle: TextStyle(color: c.fgSubtle),
                                contentPadding: const EdgeInsetsDirectional.symmetric(horizontal: 12, vertical: 8),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(LumoRadius.md),
                                  borderSide: BorderSide(color: invalid ? c.critical : c.borderControl),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          if (widget.description != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: ExcludeSemantics(
                child: Text(widget.description!, style: TextStyle(fontSize: 12, color: c.fgMuted)),
              ),
            ),
          if (invalid)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: // ExcludeSemantics, and deliberately NOT `Semantics(liveRegion: true, …)`: the message is already announced as part of the field's semantic `hint` just above, so a second node carrying the same words would say it twice. A `liveRegion` wrapped round an EXCLUDED subtree — which is what stood here — announces nothing at all: it reads as an accessibility feature and is a no-op. See test/house_rules_test.dart.
              ExcludeSemantics(
                child: Text(widget.errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)),
              ),
            ),
        ],
      ),
    );
  }
}

/// The country sheet's body: a search box over the plan, then the countries as
/// buttons named «name +dial» and announced `selected` for the current one.
/// The dial code is an LTR island for the same reason the number is.
class _CountrySheet extends StatefulWidget {
  const _CountrySheet({required this.countries, required this.selected, required this.searchLabel, required this.onPick});
  final List<LumoPhoneCountry> countries;
  final String selected;
  final String searchLabel;
  final ValueChanged<String> onPick;

  @override
  State<_CountrySheet> createState() => _CountrySheetState();
}

class _CountrySheetState extends State<_CountrySheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final query = lumoFoldForSearch(_query.trim());
    final visible = query.isEmpty
        ? widget.countries
        : widget.countries.where((k) => lumoFoldForSearch(k.nameFor(scope.locale)).contains(query) || k.dial.startsWith(query) || lumoFoldForSearch(k.code).contains(query)).toList();
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        LumoTextField(
          label: widget.searchLabel,
          showLabel: false,
          placeholder: widget.searchLabel,
          prefix: Icon(Icons.search, size: 16, color: c.fgSubtle),
          onChanged: (v) => setState(() => _query = v),
        ),
        const SizedBox(height: 8),
        Semantics(
          container: true,
          explicitChildNodes: true,
          role: SemanticsRole.list,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 320),
            child: ListView(
              shrinkWrap: true,
              children: [
                for (final k in visible)
                  Semantics(
                    label: '${k.nameFor(scope.locale)} +${_renderDigits(k.dial, scope.locale)}',
                    button: true,
                    selected: k.code == widget.selected,
                    child: InkWell(
                      onTap: () => widget.onPick(k.code),
                      borderRadius: BorderRadius.circular(LumoRadius.sm),
                      child: Container(
                        constraints: const BoxConstraints(minHeight: LumoControl.lg),
                        padding: const EdgeInsetsDirectional.symmetric(horizontal: 10, vertical: 8),
                        child: ExcludeSemantics(
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  k.nameFor(scope.locale),
                                  style: TextStyle(fontSize: 15, fontWeight: k.code == widget.selected ? FontWeight.w600 : FontWeight.w400, color: c.fg),
                                ),
                              ),
                              // The dial code reads left-to-right in every script.
                              Directionality(
                                textDirection: TextDirection.ltr,
                                child: Text('+${_renderDigits(k.dial, scope.locale)}', style: TextStyle(fontSize: 13, color: c.fgMuted)),
                              ),
                              if (k.code == widget.selected)
                                Padding(
                                  padding: const EdgeInsetsDirectional.only(start: 8),
                                  child: Icon(Icons.check, size: 16, color: c.accent),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// ASCII digits rendered in the reader's numbering system, one at a time
/// through `formatNumber` — the web's `renderDigits`. Anything that is not a
/// digit passes through.
String _renderDigits(String digits, String locale) {
  final out = StringBuffer();
  for (final rune in digits.runes) {
    final ch = String.fromCharCode(rune);
    out.write(rune >= 0x30 && rune <= 0x39 ? formatNumber(rune - 0x30, locale, grouping: false) : ch);
  }
  return out.toString();
}

/// The reader's digits → ASCII, learned from `intl`: the built-in systems
/// always, plus `locale`'s on first use. The same rule `LumoNumberField` parses by.
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
