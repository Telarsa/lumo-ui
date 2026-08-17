import 'dart:async';

import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// A slide carousel — the web `Carousel` family (`CarouselContent`,
/// `CarouselItem`, `CarouselPrevious`, `CarouselNext`) as ONE widget on
/// Flutter's `PageView`. No engine is rented: embla exists on the web because
/// the DOM has no pager; Flutter ships one.
///
/// **The inline axis.** A horizontal `PageView` reads `Directionality` through
/// `getAxisDirectionFromAxisReverseAndDirectionality`, so under RTL its axis is
/// `AxisDirection.left`: page 0 is drawn at the RIGHT, page 1 to its LEFT, and
/// «next» moves the deck leftward — the same fix the web makes by deriving
/// embla's `direction` from the locale. That is why there is no `reverse:` here
/// and no direction flag: passing `reverse` would UNDO the mirroring, which is
/// exactly the bug this library exists to prevent. `carousel_test.dart` pins it
/// with real positions under fa-IR and en-US.
///
/// **Required names.** `label` names the region; `previousLabel`/`nextLabel`
/// name the chevrons (a chevron is not a name); `slideLabel(index, count)`
/// names every slide AND its dot — a function, because Persian word order is
/// not English with the words swapped, and because the caller owns the digits:
/// `(i, n) => 'اسلاید ${formatNumber(i + 1, locale)} از ${formatNumber(n, locale)}'`.
/// `index` is ZERO-based.
///
/// **Auto-play** is off by default and, when on, stops for good on the first
/// interaction (a drag, a chevron, a dot) and never starts at all under
/// `MediaQuery.disableAnimationsOf` — a slide that moves on its own is WCAG
/// 2.2.2, and "reduce motion" is the platform saying no.
class LumoCarousel extends StatefulWidget {
  const LumoCarousel({
    super.key,
    required this.label,
    required this.items,
    required this.previousLabel,
    required this.nextLabel,
    required this.slideLabel,
    this.autoPlay = false,
    this.interval = const Duration(seconds: 5),
    this.showDots = true,
    this.onIndexChanged,
    this.height = 200,
  });

  /// Announced name of the whole carousel, e.g. «پیشنهادهای ویژه». REQUIRED.
  final String label;

  /// The slides, in reading order: the FIRST is at the reading start.
  final List<Widget> items;

  /// Announced name of the «previous» chevron. REQUIRED.
  final String previousLabel;

  /// Announced name of the «next» chevron. REQUIRED.
  final String nextLabel;

  /// Names slide `index` of `count` — and its dot. REQUIRED; `index` is 0-based.
  final String Function(int index, int count) slideLabel;

  /// Advance on a timer. Off by default; ignored when animations are disabled.
  final bool autoPlay;

  /// Time on each slide while auto-playing.
  final Duration interval;

  /// Show the dot row under the deck.
  final bool showDots;

  /// Called with the 0-based index whenever the visible slide changes.
  final ValueChanged<int>? onIndexChanged;

  /// The deck's block-axis extent. Flutter's pager needs a bounded one; the web
  /// gets it from the slides' own content.
  final double height;

  @override
  State<LumoCarousel> createState() => _LumoCarouselState();
}

class _LumoCarouselState extends State<LumoCarousel> {
  final PageController _controller = PageController();
  int _index = 0;
  Timer? _timer;
  /// Latched: once the reader has taken control, the carousel never takes it back.
  bool _interacted = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncTimer();
  }

  @override
  void didUpdateWidget(LumoCarousel old) {
    super.didUpdateWidget(old);
    _syncTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _syncTimer() {
    final wanted = widget.autoPlay &&
        !_interacted &&
        widget.items.length > 1 &&
        !MediaQuery.disableAnimationsOf(context);
    if (wanted && _timer == null) {
      _timer = Timer.periodic(widget.interval, (_) {
        if (mounted) _goTo((_index + 1) % widget.items.length);
      });
    } else if (!wanted && _timer != null) {
      _timer!.cancel();
      _timer = null;
    }
  }

  /// Any deliberate act by the reader: auto-play stops and stays stopped.
  void _stopAuto() {
    if (_interacted) return;
    _interacted = true;
    _timer?.cancel();
    _timer = null;
  }

  void _goTo(int target) {
    if (target < 0 || target >= widget.items.length || !_controller.hasClients) return;
    if (MediaQuery.disableAnimationsOf(context)) {
      _controller.jumpToPage(target);
    } else {
      _controller.animateToPage(target, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final count = widget.items.length;
    final canPrevious = _index > 0;
    final canNext = _index < count - 1;

    final deck = SizedBox(
      height: widget.height,
      child: NotificationListener<ScrollStartNotification>(
        // `dragDetails != null` = a finger, not our own `animateToPage`.
        onNotification: (n) {
          if (n.dragDetails != null) _stopAuto();
          return false;
        },
        child: PageView.builder(
          controller: _controller,
          itemCount: count,
          onPageChanged: (i) {
            setState(() => _index = i);
            widget.onIndexChanged?.call(i);
          },
          itemBuilder: (context, i) => Semantics(
            container: true,
            // The slide is a named group; its content stays reachable underneath
            // it (the web's `role="group"` + `aria-label`, where an unnamed
            // slide is announced as the role and nothing else).
            explicitChildNodes: true,
            label: widget.slideLabel(i, count),
            child: widget.items[i],
          ),
        ),
      ),
    );

    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            children: [
              deck,
              // `inset-inline-start` / `-end`: «previous» sits at the reading
              // start in both scripts — the side the deck moves toward.
              PositionedDirectional(
                start: 4,
                top: 0,
                bottom: 0,
                child: Center(
                  child: _Chevron(
                    label: widget.previousLabel,
                    // `matchTextDirection` glyph: it points the reading way with no branch.
                    icon: Icons.chevron_left,
                    isEnabled: canPrevious,
                    onTap: () {
                      _stopAuto();
                      _goTo(_index - 1);
                    },
                  ),
                ),
              ),
              PositionedDirectional(
                end: 4,
                top: 0,
                bottom: 0,
                child: Center(
                  child: _Chevron(
                    label: widget.nextLabel,
                    icon: Icons.chevron_right,
                    isEnabled: canNext,
                    onTap: () {
                      _stopAuto();
                      _goTo(_index + 1);
                    },
                  ),
                ),
              ),
            ],
          ),
          if (widget.showDots && count > 1)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              // A `Row`, so the first dot sits at the reading start — level with the first slide.
              child: Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                spacing: 4,
                children: [
                  for (var i = 0; i < count; i++)
                    Semantics(
                      container: true,
                      button: true,
                      selected: i == _index,
                      label: widget.slideLabel(i, count),
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        excludeFromSemantics: true,
                        onTap: () {
                          _stopAuto();
                          _goTo(i);
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            width: i == _index ? 16 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: i == _index ? c.accent : c.borderStrong,
                              borderRadius: BorderRadius.circular(999),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// One overlay chevron: an icon button on the surface, disabled at the bound
/// (the web's `canScrollPrev`/`canScrollNext`).
class _Chevron extends StatelessWidget {
  const _Chevron({required this.label, required this.icon, required this.isEnabled, required this.onTap});
  final String label;
  final IconData icon;
  final bool isEnabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Semantics(
      container: true,
      button: true,
      enabled: isEnabled,
      label: label,
      child: Opacity(
        opacity: isEnabled ? 1 : 0.4,
        child: Tooltip(
          message: label,
          excludeFromSemantics: true,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            excludeFromSemantics: true,
            onTap: isEnabled ? onTap : null,
            child: Container(
              width: LumoControl.sm,
              height: LumoControl.sm,
              decoration: BoxDecoration(
                color: c.surface,
                shape: BoxShape.circle,
                border: Border.all(color: c.borderControl),
              ),
              child: Icon(icon, size: 18, color: c.fg),
            ),
          ),
        ),
      ),
    );
  }
}
