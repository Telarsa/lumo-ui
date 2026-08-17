import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show MaxLengthEnforcement;
import 'format.dart';
import 'scope.dart';

/// The multi-line box — the counterpart of the web `TextArea`, in
/// `LumoTextField`'s visual language (same decoration theme, same label /
/// description / error rows): `label` REQUIRED (visible, and the field's name),
/// a MINIMUM of `minLines` that grows to `maxLines` (null = unbounded), and an
/// optional `maxLength` whose counter is rendered through `formatNumber` —
/// Material's own counter prints raw «12/200», so `buildCounter` is owned here
/// (Persian digits under `fa-*`). Text aligns to the reading start by
/// `Directionality`. Semantics: ONE text-field node named by `label`
/// (`MergeSemantics`) carrying `currentValueLength`/`maxValueLength`; the painted
/// counter is decoration and excluded.
class LumoTextArea extends StatelessWidget {
  const LumoTextArea({super.key, required this.label, this.description, this.errorMessage, this.minLines = 3, this.maxLines, this.maxLength, this.isRequired = false, this.isDisabled = false, this.isReadOnly = false, this.placeholder, this.controller, this.onChanged, this.autoFocus = false})
      : assert(minLines > 0, 'A text area needs at least one line.'),
        assert(maxLines == null || maxLines >= minLines, 'maxLines must not be smaller than minLines.');
  final String label;
  final String? description;
  final String? errorMessage;
  /// Visible lines before the box grows. Web `rows`; three by default.
  final int minLines;
  /// The box stops growing here and scrolls; null grows without bound.
  final int? maxLines;
  /// Enforced limit; when set, a counter «۱۲/۲۰۰» in the reader's digits sits under the box.
  final int? maxLength;
  final bool isRequired;
  final bool isDisabled;
  final bool isReadOnly;
  final String? placeholder;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final bool autoFocus;

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    return Opacity(
      opacity: isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text.rich(TextSpan(text: label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg), children: [if (isRequired) TextSpan(text: ' *', style: TextStyle(color: c.critical))])),
          const SizedBox(height: 6),
          // `MergeSemantics`: name + editable = ONE text-field node (a bare `Semantics(label:)`
          // would leave the name on a parent the reader lands on separately from the field).
          MergeSemantics(
            child: Semantics(
              label: label,
              hint: [if (description != null) description, if (errorMessage != null) errorMessage].join('. '),
              textField: true,
              multiline: true,
              enabled: !isDisabled,
              child: TextField(
                controller: controller,
                onChanged: onChanged,
                enabled: !isDisabled,
                readOnly: isReadOnly,
                autofocus: autoFocus,
                keyboardType: TextInputType.multiline,
                minLines: minLines,
                maxLines: maxLines,
                maxLength: maxLength,
                maxLengthEnforcement: maxLength == null ? null : MaxLengthEnforcement.enforced,
                style: TextStyle(fontSize: 14, color: c.fg),
                decoration: InputDecoration(hintText: placeholder, hintStyle: TextStyle(color: c.fgSubtle), errorText: errorMessage, errorStyle: TextStyle(color: c.critical, fontSize: 12)),
                // The counter in the reader's digits; Material's default would print raw ASCII.
                buildCounter: maxLength == null
                    ? null
                    // Excluded from semantics: the count reaches the reader as the field's own
                    // currentValueLength/maxValueLength, not as text appended to its name on every keystroke.
                    : (context, {required currentLength, required isFocused, maxLength}) => ExcludeSemantics(
                          child: Text(
                            '${formatNumber(currentLength, scope.locale)}/${formatNumber(maxLength!, scope.locale)}',
                            style: TextStyle(fontSize: 12, color: currentLength >= maxLength ? c.critical : c.fgMuted),
                          ),
                        ),
              ),
            ),
          ),
          if (description != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(description!, style: TextStyle(fontSize: 12, color: c.fgMuted))),
        ],
      ),
    );
  }
}
