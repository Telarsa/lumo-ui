// Dialog was the one overlay family with no semantics-tree test, and it had a
// defect because of that: the route's name existed TWICE in the tree (a
// `Semantics(label:)` wrapper above a visible `Text(label)`), so a reader heard
// the title, then heard it again. This file is why that cannot come back.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

/// Every node in the tree whose label contains [text].
int _nodesLabelled(WidgetTester tester, String text) {
  var count = 0;
  void walk(SemanticsNode node) {
    if (node.label.contains(text)) count++;
    node.visitChildren((child) {
      walk(child);
      return true;
    });
  }

  // The semantics owner hangs off the binding's own pipeline owner; the
  // `rootPipelineOwner` replacement owns no semantics tree in a widget test.
  // ignore: deprecated_member_use
  walk(tester.binding.pipelineOwner.semanticsOwner!.rootSemanticsNode!);
  return count;
}

void main() {
  testWidgets('fa-IR: opens from its trigger, names the route ONCE, ✕ named by closeLabel at the inline end, closes', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app(
      'fa-IR',
      Builder(
        builder: (context) => LumoDialogTrigger(
          label: 'حذف پروژه',
          closeLabel: 'بستن',
          description: 'این کار برگشت‌پذیر نیست.',
          trigger: (open) => LumoButton(onPressed: open, child: const Text('باز کردن')),
          actions: (ctx) => [LumoButton(variant: LumoButtonVariant.outline, onPressed: () => Navigator.of(ctx).pop(), child: const Text('انصراف'))],
        ),
      ),
    ));
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();

    expect(find.text('حذف پروژه'), findsOneWidget);
    expect(find.text('این کار برگشت‌پذیر نیست.'), findsOneWidget);
    // The title is in the tree exactly once — the defect this file exists for.
    expect(_nodesLabelled(tester, 'حذف پروژه'), 1, reason: 'the dialog name must be announced once, not once per wrapper');

    // The ✕ is named by closeLabel and sits at the inline end (left under fa-IR).
    final close = find.descendant(of: find.byType(Dialog), matching: find.bySemanticsLabel('بستن'));
    expect(close, findsOneWidget);
    final card = tester.getRect(find.byType(Dialog));
    expect(tester.getCenter(close).dx < card.center.dx, isTrue, reason: 'the ✕ sits at the inline end = left under fa-IR');

    // The route inherits the scope's direction, which routes forget by default.
    expect(Directionality.of(tester.element(find.text('حذف پروژه'))), TextDirection.rtl);

    await tester.tap(find.text('انصراف'));
    await tester.pumpAndSettle();
    expect(find.text('حذف پروژه'), findsNothing);
    semantics.dispose();
  });

  testWidgets('en-US: the ✕ sits at the inline end (right), and the imperative form returns its result', (tester) async {
    final semantics = tester.ensureSemantics();
    String? answer;
    await tester.pumpWidget(app(
      'en-US',
      Builder(
        builder: (context) => LumoButton(
          onPressed: () async {
            answer = await showLumoDialog<String>(
              context,
              label: 'Delete project',
              closeLabel: 'Close',
              description: 'This cannot be undone.',
              actions: (ctx) => [LumoButton(onPressed: () => Navigator.of(ctx).pop('deleted'), child: const Text('Delete'))],
            );
          },
          child: const Text('Open'),
        ),
      ),
    ));
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();

    final close = find.descendant(of: find.byType(Dialog), matching: find.bySemanticsLabel('Close'));
    final card = tester.getRect(find.byType(Dialog));
    expect(tester.getCenter(close).dx > card.center.dx, isTrue, reason: 'the ✕ sits at the inline end = right under en-US');
    expect(_nodesLabelled(tester, 'Delete project'), 1);

    await tester.tap(find.text('Delete'));
    await tester.pumpAndSettle();
    expect(answer, 'deleted', reason: 'the imperative form hands the caller the action it took');
    semantics.dispose();
  });

  testWidgets('the ✕ closes it, and the dialog carries no English platform name', (tester) async {
    await tester.pumpWidget(app(
      'fa-IR',
      Builder(
        builder: (context) => LumoDialogTrigger(
          label: 'حذف پروژه',
          closeLabel: 'بستن',
          trigger: (open) => LumoButton(onPressed: open, child: const Text('باز کردن')),
          actions: (ctx) => const [],
        ),
      ),
    ));
    await tester.tap(find.text('باز کردن'));
    await tester.pumpAndSettle();
    // Material would name its own barrier «Dismiss» and its route «Dialog».
    expect(find.bySemanticsLabel(RegExp('Dismiss')), findsNothing);
    expect(find.bySemanticsLabel('Dialog'), findsNothing);

    await tester.tap(find.descendant(of: find.byType(Dialog), matching: find.bySemanticsLabel('بستن')));
    await tester.pumpAndSettle();
    expect(find.text('حذف پروژه'), findsNothing);
  });
}
