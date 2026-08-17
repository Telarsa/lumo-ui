import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show CustomSemanticsAction;
import 'scope.dart';

/// Pull a list down past its start to reload it.
///
/// **Why this is not `RefreshIndicator`.** The brief was: build on Material's
/// widget only if its semantics can be named in Lumo's language. What the
/// source says (`packages/flutter/lib/src/material/refresh_indicator.dart`,
/// Flutter 3.35):
///
///  - line 664: `semanticsLabel: widget.semanticsLabel ??
///    MaterialLocalizations.of(context).refreshIndicatorSemanticLabel` — so
///    there IS a public parameter and passing it does reach the label. On that
///    narrow question the answer is "yes, it can be named".
///  - line 618: `assert(debugCheckHasMaterialLocalizations(context))` — but the
///    widget still refuses to build without a Material locale table, for a
///    string it may never use.
///
/// Two things decided it anyway, and neither is the label:
///
///  1. **There is no way in.** The name lands on the `RefreshProgressIndicator`
///     while it is on screen. Nothing names the refreshable region, and nothing
///     offers a refresh ACTION — a pull is a gesture a screen-reader user
///     cannot make, so on Material's widget that reader has no route to a
///     refresh at all. Here [refreshLabel] is a `CustomSemanticsAction` on the
///     region, which is the whole reason the string is required.
///  2. **The puck is Material's.** `RefreshProgressIndicator` is a white circle
///     with an arrow, coloured from `ColorScheme`/`ProgressIndicatorTheme`,
///     with Material's own elevation. Lumo answers a pull the way the Khroos
///     app hand-rolled it: a glyph that rotates with the pull, a spinner while
///     it runs, both on the scope's colours.
///
/// **Why overscroll, not touch deltas.** The gesture is read from
/// `ScrollNotification`s, exactly as `provider_screens.dart` reads them: a
/// `GestureDetector` wrapped around a list competes with the list in the
/// gesture arena and steals drags that were meant to scroll. Overscroll is the
/// list's own report that it is already at its start and the finger is still
/// pulling, which is precisely when a pull means "refresh". Both physics are
/// handled: iOS's `BouncingScrollPhysics` reports a negative `pixels` on a
/// `ScrollUpdateNotification`, Android's clamping physics reports an
/// `OverscrollNotification` and never moves `pixels` at all.
///
/// **Why the child's physics are replaced.** A list shorter than its viewport
/// does not scroll, so it never overscrolls, so it can never be pulled — the
/// same trap `RefreshIndicator` documents and leaves to the caller.
/// `AlwaysScrollableScrollPhysics` is imposed through a `ScrollConfiguration`
/// so a short list stays refreshable without the caller remembering. A child
/// that names its own `physics` still wins; that is the caller's choice.
class LumoPullToRefresh extends StatefulWidget {
  const LumoPullToRefresh({
    super.key,
    required this.refreshLabel,
    required this.onRefresh,
    required this.child,
    this.pullLabel,
    this.releaseLabel,
    this.triggerDistance = 64,
    this.maxDistance = 96,
  });

  /// Announced while a refresh runs, e.g. «در حال به‌روزرسانی…», AND the name of
  /// the semantic action that starts one. REQUIRED: it is the only route a
  /// screen-reader user has, since they cannot perform the pull.
  final String refreshLabel;

  /// Runs the refresh. The indicator stays up until the future completes.
  final Future<void> Function() onRefresh;

  /// The scrollable. Anything that reports `ScrollNotification`s.
  final Widget child;

  /// Drawn while the finger is pulling but has not yet gone far enough, e.g.
  /// «برای تازه‌کردن بکشید». Optional — with no string the glyph pulls alone.
  final String? pullLabel;

  /// Drawn once the pull has passed [triggerDistance], e.g. «رها کنید تا تازه شود».
  final String? releaseLabel;

  /// How far the list must be pulled before releasing refreshes.
  final double triggerDistance;

  /// The furthest the indicator travels, however hard the pull.
  final double maxDistance;

  @override
  State<LumoPullToRefresh> createState() => _LumoPullToRefreshState();
}

class _LumoPullToRefreshState extends State<LumoPullToRefresh> with SingleTickerProviderStateMixin {
  /// How far past the start the list is being held, in logical pixels.
  double _pull = 0;
  bool _refreshing = false;
  // Built in `initState`, not `late final`: a lazily-created controller is
  // first touched inside `dispose()`, where `vsync: this` looks an inherited
  // `TickerMode` up through an element that has already been deactivated.
  late final AnimationController _spin;

  @override
  void initState() {
    super.initState();
    _spin = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
  }

  @override
  void dispose() {
    _spin.dispose();
    super.dispose();
  }

  void _setPull(double next) {
    final clamped = next.clamp(0.0, widget.maxDistance);
    if ((clamped - _pull).abs() < 0.5) return;
    setState(() => _pull = clamped);
  }

  bool _onNotification(ScrollNotification n) {
    // Only the list's own axis, and only its leading edge: a horizontal chip
    // row nested in the same subtree must not drive a vertical pull.
    if (n.metrics.axis != Axis.vertical) return false;
    if (_refreshing) return false;

    if (n is OverscrollNotification) {
      // Clamping physics: `pixels` never leaves the range, the overshoot is
      // reported instead. Negative = past the start.
      if (n.dragDetails != null && n.overscroll < 0) _setPull(_pull - n.overscroll);
      return false;
    }
    if (n is ScrollUpdateNotification) {
      final pixels = n.metrics.pixels;
      if (pixels > 0) {
        // Scrolled back into the corpus: whatever was pulled is abandoned.
        if (_pull > 0) _setPull(0);
        return false;
      }
      if (n.dragDetails != null) {
        // Bouncing physics: the overshoot IS the position.
        _setPull(math.max(_pull, -pixels));
      } else if (_pull > 0) {
        // The finger has lifted and the list is springing back.
        _release();
      }
      return false;
    }
    if (n is ScrollEndNotification && _pull > 0) _release();
    return false;
  }

  void _release() {
    if (_pull >= widget.triggerDistance) {
      unawaited(_refresh());
    } else {
      _setPull(0);
    }
  }

  Future<void> _refresh() async {
    if (_refreshing) return;
    setState(() {
      _refreshing = true;
      _pull = widget.triggerDistance;
    });
    // `disableAnimationsOf` is the platform saying no to a spinning glyph; the
    // row still says what is happening in words.
    if (!MediaQuery.disableAnimationsOf(context)) _spin.repeat();
    try {
      await widget.onRefresh();
    } finally {
      _spin.stop();
      _spin.value = 0;
      if (mounted) {
        setState(() {
          _refreshing = false;
          _pull = 0;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final armed = _pull >= widget.triggerDistance;
    final hint = _refreshing ? widget.refreshLabel : (armed ? widget.releaseLabel : widget.pullLabel);

    return Semantics(
      container: true,
      explicitChildNodes: true,
      // The refresh as a NAMED action, so a reader who cannot pull can still
      // refresh. This is the whole argument against `RefreshIndicator`.
      customSemanticsActions: {CustomSemanticsAction(label: widget.refreshLabel): () => unawaited(_refresh())},
      child: NotificationListener<ScrollNotification>(
        onNotification: _onNotification,
        child: Stack(
          children: [
            Positioned.fill(
              child: ScrollConfiguration(
                behavior: const _AlwaysScrollable(),
                child: widget.child,
              ),
            ),
            if (_pull > 0 || _refreshing)
              PositionedDirectional(
                top: 0,
                start: 0,
                end: 0,
                // The drawn row is a VISUAL echo of state and is silent: while
                // a refresh runs the live-region node below says so, and if the
                // row spoke too the caller's `refreshLabel` would be heard
                // twice. `pullLabel`/`releaseLabel` are drag feedback for the
                // eye — announcing a string per sampled pixel is noise, which
                // is the same reason `sortable.tsx` stays silent on pointermove.
                child: ExcludeSemantics(
                  child: ClipRect(
                  child: Align(
                    alignment: Alignment.bottomCenter,
                    heightFactor: (_pull / widget.triggerDistance).clamp(0.0, 1.0),
                    child: ColoredBox(
                      color: c.bg,
                      child: SizedBox(
                        height: widget.triggerDistance,
                        width: double.infinity,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          spacing: 8,
                          children: [
                            RotationTransition(
                              // Before the refresh the glyph turns with the
                              // finger, so the pull has an answer at every
                              // pixel; during it, the controller drives.
                              turns: _refreshing ? _spin : AlwaysStoppedAnimation<double>(_pull / widget.maxDistance),
                              child: Icon(Icons.refresh, size: 18, color: c.accent),
                            ),
                            if (hint != null)
                              Flexible(
                                child: Text(
                                  hint,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c.accent),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  ),
                ),
              ),
            // The announcement, kept OUT of the drawn row above.
            if (_refreshing)
              Semantics(container: true, liveRegion: true, label: widget.refreshLabel, child: const SizedBox.shrink()),
          ],
        ),
      ),
    );
  }
}

/// The child's scroll behaviour with one change: a list shorter than its
/// viewport is still draggable, so it can still be pulled.
class _AlwaysScrollable extends ScrollBehavior {
  const _AlwaysScrollable();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) =>
      const AlwaysScrollableScrollPhysics().applyTo(super.getScrollPhysics(context));
}
