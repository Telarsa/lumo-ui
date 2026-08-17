// Timeline: a record of events. The state WORD travels with every item (colour
// is never the only carrier), the list names itself, and the rail follows the
// inline axis — right-hand rail under fa-IR, left-hand under en-US.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

const history = [
  LumoTimelineItem(title: 'سفارش ثبت شد', description: 'در انتظار تأیید پرداخت.', meta: '۵ مرداد ۱۴۰۵', icon: Icon(Icons.check)),
  LumoTimelineItem(title: 'بسته‌بندی شد', meta: '۶ مرداد ۱۴۰۵', state: LumoTimelineState.current),
  LumoTimelineItem(title: 'تحویل مشتری', state: LumoTimelineState.upcoming),
];

void main() {
  testWidgets('Timeline fa-IR: a list named by label; every item is a listItem announcing title + state word + description + meta, each string ONCE; the rail is at the reading start (right)', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoTimeline(
      label: 'تاریخچهٔ سفارش',
      items: history,
      doneLabel: 'انجام‌شده',
      currentLabel: 'در جریان',
      upcomingLabel: 'در انتظار',
    )));
    expect(Directionality.of(tester.element(find.text('سفارش ثبت شد'))), TextDirection.rtl);
    final list = tester.getSemantics(find.bySemanticsLabel('تاریخچهٔ سفارش'));
    expect(list.getSemanticsData().role, SemanticsRole.list);
    // Each item is one merged node: title, state word, description, meta.
    expect(tester.getSemantics(find.text('سفارش ثبت شد')).getSemanticsData().label, 'سفارش ثبت شد\nانجام‌شده\nدر انتظار تأیید پرداخت.\n۵ مرداد ۱۴۰۵');
    expect(tester.getSemantics(find.text('سفارش ثبت شد')).getSemanticsData().role, SemanticsRole.listItem);
    expect(tester.getSemantics(find.text('بسته‌بندی شد')).getSemanticsData().label, 'بسته‌بندی شد\nدر جریان\n۶ مرداد ۱۴۰۵');
    expect(tester.getSemantics(find.text('تحویل مشتری')).getSemanticsData().label, 'تحویل مشتری\nدر انتظار');
    // The state words, once each.
    expect(find.bySemanticsLabel(RegExp('انجام‌شده')), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp('در جریان')), findsOneWidget);
    // The dot's icon is decoration.
    expect(tester.getSemantics(find.byIcon(Icons.check)).getSemanticsData().label, 'سفارش ثبت شد\nانجام‌شده\nدر انتظار تأیید پرداخت.\n۵ مرداد ۱۴۰۵');
    expect(find.text('انجام‌شده'), findsNothing, reason: 'the state word is announced, not painted');
    // Vertical: events run top→bottom, the rail column at the inline START = right.
    expect(tester.getCenter(find.text('سفارش ثبت شد')).dy < tester.getCenter(find.text('تحویل مشتری')).dy, isTrue);
    final box = tester.getRect(find.byType(LumoTimeline));
    expect(tester.getCenter(find.byIcon(Icons.check)).dx > box.center.dx, isTrue, reason: 'the rail sits at the reading start = right under fa-IR');
    expect(tester.getCenter(find.byIcon(Icons.check)).dx > tester.getCenter(find.text('سفارش ثبت شد')).dx, isTrue, reason: 'the dot precedes its title in reading order');
    semantics.dispose();
  });

  testWidgets('Timeline: the dot takes its colours from the scope per state — done filled, current ringed, upcoming quiet', (tester) async {
    await tester.pumpWidget(app('fa-IR', const LumoTimeline(label: 'تاریخچه', items: history, doneLabel: 'انجام‌شده', currentLabel: 'در جریان', upcomingLabel: 'در انتظار')));
    final c = LumoScope.of(tester.element(find.text('سفارش ثبت شد'))).colours;
    final dots = tester.widgetList<Container>(find.descendant(of: find.byType(LumoTimeline), matching: find.byWidgetPredicate((w) => w is Container && w.decoration is BoxDecoration && (w.decoration! as BoxDecoration).shape == BoxShape.circle))).toList();
    expect(dots.length, 3);
    BoxDecoration deco(int i) => dots[i].decoration! as BoxDecoration;
    expect(deco(0).color, c.accent);
    expect(deco(1).color, c.surface);
    expect(deco(1).border, Border.all(color: c.accent, width: 2));
    expect(deco(2).border, Border.all(color: c.borderStrong, width: 2));
  });

  testWidgets('Timeline en-US horizontal: the first event is at the reading start (left), the states announced, the meta string is the caller\'s already-formatted one', (tester) async {
    final semantics = tester.ensureSemantics();
    const stages = [
      LumoTimelineItem(title: 'Requested', meta: 'Aug 5, 2026'),
      LumoTimelineItem(title: 'Assigned', state: LumoTimelineState.current),
      LumoTimelineItem(title: 'Closed', state: LumoTimelineState.upcoming),
    ];
    await tester.pumpWidget(app('en-US', const LumoTimeline(
      label: 'Case history',
      items: stages,
      orientation: LumoTimelineOrientation.horizontal,
      doneLabel: 'Done',
      currentLabel: 'In progress',
      upcomingLabel: 'Not yet',
    )));
    expect(tester.getSemantics(find.bySemanticsLabel('Case history')).getSemanticsData().role, SemanticsRole.list);
    expect(tester.getSemantics(find.text('Requested')).getSemanticsData().label, 'Requested\nDone\nAug 5, 2026');
    expect(find.bySemanticsLabel(RegExp('Not yet')), findsOneWidget);
    // Horizontal: reading order left→right under en-US, and the dots sit above their titles.
    expect(tester.getCenter(find.text('Requested')).dx < tester.getCenter(find.text('Closed')).dx, isTrue);
    expect(tester.getCenter(find.text('Requested')).dy > tester.getRect(find.byType(LumoTimeline)).top, isTrue);
    // The same items under fa-IR run the other way, with no direction flag anywhere.
    await tester.pumpWidget(app('fa-IR', const LumoTimeline(
      label: 'Case history',
      items: stages,
      orientation: LumoTimelineOrientation.horizontal,
      doneLabel: 'Done',
      currentLabel: 'In progress',
      upcomingLabel: 'Not yet',
    )));
    expect(tester.getCenter(find.text('Requested')).dx > tester.getCenter(find.text('Closed')).dx, isTrue, reason: 'the first event is at the reading start = right under fa-IR');
    semantics.dispose();
  });
}
