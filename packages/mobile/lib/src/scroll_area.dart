import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// Which axis a [LumoScrollArea] scrolls.
///
/// The web's third value, `"both"`, is deliberately NOT carried: on the DOM one
/// element scrolls on two axes, while Flutter needs two nested `Scrollable`s,
/// two controllers, two scrollbars and two fade pairs — and the nesting has its
/// own gesture-arena behaviour that a consumer must reason about anyway. A
/// caller who wants both nests two `LumoScrollArea`s and sees the cost.
enum LumoScrollAreaOrientation { vertical, horizontal }

/// Full alpha for the fade mask. See the `shaderCallback` below: in
/// `BlendMode.dstIn` only the alpha channel is sampled, so this is the number 1
/// wearing a `Color`'s type, not a colour the library paints with.
const Color _opaque = Color(0xFF000000);

/// A bounded scroller with Lumo's own scrollbar and fade edges — the web
/// `ScrollArea`.
///
/// **What the web does and why this differs.** `scroll-area.tsx` is a `<div>`
/// with `overflow-*-auto` and two CSS scrollbar properties: it restyles the
/// ENGINE's scrollbar, so wheel, touch, keyboard and RTL edge placement stay
/// native. Flutter has no engine scrollbar to restyle — `Scrollbar` is a widget
/// that paints from `ScrollbarThemeData`, i.e. from Material's palette. So the
/// thumb here is drawn by [RawScrollbar] with the SCOPE's colours, which is the
/// same decision the web file made (take the platform's mechanics, wear Lumo's
/// paint) arrived at from the other side.
///
/// **Fade edges** are the mobile addition the web has no need for: a desktop
/// scrollbar says "there is more"; a phone's overlay thumb is gone two seconds
/// after the finger lifts. The fade is a `ShaderMask` in `BlendMode.dstIn`, so
/// it makes the content TRANSPARENT at the edge rather than painting a colour
/// over it — a fade painted in `surface` is wrong the moment the area sits on
/// `bgSubtle`, and that is the bug this avoids. The gradient runs from
/// `AlignmentDirectional.centerStart` to `centerEnd` on the inline axis, so it
/// mirrors with the locale and there is no `isRtl` branch anywhere in the file.
/// Each edge fades only when there is content past it, so a list that fits has
/// no fade at all.
///
/// **`overflow-x-hidden`** on the web's `vertical` variant says a too-wide child
/// must clip rather than push the page sideways. `ClipRect` is that line.
///
/// **Semantics.** `label` is REQUIRED and names the region — as on the web,
/// where the container is a tab stop and an unnamed one announces nothing.
/// `SemanticsRole.region` is deliberately NOT set: Flutter grades it as a
/// LANDMARK, and a landmark inside another landmark is a framework assertion —
/// a scroll area inside a scroll area, or inside a future `main`, would crash
/// the app rather than mis-announce. The node is a plain named container.
class LumoScrollArea extends StatefulWidget {
  const LumoScrollArea({
    super.key,
    required this.label,
    required this.child,
    this.orientation = LumoScrollAreaOrientation.vertical,
    this.controller,
    this.padding,
    this.showScrollbar = true,
    this.fadeEdges = true,
    this.fadeExtent = 24,
    this.physics,
  });

  /// Announced name of the scrollable region, e.g. «فهرست تراکنش‌ها». REQUIRED.
  final String label;

  /// The widget this one wraps.
  final Widget child;

  /// Which axis the control runs along.
  final LumoScrollAreaOrientation orientation;

  /// A controller the caller owns. Given one, the widget never disposes it;
  /// without one it makes and disposes its own.
  final ScrollController? controller;

  /// Inside the scroller, so the padding scrolls with the content.
  final EdgeInsetsGeometry? padding;

  /// Draw the thumb. Always visible while there is anything to scroll — an
  /// overlay thumb that has already faded cannot say "there is more".
  final bool showScrollbar;

  /// Fade the edge that has content beyond it.
  final bool fadeEdges;

  /// How many logical pixels the fade covers.
  final double fadeExtent;

  /// Scroll physics, for a caller that needs something other than the platform default.
  final ScrollPhysics? physics;

  @override
  State<LumoScrollArea> createState() => _LumoScrollAreaState();
}

class _LumoScrollAreaState extends State<LumoScrollArea> {
  ScrollController? _own;
  ScrollController get _controller => widget.controller ?? (_own ??= ScrollController());

  /// Whether there is content past each edge — the only thing the fade needs.
  bool _beforeStart = false;
  bool _pastEnd = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_sync);
  }

  @override
  void didUpdateWidget(LumoScrollArea old) {
    super.didUpdateWidget(old);
    if (old.controller != widget.controller) {
      old.controller?.removeListener(_sync);
      _own?.removeListener(_sync);
      _controller.addListener(_sync);
    }
  }

  @override
  void dispose() {
    widget.controller?.removeListener(_sync);
    _own?.dispose();
    super.dispose();
  }

  /// `setState` only when a BOOLEAN flips — a scroll fires this on every frame
  /// and rebuilding the subtree per pixel is the classic fade-edge regression.
  void _sync() {
    if (!_controller.hasClients) return;
    final p = _controller.position;
    final before = p.extentBefore > 0.5;
    final after = p.extentAfter > 0.5;
    if (before != _beforeStart || after != _pastEnd) {
      setState(() {
        _beforeStart = before;
        _pastEnd = after;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final horizontal = widget.orientation == LumoScrollAreaOrientation.horizontal;

    // A `NotificationListener` rather than the controller alone: the first
    // layout has no clients yet, so the flags would stay false until the reader
    // scrolled, and a list that overflows would start with no fade.
    Widget scroller = NotificationListener<ScrollMetricsNotification>(
      onNotification: (n) {
        final before = n.metrics.extentBefore > 0.5;
        final after = n.metrics.extentAfter > 0.5;
        if (before != _beforeStart || after != _pastEnd) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) setState(() { _beforeStart = before; _pastEnd = after; });
          });
        }
        return false;
      },
      child: SingleChildScrollView(
        controller: _controller,
        scrollDirection: horizontal ? Axis.horizontal : Axis.vertical,
        padding: widget.padding,
        physics: widget.physics,
        child: widget.child,
      ),
    );

    if (widget.fadeEdges) {
      final f = widget.fadeExtent;
      // `content`, not `scroller`: a closure captures the VARIABLE, so a builder
      // that read `scroller` would read the `LayoutBuilder` being assigned to it
      // and rebuild itself for ever. It hangs rather than throws, which is why
      // it is worth a line of comment.
      final content = scroller;
      // The mask is here on EVERY frame `fadeEdges` is on, even with both edges
      // opaque and nothing to fade. Adding and removing it would change the
      // tree's shape, and a `SingleChildScrollView` that changes depth is
      // rebuilt from scratch with a fresh `ScrollPosition` — the reader's place
      // in the list is lost the first time the content grows past its box.
      // The price is one `saveLayer` for the area; `fadeEdges: false` declines it.
      scroller = LayoutBuilder(builder: (context, constraints) {
        final extent = horizontal ? constraints.maxWidth : constraints.maxHeight;
        // A fade wider than half the box would meet in the middle and dim
        // everything; below that it is simply not drawn.
        final stop = extent.isFinite && extent > 0 ? (f / extent).clamp(0.0, 0.45) : 0.0;
        return ShaderMask(
          blendMode: BlendMode.dstIn,
          // Not a palette: in `BlendMode.dstIn` only the ALPHA channel is read,
          // so these four entries are an opacity ramp (opaque throughout, 0 at
          // an edge with content beyond it) and `_opaque`'s hue never reaches a
          // pixel. The scope's colours would be wrong here — a fade must not tint.
          shaderCallback: (rect) => LinearGradient(
            begin: horizontal ? AlignmentDirectional.centerStart : Alignment.topCenter,
            end: horizontal ? AlignmentDirectional.centerEnd : Alignment.bottomCenter,
            colors: [
              _beforeStart && stop > 0 ? Colors.transparent : _opaque,
              _opaque,
              _opaque,
              _pastEnd && stop > 0 ? Colors.transparent : _opaque,
            ],
            stops: [0, stop, 1 - stop, 1],
          ).createShader(rect, textDirection: scope.direction),
          child: content,
        );
      });
    }

    if (widget.showScrollbar) {
      scroller = RawScrollbar(
        controller: _controller,
        thumbVisibility: true,
        // The web sets `scrollbar-color: var(--color-border) transparent` on a
        // 1-px-wide engine scrollbar. A 4-px overlay thumb on a phone needs the
        // next step up to read at all, hence `borderStrong`.
        thumbColor: scope.colours.borderStrong,
        radius: const Radius.circular(LumoRadius.sm),
        thickness: 4,
        crossAxisMargin: 2,
        child: scroller,
      );
    }

    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label,
      // The web's `overflow-x-hidden`: a too-wide child clips instead of
      // pushing the page sideways.
      child: ClipRect(child: scroller),
    );
  }
}
