import 'package:flutter/material.dart';
import 'scope.dart';

/// A labelled text field: `label` REQUIRED (visible, and the field's name),
/// `description` under it, `errorMessage` announced, text aligned to the
/// reading start by `Directionality`. On Material's `TextField`.
class LumoTextField extends StatelessWidget {
  const LumoTextField({super.key, required this.label, this.description, this.errorMessage, this.isRequired = false, this.isDisabled = false, this.isReadOnly = false, this.placeholder, this.controller, this.onChanged, this.keyboardType, this.obscureText = false, this.autofillHints});
  final String label;
  final String? description;
  final String? errorMessage;
  final bool isRequired;
  final bool isDisabled;
  final bool isReadOnly;
  final String? placeholder;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Iterable<String>? autofillHints;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Opacity(
      opacity: isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text.rich(TextSpan(text: label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg), children: [if (isRequired) TextSpan(text: ' *', style: TextStyle(color: c.critical))])),
          const SizedBox(height: 6),
          Semantics(
            label: label,
            hint: [if (description != null) description, if (errorMessage != null) errorMessage].join('. '),
            textField: true,
            enabled: !isDisabled,
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              enabled: !isDisabled,
              readOnly: isReadOnly,
              keyboardType: keyboardType,
              obscureText: obscureText,
              autofillHints: autofillHints,
              style: TextStyle(fontSize: 14, color: c.fg),
              decoration: InputDecoration(hintText: placeholder, hintStyle: TextStyle(color: c.fgSubtle), errorText: errorMessage, errorStyle: TextStyle(color: c.critical, fontSize: 12)),
            ),
          ),
          if (description != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(description!, style: TextStyle(fontSize: 12, color: c.fgMuted))),
        ],
      ),
    );
  }
}
