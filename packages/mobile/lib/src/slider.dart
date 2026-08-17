import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsValidationResult;
import 'scope.dart';
import 'tokens.g.dart';

/// Formats a slider value for the eye AND the reader — the app's `formatNumber`
/// (or a phrase built on it), so the shown value and `aria-valuetext`'s Flutter
/// counterpart (`Semantics.value`) come from ONE function and cannot drift.
typedef LumoValueLabel = String Function(double value);

/// A single value chosen from a range — the counterpart of the web `Slider`, on
/// Material's `Slider` wearing the tokens. `label` REQUIRED (an unnamed slider
/// announces bare "slider"), `valueLabel` REQUIRED (a raw double is never
/// rendered or announced — the app formats it, once, for both). `step` (web) is
/// translated onto Material's `divisions`. The track fills from the reading
/// START: Material lays the slider out under `Directionality`, so under `fa-*`
/// the minimum sits at the RIGHT and the fill grows leftwards — no flag.
/// Semantics: ONE node (`MergeSemantics`) named by `label`, `isSlider`, value /
/// increasedValue / decreasedValue through `valueLabel`, increase/decrease
/// actions; the header row is excluded so the name is announced once.
///
/// The web `Slider` has NO `isInvalid` and gives an invalid slider no visual
/// state at all (`slider.tsx`: the engine forwards `aria-describedby` to its
/// range input but not `aria-invalid`) — that is carried here, with the one
/// thing Flutter can do that the DOM could not: the node itself takes
/// `SemanticsValidationResult.invalid`, so the state is a state and not only a
/// sentence. `description` and `errorMessage` are painted under the track and
/// EXCLUDED there, because both are already this node's hint.
class LumoSlider extends StatelessWidget {
  const LumoSlider({
    super.key,
    required this.label,
    required this.value,
    required this.valueLabel,
    this.min = 0,
    this.max = 1,
    this.step,
    this.onChanged,
    this.onChangeEnd,
    this.description,
    this.errorMessage,
    this.hideValue = false,
    this.isDisabled = false,
  }) : assert(min < max, 'min must be below max.'),
       assert(step == null || step > 0, 'step must be positive.');

  /// Announced (and, unless `hideValue`, displayed) name. REQUIRED.
  final String label;
  /// The current value. Supply it with `onChanged` for a controlled widget; omit both and the widget owns its own.
  final double value;

  /// The value as the reader/eye gets it, e.g. `(v) => formatNumber(v.round(), locale)`. REQUIRED.
  final LumoValueLabel valueLabel;
  /// The lowest value the control accepts.
  final double min;
  /// The highest value the control accepts.
  final double max;

  /// The amount one tick moves; null = continuous. Web `step`, Material `divisions`.
  final double? step;
  /// Called with the new value when the user changes it. Omitting it makes the control read-only.
  final ValueChanged<double>? onChanged;

  /// Fires when the drag ends (web `onChangeEnd`).
  final ValueChanged<double>? onChangeEnd;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// An error message for the field. Announced as the control's hint and marks it invalid.
  final String? errorMessage;

  /// Hide the label/value row and keep only the track. The name stays on the node.
  final bool hideValue;
  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Opacity(
      opacity: isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!hideValue)
            _Header(
              children: [
                // BOTH sides flex. `Expanded` on the label alone was not enough:
                // a flex child is laid out with what the NON-flex children leave,
                // so an unconstrained value simply pushed past the edge — the
                // range slider overflowed by 85px at 328dp with Persian money
                // labels, and nothing caught it because the label looked handled.
                Flexible(
                  child: Text(
                    label,
                    style: TextStyle(fontSize: 14, color: c.fg),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    valueLabel(value),
                    style: TextStyle(fontSize: 14, color: c.fgMuted),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.end,
                  ),
                ),
              ],
            ),
          // `MergeSemantics`: the name and Material's slider node (value, actions) become ONE node.
          MergeSemantics(
            child: Semantics(
              label: label,
              hint: _hint(description, errorMessage),
              // Material's node carries role and value only while interactive; disabled, this keeps them.
              slider: true,
              enabled: !isDisabled,
              validationResult: errorMessage == null ? SemanticsValidationResult.none : SemanticsValidationResult.invalid,
              value: isDisabled ? valueLabel(value) : null,
              child: SliderTheme(
                data: _sliderTheme(c, isDisabled),
                child: Slider(
                  value: value.clamp(min, max),
                  min: min,
                  max: max,
                  divisions: _divisions(step, min, max),
                  onChanged: isDisabled ? null : onChanged,
                  onChangeEnd: isDisabled ? null : onChangeEnd,
                  // The reader's value — never Material's raw «40%».
                  semanticFormatterCallback: valueLabel,
                ),
              ),
            ),
          ),
          _Notes(description: description, errorMessage: errorMessage),
        ],
      ),
    );
  }
}

/// Two values from a range — Material's `RangeSlider` under the same contract.
/// The web has no range slider yet (`formatRange` is not in core), so this is
/// Lumo Mobile's own; its two thumbs are named by the REQUIRED `startLabel` /
/// `endLabel` — Material's `RangeSlider` builds two UNNAMED slider nodes with no
/// way in, so its semantics are excluded and two named `Semantics` nodes are
/// laid over the halves (start half at the reading start: a `Row` under
/// `Directionality`, exactly where Material puts its own), each with `isSlider`,
/// value through `valueLabel`, and increase/decrease actions of one `step`
/// (or a twentieth of the range, Material's own unit, when continuous).
class LumoRangeSlider extends StatelessWidget {
  const LumoRangeSlider({
    super.key,
    required this.label,
    required this.startLabel,
    required this.endLabel,
    required this.values,
    required this.valueLabel,
    this.min = 0,
    this.max = 1,
    this.step,
    this.onChanged,
    this.onChangeEnd,
    this.description,
    this.errorMessage,
    this.hideValue = false,
    this.isDisabled = false,
  }) : assert(min < max, 'min must be below max.'),
       assert(step == null || step > 0, 'step must be positive.');

  /// Displayed name of the whole control. REQUIRED.
  final String label;

  /// Announced name of the start thumb, e.g. «کمینهٔ بودجه». REQUIRED.
  final String startLabel;

  /// Announced name of the end thumb. REQUIRED.
  final String endLabel;
  /// The current range.
  final RangeValues values;
  /// Turns a value into the string the reader hears and sees. Must format its digits.
  final LumoValueLabel valueLabel;
  /// The lowest value the control accepts.
  final double min;
  /// The highest value the control accepts.
  final double max;
  /// The increment the control moves by.
  final double? step;
  /// Called with the new value when the user changes it. Omitting it makes the control read-only.
  final ValueChanged<RangeValues>? onChanged;
  /// Called once when the drag ends, rather than on every frame.
  final ValueChanged<RangeValues>? onChangeEnd;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// An error message for the field. Announced as the control's hint and marks it invalid.
  final String? errorMessage;
  /// Whether the value is painted beside the label. It is announced either way.
  final bool hideValue;
  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final start = values.start.clamp(min, max);
    final end = values.end.clamp(start, max);
    final unit = step ?? (max - min) / 20;
    final hint = _hint(description, errorMessage);
    Widget thumbSemantics(String name, double own, double other, bool isStart) {
      final up = math.min(own + unit, isStart ? other : max);
      final down = math.max(own - unit, isStart ? min : other);
      return Semantics(
        slider: true,
        label: name,
        hint: hint,
        enabled: !isDisabled,
        validationResult: errorMessage == null ? SemanticsValidationResult.none : SemanticsValidationResult.invalid,
        value: valueLabel(own),
        increasedValue: valueLabel(up),
        decreasedValue: valueLabel(down),
        onIncrease: isDisabled || onChanged == null ? null : () => onChanged!(isStart ? RangeValues(up, end) : RangeValues(start, up)),
        onDecrease: isDisabled || onChanged == null ? null : () => onChanged!(isStart ? RangeValues(down, end) : RangeValues(start, down)),
        child: const SizedBox.expand(),
      );
    }

    return Opacity(
      opacity: isDisabled ? 0.5 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!hideValue)
            _Header(
              children: [
                // See the single slider above: both sides flex, or the value
                // pushes past the edge.
                Flexible(
                  child: Text(
                    label,
                    style: TextStyle(fontSize: 14, color: c.fg),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                // ONE text, three spans: the pair ellipsises as a unit, which
                // three sibling Texts cannot do. Start value first in reading
                // order; the dash is punctuation, not language.
                Flexible(
                  child: Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(text: valueLabel(start), style: TextStyle(fontSize: 14, color: c.fgMuted)),
                        TextSpan(text: ' – ', style: TextStyle(fontSize: 14, color: c.fgSubtle)),
                        TextSpan(text: valueLabel(end), style: TextStyle(fontSize: 14, color: c.fgMuted)),
                      ],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.end,
                  ),
                ),
              ],
            ),
          Stack(
            children: [
              ExcludeSemantics(
                child: SliderTheme(
                  data: _sliderTheme(c, isDisabled),
                  child: RangeSlider(
                    values: RangeValues(start, end),
                    min: min,
                    max: max,
                    divisions: _divisions(step, min, max),
                    onChanged: isDisabled ? null : onChanged,
                    onChangeEnd: isDisabled ? null : onChangeEnd,
                  ),
                ),
              ),
              // The named thumbs — over the halves. Nothing here hit-tests itself, so touch
              // falls through to the slider (no `IgnorePointer`: it would also block the actions).
              Positioned.fill(
                child: Row(
                  children: [
                    Expanded(child: thumbSemantics(startLabel, start, end, true)),
                    Expanded(child: thumbSemantics(endLabel, end, start, false)),
                  ],
                ),
              ),
            ],
          ),
          _Notes(description: description, errorMessage: errorMessage),
        ],
      ),
    );
  }
}

String? _hint(String? description, String? errorMessage) {
  final parts = [?description, ?errorMessage];
  return parts.isEmpty ? null : parts.join('. ');
}

int? _divisions(double? step, double min, double max) => step == null ? null : math.max(1, ((max - min) / step).round());

/// The tokens on Material's slider parts. Thumb: surface disc with an accent
/// ring, as the web's `sliderThumbVariants`; the value indicator is off — the
/// value is in the header row, formatted by the app.
SliderThemeData _sliderTheme(LumoSchemeColours c, bool disabled) => SliderThemeData(
  trackHeight: 6,
  activeTrackColor: c.accent,
  inactiveTrackColor: c.surfaceSunken,
  disabledActiveTrackColor: c.accent,
  disabledInactiveTrackColor: c.surfaceSunken,
  thumbShape: _LumoThumb(fill: disabled ? c.surfaceSunken : c.surface, ring: disabled ? c.borderControl : c.accent),
  rangeThumbShape: _LumoRangeThumb(fill: disabled ? c.surfaceSunken : c.surface, ring: disabled ? c.borderControl : c.accent),
  overlayColor: c.focus.withValues(alpha: 0.24),
  overlayShape: const RoundSliderOverlayShape(overlayRadius: 20),
  showValueIndicator: ShowValueIndicator.never,
  tickMarkShape: SliderTickMarkShape.noTickMark,
  rangeTickMarkShape: const RoundRangeSliderTickMarkShape(tickMarkRadius: 0),
  trackShape: const RoundedRectSliderTrackShape(),
  rangeTrackShape: const RoundedRectRangeSliderTrackShape(),
);

void _paintThumb(Canvas canvas, Offset center, Color fill, Color ring) {
  canvas.drawCircle(center, 10, Paint()..color = fill);
  canvas.drawCircle(
    center,
    9,
    Paint()
      ..color = ring
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2,
  );
}

class _LumoThumb extends SliderComponentShape {
  const _LumoThumb({required this.fill, required this.ring});
  final Color fill;
  final Color ring;
  @override
  Size getPreferredSize(bool isEnabled, bool isDiscrete) => const Size(20, 20);
  @override
  void paint(
    PaintingContext context,
    Offset center, {
    required Animation<double> activationAnimation,
    required Animation<double> enableAnimation,
    required bool isDiscrete,
    required TextPainter labelPainter,
    required RenderBox parentBox,
    required SliderThemeData sliderTheme,
    required TextDirection textDirection,
    required double value,
    required double textScaleFactor,
    required Size sizeWithOverflow,
  }) => _paintThumb(context.canvas, center, fill, ring);
}

class _LumoRangeThumb extends RangeSliderThumbShape {
  const _LumoRangeThumb({required this.fill, required this.ring});
  final Color fill;
  final Color ring;
  @override
  Size getPreferredSize(bool isEnabled, bool isDiscrete) => const Size(20, 20);
  @override
  void paint(
    PaintingContext context,
    Offset center, {
    required Animation<double> activationAnimation,
    required Animation<double> enableAnimation,
    bool isDiscrete = false,
    bool isEnabled = false,
    bool? isOnTop,
    TextDirection? textDirection,
    required SliderThemeData sliderTheme,
    Thumb? thumb,
    bool? isPressed,
  }) => _paintThumb(context.canvas, center, fill, ring);
}

/// The label/value row above the track — decoration for the reader (the name
/// and value live on the slider node), hence excluded.
class _Header extends StatelessWidget {
  const _Header({required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: children),
    ),
  );
}

class _Notes extends StatelessWidget {
  const _Notes({required this.description, required this.errorMessage});
  final String? description;
  final String? errorMessage;
  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Both are the slider node's HINT already: painted here, excluded there,
        // so each is heard exactly once (measured: each was heard TWICE).
        if (description != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: ExcludeSemantics(
              child: Text(description!, style: TextStyle(fontSize: 12, color: c.fgMuted)),
            ),
          ),
        if (errorMessage != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: // ExcludeSemantics, and deliberately NOT `Semantics(liveRegion: true, …)`: the message is already announced as part of the field's semantic `hint` just above, so a second node carrying the same words would say it twice. A `liveRegion` wrapped round an EXCLUDED subtree — which is what stood here — announces nothing at all: it reads as an accessibility feature and is a no-op. See test/house_rules_test.dart.
            ExcludeSemantics(
              child: Text(errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)),
            ),
          ),
      ],
    );
  }
}
