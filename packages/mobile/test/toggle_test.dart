// Semantics-tree tests for the toggle family: a two-state BUTTON (`toggled`
// alongside `isButton`, which is what separates it from LumoSwitch), a name
// that does not change with the state, the group named by `label` with each
// member announced `toggled` (never `selected` — that is the segmented
// control), single and multiple selection, and the house `_fit` rule that a
// cramped strip sheds padding and icons before it truncates a word.
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart' show RenderParagraph, SemanticsAction;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

void main() {
  testWidgets('Toggle: a two-state BUTTON — `toggled` AND `isButton`, unlike LumoSwitch, which is toggled and not a button', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', Column(mainAxisSize: MainAxisSize.min, children: [
      LumoToggle(label: 'بی‌صدا', defaultSelected: true, onChanged: (_) {}),
      LumoSwitch(label: 'اعلان‌ها', isSelected: true, onChanged: (_) {}),
    ])));
    final toggle = tester.getSemantics(find.byType(LumoToggle)).getSemanticsData();
    expect(toggle.flagsCollection.isButton, isTrue);
    expect(toggle.flagsCollection.hasToggledState, isTrue);
    expect(toggle.flagsCollection.isToggled, isTrue);
    expect(toggle.label, 'بی‌صدا');
    final aSwitch = tester.getSemantics(find.byType(LumoSwitch)).getSemanticsData();
    expect(aSwitch.flagsCollection.hasToggledState, isTrue);
    expect(aSwitch.flagsCollection.isButton, isFalse, reason: 'a switch is a setting, not a pressed button');
    // And the toggle says its name ONCE, where the switch (0.2.3) says it twice
    // — see the report: `switch.dart` labels its node AND draws an unexcluded
    // copy of the same string.
    expect(toggle.label.split('\n').length, 1);
    semantics.dispose();
  });

  testWidgets('Toggle: uncontrolled flips on tap and the NAME never changes with the state; controlled stays where the parent says', (tester) async {
    final semantics = tester.ensureSemantics();
    bool? reported;
    await tester.pumpWidget(app('fa-IR', LumoToggle(label: 'پررنگ', onChanged: (v) => reported = v)));
    expect(tester.getSemantics(find.byType(LumoToggle)).getSemanticsData().flagsCollection.isToggled, isFalse);
    await tester.tap(find.byType(LumoToggle));
    await tester.pump();
    expect(reported, isTrue);
    expect(tester.getSemantics(find.byType(LumoToggle)).getSemanticsData().flagsCollection.isToggled, isTrue);
    // The same name in both states — a voice-control user must be able to say it twice.
    expect(tester.getSemantics(find.byType(LumoToggle)).getSemanticsData().label, 'پررنگ');
    expect(find.bySemanticsLabel('پررنگ'), findsOneWidget);
    expect(find.text('پررنگ'), findsOneWidget);

    await tester.pumpWidget(app('fa-IR', LumoToggle(label: 'پررنگ', isSelected: false, onChanged: (v) => reported = v)));
    await tester.tap(find.byType(LumoToggle));
    await tester.pump();
    expect(reported, isTrue);
    expect(tester.getSemantics(find.byType(LumoToggle)).getSemanticsData().flagsCollection.isToggled, isFalse, reason: 'controlled: the parent did not move it');
    semantics.dispose();
  });

  testWidgets('Toggle: icon-only keeps its name for the reader and draws nothing else; disabled has no tap; the ON fill is the accent TINT', (tester) async {
    final semantics = tester.ensureSemantics();
    var taps = 0;
    await tester.pumpWidget(app('fa-IR', Column(mainAxisSize: MainAxisSize.min, children: [
      LumoToggle(label: 'ذخیره در نشان‌ها', icon: const Icon(Icons.bookmark), iconOnly: true, isSelected: true, onChanged: (_) {}),
      LumoToggle(label: 'بایگانی', isDisabled: true, onChanged: (_) => taps++),
    ])));
    expect(find.bySemanticsLabel('ذخیره در نشان‌ها'), findsOneWidget);
    expect(find.text('ذخیره در نشان‌ها'), findsNothing);
    expect(find.byIcon(Icons.bookmark), findsOneWidget);
    final off = tester.getSemantics(find.byType(LumoToggle).last).getSemanticsData();
    expect(off.flagsCollection.isEnabled, isFalse);
    expect(off.hasAction(SemanticsAction.tap), isFalse);
    await tester.tap(find.text('بایگانی'), warnIfMissed: false);
    expect(taps, 0);

    final c = LumoScope.of(tester.element(find.byType(LumoToggle).first)).colours;
    final deco = tester.widget<AnimatedContainer>(find.descendant(of: find.byType(LumoToggle).first, matching: find.byType(AnimatedContainer))).decoration! as BoxDecoration;
    expect(deco.color, c.accent.withValues(alpha: 0.1), reason: 'a standalone toggle ON is the accent tint, not the solid accent');
    expect(() => LumoToggle(label: 'x', iconOnly: true, onChanged: (_) {}), throwsAssertionError);
    semantics.dispose();
  });

  testWidgets('ToggleGroup: the group is named by `label` (announced, not drawn); every member is announced `toggled`; single mode replaces', (tester) async {
    final semantics = tester.ensureSemantics();
    Set<String>? reported;
    await tester.pumpWidget(app('fa-IR', SizedBox(width: 320, child: LumoToggleGroup(
      label: 'چیدمان',
      defaultValue: 'list',
      onChanged: (v) => reported = v,
      items: const [
        LumoToggleItem(id: 'list', label: 'فهرست'),
        LumoToggleItem(id: 'grid', label: 'شبکه'),
      ],
    ))));
    expect(find.bySemanticsLabel('چیدمان'), findsOneWidget);
    expect(find.text('چیدمان'), findsNothing);
    expect(
      tester.getSemantics(find.bySemanticsLabel('فهرست')),
      matchesSemantics(label: 'فهرست', isButton: true, hasToggledState: true, isToggled: true, hasEnabledState: true, isEnabled: true, hasTapAction: true),
    );
    expect(tester.getSemantics(find.bySemanticsLabel('شبکه')).getSemanticsData().flagsCollection.isToggled, isFalse);
    await tester.tap(find.text('شبکه'));
    await tester.pump();
    expect(reported, {'grid'});
    expect(tester.getSemantics(find.bySemanticsLabel('فهرست')).getSemanticsData().flagsCollection.isToggled, isFalse);
    // A member's ON state is the SOLID accent — not the standalone toggle's tint.
    final c = LumoScope.of(tester.element(find.text('شبکه'))).colours;
    final member = tester.widget<AnimatedContainer>(find.ancestor(of: find.text('شبکه'), matching: find.byType(AnimatedContainer)).first).decoration! as BoxDecoration;
    expect(member.color, c.accent);
    semantics.dispose();
  });

  testWidgets('ToggleGroup: multiple accumulates and disallowEmptySelection keeps the last key; the first member sits at the reading START in both directions', (tester) async {
    final semantics = tester.ensureSemantics();
    Set<String>? reported;
    for (final locale in ['fa-IR', 'en-US']) {
      final rtl = locale == 'fa-IR';
      final first = rtl ? 'پررنگ' : 'Bold';
      final second = rtl ? 'کج' : 'Italic';
      await tester.pumpWidget(app(locale, SizedBox(width: 320, child: LumoToggleGroup(
        key: ValueKey(locale),
        label: rtl ? 'قالب متن' : 'Text format',
        selectionMode: LumoToggleSelectionMode.multiple,
        disallowEmptySelection: true,
        defaultValues: const {'bold'},
        onChanged: (v) => reported = v,
        items: [LumoToggleItem(id: 'bold', label: first), LumoToggleItem(id: 'italic', label: second)],
      ))));
      final strip = tester.getRect(find.byType(LumoToggleGroup));
      expect(rtl ? tester.getCenter(find.text(first)).dx > strip.center.dx : tester.getCenter(find.text(first)).dx < strip.center.dx, isTrue,
          reason: '$locale: the first member sits at the reading start');
      await tester.tap(find.text(second));
      await tester.pump();
      expect(reported, {'bold', 'italic'});
      await tester.tap(find.text(second));
      await tester.pump();
      expect(reported, {'bold'});
      // The floor: the last key cannot be removed.
      await tester.tap(find.text(first));
      await tester.pump();
      expect(reported, {'bold'});
    }
    semantics.dispose();
  });

  testWidgets('ToggleGroup: a disabled group and a disabled member have no tap; contradictory selection props are refused at construction', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const SizedBox(width: 320, child: LumoToggleGroup(
      label: 'چیدمان',
      items: [LumoToggleItem(id: 'a', label: 'الف'), LumoToggleItem(id: 'b', label: 'ب', isDisabled: true)],
    ))));
    expect(tester.getSemantics(find.bySemanticsLabel('ب')).getSemanticsData().hasAction(SemanticsAction.tap), isFalse);
    await tester.pumpWidget(app('fa-IR', const SizedBox(width: 320, child: LumoToggleGroup(
      label: 'چیدمان',
      isDisabled: true,
      items: [LumoToggleItem(id: 'a', label: 'الف'), LumoToggleItem(id: 'b', label: 'ب')],
    ))));
    expect(tester.getSemantics(find.bySemanticsLabel('الف')).getSemanticsData().hasAction(SemanticsAction.tap), isFalse);

    expect(() => LumoToggleGroup(label: 'x', items: const [], value: 'a', values: const {'a'}), throwsAssertionError);
    expect(() => LumoToggleGroup(label: 'x', items: const [], selectionMode: LumoToggleSelectionMode.multiple, value: 'a'), throwsAssertionError);
    expect(() => LumoToggleGroup(label: 'x', items: const [], selectionMode: LumoToggleSelectionMode.multiple, defaultValue: 'a'), throwsAssertionError);
    semantics.dispose();
  });

  testWidgets('a narrow toggle group sheds its padding, then its icons, instead of truncating a label', (tester) async {
    for (final width in [320.0, 240.0, 200.0]) {
      await tester.pumpWidget(app('fa-IR', SizedBox(
        width: width,
        child: LumoToggleGroup(
          label: 'نمای نتایج',
          value: 'list',
          onChanged: (_) {},
          items: const [
            LumoToggleItem(id: 'list', label: 'فهرست', icon: Icon(Icons.list)),
            LumoToggleItem(id: 'map', label: 'نقشه', icon: Icon(Icons.map)),
          ],
        ),
      )));
      for (final label in ['فهرست', 'نقشه']) {
        final paragraph = tester.renderObject<RenderParagraph>(find.text(label));
        expect(paragraph.didExceedMaxLines, isFalse, reason: '«$label» must render whole at ${width}px, not ellipsize');
      }
    }
  });
  testWidgets('Toggle: under disableAnimations the ON fill ARRIVES in ONE frame — standalone and as a group member', (tester) async {
    Widget build({required bool on, required bool reduce}) => MaterialApp(
          theme: lumoThemeData(brightness: Brightness.light),
          home: MediaQuery(
            data: MediaQueryData(disableAnimations: reduce),
            child: LumoScope(locale: 'fa-IR', brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: Column(mainAxisSize: MainAxisSize.min, children: [
              LumoToggle(label: 'بی‌صدا', isSelected: on),
              LumoToggleGroup(label: 'چیدمان', value: on ? 'grid' : 'list', items: const [
                LumoToggleItem(id: 'list', label: 'فهرست'),
                LumoToggleItem(id: 'grid', label: 'شبکه'),
              ]),
            ]))))),
          ),
        );
    Color fillOf(Finder of) {
      final container = tester.widget<Container>(find.descendant(of: find.descendant(of: of, matching: find.byType(AnimatedContainer)), matching: find.byType(Container)).first);
      return container.color ?? (container.decoration! as BoxDecoration).color!;
    }
    Finder memberOf(String label) => find.ancestor(of: find.text(label), matching: find.byType(GestureDetector)).first;
    final c = lightColours(LumoBrand.achromatic);
    final toggleOn = c.accent.withValues(alpha: 0.1);

    // Sanity: WITH motion, one frame after the change neither fill has arrived.
    await tester.pumpWidget(build(on: false, reduce: false));
    await tester.pumpAndSettle();
    await tester.pumpWidget(build(on: true, reduce: false));
    await tester.pump();
    expect(fillOf(find.byType(LumoToggle)), isNot(toggleOn));
    expect(fillOf(memberOf('شبکه')), isNot(c.accent));
    await tester.pumpAndSettle();

    // Under «Reduce motion»: both fills are final on the next frame.
    await tester.pumpWidget(build(on: false, reduce: true));
    await tester.pumpAndSettle();
    await tester.pumpWidget(build(on: true, reduce: true));
    await tester.pump();
    expect(fillOf(find.byType(LumoToggle)), toggleOn);
    expect(fillOf(memberOf('شبکه')), c.accent);
  });

}
