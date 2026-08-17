import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsValidationResult;
import 'scope.dart';
import 'tokens.g.dart';

/// A labelled text field: `label` REQUIRED (visible, and the field's name),
/// `description` under it, `errorMessage` announced, text aligned to the
/// reading start by `Directionality`. On Material's `TextField`.
///
/// `isNumeric`: the value is digits (a phone number, a code, an amount) — it
/// is laid out left-to-right inside an RTL form and gets a numeric keyboard.
/// A data-type fact, not a direction flag (there is no `dir` anywhere in Lumo).
///
/// **State reaches the reader as STATE, not only as words.** `isInvalid` is the
/// web's own prop (`TextFieldProps.isInvalid`, separate from `errorMessage`, so
/// a form can mark a field wrong before it has a sentence for it) and lands on
/// the node as `SemanticsValidationResult.invalid`; `isRequired` lands as
/// `SemanticsFlag.isRequired`. The web carries required on the native `required`
/// attribute and paints no marker — the « *» drawn here is a mobile addition,
/// kept because a phone form has no other affordance for it.
class LumoTextField extends StatelessWidget {
  const LumoTextField({
    super.key,
    required this.label,
    this.description,
    this.errorMessage,
    this.isInvalid,
    this.isRequired = false,
    this.isDisabled = false,
    this.isReadOnly = false,
    this.placeholder,
    this.controller,
    this.onChanged,
    this.onSubmitted,
    this.keyboardType,
    this.obscureText = false,
    this.autofillHints,
    this.isNumeric = false,
    this.prefix,
    this.suffix,
    this.autofocus = false,
    this.maxLines = 1,
    this.minLines,
    this.textInputAction,
    this.focusNode,
    this.showLabel = true,
  });
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// An error message for the field. Announced as the control's hint and marks it invalid.
  final String? errorMessage;

  /// Marks the field wrong WITHOUT a sentence (the web's `isInvalid`). Null
  /// derives it from `errorMessage`, which is what a message alone already means.
  final bool? isInvalid;
  /// Whether user input is required before the form is submitted.
  final bool isRequired;
  /// Whether the control is disabled.
  final bool isDisabled;
  /// Whether the input can be selected but not changed by the user.
  final bool isReadOnly;
  /// Placeholder text shown while the field is empty. Never a substitute for the label.
  final String? placeholder;
  /// An optional controller: supply one to read or drive the value from outside, or omit it and the widget owns its own.
  final TextEditingController? controller;
  /// Called with the new value when the user changes it. Omitting it makes the control read-only.
  final ValueChanged<String>? onChanged;
  /// Called when the reader submits from the keyboard.
  final ValueChanged<String>? onSubmitted;
  /// Which keyboard the platform should offer.
  final TextInputType? keyboardType;
  /// Whether the text is masked, as for a password.
  final bool obscureText;
  /// Autofill hints for the platform's keyboard and password manager.
  final Iterable<String>? autofillHints;
  /// Whether the field holds a number, so its digits stay LTR inside RTL text.
  final bool isNumeric;

  /// A glyph at the inline START of the box (decorative — the label names the field).
  final Widget? prefix;

  /// A widget at the inline END of the box (a named button, a unit…).
  final Widget? suffix;
  /// Whether the control takes focus when it first appears.
  final bool autofocus;
  /// How many lines the text may occupy before it wraps no further.
  final int? maxLines;
  /// The fewest lines the field occupies before it grows.
  final int? minLines;
  /// What the keyboard's action key does.
  final TextInputAction? textInputAction;
  /// An optional focus node, for callers that manage focus themselves.
  final FocusNode? focusNode;

  /// The label is always the field's NAME; `showLabel: false` hides it visually
  /// (a search box with a placeholder) — the name is still announced.
  final bool showLabel;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final invalid = isInvalid ?? (errorMessage != null);
    return Opacity(
      opacity: isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (showLabel) ...[
            ExcludeSemantics(
              child: Text.rich(
                TextSpan(
                  text: label,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg),
                  children: [
                    if (isRequired)
                      TextSpan(
                        text: ' *',
                        style: TextStyle(color: c.critical),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 6),
          ],
          Semantics(
            label: label,
            hint: [if (description != null) description, if (errorMessage != null) errorMessage].join('. '),
            textField: true,
            enabled: !isDisabled,
            // The two STATES the web sets on the control itself, which a hint
            // string cannot carry: a reader hears «invalid» / «required», not
            // just the sentence.
            // `null`, not `false`, when the field is optional: a bool sets the
            // required STATE either way, and an optional field carries none on
            // the web (there is no `required="false"` attribute).
            isRequired: isRequired ? true : null,
            validationResult: invalid ? SemanticsValidationResult.invalid : SemanticsValidationResult.none,
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              onSubmitted: onSubmitted,
              enabled: !isDisabled,
              readOnly: isReadOnly,
              keyboardType: keyboardType ?? (isNumeric ? TextInputType.number : null),
              obscureText: obscureText,
              autofillHints: autofillHints,
              autofocus: autofocus,
              maxLines: obscureText ? 1 : maxLines,
              minLines: minLines,
              textInputAction: textInputAction,
              focusNode: focusNode,
              // Digits read left-to-right in every script; the box stays where the form put it.
              textDirection: isNumeric ? TextDirection.ltr : null,
              style: TextStyle(fontSize: 14, color: c.fg),
              decoration: InputDecoration(
                hintText: placeholder,
                hintStyle: TextStyle(color: c.fgSubtle),
                // `error:`, not `errorText:` — the message is the node's HINT
                // already, and `errorText` builds a second announcing node for
                // the same words (measured: «ایراد» was heard twice). The
                // widget form lets the copy be excluded while Material still
                // reads the decorator as errored and paints the critical border.
                error: errorMessage == null
                    ? null
                    : // ExcludeSemantics, and deliberately NOT `Semantics(liveRegion: true, …)`: the message is already announced as part of the field's semantic `hint` just above, so a second node carrying the same words would say it twice. A `liveRegion` wrapped round an EXCLUDED subtree — which is what stood here — announces nothing at all: it reads as an accessibility feature and is a no-op. See test/house_rules_test.dart.
                      ExcludeSemantics(
                        child: Text(
                          errorMessage!,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: c.critical, fontSize: 12),
                        ),
                      ),
                // `isInvalid` with no sentence still has to look wrong: with no
                // error child Material would draw the ordinary border.
                enabledBorder: invalid && errorMessage == null
                    ? OutlineInputBorder(
                        borderRadius: BorderRadius.circular(LumoRadius.md),
                        borderSide: BorderSide(color: c.critical),
                      )
                    : null,
                focusedBorder: invalid && errorMessage == null
                    ? OutlineInputBorder(
                        borderRadius: BorderRadius.circular(LumoRadius.md),
                        borderSide: BorderSide(color: c.critical, width: LumoFocus.width),
                      )
                    : null,
                prefixIcon: prefix == null
                    ? null
                    : ExcludeSemantics(
                        child: Padding(padding: const EdgeInsetsDirectional.only(start: 10, end: 6), child: prefix),
                      ),
                prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
                suffixIcon: suffix,
                suffixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
              ),
            ),
          ),
          // The visible copy is EXCLUDED: `description` is already the node's
          // hint and `errorText` is already inside the field's own subtree, so
          // without this a reader hears each of them twice. Same rule as
          // checkbox.dart and select.dart.
          if (description != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: ExcludeSemantics(
                child: Text(description!, style: TextStyle(fontSize: 12, color: c.fgMuted)),
              ),
            ),
        ],
      ),
    );
  }
}
