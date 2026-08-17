// Tags input: the field is named ONCE and carries its own description and
// error as its hint; every tag's ✕ is named with THAT tag's words; a refused
// addition says why instead of doing nothing; and the run of tags mirrors.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Align(alignment: Alignment.topCenter, child: SizedBox(width: 360, child: child)))),
    );

/// A stateful host, because the tag list is controlled.
class Host extends StatefulWidget {
  const Host({super.key, required this.initial, required this.build, this.onChanged});
  final List<String> initial;
  final Widget Function(List<String> values, ValueChanged<List<String>> onChanged) build;
  final ValueChanged<List<String>>? onChanged;

  @override
  State<Host> createState() => HostState();
}

class HostState extends State<Host> {
  late List<String> values = List<String>.of(widget.initial);

  @override
  Widget build(BuildContext context) => widget.build(values, (next) {
        setState(() => values = next);
        widget.onChanged?.call(next);
      });
}

void main() {
  testWidgets('TagsInput fa-IR: one named text field carrying its description, the ✚ named, each tag’s ✕ named with that tag’s words, and the run mirrors', (tester) async {
    final semantics = tester.ensureSemantics();
    final host = GlobalKey<HostState>();
    await tester.pumpWidget(app('fa-IR', Host(
      key: host,
      initial: const ['تهران'],
      build: (values, onChanged) => LumoTagsInput(
        label: 'مهارت‌ها',
        description: 'با ویرگول جدا کنید',
        values: values,
        onChanged: onChanged,
        addLabel: 'افزودن مهارت',
        removeLabel: (tag) => 'حذف $tag',
        placeholder: 'یک مهارت بنویسید',
      ),
    )));

    // ONE text-field node: the name, the description as its hint.
    final field = tester.getSemantics(find.byType(TextField)).getSemanticsData();
    expect(field.label, contains('مهارت‌ها'));
    expect(field.hint, 'با ویرگول جدا کنید');
    expect(field.flagsCollection.isTextField, isTrue);
    // The name is in the tree once — the drawn label is excluded.
    expect(find.bySemanticsLabel('مهارت‌ها'), findsOneWidget);
    // The ✚ and the ✕ are both named; neither is a bare glyph.
    expect(find.bySemanticsLabel('افزودن مهارت'), findsOneWidget);
    expect(find.bySemanticsLabel('حذف تهران'), findsOneWidget);

    // Add through the ✚.
    await tester.enterText(find.byType(TextField), 'کرج');
    await tester.tap(find.bySemanticsLabel('افزودن مهارت'));
    await tester.pumpAndSettle();
    expect(host.currentState!.values, ['تهران', 'کرج']);
    expect(find.bySemanticsLabel('حذف کرج'), findsOneWidget);
    expect(find.text('کرج'), findsOneWidget, reason: 'the draft was cleared into a chip, not left in the box');

    // The run of tags mirrors: the first tag is the rightmost under fa-IR.
    expect(tester.getCenter(find.text('تهران')).dx > tester.getCenter(find.text('کرج')).dx, isTrue);

    // Remove through that tag's own ✕.
    await tester.tap(find.bySemanticsLabel('حذف تهران'));
    await tester.pumpAndSettle();
    expect(host.currentState!.values, ['کرج']);
    semantics.dispose();
  });

  testWidgets('TagsInput fa-IR: the keyboard’s action key commits, and a separator splits one entry into several', (tester) async {
    final host = GlobalKey<HostState>();
    await tester.pumpWidget(app('fa-IR', Host(
      key: host,
      initial: const [],
      build: (values, onChanged) => LumoTagsInput(
        label: 'مهارت‌ها',
        values: values,
        onChanged: onChanged,
        addLabel: 'افزودن مهارت',
        removeLabel: (tag) => 'حذف $tag',
      ),
    )));

    await tester.enterText(find.byType(TextField), 'برق, لوله‌کشی ,');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();
    expect(host.currentState!.values, ['برق', 'لوله‌کشی'], reason: 'split on the separator, trimmed, empties dropped');
  });

  testWidgets('TagsInput fa-IR: a duplicate and a full field are REFUSED and say why, on a live node', (tester) async {
    final semantics = tester.ensureSemantics();
    final host = GlobalKey<HostState>();
    await tester.pumpWidget(app('fa-IR', Host(
      key: host,
      initial: const ['تهران'],
      build: (values, onChanged) => LumoTagsInput(
        label: 'شهرها',
        values: values,
        onChanged: onChanged,
        addLabel: 'افزودن شهر',
        removeLabel: (tag) => 'حذف $tag',
        maxTags: 2,
        duplicateMessage: 'این شهر قبلاً اضافه شده.',
        maxTagsMessage: 'بیشتر از دو شهر نمی‌شود.',
      ),
    )));

    await tester.enterText(find.byType(TextField), 'تهران');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();
    expect(host.currentState!.values, ['تهران'], reason: 'a duplicate is not added');
    expect(tester.getSemantics(find.text('این شهر قبلاً اضافه شده.')), containsSemantics(label: 'این شهر قبلاً اضافه شده.', isLiveRegion: true));

    // Fill to the cap; the ✚ then goes disabled and the cap says so.
    await tester.enterText(find.byType(TextField), 'کرج');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();
    expect(host.currentState!.values, ['تهران', 'کرج']);
    expect(find.text('این شهر قبلاً اضافه شده.'), findsNothing, reason: 'a successful addition clears the last refusal');
    expect(tester.getSemantics(find.bySemanticsLabel('افزودن شهر')).getSemanticsData().flagsCollection.isEnabled, isFalse);
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().flagsCollection.isEnabled, isFalse, reason: 'a full field takes no more typing');
    semantics.dispose();
  });

  testWidgets('TagsInput en-US: the error is the FIELD’s own hint and the run starts at the left', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', Host(
      initial: const ['Tehran', 'Karaj'],
      build: (values, onChanged) => LumoTagsInput(
        label: 'Skills',
        values: values,
        onChanged: onChanged,
        addLabel: 'Add a skill',
        removeLabel: (tag) => 'Remove $tag',
        errorMessage: 'Add at least three skills.',
      ),
    )));
    expect(tester.getSemantics(find.byType(TextField)).getSemanticsData().hint, 'Add at least three skills.');
    expect(find.bySemanticsLabel('Remove Tehran'), findsOneWidget);
    expect(tester.getCenter(find.text('Tehran')).dx < tester.getCenter(find.text('Karaj')).dx, isTrue, reason: 'mirrored: the first tag is the leftmost under en-US');
    semantics.dispose();
  });

  testWidgets('TagsInput: a zero cap is refused at construction, an empty separator list at build', (tester) async {
    expect(() => LumoTagsInput(label: 'x', values: const [], addLabel: 'a', removeLabel: (t) => t, maxTags: 0), throwsAssertionError);
    // A `length` check cannot live in a const constructor; it is checked at build.
    await tester.pumpWidget(app('fa-IR', LumoTagsInput(label: 'x', values: const [], addLabel: 'a', removeLabel: (t) => t, splitCharacters: const [])));
    expect(tester.takeException(), isAssertionError);
  });
}
