import 'package:flutter/material.dart';
import 'scope.dart';

/// How a pair is laid out. The web spells these `layout: "row" | "stack"`;
/// renamed here to say what they do on the block axis rather than which flex
/// direction they use.
enum LumoDescriptionListOrientation {
  /// Term at the reading START, value at the reading END on one line — the
  /// web's `row` (`justify-between`, which mirrors on its own; never a
  /// physical alignment).
  inline,

  /// Value under the term. The block axis does not mirror.
  stacked,
}

/// The text-size step. The web `DescriptionList` has no size variant (it is
/// `text-sm` throughout); `md` IS that scale and `sm` is the denser mobile
/// step, for a spec sheet inside a card that already has a title.
enum LumoDescriptionListSize { sm, md }

const _font = {LumoDescriptionListSize.sm: 13.0, LumoDescriptionListSize.md: 14.0};
const _listGap = {LumoDescriptionListSize.sm: 6.0, LumoDescriptionListSize.md: 8.0};
const _inlineGap = {LumoDescriptionListSize.sm: 8.0, LumoDescriptionListSize.md: 12.0};

/// One term/value pair — the web `DescriptionGroup` + `DescriptionTerm` +
/// `DescriptionDetail`.
///
/// The value is a **pre-formatted String** by default, never a number: Dart
/// cannot refuse a raw `int` at the type level the way the web's `LumoNode`
/// does, so the type asks for the string the app already ran through
/// `formatNumber(n, locale)` / `formatLumoDate`. Use `LumoDescription.widget`
/// when the value is drawn (a badge, a price with a currency chip) — it takes
/// the widget AND the announced `value`, because nothing derives words from a
/// widget and a reader cannot hear a badge.
class LumoDescription {
  /// A value that is already the string it should be read as.
  const LumoDescription({required this.term, required this.value}) : child = null;

  /// A drawn value. `value` is what is ANNOUNCED; `child` is what is SHOWN and
  /// is excluded from semantics, so the pair is heard exactly once.
  const LumoDescription.widget({required this.term, required this.value, required Widget this.child});

  /// The name of the fact, e.g. «جمع پرداخت». Required.
  final String term;

  /// The fact, as words. Required — announced in both forms.
  final String value;

  /// The drawn value, when it is not plain text.
  final Widget? child;
}

/// A spec sheet: name/value pairs — the web `DescriptionList`. `label` is
/// REQUIRED and names the block; the web's bare `<dl>` has no name because a
/// page heading above it does the job, and on a phone a card full of rows has
/// no such heading to lean on.
///
/// Semantics: each pair is ONE node (`MergeSemantics`) reading the term then
/// the value, so a reader hears «جمع پرداخت، ۱٬۲۰۰٬۰۰۰ تومان» and not two
/// unrelated fragments. No punctuation is invented between them — the join
/// belongs to the platform's node separator, not to a colon this library would
/// have to pick per language.
///
/// The Khroos app hand-rolled these rows across the provider profile and the
/// business screens as `Row(mainAxisAlignment: spaceBetween)` with two `Text`s,
/// which reads as two separate nodes and loses the pairing entirely.
class LumoDescriptionList extends StatelessWidget {
  const LumoDescriptionList({
    super.key,
    required this.label,
    required this.entries,
    this.orientation = LumoDescriptionListOrientation.inline,
    this.size = LumoDescriptionListSize.md,
  });

  /// Announced name of the block, e.g. «جزئیات صورتحساب». Required.
  final String label;
  final List<LumoDescription> entries;
  final LumoDescriptionListOrientation orientation;
  final LumoDescriptionListSize size;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final font = _font[size]!;
    final inline = orientation == LumoDescriptionListOrientation.inline;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: label,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        spacing: _listGap[size]!,
        children: [
          for (final e in entries)
            MergeSemantics(
              child: _Pair(entry: e, inline: inline, font: font, gap: _inlineGap[size]!, term: c.fgMuted, value: c.fg),
            ),
        ],
      ),
    );
  }
}

class _Pair extends StatelessWidget {
  const _Pair({required this.entry, required this.inline, required this.font, required this.gap, required this.term, required this.value});
  final LumoDescription entry;
  final bool inline;
  final double font;
  final double gap;
  final Color term;
  final Color value;

  @override
  Widget build(BuildContext context) {
    final termText = Text(entry.term, style: TextStyle(fontSize: font, height: 1.5, color: term));
    final valueWidget = entry.child == null
        // Reading END inside its own box for the inline form, so a value that
        // wraps to a second line still hangs off the same edge; `TextAlign.end`
        // resolves against direction, it is not `right`.
        ? Text(entry.value, textAlign: inline ? TextAlign.end : TextAlign.start, style: TextStyle(fontSize: font, height: 1.5, fontWeight: FontWeight.w500, color: value))
        // Drawn: the announced words come from `value`, the widget is silent.
        : Semantics(label: entry.value, child: ExcludeSemantics(child: entry.child!));
    return inline
        ? Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            spacing: gap,
            children: [Flexible(child: termText), Flexible(child: valueWidget)],
          )
        : Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            // The web's `gap-0.5` in the stacked layout.
            spacing: 2,
            children: [termText, valueWidget],
          );
  }
}
