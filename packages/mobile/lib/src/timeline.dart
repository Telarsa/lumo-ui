import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'scope.dart';

enum LumoTimelineOrientation { vertical, horizontal }

/// Where an event stands. A timeline usually reads `done` … `current` …
/// `upcoming`, but nothing here enforces that: it is a RECORD, and a record may
/// hold a rejected step after a done one.
enum LumoTimelineState { done, current, upcoming }

/// One event: `title` REQUIRED, `description` the sentence under it, `meta` the
/// already-formatted stamp — «۱۹ مرداد ۱۴۰۵», a STRING the caller built with
/// `formatLumoDate`/`formatNumber`, because the caller holds the locale (the
/// web `TimelineTime` takes the same already-formatted string, and for the same
/// reason). `icon` is what sits IN the dot: decorative.
class LumoTimelineItem {
  const LumoTimelineItem({required this.title, this.description, this.meta, this.icon, this.state = LumoTimelineState.done});
  final String title;
  final String? description;

  /// The pre-formatted time or place stamp. Never a `DateTime`, never a number.
  final String? meta;

  /// The dot's glyph. DECORATIVE — the title says what happened.
  final Widget? icon;
  final LumoTimelineState state;
}

/// A sequence of EVENTS down a rail — the web `Timeline`: an order's history,
/// an audit trail, a job's stages.
///
/// **Timeline is not Steps.** `LumoSteps` is where you are in a sequence you
/// have to FINISH — a wizard's progress, numbered discs, one `current` index,
/// and every step before it complete by definition. A timeline is a RECORD of
/// what happened: each item carries its own `state`, the order is the
/// information (the web renders an `<ol>` for exactly that reason), items are
/// not numbered, and there may be no current item at all. Same distinction as
/// the web's two registry entries — «Where you are in a sequence you have to
/// finish» against «A sequence of events down a rail». Pick Steps for a form,
/// Timeline for a history.
///
/// `label` is REQUIRED (the list's announced name; the web `<ol>` takes its
/// name from the surrounding page, mobile has no such page), and so are the
/// three STATE WORDS — `doneLabel`, `currentLabel`, `upcomingLabel` — announced
/// after each title, so colour is never the sole carrier (WCAG 1.4.1). This is
/// the rule `steps.dart` states and the same implementation: a semantics-only
/// node after the title, never a label that would REPLACE it.
///
/// Direction: the rail, the dots and the text all sit on the INLINE axis —
/// vertically the dot column is at the reading start (right under fa-IR),
/// horizontally the first event is at the reading start, because a `Row`
/// mirrors itself. Nothing is placed by a physical offset.
///
/// Semantics: a `list` named by `label`; each item a `listItem` whose node is
/// title, state word, description, meta — MERGED, so each string is heard
/// exactly once; the dot, its icon and the connectors are decoration.
///
/// Web props not carried: the per-item `tone` (`neutral | accent | positive |
/// critical`) — on mobile the dot and the rail take their colour from `state`,
/// which is the axis that has a required WORD behind it; a second, wordless
/// colour axis would be exactly the "colour is the only carrier" defect the
/// state labels exist to prevent. `marker` is `icon`, `TimelineTime`'s
/// `dateTime` (the machine-readable ISO stamp) has no mobile counterpart —
/// there is no `<time>` element for a reader to parse.
class LumoTimeline extends StatelessWidget {
  const LumoTimeline({
    super.key,
    required this.label,
    required this.items,
    required this.doneLabel,
    required this.currentLabel,
    required this.upcomingLabel,
    this.orientation = LumoTimelineOrientation.vertical,
  });

  /// The announced name of the sequence, e.g. «تاریخچهٔ سفارش». Required.
  final String label;
  final List<LumoTimelineItem> items;

  /// Announced state of an event that happened, e.g. «انجام‌شده». Required.
  final String doneLabel;

  /// Announced state of the event in progress, e.g. «در جریان». Required.
  final String currentLabel;

  /// Announced state of an event not yet reached, e.g. «در انتظار». Required.
  final String upcomingLabel;
  final LumoTimelineOrientation orientation;

  String _wordOf(LumoTimelineState s) => switch (s) {
        LumoTimelineState.done => doneLabel,
        LumoTimelineState.current => currentLabel,
        LumoTimelineState.upcoming => upcomingLabel,
      };

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final vertical = orientation == LumoTimelineOrientation.vertical;

    // `size-7` with a `border-2 border-bg` ring, as the web marker: the ring
    // keeps the rail from touching the dot whatever the surface.
    Widget dot(LumoTimelineItem item) {
      final (Color fill, Color ring, Color glyph) = switch (item.state) {
        LumoTimelineState.done => (c.accent, c.accent, c.accentFg),
        LumoTimelineState.current => (c.surface, c.accent, c.accent),
        LumoTimelineState.upcoming => (c.surface, c.borderStrong, c.fgSubtle),
      };
      return ExcludeSemantics(
        child: Container(
          width: 28,
          height: 28,
          alignment: Alignment.center,
          decoration: BoxDecoration(color: fill, shape: BoxShape.circle, border: Border.all(color: ring, width: 2)),
          child: item.icon == null ? null : IconTheme(data: IconThemeData(size: 14, color: glyph), child: item.icon!),
        ),
      );
    }

    // The rail: the web's `w-px` hairline, drawn BY the item that precedes it.
    Widget rail() => ExcludeSemantics(
          child: ColoredBox(
            color: c.border,
            child: vertical ? const SizedBox(width: 1, height: double.infinity) : const SizedBox(height: 1, width: double.infinity),
          ),
        );

    Widget texts(LumoTimelineItem item, {required bool centred}) => Column(
          crossAxisAlignment: centred ? CrossAxisAlignment.center : CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              item.title,
              textAlign: centred ? TextAlign.center : TextAlign.start,
              style: TextStyle(
                fontSize: 14,
                fontWeight: item.state == LumoTimelineState.current ? FontWeight.w600 : FontWeight.w500,
                height: 1.4,
                color: item.state == LumoTimelineState.upcoming ? c.fgMuted : c.fg,
              ),
            ),
            // The state IN WORDS — a semantics-only node after the title, never a label that would REPLACE it.
            Semantics(label: _wordOf(item.state), child: const SizedBox.shrink()),
            if (item.description != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(item.description!, textAlign: centred ? TextAlign.center : TextAlign.start, style: TextStyle(fontSize: 14, height: 1.6, color: c.fgMuted)),
              ),
            if (item.meta != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(item.meta!, textAlign: centred ? TextAlign.center : TextAlign.start, style: TextStyle(fontSize: 12, color: c.fgSubtle)),
              ),
          ],
        );

    final children = <Widget>[];
    for (var i = 0; i < items.length; i++) {
      final item = items[i];
      final last = i == items.length - 1;
      if (vertical) {
        // The rail runs from under the dot to the bottom of the item, so it
        // reaches the next dot however tall the text is.
        final row = Row(
          // The last item has no rail to stretch: stretching it against an
          // unbounded column would ask for an infinite height.
          crossAxisAlignment: last ? CrossAxisAlignment.start : CrossAxisAlignment.stretch,
          children: [
            Column(
              children: [
                dot(item),
                // 13.5 = (28 / 2) − 0.5: the hairline runs through the dots' centres.
                if (!last) Expanded(child: Padding(padding: const EdgeInsetsDirectional.only(start: 13.5, end: 13.5), child: rail())),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(child: Padding(padding: EdgeInsets.only(top: 3, bottom: last ? 0 : 20), child: texts(item, centred: false))),
          ],
        );
        children.add(MergeSemantics(
          child: Semantics(
            role: SemanticsRole.listItem,
            child: last ? row : IntrinsicHeight(child: row),
          ),
        ));
      } else {
        children.add(Flexible(
          child: MergeSemantics(
            child: Semantics(
              role: SemanticsRole.listItem,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  dot(item),
                  Padding(padding: const EdgeInsets.only(top: 8), child: texts(item, centred: true)),
                ],
              ),
            ),
          ),
        ));
        if (!last) {
          // The connector sits between two dots at their centre height; the Row
          // put them in reading order, so it needs no side of its own.
          children.add(Expanded(
            child: Padding(padding: const EdgeInsetsDirectional.only(start: 8, end: 8, top: 13.5), child: SizedBox(height: 1, child: rail())),
          ));
        }
      }
    }

    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: label,
      role: SemanticsRole.list,
      child: vertical
          ? Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: children)
          : Row(crossAxisAlignment: CrossAxisAlignment.start, children: children),
    );
  }
}
