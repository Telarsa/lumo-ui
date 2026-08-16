import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// The placeholder's silhouette: a text line (16px, full width), a circle, or a block.
enum LumoSkeletonShape { rect, circle, text }

/// A placeholder block for content that has not arrived — the web `Skeleton`.
/// A PULSE, not a shimmer: a gradient sweep is physical in its axis and its
/// sign and runs against the reading direction in RTL; opacity has no
/// direction. Static under `disableAnimations` (the block still says
/// "pending"). Always excluded from semantics: loading is a STATE — put a
/// `LumoSpinner(label:)` beside it, which announces.
class LumoSkeleton extends StatefulWidget {
  const LumoSkeleton({super.key, this.width, this.height, this.shape = LumoSkeletonShape.rect});
  final double? width;
  final double? height;
  final LumoSkeletonShape shape;

  @override
  State<LumoSkeleton> createState() => _LumoSkeletonState();
}

class _LumoSkeletonState extends State<LumoSkeleton> with SingleTickerProviderStateMixin {
  late final _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000));
  late final _opacity = Tween<double>(begin: 1, end: 0.45).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _controller.stop();
      _controller.value = 0;
    } else if (!_controller.isAnimating) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final (w, h, radius) = switch (widget.shape) {
      LumoSkeletonShape.text => (widget.width ?? double.infinity, widget.height ?? 16.0, BorderRadius.circular(LumoRadius.sm)),
      LumoSkeletonShape.circle => (widget.width ?? widget.height ?? 40.0, widget.height ?? widget.width ?? 40.0, BorderRadius.circular(999)),
      LumoSkeletonShape.rect => (widget.width ?? double.infinity, widget.height ?? 40.0, BorderRadius.circular(LumoRadius.md)),
    };
    return ExcludeSemantics(
      child: FadeTransition(
        opacity: _opacity,
        child: Container(width: w, height: h, decoration: BoxDecoration(color: c.surfaceSunken, borderRadius: radius)),
      ),
    );
  }
}

/// A stack of `lines` text-line skeletons; the last one is two-thirds wide so
/// the block reads as a paragraph, not a wall. The short line sits at the
/// reading START (a `Column` with `CrossAxisAlignment.start` mirrors).
class LumoSkeletonText extends StatelessWidget {
  const LumoSkeletonText({super.key, this.lines = 3, this.gap = 8});
  final int lines;
  final double gap;

  @override
  Widget build(BuildContext context) {
    return ExcludeSemantics(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < lines; i++)
            Padding(
              padding: EdgeInsets.only(bottom: i == lines - 1 ? 0 : gap),
              child: i == lines - 1 && lines > 1
                  ? FractionallySizedBox(widthFactor: 2 / 3, alignment: AlignmentDirectional.centerStart, child: const LumoSkeleton(shape: LumoSkeletonShape.text))
                  : const LumoSkeleton(shape: LumoSkeletonShape.text),
            ),
        ],
      ),
    );
  }
}
