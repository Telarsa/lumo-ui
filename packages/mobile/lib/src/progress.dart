import 'package:flutter/material.dart';
import 'scope.dart';

enum LumoProgressSize { sm, md, lg }
/// Colour of the fill. Colour must not be the only carrier (WCAG 1.4.1): pair `critical` with text.
enum LumoProgressTone { accent, positive, caution, critical }

const _track = {LumoProgressSize.sm: 4.0, LumoProgressSize.md: 8.0, LumoProgressSize.lg: 12.0};

/// An operation in flight — the web `ProgressBar`. `label` REQUIRED (what is
/// progressing, in the reader's language); `value` is the FRACTION 0..1, or
/// `null` for indeterminate (a full-width pulse — a sliding bar would run
/// backwards under RTL); `valueLabel` is the pre-formatted value the app built
/// with `formatNumber` («۴۵٪») — the SAME string is shown (with `showValue`) and
/// announced as the semantics value, so seen and announced cannot drift. The
/// fill grows from the inline START (`AlignmentDirectional.centerStart`).
///
/// No `SemanticsRole.progressBar`: Flutter 3.35 declares the role but its
/// debug validator is unimplemented and throws; the label + value node is what
/// TalkBack/VoiceOver read either way.
///
/// BOTH animations obey `MediaQuery.disableAnimationsOf`: the indeterminate
/// pulse is stopped and parked opaque, and the determinate fill's 160ms growth
/// (the web's `transition-[inline-size]`) collapses to `Duration.zero`, so the
/// bar jumps to the new value instead of sweeping across the screen.
class LumoProgress extends StatefulWidget {
  const LumoProgress({super.key, required this.label, this.value = 0, this.valueLabel, this.showValue = false, this.size = LumoProgressSize.md, this.tone = LumoProgressTone.accent})
      : assert(value == null || (value >= 0 && value <= 1), 'value is a fraction 0..1, or null for indeterminate.');
  final String label;
  /// 0..1, or `null` = indeterminate.
  final double? value;
  /// The value as the app formatted it, e.g. «۴۵٪». Announced; shown with `showValue`.
  final String? valueLabel;
  /// Render the label and the value above the track.
  final bool showValue;
  final LumoProgressSize size;
  final LumoProgressTone tone;

  @override
  State<LumoProgress> createState() => _LumoProgressState();
}

class _LumoProgressState extends State<LumoProgress> with SingleTickerProviderStateMixin {
  late final _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000));

  @override
  void didUpdateWidget(LumoProgress old) {
    super.didUpdateWidget(old);
    _sync();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _sync();
  }

  void _sync() {
    final animate = widget.value == null && !MediaQuery.disableAnimationsOf(context);
    if (animate && !_pulse.isAnimating) _pulse.repeat(reverse: true);
    if (!animate && _pulse.isAnimating) {
      _pulse.stop();
      _pulse.value = 0;
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final fill = switch (widget.tone) {
      LumoProgressTone.accent => c.accent,
      LumoProgressTone.positive => c.positive,
      LumoProgressTone.caution => c.caution,
      LumoProgressTone.critical => c.critical,
    };
    final h = _track[widget.size]!;
    // «Reduce motion» is the platform's answer, not a parameter of ours — the
    // same spelling `disclosure.dart` and `card.dart` use.
    final motion = !MediaQuery.disableAnimationsOf(context);
    return Semantics(
      container: true,
      label: widget.label,
      value: widget.valueLabel,
      // The visible label/value are the same strings the node carries: excluded so each is heard ONCE.
      child: ExcludeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.showValue)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                // `spaceBetween` swaps under RTL with no override.
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Expanded(child: Text(widget.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, color: c.fg))),
                    if (widget.valueLabel != null && widget.value != null) Padding(padding: const EdgeInsetsDirectional.only(start: 8), child: Text(widget.valueLabel!, style: TextStyle(fontSize: 14, color: c.fgMuted))),
                  ],
                ),
              ),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: SizedBox(
                height: h,
                child: ColoredBox(
                  color: c.surfaceSunken,
                  child: widget.value == null
                      ? FadeTransition(opacity: Tween<double>(begin: 1, end: 0.35).animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut)), child: ColoredBox(color: fill))
                      : Align(
                          alignment: AlignmentDirectional.centerStart,
                          child: AnimatedFractionallySizedBox(
                            duration: motion ? const Duration(milliseconds: 160) : Duration.zero,
                            widthFactor: widget.value!.clamp(0, 1),
                            heightFactor: 1,
                            child: DecoratedBox(decoration: BoxDecoration(color: fill, borderRadius: BorderRadius.circular(999))),
                          ),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

enum LumoSpinnerSize { sm, md, lg }
/// `color`, not `tone`: `tone` is the library's STATUS RAMP, and a spinner has no status.
enum LumoSpinnerColor { current, accent, muted }

const _spinner = {LumoSpinnerSize.sm: 16.0, LumoSpinnerSize.md: 20.0, LumoSpinnerSize.lg: 32.0};

/// A busy indicator that says so out loud — the web `Spinner`. `label` REQUIRED
/// (what is being waited for, e.g. «در حال بارگذاری…»), announced as a LIVE
/// region on appearance (the web's `role="status"`); shown beside the ring
/// with `showLabel`. On Material's `CircularProgressIndicator`, sized to the
/// spinner scale, its own semantics excluded so the name is heard ONCE.
///
/// **Reduce motion.** Under `MediaQuery.disableAnimationsOf` the ROTATION
/// stops and the ring pulses in place instead — the web's
/// `motion-reduce:animate-pulse`, and its reason, verbatim: "a static ring
/// reads as a bug". This is the one place the library does not simply go
/// still (`skeleton.dart` does, because a frozen placeholder block still says
/// "pending" — a frozen spinner says "hung"). The parked ring is the same 3/4
/// arc the spin draws (`value: 0.75` = the web's `border-bs-transparent` gap),
/// so the drawing is unchanged; only the movement is. Opacity has no axis and
/// no direction, which is why it is the fallback and a sweep is not.
class LumoSpinner extends StatefulWidget {
  const LumoSpinner({super.key, required this.label, this.showLabel = false, this.size = LumoSpinnerSize.md, this.color = LumoSpinnerColor.current});
  final String label;
  final bool showLabel;
  final LumoSpinnerSize size;
  final LumoSpinnerColor color;

  @override
  State<LumoSpinner> createState() => _LumoSpinnerState();
}

class _LumoSpinnerState extends State<LumoSpinner> with SingleTickerProviderStateMixin {
  late final _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000));
  late final _opacity = Tween<double>(begin: 1, end: 0.45).animate(CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reduced = MediaQuery.disableAnimationsOf(context);
    if (reduced && !_pulse.isAnimating) _pulse.repeat(reverse: true);
    if (!reduced && _pulse.isAnimating) {
      _pulse.stop();
      _pulse.value = 0;
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final ring = switch (widget.color) {
      LumoSpinnerColor.current => DefaultTextStyle.of(context).style.color ?? IconTheme.of(context).color ?? c.fg,
      LumoSpinnerColor.accent => c.accent,
      LumoSpinnerColor.muted => c.fgMuted,
    };
    final side = _spinner[widget.size]!;
    final reduced = MediaQuery.disableAnimationsOf(context);
    return Semantics(
      container: true,
      liveRegion: true,
      label: widget.label,
      child: ExcludeSemantics(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: side,
              height: side,
              child: reduced
                  // The same 3/4 arc, parked, pulsing rather than turning.
                  ? FadeTransition(opacity: _opacity, child: CircularProgressIndicator(value: 0.75, strokeWidth: 2, color: ring))
                  : CircularProgressIndicator(strokeWidth: 2, color: ring),
            ),
            if (widget.showLabel) Padding(padding: const EdgeInsetsDirectional.only(start: 8), child: Text(widget.label, style: TextStyle(fontSize: 14, color: c.fgMuted))),
          ],
        ),
      ),
    );
  }
}
