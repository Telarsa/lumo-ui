import 'package:flutter/material.dart';
import 'scope.dart';
import 'sheet.dart';
import 'tokens.g.dart';

class LumoSelectOption {
  const LumoSelectOption({required this.id, required this.label, this.isDisabled = false});
  final String id;
  final String label;
  final bool isDisabled;
}

/// A single choice from a short list — Lumo's own, as on React Native (a trigger
/// named by the REQUIRED `label`, showing the REQUIRED `placeholder` or the chosen
/// option; a bottom sheet of options; REQUIRED `closeLabel`). Material's own
/// `DropdownMenu` was not used: its menu is a desktop-shaped popup and its
/// announced strings default to English.
class LumoSelect extends StatelessWidget {
  const LumoSelect({super.key, required this.label, required this.placeholder, required this.closeLabel, required this.options, this.value, this.onChanged, this.description, this.errorMessage, this.isDisabled = false});
  final String label;
  final String placeholder;
  final String closeLabel;
  final List<LumoSelectOption> options;
  final String? value;
  final ValueChanged<String>? onChanged;
  final String? description;
  final String? errorMessage;
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final selected = options.where((o) => o.id == value).firstOrNull;
    final invalid = errorMessage != null;
    return Opacity(
      opacity: isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg)),
          const SizedBox(height: 6),
          Semantics(
            label: label,
            value: selected?.label ?? placeholder,
            hint: description,
            button: true,
            enabled: !isDisabled,
            child: InkWell(
              onTap: isDisabled ? null : () => _open(context),
              borderRadius: BorderRadius.circular(LumoRadius.md),
              child: Container(
                height: LumoControl.md,
                padding: const EdgeInsetsDirectional.symmetric(horizontal: 12),
                decoration: BoxDecoration(color: c.surface, border: Border.all(color: invalid ? c.critical : c.borderControl), borderRadius: BorderRadius.circular(LumoRadius.md)),
                child: Row(
                  children: [
                    Expanded(child: Text(selected?.label ?? placeholder, style: TextStyle(fontSize: 14, color: selected == null ? c.fgSubtle : c.fg))),
                    ExcludeSemantics(child: Icon(Icons.expand_more, size: 18, color: c.fgMuted)),
                  ],
                ),
              ),
            ),
          ),
          if (description != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(description!, style: TextStyle(fontSize: 12, color: c.fgMuted))),
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
          for (final o in options)
            Semantics(
              selected: o.id == value,
              button: true,
              enabled: !o.isDisabled,
              label: o.label,
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
