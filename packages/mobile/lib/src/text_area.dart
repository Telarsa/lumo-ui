import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsValidationResult;
import 'package:flutter/services.dart' show MaxLengthEnforcement;
import 'format.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// The multi-line box — the counterpart of the web `TextArea`, in
/// `LumoTextField`'s visual language (same decoration theme, same label /
/// description / error rows): `label` REQUIRED (visible, and the field's name),
/// a MINIMUM of `minLines` that grows to `maxLines` (null = unbounded), and an
/// optional `maxLength` whose counter is rendered through `formatNumber` —
/// Material's own counter prints raw «12/200», so `buildCounter` is owned here
/// (Persian digits under `fa-*`). Text aligns to the reading start by
/// `Directionality`. Semantics: ONE text-field node named by `label`
/// (`MergeSemantics`) carrying `currentValueLength`/`maxValueLength`, plus the
/// `invalid` and `required` STATES the web sets on the control (`isInvalid` is
/// the web's own prop, separate from `errorMessage`); the painted counter, the
/// painted label and the painted description are decoration and excluded — each
/// of the three already reaches the reader through the field's own node, and
/// without the exclusion every one of them was heard TWICE.
class LumoTextArea extends StatelessWidget {
  const LumoTextArea({
    super.key,
    required this.label,
    this.description,
    this.errorMessage,
    this.minLines = 4,
    this.maxLines,
    this.maxLength,
    this.isInvalid,
    this.isRequired = false,
    this.isDisabled = false,
    this.isReadOnly = false,
    this.placeholder,
    this.controller,
    this.onChanged,
    this.autoFocus = false,
  }) : assert(minLines > 0, 'A text area needs at least one line.'),
       assert(maxLines == null || maxLines >= minLines, 'maxLines must not be smaller than minLines.');
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// An error message for the field. Announced as the control's hint and marks it invalid.
  final String? errorMessage;

  /// Visible lines before the box grows. The web `TextArea`'s `rows`, which
  /// defaults to FOUR (`text-area.tsx`); this used to say three and default to
  /// three, which was drift against the reference, not a mobile decision.
  final int minLines;

  /// The box stops growing here and scrolls; null grows without bound.
  final int? maxLines;

  /// Enforced limit; when set, a counter «۱۲/۲۰۰» in the reader's digits sits under the box.
  final int? maxLength;

  /// Marks the box wrong WITHOUT a sentence (the web's `isInvalid`). Null
  /// derives it from `errorMessage`.
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
  /// Whether the control takes focus when it first appears.
  final bool autoFocus;

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final invalid = isInvalid ?? (errorMessage != null);
    return Opacity(
      opacity: isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Excluded: the name lives on the field's node, so it is heard ONCE.
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
          // `MergeSemantics`: name + editable = ONE text-field node (a bare `Semantics(label:)`
          // would leave the name on a parent the reader lands on separately from the field).
          MergeSemantics(
            child: Semantics(
              label: label,
              hint: [if (description != null) description, if (errorMessage != null) errorMessage].join('. '),
              textField: true,
              multiline: true,
              enabled: !isDisabled,
              // `null`, not `false`: an optional field carries no required state.
              isRequired: isRequired ? true : null,
              validationResult: invalid ? SemanticsValidationResult.invalid : SemanticsValidationResult.none,
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
                decoration: InputDecoration(
                  hintText: placeholder,
                  hintStyle: TextStyle(color: c.fgSubtle),
                  // `error:`, not `errorText:` — see text_field.dart: the words
                  // are the node's hint already and `errorText` announces them a
                  // second time. The widget form keeps Material's errored border.
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
                ),
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
          // Excluded: already this node's hint — visible once, announced once.
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
