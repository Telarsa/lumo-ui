import 'package:flutter/material.dart';
import 'scope.dart';

enum LumoEmptyStateSize { sm, md, lg }

const _gap = {LumoEmptyStateSize.sm: 8.0, LumoEmptyStateSize.md: 12.0, LumoEmptyStateSize.lg: 16.0};
const _padding = {LumoEmptyStateSize.sm: EdgeInsets.symmetric(horizontal: 16, vertical: 32), LumoEmptyStateSize.md: EdgeInsets.symmetric(horizontal: 24, vertical: 48), LumoEmptyStateSize.lg: EdgeInsets.symmetric(horizontal: 24, vertical: 80)};

/// The "there is nothing here yet" panel — the web `EmptyState`: icon (in the
/// 40px chip, decorative and excluded — the title already says what the picture
/// says), `title` REQUIRED and a HEADER for the reader, `description`, and
/// `actions` (widgets, usually `LumoButton`s — slots, not labels plus handlers).
/// Centred: `TextAlign.center` is direction-neutral.
class LumoEmptyState extends StatelessWidget {
  const LumoEmptyState({super.key, required this.title, this.description, this.icon, this.actions, this.size = LumoEmptyStateSize.md});
  /// What is empty, in the reader's language. Required.
  final String title;
  /// Why it is empty and what to do about it.
  final String? description;
  /// Decorative illustration or glyph.
  final Widget? icon;
  final List<Widget>? actions;
  final LumoEmptyStateSize size;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final gap = _gap[size]!;
    return Padding(
      padding: _padding[size]!,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (icon != null)
            ExcludeSemantics(
              child: Container(
                width: 40,
                height: 40,
                margin: EdgeInsets.only(bottom: gap),
                decoration: BoxDecoration(color: c.surfaceSunken, shape: BoxShape.circle),
                child: IconTheme(data: IconThemeData(size: 20, color: c.fgSubtle), child: Center(child: icon)),
              ),
            ),
          Semantics(header: true, child: Text(title, textAlign: TextAlign.center, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, height: 1.4, color: c.fg))),
          if (description != null)
            Padding(
              padding: EdgeInsets.only(top: gap),
              // 60ch-ish prose width so a long explanation does not run edge to edge.
              child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 480), child: Text(description!, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: c.fgMuted))),
            ),
          if (actions != null && actions!.isNotEmpty)
            Padding(
              padding: EdgeInsets.only(top: gap + 4),
              child: Wrap(alignment: WrapAlignment.center, spacing: 8, runSpacing: 8, children: actions!),
            ),
        ],
      ),
    );
  }
}
