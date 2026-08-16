import 'package:flutter/material.dart';
import 'scope.dart';

/// A labelled text field: `label` REQUIRED (visible, and the field's name),
/// `description` under it, `errorMessage` announced, text aligned to the
/// reading start by `Directionality`. On Material's `TextField`.
///
/// `isNumeric`: the value is digits (a phone number, a code, an amount) — it
/// is laid out left-to-right inside an RTL form and gets a numeric keyboard.
/// A data-type fact, not a direction flag (there is no `dir` anywhere in Lumo).
class LumoTextField extends StatelessWidget {
  const LumoTextField({super.key, required this.label, this.description, this.errorMessage, this.isRequired = false, this.isDisabled = false, this.isReadOnly = false, this.placeholder, this.controller, this.onChanged, this.onSubmitted, this.keyboardType, this.obscureText = false, this.autofillHints, this.isNumeric = false, this.prefix, this.suffix, this.autofocus = false, this.maxLines = 1, this.minLines, this.textInputAction, this.focusNode, this.showLabel = true});
  final String label;
  final String? description;
  final String? errorMessage;
  final bool isRequired;
  final bool isDisabled;
  final bool isReadOnly;
  final String? placeholder;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Iterable<String>? autofillHints;
  final bool isNumeric;
  /// A glyph at the inline START of the box (decorative — the label names the field).
  final Widget? prefix;
  /// A widget at the inline END of the box (a named button, a unit…).
  final Widget? suffix;
  final bool autofocus;
  final int? maxLines;
  final int? minLines;
  final TextInputAction? textInputAction;
  final FocusNode? focusNode;
  /// The label is always the field's NAME; `showLabel: false` hides it visually
  /// (a search box with a placeholder) — the name is still announced.
  final bool showLabel;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Opacity(
      opacity: isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (showLabel) ...[
            ExcludeSemantics(child: Text.rich(TextSpan(text: label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg), children: [if (isRequired) TextSpan(text: ' *', style: TextStyle(color: c.critical))]))),
            const SizedBox(height: 6),
          ],
          Semantics(
            label: label,
            hint: [if (description != null) description, if (errorMessage != null) errorMessage].join('. '),
            textField: true,
            enabled: !isDisabled,
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
                errorText: errorMessage,
                errorStyle: TextStyle(color: c.critical, fontSize: 12),
                prefixIcon: prefix == null ? null : ExcludeSemantics(child: Padding(padding: const EdgeInsetsDirectional.only(start: 10, end: 6), child: prefix)),
                prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
                suffixIcon: suffix,
                suffixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
              ),
            ),
          ),
          if (description != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(description!, style: TextStyle(fontSize: 12, color: c.fgMuted))),
        ],
      ),
    );
  }
}
