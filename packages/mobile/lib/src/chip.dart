import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

enum LumoChipSize { sm, md }

/// A chip — a filter, a keyword, a selected value — the web `Tag`: `label`
/// REQUIRED (a chip IS its text; the web's `children`), optionally selectable
/// (`isSelected` + `onChanged` — a toggle button announced with its selected
/// state; the web keeps selection for `ListBox`, mobile filter chips are the
/// idiom) and optionally removable: `onRemove` + `removeLabel` are ONE decision
/// — the constructor asserts `removeLabel` whenever `onRemove` is set (the web
/// makes it a discriminated union), because an ✕ has no name of its own and a
/// convention has already failed on this project. The ✕ sits at the inline END
/// (left in Persian) — `EdgeInsetsDirectional`, so the trimmed cap follows it.
class LumoChip extends StatelessWidget {
  const LumoChip({super.key, required this.label, this.icon, this.isSelected = false, this.onChanged, this.onRemove, this.removeLabel, this.size = LumoChipSize.md, this.isDisabled = false})
      : assert(onRemove == null || removeLabel != null, 'A removable chip needs a removeLabel — name the thing being removed, e.g. «حذف تهران».');
  final String label;
  /// A leading icon (drawn at the inline start; decorative).
  final Widget? icon;
  final bool isSelected;
  /// Makes the chip a toggle: called with the next selected state.
  final ValueChanged<bool>? onChanged;
  /// Called when the remove control is activated.
  final VoidCallback? onRemove;
  /// Announced name of the remove control. REQUIRED when `onRemove` is set.
  final String? removeLabel;
  final LumoChipSize size;
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final sm = size == LumoChipSize.sm;
    final removable = onRemove != null;
    final selectable = onChanged != null;
    final fg = isSelected ? c.accentFg : c.fg;
    final body = Container(
      height: sm ? 24 : 28,
      // `ps`/`pe`, not symmetric: the removable form trims the inline END for the ✕.
      padding: EdgeInsetsDirectional.only(start: sm ? 8 : 10, end: removable ? 4 : (sm ? 8 : 10)),
      decoration: BoxDecoration(
        color: isSelected ? c.accent : c.surfaceSunken,
        border: Border.all(color: isSelected ? c.accent : c.border),
        borderRadius: BorderRadius.circular(LumoRadius.md),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        spacing: sm ? 4 : 6,
        children: [
          if (icon != null) ExcludeSemantics(child: IconTheme(data: IconThemeData(size: sm ? 12 : 14, color: fg), child: icon!)),
          // Selectable: the outer button node carries the name, so the text is excluded (announced ONCE).
          Flexible(child: ExcludeSemantics(excluding: selectable, child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: sm ? 12 : 14, color: fg)))),
          if (removable)
            // `container`: its own node, so it never merges into a selectable chip's button node.
            Semantics(
              container: true,
              button: true,
              enabled: !isDisabled,
              label: removeLabel,
              child: Tooltip(
                message: removeLabel!,
                excludeFromSemantics: true,
                child: InkWell(
                  onTap: isDisabled ? null : onRemove,
                  borderRadius: BorderRadius.circular(LumoRadius.sm),
                  child: SizedBox(width: 20, height: 20, child: ExcludeSemantics(child: Icon(Icons.close, size: 12, color: isSelected ? c.accentFg : c.fgMuted))),
                ),
              ),
            ),
        ],
      ),
    );
    final chip = Opacity(opacity: isDisabled ? 0.5 : 1, child: body);
    if (!selectable) {
      // Static: the label is announced as text; only the ✕ (if any) is a control.
      return Semantics(container: true, explicitChildNodes: true, child: chip);
    }
    // No `explicitChildNodes`: the InkWell's tap and focus merge INTO this button node; the ✕ is a container of its own.
    return Semantics(
      container: true,
      button: true,
      selected: isSelected,
      enabled: !isDisabled,
      label: label,
      child: InkWell(
        onTap: isDisabled ? null : () => onChanged!(!isSelected),
        borderRadius: BorderRadius.circular(LumoRadius.md),
        child: chip,
      ),
    );
  }
}

/// One tag of a `LumoTagGroup`: `id` handed back to `onRemove`, `textValue`
/// REQUIRED (the plain text — nothing derives it, so it cannot be empty by
/// accident; also the argument handed to `removeLabel`).
class LumoTagItem {
  const LumoTagItem({required this.id, required this.textValue, this.icon});
  final String id;
  final String textValue;
  final Widget? icon;
}

/// A group of tags — the web `TagGroup`: `label` REQUIRED (names the
/// collection). Removable when told how — `onRemove` and `removeLabel` are one
/// decision (asserted, as the web's union), `removeLabel` a FUNCTION of the
/// tag's own text because Persian word order is not English with the words
/// swapped: `(tag) => 'حذف $tag'`. Static: a plain named list; the reader gets
/// the label once and each tag as text.
class LumoTagGroup extends StatelessWidget {
  const LumoTagGroup({super.key, required this.label, required this.items, this.onRemove, this.removeLabel, this.size = LumoChipSize.md, this.isDisabled = false})
      : assert((onRemove == null) == (removeLabel == null), 'onRemove and removeLabel are one decision: both or neither.');
  final String label;
  final List<LumoTagItem> items;
  /// Called with the id of the tag to drop.
  final ValueChanged<String>? onRemove;
  /// Builds the announced name of each tag's remove control from that tag's `textValue`.
  final String Function(String textValue)? removeLabel;
  final LumoChipSize size;
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: label,
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final t in items)
            LumoChip(
              label: t.textValue,
              icon: t.icon,
              size: size,
              isDisabled: isDisabled,
              onRemove: onRemove == null ? null : () => onRemove!(t.id),
              removeLabel: removeLabel?.call(t.textValue),
            ),
        ],
      ),
    );
  }
}
