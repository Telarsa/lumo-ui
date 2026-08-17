import 'package:flutter/material.dart';

import 'phone_input.dart' show lumoPhoneDigits;
import 'scope.dart';
import 'text_field.dart';

/// What a masked field is worth, in the three forms a caller needs — the web's
/// `MaskValue` (`mask-input.tsx`).
@immutable
class LumoMaskValue {
  const LumoMaskValue({required this.raw, required this.masked, required this.isComplete});

  /// The value WITHOUT the mask's own characters, in ASCII: `'12345678'`.
  /// This is what a server is sent and what a database holds; the separators
  /// are presentation, and Persian digits are a numbering system, not data.
  final String raw;

  /// The value AS SHOWN, mask characters included: `'1234-5678'`.
  final String masked;

  /// Whether every slot in the mask is filled.
  final bool isComplete;

  @override
  bool operator ==(Object other) => other is LumoMaskValue && other.raw == raw && other.masked == masked && other.isComplete == isComplete;

  @override
  int get hashCode => Object.hash(raw, masked, isComplete);
}

/// `#` accepts a digit, `@` a letter, `*` either — maska's token set, which
/// `mask-input.tsx` builds on. Everything else in a mask is a literal.
bool _isToken(String ch) => ch == '#' || ch == '@' || ch == '*';

final RegExp _letter = RegExp(r'\p{L}', unicode: true);

bool _satisfies(String token, String ch) => switch (token) {
      '#' => ch.codeUnitAt(0) >= 0x30 && ch.codeUnitAt(0) <= 0x39,
      '@' => _letter.hasMatch(ch),
      _ => _letter.hasMatch(ch) || (ch.codeUnitAt(0) >= 0x30 && ch.codeUnitAt(0) <= 0x39),
    };

/// One character with any numbering system's digits folded to ASCII.
///
/// `lumoPhoneDigits` (phone_input.dart) is the library's existing digit fold,
/// learned from `intl` rather than a hardcoded U+06F0–06F9 table, and it is
/// REUSED here rather than copied: given one character it returns that
/// character's ASCII digit, or the empty string when it is not a digit at all —
/// which is exactly the two answers this needs. (`number_field.dart` and
/// `otp_field.dart` each hold a private copy of the same table; a fourth copy
/// is how four of them start disagreeing.)
String _fold(String ch, String locale) {
  final digit = lumoPhoneDigits(ch, locale: locale);
  return digit.isEmpty ? ch : digit;
}

/// Apply `mask` to `input` — the web's `maskValue(value, mask)`, on Lumo's
/// digit fold.
///
/// **Persian digits are accepted and normalised**: «۱۲۳۴» fills a `'####'`
/// mask, and `raw` comes back `'1234'`. That is the whole reason this is not
/// `maskValue` with a different name — a Persian keyboard is what an Iranian
/// phone types a card number with, and a mask that only understands U+0030–39
/// silently refuses every keystroke.
///
/// Characters in `input` that no slot accepts are DROPPED, so re-masking an
/// already-masked string is stable (`'1234-5678'` masks to itself), a paste
/// with spaces or dashes works, and a filled slot never holds punctuation.
LumoMaskValue lumoMaskValue(String input, String mask, {String locale = 'en'}) {
  final chars = [for (final rune in input.runes) _fold(String.fromCharCode(rune), locale)];
  final masked = StringBuffer();
  final raw = StringBuffer();
  final pending = StringBuffer();
  var slots = 0;
  var filled = 0;
  var index = 0;
  for (final rune in mask.runes) {
    final token = String.fromCharCode(rune);
    if (!_isToken(token)) {
      // A literal waits until the slot after it is actually filled: a half-typed
      // value ends on a digit, never on a dangling separator.
      pending.write(token);
      continue;
    }
    slots++;
    while (index < chars.length && !_satisfies(token, chars[index])) {
      index++;
    }
    if (index >= chars.length) continue;
    masked
      ..write(pending)
      ..write(chars[index]);
    pending.clear();
    raw.write(chars[index]);
    filled++;
    index++;
  }
  return LumoMaskValue(raw: raw.toString(), masked: masked.toString(), isComplete: slots > 0 && filled == slots);
}

/// A field whose text is forced into a fixed shape as it is typed — a card
/// number, a national ID, a postal code, a plate. The web `MaskInput`
/// (`mask-input.tsx`), whose engine is maska; here the engine is
/// [lumoMaskValue], forty lines that owe nothing to a package.
///
/// **`label` REQUIRED**; `mask` uses maska's tokens (`#` digit, `@` letter,
/// `*` either, everything else literal), and `onChanged` reports BOTH forms —
/// the [LumoMaskValue.raw] the app stores and the [LumoMaskValue.masked] the
/// reader sees — because a caller that gets only one of them writes the other
/// conversion itself, differently.
///
/// **Persian digits fill the mask.** «۱۲۳۴۵۶۷۸» typed into `'####-####'`
/// yields `1234-5678` on screen and `'12345678'` as `raw`. The shown value is
/// ASCII and an LTR ISLAND, matching the web's `dir="ltr"` +
/// `data-lumo-latn` on the same control: a masked value is a code, and a code
/// reads left-to-right in every script — the box itself stays exactly where
/// the form put it. This is a data-type fact, not a direction flag; it is
/// `LumoTextField.isNumeric`, the same one `LumoPhoneInput` uses.
///
/// `maskPlaceholder`, when given, is the character standing in for an unfilled
/// slot: the field shows the whole skeleton (`'____-____'`) while it is empty,
/// so the shape is visible before the first keystroke without a word in any
/// language.
///
/// **The caret goes to the end after every edit.** Editing in the middle of a
/// masked value moves the caret; the alternative is a caret-mapping pass that
/// is wrong in a different way in every mask. Stated rather than discovered.
///
/// Web props not carried: `name` (nothing is posted by the platform), and
/// maska's own options beyond the token set (`eager`, `reversed`, custom token
/// tables) — none of them reaches anything in this implementation, and a prop
/// that reaches nothing is not declared.
class LumoMaskInput extends StatefulWidget {
  const LumoMaskInput({
    super.key,
    required this.label,
    required this.mask,
    this.maskPlaceholder,
    this.value,
    this.defaultValue,
    this.onChanged,
    this.description,
    this.errorMessage,
    this.incompleteMessage,
    this.isRequired = false,
    this.isDisabled = false,
    this.focusNode,
    this.autofocus = false,
    this.showLabel = true,
    this.prefix,
  })  : assert(mask.length > 0, 'A mask input needs a mask.'),
        assert(maskPlaceholder == null || maskPlaceholder.length == 1, 'maskPlaceholder is ONE character, drawn in every unfilled slot.');

  /// Announced (and, unless `showLabel` is false, displayed) name. REQUIRED.
  final String label;

  /// The pattern: `'####-####'`, `'@@-###'`, `'###-##-####'`.
  final String mask;

  /// The character drawn in an unfilled slot. `null` shows no skeleton.
  final String? maskPlaceholder;

  /// Controlled text — raw or masked, it is re-masked either way.
  final String? value;

  /// Uncontrolled initial text, on the same terms.
  final String? defaultValue;

  /// Called after every edit with the raw value, the masked value and whether
  /// the mask is full.
  final ValueChanged<LumoMaskValue>? onChanged;

  /// A description for the field, shown under the control and announced as its hint.
  final String? description;

  /// An error the app decided on. Wins over [incompleteMessage].
  final String? errorMessage;

  /// Announced while the field holds something that does not fill the mask.
  /// Optional: a field that is allowed to stay half-typed says nothing.
  final String? incompleteMessage;

  /// Whether user input is required before the form is submitted.
  final bool isRequired;
  /// Whether the control is disabled.
  final bool isDisabled;
  /// An optional focus node, for callers that manage focus themselves.
  final FocusNode? focusNode;
  /// Whether the control takes focus when it first appears.
  final bool autofocus;
  /// Whether the label is painted. It is announced either way — hiding a name is not dropping it.
  final bool showLabel;

  /// A glyph at the inline start (decorative — the label names the field).
  final Widget? prefix;

  @override
  State<LumoMaskInput> createState() => _LumoMaskInputState();
}

class _LumoMaskInputState extends State<LumoMaskInput> {
  late final TextEditingController _controller = TextEditingController();
  String _locale = 'en';
  bool _seeded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _locale = LumoScope.of(context).locale;
    if (!_seeded) {
      _seeded = true;
      _controller.text = lumoMaskValue(widget.value ?? widget.defaultValue ?? '', widget.mask, locale: _locale).masked;
    }
  }

  @override
  void didUpdateWidget(LumoMaskInput old) {
    super.didUpdateWidget(old);
    if (widget.value == null && widget.mask == old.mask) return;
    final masked = lumoMaskValue(widget.value ?? _controller.text, widget.mask, locale: _locale).masked;
    if (masked != _controller.text) {
      _controller.value = TextEditingValue(text: masked, selection: TextSelection.collapsed(offset: masked.length));
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String text) {
    final next = lumoMaskValue(text, widget.mask, locale: _locale);
    if (next.masked != text) {
      _controller.value = TextEditingValue(text: next.masked, selection: TextSelection.collapsed(offset: next.masked.length));
    }
    // The incomplete message and the skeleton both follow the text.
    setState(() {});
    widget.onChanged?.call(next);
  }

  /// True when the mask has a slot that only a letter or a letter-or-digit can
  /// fill — then the keyboard must not be the numeric one.
  bool get _digitsOnly => !widget.mask.contains('@') && !widget.mask.contains('*');

  @override
  Widget build(BuildContext context) {
    final current = lumoMaskValue(_controller.text, widget.mask, locale: _locale);
    final incomplete = _controller.text.isNotEmpty && !current.isComplete;
    final skeleton = widget.maskPlaceholder == null
        ? null
        : [for (final rune in widget.mask.runes) _isToken(String.fromCharCode(rune)) ? widget.maskPlaceholder! : String.fromCharCode(rune)].join();
    return LumoTextField(
      label: widget.label,
      showLabel: widget.showLabel,
      description: widget.description,
      errorMessage: widget.errorMessage ?? (incomplete ? widget.incompleteMessage : null),
      placeholder: skeleton,
      controller: _controller,
      onChanged: _onChanged,
      isRequired: widget.isRequired,
      isDisabled: widget.isDisabled,
      focusNode: widget.focusNode,
      autofocus: widget.autofocus,
      prefix: widget.prefix,
      // `isNumeric` is this library's LTR-ISLAND flag (a data-type fact, never a
      // direction one): a masked value is a code, and a code reads
      // left-to-right in Persian too. A mask with letters keeps the island and
      // takes the text keyboard back, because a numeric one cannot type them.
      isNumeric: true,
      keyboardType: _digitsOnly ? TextInputType.number : TextInputType.text,
    );
  }
}
