import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// A switch, direction-sensitive: named by its visible `label` or by an
/// explicit `accessibilityLabel` — the constructor asserts one is present
/// (Dart has no union types; the assertion is the compile-adjacent guard).
/// ON at the reading END, which `Directionality` mirrors — the thumb travels
/// along the inline axis, and stands still under `disableAnimations`.
///
/// Track geometry is the web's BORDER box — `switchTrackVariants`' `h-4.5 w-8`
/// (32×18) and `h-6 w-11` (44×24), thumb `size-3.5`/`size-5` (14/20). The first
/// pass drew 30×16 / 42×22, which is the web's PADDING box: a `BoxDecoration`
/// border in Flutter paints INSIDE the box and does not inset the child, so
/// subtracting it a second time shipped a switch 2 logical px short on both
/// axes in both sizes. The 2px thumb inset is the web's 1px border + 1px inset,
/// which puts the ON thumb at `trackW − 2 − thumb`, the web's `start-3.75` /
/// `start-5.25` measured from the border box.
class LumoSwitch extends StatelessWidget {
  const LumoSwitch({super.key, this.label, this.accessibilityLabel, this.description, this.isSelected = false, this.onChanged, this.isDisabled = false, this.size = LumoSwitchSize.md})
      : assert(label != null || accessibilityLabel != null, 'A switch needs a visible label or an accessibilityLabel — never neither.');
  /// The name this control is announced by, and painted where the family shows one.
  final String? label;
  /// The announced name, for when it must differ from the visible text.
  final String? accessibilityLabel;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// Whether this one is selected.
  final bool isSelected;
  /// Called with the new value when the user changes it. Omitting it makes the control read-only.
  final ValueChanged<bool>? onChanged;
  /// Whether the control is disabled.
  final bool isDisabled;
  /// The size step, from the shared control scale.
  final LumoSwitchSize size;

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final g = size == LumoSwitchSize.lg ? const (trackW: 44.0, trackH: 24.0, thumb: 20.0) : const (trackW: 32.0, trackH: 18.0, thumb: 14.0);
    // «Reduce motion» is the platform's answer, not a parameter of ours — the
    // same spelling as `disclosure.dart`: the thumb JUMPS to its end state.
    final motion = !MediaQuery.disableAnimationsOf(context);
    final track = SizedBox(
      width: g.trackW,
      height: g.trackH,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: isSelected ? c.accent : c.surfaceSunken,
          border: Border.all(color: isSelected ? c.accent : c.borderControl),
          borderRadius: BorderRadius.circular(LumoRadius.full),
        ),
        child: AnimatedAlign(
          duration: motion ? const Duration(milliseconds: 120) : Duration.zero,
          // Logical: start when off, end when on — mirrored by Directionality.
          alignment: isSelected ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
          child: Padding(
            // The web's 1px border + 1px inset, measured from the border box.
            padding: const EdgeInsets.all(2),
            // At rest the thumb is a RAISED SURFACE (`bg-surface`), not text:
            // `c.fg` is the foreground role and drew a near-black thumb on the
            // light theme, inverting to near-white on dark — a token used for
            // the wrong role, invisible in one scheme and wrong in the other.
            child: Container(width: g.thumb, height: g.thumb, decoration: BoxDecoration(shape: BoxShape.circle, color: isSelected ? c.accentFg : c.surface)),
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
            // A NAMELESS switch (only `accessibilityLabel`) has no label column
            // to widen the row, so in an unbounded parent it was the bare track:
            // measured 32×36 inside a `Row`. `minWidth` is the 44 px floor for
            // that case and is inert for a labelled switch, which already fills
            // its column.
            constraints: BoxConstraints(minWidth: LumoControl.lg, minHeight: size == LumoSwitchSize.lg ? LumoControl.lg : LumoControl.md),
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
