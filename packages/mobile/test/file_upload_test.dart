// File upload: a named group, a named button, and the list — no drop zone, no
// picker plugin. Every state the web has (pending, uploading, done, failed,
// disabled), and the row's geometry under fa-IR and en-US.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {double width = 360}) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: width, child: child)))),
    );

void main() {
  testWidgets('FileUpload fa-IR: the group is named once, the browse button is named and fires, the hint is its own node', (tester) async {
    final semantics = tester.ensureSemantics();
    var browsed = 0;
    await tester.pumpWidget(app('fa-IR', LumoFileUpload(
      label: 'تصویر کارت ملی',
      description: 'JPG یا PDF، حداکثر ۵ مگابایت',
      browseLabel: 'انتخاب پرونده',
      maxFilesLabel: 'حداکثر ۲ پرونده',
      onBrowse: () => browsed++,
    )));
    expect(Directionality.of(tester.element(find.text('انتخاب پرونده'))), TextDirection.rtl);
    // Visible AND announced, but heard exactly once: the visible copy is excluded.
    expect(find.text('تصویر کارت ملی'), findsOneWidget);
    expect(find.bySemanticsLabel('تصویر کارت ملی'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('انتخاب پرونده')), containsSemantics(label: 'انتخاب پرونده', isButton: true, hasEnabledState: true, isEnabled: true));
    expect(find.bySemanticsLabel('انتخاب پرونده'), findsOneWidget);
    expect(find.text('JPG یا PDF، حداکثر ۵ مگابایت'), findsOneWidget);
    expect(find.text('حداکثر ۲ پرونده'), findsOneWidget);
    await tester.tap(find.bySemanticsLabel('انتخاب پرونده'));
    expect(browsed, 1);
    semantics.dispose();
  });

  testWidgets('FileUpload: every attachment state — pending, uploading (a LumoProgress, silent), done, failed', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoFileUpload(
      label: 'مدارک',
      browseLabel: 'انتخاب پرونده',
      onBrowse: () {},
      files: const [
        LumoAttachment(name: 'کارت-ملی.jpg', sizeLabel: '۱٫۲ مگابایت', status: LumoAttachmentStatus.pending, statusLabel: 'در صف'),
        LumoAttachment(name: 'گزارش.pdf', sizeLabel: '۸۰۰ کیلوبایت', status: LumoAttachmentStatus.uploading, statusLabel: 'در حال بارگذاری', progress: 0.45, progressLabel: '۴۵٪'),
        LumoAttachment(name: 'photo.png', sizeLabel: '۲ مگابایت'),
        LumoAttachment(name: 'جواز.pdf', status: LumoAttachmentStatus.failed, statusLabel: 'ناموفق', errorMessage: 'حجم پرونده بیش از حد مجاز است'),
      ],
    )));
    // One node per row: name, size, state, value, error — in that order.
    expect(tester.getSemantics(find.byWidgetPredicate((w) => w is LumoAttachmentTile && w.file.name == 'کارت-ملی.jpg')).getSemanticsData().label, 'کارت-ملی.jpg\n۱٫۲ مگابایت\nدر صف');
    expect(tester.getSemantics(find.byWidgetPredicate((w) => w is LumoAttachmentTile && w.file.name == 'گزارش.pdf')).getSemanticsData().label, 'گزارش.pdf\n۸۰۰ کیلوبایت\nدر حال بارگذاری\n۴۵٪');
    expect(tester.getSemantics(find.byWidgetPredicate((w) => w is LumoAttachmentTile && w.file.name == 'photo.png')).getSemanticsData().label, 'photo.png\n۲ مگابایت');
    expect(tester.getSemantics(find.byWidgetPredicate((w) => w is LumoAttachmentTile && w.file.name == 'جواز.pdf')).getSemanticsData().label, 'جواز.pdf\nناموفق\nحجم پرونده بیش از حد مجاز است');
    // The bar is drawn, but it does not announce a second time: «در حال بارگذاری» is heard once.
    expect(find.byType(LumoProgress), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp('در حال بارگذاری')), findsOneWidget);
    // The failure is visible text, not just a red edge.
    expect(find.text('حجم پرونده بیش از حد مجاز است'), findsOneWidget);
    final c = LumoScope.of(tester.element(find.text('جواز.pdf'))).colours;
    BoxDecoration frame(String name) => tester.widget<Container>(find.ancestor(of: find.text(name), matching: find.byType(Container)).first).decoration! as BoxDecoration;
    expect((frame('جواز.pdf').border! as Border).top.color, c.critical.withValues(alpha: 0.4));
    expect((frame('photo.png').border! as Border).top.color, c.border);
    semantics.dispose();
  });

  testWidgets('FileUpload fa-IR: the ✕ is named per file, sits at the inline END (left), and removes by index', (tester) async {
    final semantics = tester.ensureSemantics();
    final dropped = <int>[];
    await tester.pumpWidget(app('fa-IR', LumoFileUpload(
      label: 'مدارک',
      browseLabel: 'انتخاب پرونده',
      onBrowse: () {},
      onRemove: dropped.add,
      removeLabel: (name) => 'حذف $name',
      files: const [
        LumoAttachment(name: 'کارت-ملی.jpg'),
        LumoAttachment(name: 'جواز.pdf'),
      ],
    )));
    expect(find.bySemanticsLabel('حذف کارت-ملی.jpg'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('حذف جواز.pdf')), containsSemantics(label: 'حذف جواز.pdf', isButton: true, hasEnabledState: true, isEnabled: true));
    final row = tester.getRect(find.byWidgetPredicate((w) => w is LumoAttachmentTile && w.file.name == 'جواز.pdf'));
    expect(tester.getCenter(find.bySemanticsLabel('حذف جواز.pdf')).dx, lessThan(row.center.dx), reason: 'the ✕ sits at the inline end = left under fa-IR');
    expect(tester.getCenter(find.text('جواز.pdf')).dx, greaterThan(row.center.dx), reason: 'the name starts at the reading edge = right under fa-IR');
    await tester.tap(find.bySemanticsLabel('حذف جواز.pdf'));
    expect(dropped, [1]);
    semantics.dispose();
  });

  testWidgets('FileUpload en-US: the ✕ at the inline end = RIGHT; disabled refuses the browse button and the ✕', (tester) async {
    final semantics = tester.ensureSemantics();
    var browsed = 0;
    final dropped = <int>[];
    await tester.pumpWidget(app('en-US', LumoFileUpload(
      label: 'Identity document',
      browseLabel: 'Choose file',
      onBrowse: () => browsed++,
      onRemove: dropped.add,
      removeLabel: (name) => 'Remove $name',
      isDisabled: true,
      files: const [LumoAttachment(name: 'passport.pdf', sizeLabel: '1.2 MB')],
    )));
    final row = tester.getRect(find.byType(LumoAttachmentTile));
    expect(tester.getCenter(find.bySemanticsLabel('Remove passport.pdf')).dx, greaterThan(row.center.dx));
    expect(tester.getCenter(find.text('passport.pdf')).dx, lessThan(row.center.dx));
    expect(tester.getSemantics(find.bySemanticsLabel('Choose file')), containsSemantics(hasEnabledState: true, isEnabled: false));
    expect(tester.getSemantics(find.bySemanticsLabel('Remove passport.pdf')), containsSemantics(hasEnabledState: true, isEnabled: false));
    await tester.tap(find.bySemanticsLabel('Choose file'));
    await tester.tap(find.bySemanticsLabel('Remove passport.pdf'));
    expect(browsed, 0);
    expect(dropped, isEmpty);
    semantics.dispose();
  });

  testWidgets('AttachmentTile stands alone; the required-string rules are refused at construction', (tester) async {
    final semantics = tester.ensureSemantics();
    var removed = 0;
    await tester.pumpWidget(app('fa-IR', LumoAttachmentTile(
      file: const LumoAttachment(name: 'گزارش.pdf', sizeLabel: '۸۰۰ کیلوبایت'),
      removeLabel: 'حذف گزارش.pdf',
      onRemove: () => removed++,
    )));
    expect(tester.getSemantics(find.byType(LumoAttachmentTile)).getSemanticsData().label, 'گزارش.pdf\n۸۰۰ کیلوبایت');
    await tester.tap(find.bySemanticsLabel('حذف گزارش.pdf'));
    expect(removed, 1);
    // A state with no words; an ✕ with no name; a picker with half a decision.
    expect(() => LumoAttachment(name: 'x.pdf', status: LumoAttachmentStatus.uploading), throwsAssertionError);
    expect(() => LumoAttachmentTile(file: const LumoAttachment(name: 'x.pdf'), onRemove: () {}), throwsAssertionError);
    expect(() => LumoFileUpload(label: 'م', browseLabel: 'ب', onBrowse: () {}, onRemove: (_) {}), throwsAssertionError);
    semantics.dispose();
  });

  testWidgets('AttachmentTile: a cramped row sheds the paperclip, then the size, and only then lets the name ellipsize', (tester) async {
    final semantics = tester.ensureSemantics();
    const tile = LumoAttachmentTile(file: LumoAttachment(name: 'گزارش.pdf', sizeLabel: '۸۰۰ کیلوبایت'));
    await tester.pumpWidget(app('fa-IR', tile));
    expect(find.byIcon(Icons.attach_file), findsOneWidget, reason: 'room for everything: the clip stays');
    expect(find.text('۸۰۰ کیلوبایت'), findsOneWidget);
    await tester.pumpWidget(app('fa-IR', tile, width: 140));
    expect(find.byIcon(Icons.attach_file), findsNothing, reason: 'decoration goes first — the name is the row identity');
    expect(find.text('۸۰۰ کیلوبایت'), findsNothing, reason: 'the detail goes second');
    expect(find.text('گزارش.pdf'), findsOneWidget, reason: 'the name is the last thing to give way');
    // A shed size is still announced: the node is built from what the caller gave.
    expect(tester.getSemantics(find.byType(LumoAttachmentTile)).getSemanticsData().label, 'گزارش.pdf\n۸۰۰ کیلوبایت');
    semantics.dispose();
  });
}
