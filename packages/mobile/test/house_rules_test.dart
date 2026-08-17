import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

/// **Defect-class guards over the SOURCE of `lib/src/`.** Five of them:
///
///  1. elevation comes from the token, never a hand-rolled `BoxShadow`
///  2. an animating family consults «reduce motion»
///  3. a validation error is never silent
///  4. no `assert` on a collection's length in a `const` constructor
///  5. a corner radius comes from `LumoRadius`, never a bare number
///
/// What they have in common is that every one of these defects is INVISIBLE at
/// runtime on the machine that introduces it. A scheme-blind shadow looks fine
/// in light mode. An animation that ignores «reduce motion» looks fine to a
/// developer who has never turned it on. A radius typed as `4` looks like a
/// radius. None of them shows up in a screenshot diff, and none is something a
/// per-family test gets written for, because the family that has the bug is the
/// one nobody suspected.
///
/// So they are swept over the whole directory rather than asserted family by
/// family — which also means a family added TOMORROW is covered without anyone
/// remembering to opt it in. That is the whole point: the ten motion fixes in
/// one pass were found by a grep, and two MORE non-compliant families
/// (`navigation_bar`, `navigation_drawer`) landed from another workstream while
/// those fixes were being written. A guard catches the next one; ten fixes do
/// not. Rule 5 proved it again the day it was added, catching a chart swatch the
/// hand-audit had walked straight past.
///
/// They are deliberately CHEAP static checks. They cannot prove an animation is
/// correct, only that the family consulted the platform at all — which is exactly
/// the line between "someone thought about it" and "nobody did".
///
/// A rule that needs an escape hatch carries a `const exemptions` map naming the
/// file AND the reason, so an exception is a sentence somebody wrote, not a
/// silently-skipped path.
File _f(String name) => File('lib/src/$name');

Iterable<File> _libSources() => Directory('lib/src')
    .listSync()
    .whereType<File>()
    .where((f) => f.path.endsWith('.dart'))
    .where((f) => !f.path.endsWith('tokens.g.dart'));

String _name(File f) => f.uri.pathSegments.last;

void main() {
  group('elevation comes from the token, never hand-picked', () {
    // WHY: `tokens.css` carries three elevation tiers with SEPARATE dark ramps,
    // because "a black shadow on the dark page is arithmetically close to a
    // no-op" — raised is 0.06/0.10 alpha on light but 0.30/0.40 on dark. A
    // hand-rolled `BoxShadow` cannot express that: it is one alpha for both
    // schemes, so it necessarily reads on one and vanishes on the other. That is
    // exactly the defect found in `card.dart` (an elevated card was invisible on
    // dark, drawn as `c.scrim` at 12% in both schemes).
    //
    // `c.scrim` is also the wrong ROLE: scrim is the modal backdrop, not an
    // elevation colour.

    /// Files allowed to spell a `BoxShadow` by hand, and WHY. A shadow is not
    /// always elevation — this list is for the ones that are something else.
    const exemptions = <String, String>{
      'otp_field.dart':
          'a FOCUS RING, not elevation: an accent glow at LumoFocus.width spread, '
          'drawn as a BoxShadow because Flutter has no outline-offset. It is already '
          'scheme-aware (c.accent comes from the scope) and no elevation tier fits it.',
    };

    for (final file in _libSources()) {
      final name = _name(file);
      test(name, () {
        final src = file.readAsStringSync();
        if (!src.contains('BoxShadow(')) return;

        final why = exemptions[name];
        expect(why, isNotNull,
            reason: '$name spells a BoxShadow by hand. Use LumoShadow.raised/.overlay/.modal '
                '(from tokens.g.dart, generated from tokens.css) with '
                'LumoScope.of(context).brightness — the tiers are named for the JOB: '
                'raised = a card lifted off the page, overlay = popover/menu/select/toast, '
                'modal = dialog/sheet/drawer. If this shadow is genuinely not elevation, '
                'add it to `exemptions` with the reason.');
      });
    }

    test('the shadow tokens carry a genuinely different dark ramp', () {
      // The guard above is worthless if the token itself is scheme-blind.
      final tokens = _f('tokens.g.dart').readAsStringSync();
      for (final tier in ['raised', 'overlay', 'modal']) {
        expect(tokens, contains('List<BoxShadow> $tier(Brightness brightness)'),
            reason: 'the $tier tier must take a Brightness — that is what makes it scheme-aware');
      }
      // Light `raised` is 0x0F/0x1A; dark is 0x4D/0x66. If a regenerate ever
      // collapsed the two ramps, this pins the failure.
      expect(tokens, contains('0x4D000000'), reason: 'the dark raised ramp');
      expect(tokens, contains('0x0F000000'), reason: 'the light raised ramp');
    });
  });

  group('an animation consults «reduce motion»', () {
    // WHY: the Khroos app — a real ~60-screen consumer of this library — HAND-ROLLED
    // `kDur(context, d) => kMotion(context) ? d : const Duration(milliseconds: 1)`
    // wrapping `MediaQuery.disableAnimationsOf`, because the library was not
    // consistent about it. A consumer writing their own accessibility helper is the
    // clearest possible evidence of a library gap, and it is what promoted this from
    // a nice-to-have to a guarded rule.

    /// Anything that moves pixels over time.
    final animationApis = RegExp(
      r'Animated[A-Z][A-Za-z]*\(|AnimationController|TweenAnimationBuilder|'
      r'FadeTransition|SlideTransition|ScaleTransition|SizeTransition|RotationTransition|'
      r'transitionDuration:',
    );

    for (final file in _libSources()) {
      final name = _name(file);
      test(name, () {
        final src = file.readAsStringSync();
        if (!animationApis.hasMatch(src)) return;

        expect(src, contains('disableAnimationsOf'),
            reason: '$name animates but never consults MediaQuery.disableAnimationsOf. '
                'Collapse the duration to Duration.zero when animations are disabled — '
                'the spelling the house already uses in disclosure.dart, card.dart, '
                'carousel.dart, progress.dart and skeleton.dart. The element must still '
                'reach its end STATE; it just arrives at once.');
      });
    }

    test('the sweep actually matches something (the guard has teeth)', () {
      // A regex that silently stopped matching would make every test above vacuous.
      final animating = _libSources().where((f) => animationApis.hasMatch(f.readAsStringSync())).map(_name).toList();
      expect(animating.length, greaterThan(10),
          reason: 'this library animates in well over ten families; '
              'if this count collapsed, the regex broke rather than the library changing');
      expect(animating, contains('disclosure.dart'));
    });
  });

  group('a validation error is never silent', () {
    // WHY: `Semantics(liveRegion: true, child: ExcludeSemantics(child: Text(msg)))`
    // reads as obviously correct and does NOTHING — `ExcludeSemantics` strips the
    // subtree, so the live node fires with an empty name. It was found in one
    // family and was in NINE. But the naive fix (drop the exclusion) is ALSO wrong
    // here: eight of those nine already fold `errorMessage` into the field's
    // semantic `hint`, so un-excluding made the message announce TWICE, which
    // their own tests caught.
    //
    // So the rule this guards is the OUTCOME, not the mechanism: a component given
    // an `errorMessage` must announce it — through the field's hint, or through a
    // live region that actually carries the words — and must not announce it twice.
    // The structural half below then bans the one spelling that can never announce
    // anything, which is the form that spread by copy-paste.

    test('no ExcludeSemantics sits directly under a liveRegion', () {
      // Cheap, and covers families added after this was written.
      final pattern = RegExp(r'liveRegion:\s*true,\s*(\n\s*)?child:\s*ExcludeSemantics');
      final offenders = <String>[];
      for (final f in _libSources()) {
        if (pattern.hasMatch(f.readAsStringSync())) offenders.add(_name(f));
      }
      expect(offenders, isEmpty,
          reason: 'a live region announces its SUBTREE; excluding that subtree leaves it announcing '
              'nothing. Either let the node carry the words (combobox.dart\'s emptyLabel), or — if '
              'the field\'s hint already says it — drop the liveRegion and keep the ExcludeSemantics.');
    });

    const msg = 'شمارهٔ واردشده معتبر نیست';

    final withError = <String, Widget Function()>{
      'LumoTextField': () => const LumoTextField(label: 'نام', errorMessage: msg),
      'LumoTextArea': () => const LumoTextArea(label: 'توضیح', errorMessage: msg),
      'LumoSearchField': () => LumoSearchField(label: 'جستجو', clearLabel: 'پاک', errorMessage: msg, onChanged: (_) {}),
      'LumoCombobox': () => LumoCombobox(
            label: 'شهر',
            suggestionsLabel: 'پیشنهادها',
            emptyLabel: 'خالی',
            clearLabel: 'پاک',
            errorMessage: msg,
            onChanged: (_) {},
            options: const [LumoComboboxOption(id: 'a', label: 'تهران')],
          ),
      'LumoMultiSelect': () => LumoMultiSelect(
            label: 'شهرها',
            closeLabel: 'بستن',
            confirmLabel: 'تایید',
            clearAllLabel: 'پاک',
            countLabel: (n) => 'تعداد',
            removeLabel: (t) => 'حذف $t',
            values: const [],
            errorMessage: msg,
            onChanged: (_) {},
            options: const [LumoMultiSelectOption(id: 'a', label: 'تهران')],
          ),
      'LumoPhoneInput': () => LumoPhoneInput(
            label: 'تلفن',
            countryLabel: 'کشور',
            closeLabel: 'بستن',
            searchLabel: 'جستجو',
            errorMessage: msg,
            onChanged: (_) {},
          ),
      'LumoSlider': () => LumoSlider(label: 'قیمت', value: 0.5, valueLabel: (v) => '۵۰', errorMessage: msg, onChanged: (_) {}),
      'LumoTimeField': () => const LumoTimeField(
            label: 'ساعت',
            openLabel: 'باز کردن',
            closeLabel: 'بستن',
            hourLabel: 'ساعت',
            minuteLabel: 'دقیقه',
            errorMessage: msg,
          ),
    };

    withError.forEach((name, build) {
      testWidgets('$name announces its errorMessage exactly once', (tester) async {
        final handle = tester.ensureSemantics();
        await tester.pumpWidget(MaterialApp(
          theme: lumoThemeData(brightness: Brightness.light),
          home: LumoScope(
            locale: 'fa-IR',
            brightness: Brightness.light,
            child: Scaffold(body: Center(child: SizedBox(width: 360, child: build()))),
          ),
        ));
        await tester.pumpAndSettle();

        // Count every channel a reader could hear the message on.
        var carriers = 0;
        void visit(SemanticsNode node) {
          final d = node.getSemanticsData();
          if (d.label.contains(msg) || d.hint.contains(msg) || d.value.contains(msg)) carriers++;
          node.visitChildren((c) {
            visit(c);
            return true;
          });
        }
        visit(tester.getSemantics(find.byType(MaterialApp)));

        expect(carriers, greaterThan(0),
            reason: '$name PAINTS «$msg» but no semantics node carries it. A validation error that '
                'is drawn and not announced is silence for a screen-reader user.');
        expect(carriers, 1,
            reason: '$name announces «$msg» on $carriers nodes. Contract §5: a string is announced ONCE.');
        handle.dispose();
      });
    });
  });

  test('no const constructor asserts on a collection length', () {
    // WHY: `List.length` is not a constant expression, so an assert that reads it
    // inside a CONST constructor makes every `const LumoX(...)` call site a hard
    // compile error — "The property 'length' can't be accessed on the type
    // 'List<…>' in a constant expression" — for VALID arguments too. The check
    // therefore never runs on the bad input it was written for, and breaks the
    // good input instead. Verified empirically against `LumoDonutChart`.
    //
    // `String.length` IS const-evaluable and stays legal: a violating const site
    // is caught at compile time, which is the behaviour you want.
    //
    // The fix is the house precedent in `segmented_control.dart`, `color_input.dart`
    // and `select.dart`: assert in `build()` instead.
    final offenders = <String>[];
    // The constructor's initializer list: from `})  :` (or `) :`) up to the `;`.
    final initializerList = RegExp(r'\}\s*\)\s*:\s*(.*?);', dotAll: true);
    for (final f in _libSources()) {
      final src = f.readAsStringSync();
      for (final m in initializerList.allMatches(src)) {
        final body = m.group(1)!;
        if (!body.contains('assert(')) continue;
        // Which identifiers in this file are declared as List fields?
        for (final listField in RegExp(r'final\s+List<[^>]+>\s+(\w+);').allMatches(src).map((x) => x.group(1)!)) {
          if (RegExp('\\b$listField\\.(length|isEmpty|isNotEmpty)\\b').hasMatch(body)) {
            offenders.add('${_name(f)}: assert reads `$listField.length` in a const constructor');
          }
        }
      }
    }
    expect(offenders, isEmpty,
        reason: 'move the assert into build() — see segmented_control.dart. Offenders:\n${offenders.join('\n')}');
  });

  test('a corner radius comes from LumoRadius, never from a bare number', () {
    // WHY: the web renders SIX radius steps — the three `--lumo-sys-radius-*`
    // tokens plus `rounded-xl`, `rounded-2xl` and `rounded-full`, which for a
    // long time nothing mapped, so Tailwind's own defaults were what shipped.
    // Flutter had names for only the first three, so ten files spelled the rest
    // by hand: `BorderRadius.circular(999)` seventeen times, and `message.dart`
    // carried `Radius.circular(16)` for the web's `rounded-2xl` and
    // `Radius.circular(4)` for a corner its OWN COMMENT said was
    // `rounded-*-md` — 8. The comment was right and the number was wrong for
    // however long it had been there, and nothing could have caught it: a
    // number cannot disagree with a token it never referenced.
    //
    // Now all six are tokens on both platforms, so a bare number in a radius
    // position is either a step that does not exist in the design system or a
    // step that does and was retyped. Either way it drifts silently.
    //
    // Deliberately narrow: only radius CONSTRUCTORS are read, not every number.
    ///
    /// Files allowed a bare number, and WHY. The web has exactly one such
    /// exception too, spelled `rounded-[2px]` — so the list is a real category,
    /// not a place to park work.
    const exemptions = <String, String>{
      'chart.dart':
          'the legend swatch is 8px square and takes a 2px corner, BELOW the '
          'ramp on purpose: the smallest Lumo step on a chip that size is a '
          'circle, and a circle reads as a status dot. The web writes '
          '`rounded-[2px]` for the same reason.',
    };

    final offenders = <String>[];
    final radiusLiteral = RegExp(r'(?:BorderRadius|Radius)\.circular\(\s*([\d.]+)\s*\)');
    for (final f in _libSources()) {
      if (exemptions.containsKey(_name(f))) continue;
      for (final m in radiusLiteral.allMatches(f.readAsStringSync())) {
        offenders.add('${_name(f)}: ${m.group(0)} — use a LumoRadius step');
      }
    }
    expect(offenders, isEmpty,
        reason: 'radii come from LumoRadius (sm/md/lg/xl/xxl/full). Offenders:\n${offenders.join('\n')}');
  });
}
