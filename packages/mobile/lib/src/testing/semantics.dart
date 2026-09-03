// THE SEMANTICS GRADER — the mobile counterpart of `lumo-gate`.
//
// MOVED HERE 31 Aug 2026 (decision §53). It lived in
// `apps/mobile-gallery/lib/src/semantics_rules.dart`, which meant the
// correctness half of Lumo Mobile could grade Lumo's own gallery and nothing
// else: a consuming app got the WIDGETS and no way to check what its own
// screens announce. A consumer noticed the hole and hand-rolled a slice of it
// (`test/contrast_test.dart` re-implements WCAG luminance) because this was
// out of reach.
//
// The web's gate reads served bytes; there are no bytes on a phone. The
// equivalent artifact is the SemanticsNode tree — what the platform hands a
// screen reader — so that is what this walks.
//
// `flutter_test` is a real dependency of this package rather than a dev one,
// which is what makes this file importable from a consumer's test. That is the
// standard shape for a test-support library and the reason the import below is
// not a lint violation here.
import 'dart:ui' show CheckedState, Rect, Size, Tristate;

import 'package:flutter/rendering.dart' show MatrixUtils;
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';

import '../latn.dart';

/// A phone-sized stage. Grading at a fixed size keeps a run comparable between
/// machines; it is not a claim about any particular device.
const kLumoStage = Size(360, 640);

/// One node of the tree, flattened to what a reader would hear.
typedef LumoAnnounced = ({
  String label,
  String value,
  String hint,

  /// Flutter's own field, and a name in its own right.
  ///
  /// A `Tooltip` — which is what `IconButton(tooltip: …)` becomes — does NOT
  /// write `label`. It writes `SemanticsData.tooltip`, which a screen reader
  /// announces after the label. Reading only `label` reported thirteen named
  /// icon buttons across three screens of a consumer app as unnamed, and no
  /// demo in the gallery could have caught it: every one of them passes an explicit
  /// `label`, so nothing there has ever been named by a tooltip.
  String tooltip,
  String increased,
  String decreased,
  bool interactive,
  bool hidden,

  /// An ancestor drawn at the SAME rect already carries a name, so this node is
  /// the same control seen again rather than a second, unnamed one.
  bool namedByAncestor,

  /// Whether this node sits in a [kLumoLatnIsland] the app declared.
  bool inLatnIsland,

  /// Where the node is drawn, and the nearest named thing above it.
  ///
  /// Carried purely so a violation can say WHERE. The first production run
  /// reported thirteen unnamed controls across three screens and gave no way
  /// to find any of them; a rule a reader cannot act on is a rule they turn
  /// off.
  Rect rect,
  String nearestNamedAncestor,
});

/// One announced node, for a fixture.
///
/// A poison fixture cares about two or three fields and has no opinion about
/// the rest, so it should not have to spell them. It had to until 31 Aug 2026,
/// and the cost showed up immediately: adding `rect` to locate a violation
/// broke every fixture in the gallery, none of which had anything to say about
/// a rectangle. Defaults here mean a new field is additive.
LumoAnnounced lumoAnnounced({
  String label = '',
  String value = '',
  String hint = '',
  String increased = '',
  String decreased = '',
  String tooltip = '',
  bool interactive = false,
  bool hidden = false,
  bool namedByAncestor = false,
  bool inLatnIsland = false,
  Rect rect = Rect.zero,
  String nearestNamedAncestor = '',
}) =>
    (
      label: label,
      value: value,
      hint: hint,
      tooltip: tooltip,
      increased: increased,
      decreased: decreased,
      interactive: interactive,
      hidden: hidden,
      namedByAncestor: namedByAncestor,
      inLatnIsland: inLatnIsland,
      rect: rect,
      nearestNamedAncestor: nearestNamedAncestor,
    );

/// A violation, in the shape a report prints.
typedef LumoViolation = ({String rule, String subject, String detail});

/// English words that leak from an ENGINE rather than from app source, which is
/// why a source scan cannot see them: Material names its own routes, barriers
/// and affordances from `MaterialLocalizations`, so a Persian app that reaches
/// a Material route helper gets «Dialog» and «Dismiss» announced in English.
/// Kept to words that are announced UI, not content — a screen may legitimately
/// say "PDF" or "jpg".
const kLumoEngineEnglish = <String>[
  'dismiss', 'dialog', 'alert', 'menu', 'popup', 'close', 'cancel', 'back',
  'next', 'previous', 'increase', 'decrease', 'select', 'show', 'hide',
  'expand', 'collapse', 'submit', 'search', 'clear', 'loading', 'error',
  'tab', 'button', 'checkbox', 'switch', 'slider',
];

/// Words that carry no meaning of their own, so a string made only of these and
/// [kLumoEngineEnglish] is chrome rather than content: «Show menu», «Tab 1 of 3».
const _kFunctionWords = <String>[
  'of', 'to', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'for', 'item',
  'page', 'more', 'all', 'no', 'not', 'is', 'was', 'this',
];

/// The announced string, if it reads as engine-supplied English UI chrome.
///
/// Returns null for anything with a Persian letter in it — the app's own
/// strings are the app's own problem, and an engine cannot have written them.
String? engineEnglishIn(String announced) {
  if (RegExp(r'[\u0600-\u06FF]').hasMatch(announced)) return null;

  final words = RegExp(r"[A-Za-z']+")
      .allMatches(announced)
      .map((m) => m.group(0)!.toLowerCase())
      .toList();
  if (words.isEmpty) return null;

  var sawUiWord = false;
  for (final w in words) {
    if (kLumoEngineEnglish.contains(w)) {
      sawUiWord = true;
      continue;
    }
    if (_kFunctionWords.contains(w)) continue;
    // A word that is neither chrome nor filler makes this content.
    return null;
  }
  return sawUiWord ? announced.trim() : null;
}

/// Every announced node under [of], flattened.
///
/// [of] is the subtree a reader meets — a screen, a dialog, one demo. It is a
/// parameter rather than a fixture because the whole point of this file is that
/// a consumer grades ITS OWN widgets:
///
/// ```dart
/// final tree = lumoAnnouncedTree(tester, of: find.byType(TodayScreen));
/// expect(lumoGrade(subject: 'today', locale: 'fa-IR', tree: tree), isEmpty);
/// ```
List<LumoAnnounced> lumoAnnouncedTree(WidgetTester tester, {required Finder of}) {
  // `getSemantics` rather than the binding's semantics owner: the owner route is
  // deprecated, and the nearest enclosing node IS the subtree the reader meets.
  final root = tester.getSemantics(of);
  final out = <LumoAnnounced>[];

  // `SemanticsNode.rect` is in the node's OWN coordinate system, and
  // `transform` is how that system sits inside its parent's. So a rect read
  // straight off a node is not comparable with any other node's, and it is not
  // a place on the screen either: the first version of the locator below
  // reported three different unnamed controls as "48x48 at 0,0", because 0,0 is
  // where almost everything sits relative to its own parent. Accumulating the
  // transform on the way down gives one shared space, which is what both the
  // locator and the ancestor test need.
  void walk(SemanticsNode node, Matrix4 toRoot,
      List<({Rect rect, String label})> named, bool latnIsland) {
    final here = node.transform == null
        ? toRoot
        : (toRoot.clone()..multiply(node.transform!));
    final globalRect = MatrixUtils.transformRect(here, node.rect);
    // A node merged into its parent is NOT announced on its own — its strings
    // are already in the parent's data. Grading it separately reported every
    // text field as an unnamed control, because the editable child carries no
    // label while the merged parent carries all of it.
    if (node.isMergedIntoParent) return;
    final data = node.getSemanticsData();
    final flags = data.flagsCollection;
    final inIsland = latnIsland || data.identifier == kLumoLatnIsland;
    out.add((
      label: data.label,
      value: data.value,
      hint: data.hint,
      tooltip: data.tooltip,
      increased: data.increasedValue,
      decreased: data.decreasedValue,
      interactive: flags.isButton ||
          flags.isLink ||
          flags.isTextField ||
          flags.isSlider ||
          flags.isChecked != CheckedState.none ||
          flags.isToggled != Tristate.none ||
          data.hasAction(SemanticsAction.tap) ||
          data.hasAction(SemanticsAction.increase) ||
          data.hasAction(SemanticsAction.decrease),
      hidden: flags.isHidden,
      namedByAncestor: named.any((a) => a.rect == globalRect),
      inLatnIsland: inIsland,
      rect: globalRect,
      nearestNamedAncestor: named.isEmpty ? '' : named.last.label,
    ));
    // Likewise, do not descend past a node that absorbs its descendants: the
    // reader meets one node here, and that is the one graded.
    if (node.mergeAllDescendantsIntoThisNode) return;
    // A `TextField` emits a labelled node with an unlabelled EDITABLE child at
    // the same rect — one control drawn once, not a second unnamed one. Carrying
    // the ancestor's name down by rect is what tells those apart from a genuinely
    // unnamed control nested inside a labelled container.
    final inherited = (data.label.trim().isEmpty && data.tooltip.trim().isEmpty)
        ? named
        : [...named, (rect: globalRect, label: data.label.trim().isEmpty ? data.tooltip : data.label)];
    node.visitChildren((child) {
      walk(child, here, inherited, inIsland);
      return true;
    });
  }

  walk(root, Matrix4.identity(), const [], false);
  return out;
}

/// Gregorian month names as a Persian reader is shown them — the raw material
/// for [lumoGrade]'s calendar rule.
///
/// CAPTURED, not typed. The first three came from
/// `formatGregorianMonth(2024, m, 'fa-IR')` in this very package, which is
/// `DateFormat.yMMMM` and therefore emits the EZAFE form for four months
/// («ژوئیهٔ», U+0654). The rest are what `date-fns` chose, which is what
/// `react-day-picker` and so shadcn's Calendar use on the web — a different
/// transliteration for five months, «جولای» rather than «ژوئیه». A Flutter app
/// can meet either: its own dates come from `intl`, and a WebView or a shared
/// design token file can carry the other.
///
/// A `const` list rather than a call to `DateFormat.MMMM('fa')`, deliberately:
/// that throws `LocaleDataException` until `initializeDateFormatting` has been
/// awaited, and a grader that needs an async setup step is a grader people
/// forget to set up. `persianMonthNames` next door is const for the same reason.
const kLumoGregorianMonthsInPersian = <String>[
  // intl / CLDR, as `DateFormat.yMMMM` renders them inside a date
  'ژانویهٔ', 'فوریهٔ', 'مارس', 'آوریل', 'مهٔ', 'ژوئن',
  'ژوئیهٔ', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر',
  // the same names standalone, without the ezafe
  'ژانویه', 'فوریه', 'مه', 'ژوئیه',
  // date-fns / react-day-picker
  'آپریل', 'جون', 'جولای', 'آگوست',
  // date-fns's May, which is also the Persian imperfective prefix. It is here
  // because the digit-adjacency test is what decides, not the word: «۲۲ می
  // ۲۰۲۴» has a digit beside it and «۳ بار تکرار می شود» has letters in
  // between. Left out of the first version out of caution, then measured.
  'می',
];

/// The rules. Pure functions over the flattened tree, so a poison fixture runs
/// exactly the same code a sweep does.
///
/// [subject] is whatever the caller calls the thing being graded — a screen
/// name, a demo id — and is echoed back in each violation.
List<LumoViolation> lumoGrade({
  required String subject,
  required String locale,
  required List<LumoAnnounced> tree,
}) {
  final out = <LumoViolation>[];
  final persian = locale.startsWith('fa');

  for (final node in tree) {
    if (node.hidden) continue;
    final announced = [
      node.label, node.value, node.hint, node.tooltip,
      node.increased, node.decreased,
    ];
    final spoken = announced.where((s) => s.isNotEmpty).toList();

    // 1. NAMED CONTROLS — an interactive node without a name is announced as
    //    its role alone: "button". The single most common accessibility defect,
    //    and the reason every announced string in this library is required.
    if (node.interactive &&
        node.label.trim().isEmpty &&
        node.value.trim().isEmpty &&
        node.tooltip.trim().isEmpty &&
        !node.namedByAncestor) {
      final r = node.rect;
      final where = '${r.width.round()}x${r.height.round()}'
          ' at ${r.left.round()},${r.top.round()}';
      out.add((
        rule: 'named-controls',
        subject: subject,
        detail: node.nearestNamedAncestor.isEmpty
            ? 'an interactive node ($where) has no label and no value'
            : 'an interactive node ($where) has no label and no value,'
                ' inside "${node.nearestNamedAncestor}"',
      ));
    }

    // 2. NATIVE DIGITS — a bare Latin digit in an announced string under a
    //    natively-numbered locale is the `formatNumber` rule failing where it is
    //    HEARD rather than seen.
    if (persian && !node.inLatnIsland) {
      for (final s in spoken) {
        if (RegExp(r'[0-9]').hasMatch(s)) {
          out.add((
            rule: 'persian-digits',
            subject: subject,
            detail: 'Latin digits announced under $locale: "$s"',
          ));
          break;
        }
      }
    }

    // 3. ENGINE ENGLISH — a string Material supplies in English, announced to a
    //    Persian reader. Source scanning cannot see these; only the tree can.
    //
    //    The test is that EVERY word is UI vocabulary, not that one word
    //    appears. A single-word test read "Upper back" — the muscle group — as
    //    Material's «Back» affordance and sent a fitness app hunting through
    //    `MaterialLocalizations` for a string its own exercise table had
    //    hard-coded. An untranslated content word is a real defect, but it is a
    //    different one, and `persian-digits` or a reader's eyes will find it;
    //    what this rule exists to catch is chrome the app never wrote.
    if (persian) {
      for (final s in spoken) {
        final leaked = engineEnglishIn(s);
        if (leaked != null) {
          out.add((
            rule: 'engine-english',
            subject: subject,
            detail: 'Material announced "$leaked" in English under $locale',
          ));
        }
      }
    }

    // 4. ANNOUNCED ONCE — the same string as both name and hint (or value) is
    //    read twice in a row. Not hypothetical: nine families once carried an
    //    error message as both its own node and the field's hint.
    //
    //    `label == tooltip` is NOT graded, and was for about an hour on 31 Aug
    //    2026. It was added beside the code that made `tooltip` an announced
    //    field — written next to the implementation rather than drawn from a
    //    defect, which is the exact discipline this repository has broken twice
    //    before and paid for twice. Flutter's own `BackButton` and the `AppBar`
    //    drawer button each wrap an `IconButton(tooltip:)` in a
    //    `Semantics(label:)` carrying the SAME string, so the check fired on
    //    two standard navigation widgets in every app and every locale, for
    //    something no consumer can fix. It never showed up because neither
    //    the consumer's tab roots nor the example screen has a back button.
    if (node.label.isNotEmpty) {
      if (node.label == node.hint) {
        out.add((
          rule: 'announced-once',
          subject: subject,
          detail: 'label and hint are the same string: "${node.label}"',
        ));
      }
      if (node.label == node.value) {
        out.add((
          rule: 'announced-once',
          subject: subject,
          detail: 'label and value are the same string: "${node.label}"',
        ));
      }
    }

    // 5. NATIVE CALENDAR — a date in the reader's LANGUAGE and the wrong
    //    CALENDAR. «۲۲ ژوئیهٔ ۲۰۲۴» is Persian words and Persian digits for a
    //    day Iran calls «۱ مرداد ۱۴۰۳»: green on every rule above, and off by
    //    622 years.
    //
    //    This package SHIPS a generator for it. `formatGregorianMonth(2024, 7,
    //    'fa-IR')` returns «ژوئیهٔ ۲۰۲۴» — a public function in `jalali.dart` —
    //    and until this rule existed the grader in the same package was green
    //    on its output.
    //
    //    Digit adjacency is what keeps «می» (date-fns's May) from firing on the
    //    imperfective prefix: «۳ بار تکرار می شود» has no digit beside the
    //    word, «۲۲ می ۲۰۲۴» does. Same shape as the web rule's `datePattern`.
    if (persian) {
      for (final s in spoken) {
        final month = _gregorianMonthInDate(s);
        if (month != null) {
          out.add((
            rule: 'native-calendar',
            subject: subject,
            detail: 'Gregorian month "$month" in a date announced under $locale, '
                'whose readers count in the Jalali calendar: "$s"',
          ));
          break;
        }
      }
    }

    // 6. NATIVE SCRIPT — an announced string with no letter of the reader's
    //    script at all.
    //
    //    `engine-english` above is deliberately narrow: it fires only when
    //    EVERY word is Material's own UI vocabulary, and its comment says an
    //    untranslated content word "is a real defect, but it is a different
    //    one". This is that one. On the web the same rule is what caught a
    //    Select shipping the raw key «thr», and an admin console printing
    //    `providers`, `in-app` and `scheduled` into cells a Persian operator
    //    reads.
    //
    //    The guard is on LETTERS, not characters: Persian digits carry
    //    `Script=Arabic`, so a naive script test reads «۱۲۳» as Persian text
    //    and the rule never fires. The web rule learned this the same way.
    if (persian && !node.inLatnIsland) {
      for (final s in spoken) {
        if (_hasLetter(s) && !_hasArabicLetter(s)) {
          out.add((
            rule: 'native-script',
            subject: subject,
            detail: 'announced under $locale with no Persian letter in it: "$s".'
                ' If it is deliberately foreign — a brand, an id — put it in a'
                ' kLumoLatnIsland; if it is a key or an untranslated string, it'
                ' is a defect.',
          ));
          break;
        }
      }
    }

    // 7. PERSIAN ZWNJ — «می کند» is two words to every collator and every
    //    search box; «می‌کند» is one. Same rule as the web's `persian-zwnj`,
    //    and the same narrow scope: the VERBAL PREFIX only. The comparative
    //    تر/ترین has the same orthography and «چوب تر» (wet wood) is correct
    //    Persian, so widening this would fire on correct text.
    if (persian && !node.inLatnIsland) {
      for (final s in spoken) {
        final m = _brokenZwnj.firstMatch(s);
        if (m != null) {
          out.add((
            rule: 'persian-zwnj',
            subject: subject,
            detail: '«${m.group(1)}» is joined with a SPACE, not a zero-width'
                ' non-joiner, in "$s". Write «${m.group(1)}\u200C».',
          ));
          break;
        }
      }
    }
  }
  return out;
}

/// Any letter at all — the guard that keeps the script rules off «۱۲۳» and «٪».
bool _hasLetter(String text) => RegExp(r'\p{L}', unicode: true).hasMatch(text);

/// A letter of the Arabic script, which is what a Persian reader reads.
/// Digits are excluded by construction: this matches LETTERS only.
bool _hasArabicLetter(String text) =>
    RegExp(r'[\u0620-\u064A\u0671-\u06D3\u06FA-\u06FF]', unicode: true)
        .hasMatch(text);

/// «می » / «نمی » before an Arabic-script letter, not preceded by one.
final RegExp _brokenZwnj =
    RegExp(r'(?<![\u0620-\u064A\u0671-\u06D3])(ن?می) (?=[\u0600-\u06FF])');

/// The Gregorian month name in [text], if it sits beside a number the way a
/// date does. Null otherwise.
///
/// Digits either side, within a few characters, and no letters in between —
/// that is what tells «۲۲ می ۲۰۲۴» from «۵ نفر می آیند».
String? _gregorianMonthInDate(String text) {
  const near = r'[\u06F0-\u06F9\u0660-\u06690-9\s،,/-]';
  for (final month in kLumoGregorianMonthsInPersian) {
    final m = RegExp('(?:[\\u06F0-\\u06F9\\u0660-\\u06690-9]$near{0,12}'
        '${RegExp.escape(month)})|(${RegExp.escape(month)}$near{0,3}'
        '[\\u06F0-\\u06F9\\u0660-\\u06690-9])');
    if (m.hasMatch(text)) return month;
  }
  return null;
}
