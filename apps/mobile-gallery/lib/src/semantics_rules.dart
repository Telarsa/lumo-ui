// THE SEMANTICS RULES, in one place.
//
// Extracted from `test/semantics_grader_test.dart` so the host sweep and the
// ON-DEVICE run (`integration_test/device_evidence_test.dart`) grade with the
// same code. Two copies of an accessibility rule is how a device result and a
// host result quietly stop being comparable.
// `flutter_test` is a dev dependency and this file lives in `lib/`, which the
// analyzer flags. It is deliberate and safe here: this gallery is never
// published (`publish_to: none`), and the file exists precisely so that TWO test
// entry points — the host sweep and the on-device run — grade with one
// implementation of the rules rather than two that can drift apart.
// ignore_for_file: depend_on_referenced_packages
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import '../main.dart';

const kStage = Size(360, 640);

/// One node of the tree, flattened to what a reader would hear.
typedef Announced = ({
  String label,
  String value,
  String hint,
  String increased,
  String decreased,
  bool interactive,
  bool hidden,
  /// An ancestor drawn at the SAME rect already carries a name, so this node is
  /// the same control seen again rather than a second, unnamed one.
  bool namedByAncestor,
});

/// A violation, in the shape the gate prints.
typedef Violation = ({String rule, String demo, String detail});

/// English words that leak from an ENGINE rather than from our source, which is
/// why `gate:flutter-contract` cannot see them: Material names its own routes,
/// barriers and affordances from `MaterialLocalizations`, and a Persian app that
/// reaches a Material route helper gets «Dialog» and «Dismiss» announced in
/// English. Kept to words that are announced UI, not content — a demo may
/// legitimately say "PDF" or "jpg".
const kEngineEnglish = <String>[
  'dismiss', 'dialog', 'alert', 'menu', 'popup', 'close', 'cancel', 'back',
  'next', 'previous', 'increase', 'decrease', 'select', 'show', 'hide',
  'expand', 'collapse', 'submit', 'search', 'clear', 'loading', 'error',
  'tab', 'button', 'checkbox', 'switch', 'slider',
];

Widget demoApp(String id, String locale) => MaterialApp(
      debugShowCheckedModeBanner: false,
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      supportedLocales: const [Locale('fa', 'IR'), Locale('en', 'US')],
      locale: Locale(locale.split('-').first, locale.split('-').last),
      theme: lumoThemeData(brightness: Brightness.light),
      builder: (context, child) => LumoScope(
        locale: locale,
        brightness: Brightness.light,
        child: child ?? const SizedBox.shrink(),
      ),
      home: DemoStage(demoId: id, locale: locale),
    );

/// Every node in the rendered tree, flattened.
List<Announced> announcedTree(WidgetTester tester) {
  // `getSemantics` rather than the binding's semantics owner: the owner route is
  // deprecated, and the nearest enclosing node of the stage IS the subtree the
  // reader meets.
  final root = tester.getSemantics(find.byType(DemoStage));
  final out = <Announced>[];
  void walk(SemanticsNode node, List<({Rect rect, String label})> named) {
    // A node merged into its parent is NOT announced on its own — its strings
    // are already in the parent's data. Grading it separately reported every
    // text field as an unnamed control, because the editable child carries no
    // label while the merged parent carries all of it.
    if (node.isMergedIntoParent) return;
    final data = node.getSemanticsData();
    final flags = data.flagsCollection;
    out.add((
      label: data.label,
      value: data.value,
      hint: data.hint,
      increased: data.increasedValue,
      decreased: data.decreasedValue,
      interactive: flags.isButton ||
          flags.isLink ||
          flags.isTextField ||
          flags.isSlider ||
          flags.hasCheckedState ||
          flags.hasToggledState ||
          data.hasAction(SemanticsAction.tap) ||
          data.hasAction(SemanticsAction.increase) ||
          data.hasAction(SemanticsAction.decrease),
      hidden: flags.isHidden,
      namedByAncestor: named.any((a) => a.rect == node.rect),
    ));
    // Likewise, do not descend past a node that absorbs its descendants: the
    // reader meets one node here, and that is the one graded.
    if (node.mergeAllDescendantsIntoThisNode) return;
    // A `TextField` emits a labelled node with an unlabelled EDITABLE child at
    // the same rect — one control drawn once, not a second unnamed one. Carrying
    // the ancestor's name down by rect is what tells those apart from a genuinely
    // unnamed control nested inside a labelled container.
    final inherited = data.label.trim().isEmpty
        ? named
        : [...named, (rect: node.rect, label: data.label)];
    node.visitChildren((child) {
      walk(child, inherited);
      return true;
    });
  }

  walk(root, const []);
  return out;
}

/// The rules. Pure functions over the flattened tree, so the poison fixtures at
/// the bottom run exactly the same code the sweep does.
List<Violation> grade(String demo, String locale, List<Announced> tree) {
  final out = <Violation>[];
  final persian = locale.startsWith('fa');
  for (final node in tree) {
    if (node.hidden) continue;
    final announced = [node.label, node.value, node.hint, node.increased, node.decreased];
    final spoken = announced.where((s) => s.isNotEmpty).toList();

    // 1. NAMED CONTROLS — an interactive node without a name is announced as
    //    its role alone: "button". The single most common accessibility defect,
    //    and the reason every announced string in this library is required.
    if (node.interactive && node.label.trim().isEmpty && node.value.trim().isEmpty && !node.namedByAncestor) {
      out.add((rule: 'named-controls', demo: demo, detail: 'an interactive node has no label and no value'));
    }

    // 2. PERSIAN DIGITS — a bare Latin digit in an announced string under fa is
    //    the `formatNumber` rule failing where it is heard rather than seen.
    if (persian) {
      for (final s in spoken) {
        if (RegExp(r'[0-9]').hasMatch(s)) {
          out.add((rule: 'persian-digits', demo: demo, detail: 'Latin digits announced under fa-IR: "$s"'));
          break;
        }
      }
    }

    // 3. ENGINE ENGLISH — a word Material supplies in English, announced to a
    //    Persian reader. Source scanning cannot see these; only the tree can.
    if (persian) {
      for (final s in spoken) {
        for (final word in kEngineEnglish) {
          if (RegExp('\\b$word\\b', caseSensitive: false).hasMatch(s)) {
            out.add((rule: 'engine-english', demo: demo, detail: 'English UI word "$word" announced under fa-IR: "$s"'));
            break;
          }
        }
      }
    }

    // 4. ANNOUNCED ONCE — the same string as both name and hint (or value) is
    //    read twice in a row. This is not hypothetical: nine families once
    //    carried an error message as both its own node and the field's hint.
    if (node.label.isNotEmpty) {
      if (node.label == node.hint) {
        out.add((rule: 'announced-once', demo: demo, detail: 'label and hint are the same string: "${node.label}"'));
      }
      if (node.label == node.value) {
        out.add((rule: 'announced-once', demo: demo, detail: 'label and value are the same string: "${node.label}"'));
      }
    }
  }
  return out;
}

/// Announcements allowed to break a rule, keyed `<demo>/<rule>`, each with the
/// reason. The web has the same escape and spells it in the markup — a
/// `data-lumo-latn` island says "this run is a code, not language". A Flutter
/// semantics tree has no such marker, so the exception is written here instead,
/// where it has to be justified in words.
const kExemptions = <String, String>{
  'text-field-3/persian-digits':
      'a bank card number is a CODE, not a quantity: its digits are Latin because the '
          'card is, and localising them would change the number a reader is meant to read back.',
};

/// Ratchets, measured 17 Aug 2026, expressed as the SHARE of demos that miss —
/// not a count. A count rises whenever a demo is added, even when nothing got
/// worse, which makes it a number people raise rather than a floor people hold.
/// A share only rises when the new demos are worse than the ones already there.
///
/// These are not targets and not excuses — they are the honest number. Lumo's
/// control scale is 29/36/44dp, generated from the web's `--lumo-ref-control-*`,
/// and it was designed for a pointer: only `lg` reaches iOS's 44pt minimum and
/// nothing reaches Android's 48dp. Raising the scale is a SHARED-TOKEN decision
/// that moves the web too, so it is the owner's call, not a test's — recorded in
/// `docs/goals.md` Tier M item M8. Until then the share may not grow.
///
/// The contrast misses are WCAG AA (4.5:1) on small text: `fgMuted` and
/// `fgSubtle` on a surface measure as low as 3.46:1 at 12px.
///
/// **The contrast ceiling is KNOWN-OPTIMISTIC on the host, and is a regression
/// tripwire rather than the real figure.** `MinimumTextContrastGuideline`
/// samples painted pixels, and the host paints a substitute font at a device
/// pixel ratio of 1. The same rules on a real iPhone at dpr 3 (18 Aug 2026)
/// reported **74 of 120 demos failing against 39 here** — roughly double, and
/// in the reassuring direction. Cite `docs/evidence/mobile-device.md` for what
/// the library actually does; cite this number only for "did it get worse".
/// Re-measured 17 Aug 2026 over 118 demos: 48 / 72 / 38. The Android figure sat
/// exactly on the old 0.61 boundary once six demos were added, which is the
/// ceiling doing its job — it is set from a measurement, not rounded to a number
/// that felt tidy.
const kIosTapCeiling = 0.41;
const kAndroidTapCeiling = 0.62;
const kContrastCeiling = 0.33;

final iosTapMisses = <String>{};
final androidTapMisses = <String>{};
final contrastMisses = <String>{};

