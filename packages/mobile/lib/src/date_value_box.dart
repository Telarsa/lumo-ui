import 'package:flutter/material.dart';

import 'scope.dart';
import 'sheet.dart';
import 'tokens.g.dart';

/// The chrome the three date controls share — `LumoDateField`,
/// `LumoDatePicker` and `LumoDateRangePicker`. INTERNAL: this file is not
/// exported from the barrel, because a consumer builds a date control by
/// naming one of the three, not by assembling this.
///
/// It exists for one reason: the same field must not be drawn three times and
/// then drift. The web solves it with two class-name recipes
/// (`fieldVariants` + `datePickerGroupVariants`); Dart has no class names, so
/// the recipe is a widget.

/// Label, control, description and error — the vertical stack every Lumo form
/// control wears (`fieldVariants` on the web). The label is displayed AND
/// announced by the control it names, so it is a plain `Text` here; the error
/// is a live region.
class LumoDateFieldFrame extends StatelessWidget {
  const LumoDateFieldFrame({
    super.key,
    required this.label,
    required this.control,
    this.description,
    this.errorMessage,
    this.isRequired = false,
    this.isDisabled = false,
  });

  final String label;
  final Widget control;
  final String? description;
  final String? errorMessage;
  final bool isRequired;
  final bool isDisabled;

  /// The hint a control in this frame announces: its description, then its
  /// error, in one sentence. Empty when it has neither.
  static String hintFor(String? description, String? errorMessage) =>
      [?description, ?errorMessage].join('. ');

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
          control,
          if (description != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(description!, style: TextStyle(fontSize: 12, color: c.fgMuted))),
          if (errorMessage != null) Padding(padding: const EdgeInsets.only(top: 6), child: Semantics(liveRegion: true, child: Text(errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)))),
        ],
      ),
    );
  }
}

/// The bordered box that SHOWS a date and opens the picker. Read-only by
/// construction: a phone keyboard has no segment navigation, so the web's
/// segment typing (`DateInput`) has no mobile counterpart and the picker IS the
/// entry. Announced as a read-only text field named by `label` with the
/// formatted date as its VALUE — never as a button, because that is what it is
/// to a reader filling in a form.
class LumoDateValueBox extends StatelessWidget {
  const LumoDateValueBox({
    super.key,
    required this.label,
    required this.text,
    required this.isEmpty,
    this.hint,
    this.onTap,
    this.isInvalid = false,
    this.isDisabled = false,
  });

  /// The announced name of this box. Required.
  final String label;

  /// What is shown and announced as the value — already through
  /// `formatLumoDate`, or the placeholder when there is nothing.
  final String text;

  /// Whether `text` is the placeholder rather than a value (it is then painted
  /// in the subtle foreground).
  final bool isEmpty;

  /// Description and error, joined — `LumoDateFieldFrame.hintFor`.
  final String? hint;

  final VoidCallback? onTap;
  final bool isInvalid;
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Semantics(
      label: label,
      value: text,
      hint: hint,
      textField: true,
      readOnly: true,
      enabled: !isDisabled,
      child: InkWell(
        onTap: isDisabled ? null : onTap,
        borderRadius: BorderRadius.circular(LumoRadius.md),
        child: Container(
          height: LumoControl.md,
          alignment: AlignmentDirectional.centerStart,
          padding: const EdgeInsetsDirectional.symmetric(horizontal: 12),
          decoration: BoxDecoration(color: c.surface, border: Border.all(color: isInvalid ? c.critical : c.borderControl), borderRadius: BorderRadius.circular(LumoRadius.md)),
          child: ExcludeSemantics(child: Text(text, style: TextStyle(fontSize: 14, color: isEmpty ? c.fgSubtle : c.fg), overflow: TextOverflow.ellipsis)),
        ),
      ),
    );
  }
}

/// The bottom sheet the three date controls open. Lumo's own route, never
/// Material's: `showModalBottomSheet` names its route «Dialog» and its barrier
/// «Dismiss» from `MaterialLocalizations` on Android — English that no
/// parameter of ours reaches. The body brings its own header, so this takes the
/// BARE route (`showLumoSheetRoute`) rather than `showLumoSheet`'s chrome.
Future<T?> showLumoDateSheet<T>(BuildContext context, {required String closeLabel, required WidgetBuilder body}) {
  final c = LumoScope.of(context).colours;
  return showLumoSheetRoute<T>(
    context,
    closeLabel: closeLabel,
    builder: (ctx) => Align(
      alignment: Alignment.bottomCenter,
      child: Material(
        color: c.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(LumoRadius.lg)),
        clipBehavior: Clip.antiAlias,
        child: SafeArea(child: body(ctx)),
      ),
    ),
  );
}
