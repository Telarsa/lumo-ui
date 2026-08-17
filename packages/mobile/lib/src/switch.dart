import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// A switch, direction-sensitive: named by its visible `label` or by an
/// explicit `accessibilityLabel` — the constructor asserts one is present
/// (Dart has no union types; the assertion is the compile-adjacent guard).
/// Track/thumb geometry from the web (30×16 / 42×22); ON at the reading END,
/// which `Directionality` mirrors — the thumb travels along the inline axis.
class LumoSwitch extends StatelessWidget {
  const LumoSwitch({super.key, this.label, this.accessibilityLabel, this.description, this.isSelected = false, this.onChanged, this.isDisabled = false, this.size = LumoSwitchSize.md})
      : assert(label != null || accessibilityLabel != null, 'A switch needs a visible label or an accessibilityLabel — never neither.');
  final String? label;
  final String? accessibilityLabel;
  final String? description;
  final bool isSelected;
  final ValueChanged<bool>? onChanged;
  final bool isDisabled;
  final LumoSwitchSize size;

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final g = size == LumoSwitchSize.lg ? const (trackW: 42.0, trackH: 22.0, thumb: 20.0) : const (trackW: 30.0, trackH: 16.0, thumb: 14.0);
    final track = SizedBox(
      width: g.trackW,
      height: g.trackH,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: isSelected ? c.accent : c.surfaceSunken,
          border: Border.all(color: isSelected ? c.accent : c.borderControl),
          borderRadius: BorderRadius.circular(999),
        ),
        child: AnimatedAlign(
          duration: const Duration(milliseconds: 120),
          // Logical: start when off, end when on — mirrored by Directionality.
          alignment: isSelected ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
          child: Padding(
            padding: const EdgeInsets.all(1),
            child: Container(width: g.thumb, height: g.thumb, decoration: BoxDecoration(shape: BoxShape.circle, color: isSelected ? c.accentFg : c.fg)),
          ),
        ),
      ),
    );
    return Semantics(
      toggled: isSelected,
      enabled: !isDisabled,
      label: accessibilityLabel ?? label,
      hint: description,
      child: Opacity(
        opacity: isDisabled ? 0.5 : 1,
        child: InkWell(
          onTap: isDisabled ? null : () => onChanged?.call(!isSelected),
          borderRadius: BorderRadius.circular(LumoRadius.md),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: size == LumoSwitchSize.lg ? LumoControl.lg : LumoControl.md),
            child: Row(
              children: [
                if (label != null || description != null)
                  Expanded(
                    // The visible copy is EXCLUDED: the name and the hint are
                    // already on the Semantics node above. Without this the
                    // reader hears the label twice and the description twice
                    // («اعلان‌ها اعلان‌ها پیامک», hint «پیامک») — the same rule
                    // chip.dart and tabs.dart follow.
                    child: ExcludeSemantics(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (label != null) Text(label!, style: TextStyle(fontSize: size == LumoSwitchSize.lg ? 16 : 14, fontWeight: FontWeight.w500, color: c.fg)),
                          if (description != null) Text(description!, style: TextStyle(fontSize: 12, color: c.fgMuted)),
                        ],
                      ),
                    ),
                  ),
                if (label != null || description != null) const SizedBox(width: 12),
                ExcludeSemantics(child: track),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

enum LumoSwitchSize { md, lg }
