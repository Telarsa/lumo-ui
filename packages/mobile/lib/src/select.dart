import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsValidationResult;
import 'scope.dart';
import 'sheet.dart';
import 'tokens.g.dart';

class LumoSelectOption {
  const LumoSelectOption({required this.id, required this.label, this.isDisabled = false});
  /// A stable identity for this item — used for selection and equality, never shown or announced.
  final String id;
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// Whether the control is disabled.
  final bool isDisabled;
}

/// A single choice from a short list — Lumo's own, as on React Native (a trigger
/// named by the REQUIRED `label`, showing the REQUIRED `placeholder` or the chosen
/// option; a bottom sheet of options; REQUIRED `closeLabel`). Material's own
/// `DropdownMenu` was not used: its menu is a desktop-shaped popup and its
/// announced strings default to English.
///
/// The trigger is `LumoControl.md` — the shared control scale every field in
/// this library stands on (`text_field`, `combobox`, `date_field`,
/// `multi_select`, `phone_input`), and the web's own default
/// (`size: "md"` → `h-control-md`). It is full-bleed, so the target is short
/// only in the block axis; raising it here alone would put one field out of
/// line with the row above it, which is a worse defect than the one it fixes.
///
/// **The empty list is a state, not a blank sheet.** The web carries
/// `asyncState` with `emptyText` / loading / error rows; mobile carries the
/// one case a static `options` list can actually be in, and `emptyLabel` is
/// REQUIRED (asserted) as soon as `options` is empty — an empty sheet that
/// says nothing is a dead end a reader cannot tell from a broken screen.
/// Loading and error are not ported: `options` is a plain `List`, so there is
/// no fetch here to be in either state.
class LumoSelect extends StatelessWidget {
  const LumoSelect({super.key, required this.label, required this.placeholder, required this.closeLabel, required this.options, this.value, this.onChanged, this.description, this.errorMessage, this.emptyLabel, this.isDisabled = false});
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// Placeholder text shown while the field is empty. Never a substitute for the label.
  final String placeholder;
  /// Announced name of the close affordance. An icon is not a name.
  final String closeLabel;
  /// The options to choose from, in reading order.
  final List<LumoSelectOption> options;
  /// The current value. Supply it with `onChanged` for a controlled widget; omit both and the widget owns its own.
  final String? value;
  /// Called with the new value when the user changes it. Omitting it makes the control read-only.
  final ValueChanged<String>? onChanged;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// An error message for the field. Announced as the control's hint and marks it invalid.
  final String? errorMessage;

  /// What the sheet says when `options` is empty. REQUIRED then (asserted).
  final String? emptyLabel;
  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    // Not in the constructor: `List.length` is not a constant expression, and
    // `const LumoSelect(...)` is a shape consumers already write.
    assert(options.isNotEmpty || emptyLabel != null, 'A select with no options needs an emptyLabel — a blank sheet is not an answer.');
    final c = LumoScope.of(context).colours;
    final selected = options.where((o) => o.id == value).firstOrNull;
    final invalid = errorMessage != null;
    return Opacity(
      opacity: isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Excluded: the name lives on the trigger node, so it is announced
          // ONCE. Undrawn, this node merged into the trigger's own and the
          // reader heard «شهر، شهر، تهران» — the sibling `multi_select.dart`
          // says the same sentence over the same widget.
          ExcludeSemantics(child: Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg))),
          const SizedBox(height: 6),
          Semantics(
            label: label,
            value: selected?.label ?? placeholder,
            hint: description,
            button: true,
            enabled: !isDisabled,
            // The INVALID state, which the trigger did not carry at all: the
            // web marks it `data-invalid` and the reader is told, not shown a
            // red line it cannot see. `multi_select.dart` already does this.
            validationResult: invalid ? SemanticsValidationResult.invalid : SemanticsValidationResult.none,
            child: InkWell(
              onTap: isDisabled ? null : () => _open(context),
              borderRadius: BorderRadius.circular(LumoRadius.md),
              child: Container(
                height: LumoControl.md,
                padding: const EdgeInsetsDirectional.symmetric(horizontal: 12),
                decoration: BoxDecoration(color: c.surface, border: Border.all(color: invalid ? c.critical : c.borderControl), borderRadius: BorderRadius.circular(LumoRadius.md)),
                child: Row(
                  children: [
                    // The chosen option is the node's VALUE; the drawn copy is
                    // excluded, or it merges into the LABEL and the reader
                    // hears the choice twice — once as part of the name, once
                    // as the value.
                    Expanded(child: ExcludeSemantics(child: Text(selected?.label ?? placeholder, style: TextStyle(fontSize: 14, color: selected == null ? c.fgSubtle : c.fg)))),
                    ExcludeSemantics(child: Icon(Icons.expand_more, size: 18, color: c.fgMuted)),
                  ],
                ),
              ),
            ),
          ),
          // The description is the trigger's `hint`; the drawn copy is excluded so it is heard once.
          if (description != null) Padding(padding: const EdgeInsets.only(top: 6), child: ExcludeSemantics(child: Text(description!, style: TextStyle(fontSize: 12, color: c.fgMuted)))),
          // The error stays a LIVE REGION and keeps its text: a live region is
          // for the moment it APPEARS, which a hint on the field never covers.
          // It is deliberately NOT also folded into the hint — that would say
          // it twice.
          if (invalid) Padding(padding: const EdgeInsets.only(top: 6), child: Semantics(liveRegion: true, child: Text(errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)))),
        ],
      ),
    );
  }

  Future<void> _open(BuildContext context) async {
    final c = LumoScope.of(context).colours;
    // Lumo's own sheet, never Material's: `showModalBottomSheet` names its route
    // «Dialog» and its barrier «Dismiss» from `MaterialLocalizations` on
    // Android — English strings no parameter of ours reaches, which is the
    // exact defect this library exists to prevent. `showLumoSheet` re-provides
    // the scope and names the barrier from `closeLabel`.
    final chosen = await showLumoSheet<String>(
      context,
      label: label,
      closeLabel: closeLabel,
      body: (ctx) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (options.isEmpty)
            // `role="status" aria-live="polite"` on the web's empty row: the
            // reader is told the list is empty rather than left in silence.
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Semantics(
                liveRegion: true,
                child: Text(emptyLabel!, style: TextStyle(fontSize: 14, color: c.fgMuted)),
              ),
            ),
          for (final o in options)
            Semantics(
              selected: o.id == value,
              button: true,
              enabled: !o.isDisabled,
              label: o.label,
              // The TAP lives on this node. `ExcludeSemantics` below drops the
              // drawn copy of the name — and it dropped the `ListTile`'s tap
              // ACTION with it, so the row announced itself a button that a
              // reader or a switch could not activate. The house spelling is
              // `item.dart`'s: the action on the named node, the detector
              // beneath it silent.
              onTap: o.isDisabled ? null : () => Navigator.of(ctx).pop(o.id),
              child: ExcludeSemantics(
                child: ListTile(
                  enabled: !o.isDisabled,
                  minTileHeight: LumoControl.lg,
                  contentPadding: EdgeInsets.zero,
                  title: Text(o.label, style: TextStyle(fontSize: 16, color: c.fg, fontWeight: o.id == value ? FontWeight.w600 : FontWeight.w400)),
                  trailing: o.id == value ? Icon(Icons.check, color: c.accent) : null,
                  onTap: () => Navigator.of(ctx).pop(o.id),
                ),
              ),
            ),
        ],
      ),
    );
    if (chosen != null) onChanged?.call(chosen);
  }
}
