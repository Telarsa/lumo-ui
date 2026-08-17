import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'format.dart';
import 'scope.dart';

enum LumoStepsOrientation { horizontal, vertical }
enum LumoStepStatus { completed, current, upcoming }

/// One step: `title` REQUIRED, an optional second line.
class LumoStep {
  const LumoStep({required this.title, this.description});
  /// The visible title.
  final String title;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
}

/// A stepper — the web `Steps`: `label` REQUIRED (the sequence's announced
/// name), `steps` in order, `current` the 0-BASED INDEX of the step in progress
/// (`steps.length` once the sequence is complete — Dart indexes from 0 where
/// the web's `current` was 1-based), and the three state words REQUIRED —
/// `completedLabel`, `currentLabel`, `upcomingLabel` — announced after each
/// title so colour is never the sole carrier (WCAG 1.4.1). Every disc number
/// goes through `formatNumber(n, locale)` from the scope. A horizontal stepper
/// is a `Row`: nodes and connectors follow the direction, so it reads
/// right→left in Persian with no mirroring code.
///
/// Semantics: a `list` named by `label`; each step a `listItem` whose node is
/// title, state word, description — merged, so each is heard ONCE; the disc is
/// decorative (the list already says "item 2 of 4").
///
/// **A cramped horizontal stepper sheds decoration before it truncates words**,
/// in the order `segmented_control.dart`'s `_fit()` sets: the DESCRIPTION goes
/// first — the title names the step and the second line only elaborates — and
/// only then is the title held to two lines and ellipsised. A shed description
/// is still ANNOUNCED (a semantics-only node, as the state word is): it leaves
/// the picture, never the reading. Three long Persian titles on a 320 dp row
/// used to overflow it by 152 px; the vertical orientation has a column's full
/// width and sheds nothing.
class LumoSteps extends StatelessWidget {
  const LumoSteps({super.key, required this.label, required this.steps, required this.current, required this.completedLabel, required this.currentLabel, required this.upcomingLabel, this.orientation = LumoStepsOrientation.horizontal}) : assert(current >= 0, 'current is a 0-based index.');
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// The steps, in order.
  final List<LumoStep> steps;
  /// 0-based index of the step in progress; `steps.length` = all complete.
  final int current;
  /// Announced status of a finished step, e.g. «تکمیل‌شده». Required.
  final String completedLabel;
  /// Announced status of the step in progress, e.g. «مرحلهٔ فعلی». Required.
  final String currentLabel;
  /// Announced status of a step not yet started, e.g. «انجام‌نشده». Required.
  final String upcomingLabel;
  /// Which axis the control runs along.
  final LumoStepsOrientation orientation;

  LumoStepStatus _statusOf(int index) => index < current ? LumoStepStatus.completed : (index == current ? LumoStepStatus.current : LumoStepStatus.upcoming);

  String _wordOf(LumoStepStatus s) => switch (s) { LumoStepStatus.completed => completedLabel, LumoStepStatus.current => currentLabel, LumoStepStatus.upcoming => upcomingLabel };

  @override
  Widget build(BuildContext context) {
    // In build, not the constructor: `List.length` is not constant-evaluable and the widget stays `const`-constructible.
    assert(current <= steps.length, 'current is the 0-based index of the step in progress, or steps.length when all are complete.');
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final horizontal = orientation == LumoStepsOrientation.horizontal;
    Widget disc(int index, LumoStepStatus s) {
      final (bg, border, fg) = switch (s) {
        LumoStepStatus.completed => (c.accent, c.accent, c.accentFg),
        LumoStepStatus.current => (c.surface, c.accent, c.accent),
        LumoStepStatus.upcoming => (c.surface, c.borderStrong, c.fgSubtle),
      };
      return ExcludeSemantics(
        child: Container(
          width: 32,
          height: 32,
          alignment: Alignment.center,
          decoration: BoxDecoration(color: bg, shape: BoxShape.circle, border: Border.all(color: border, width: 2)),
          child: Text(formatNumber(index + 1, scope.locale, grouping: false), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: fg)),
        ),
      );
    }
    Widget texts(LumoStep step, LumoStepStatus s, {required bool showDescription}) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              step.title,
              // Horizontal: a step owns a slice of one row, so a long title is
              // held to two lines rather than growing the whole stepper.
              maxLines: horizontal ? 2 : null,
              overflow: horizontal ? TextOverflow.ellipsis : null,
              style: TextStyle(fontSize: 14, fontWeight: s == LumoStepStatus.current ? FontWeight.w600 : FontWeight.w400, color: s == LumoStepStatus.upcoming ? c.fgMuted : c.fg),
            ),
            // The state in words — a semantics-only node after the title, never a label that would REPLACE it.
            Semantics(label: _wordOf(s), child: const SizedBox.shrink()),
            if (step.description != null)
              showDescription
                  ? Text(step.description!, style: TextStyle(fontSize: 14, color: c.fgMuted))
                  // Shed from the picture, kept in the reading.
                  : Semantics(label: step.description!, child: const SizedBox.shrink()),
          ],
        );
    final connector = ExcludeSemantics(child: ColoredBox(color: c.border, child: horizontal ? const SizedBox(height: 1, width: double.infinity) : const SizedBox(width: 1, height: double.infinity)));

    return LayoutBuilder(builder: (context, constraints) {
      // The fit, measured in the inherited face so Persian metrics count, not
      // Latin ones: a description survives only while the titles still fit on
      // one line in the width one step is going to get.
      var showDescription = true;
      if (horizontal && constraints.maxWidth.isFinite) {
        final style = DefaultTextStyle.of(context).style.copyWith(fontSize: 14, fontWeight: FontWeight.w600);
        var widest = 0.0;
        for (final step in steps) {
          final tp = TextPainter(text: TextSpan(text: step.title, style: style), textDirection: Directionality.of(context), maxLines: 1)..layout();
          widest = math.max(widest, tp.width);
        }
        // 44 = the disc (32) and the gap (12) the text never gets.
        showDescription = (constraints.maxWidth / steps.length) - 44 >= widest;
      }
      final items = <Widget>[];
      for (var i = 0; i < steps.length; i++) {
        final s = _statusOf(i);
        final last = i == steps.length - 1;
        final item = MergeSemantics(
          child: Semantics(
            role: SemanticsRole.listItem,
            child: horizontal
                ? Row(mainAxisSize: MainAxisSize.min, children: [disc(i, s), const SizedBox(width: 12), Flexible(child: texts(steps[i], s, showDescription: showDescription))])
                : Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Column(mainAxisSize: MainAxisSize.min, children: [disc(i, s), if (!last) SizedBox(height: 24, child: connector)]),
                      const SizedBox(width: 12),
                      Expanded(child: Padding(padding: EdgeInsets.only(bottom: last ? 0 : 24), child: texts(steps[i], s, showDescription: true))),
                    ],
                  ),
          ),
        );
        if (horizontal) {
          // EVERY item is `Flexible`, the last one included — the web's step is a
          // flex child with `min-w-0`. While the last was rigid it kept its
          // intrinsic width, and three long Persian titles overflowed a 320 dp row
          // by 152 px («A RenderFlex overflowed by 152 pixels on the right»).
          items.add(Flexible(child: item));
          if (!last) items.add(Expanded(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: SizedBox(height: 1, child: connector))));
        } else {
          items.add(item);
        }
      }
      return Semantics(
        container: true,
        explicitChildNodes: true,
        label: label,
        role: SemanticsRole.list,
        child: horizontal
            ? Row(crossAxisAlignment: CrossAxisAlignment.center, children: items)
            : Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: items),
      );
    });
  }
}
