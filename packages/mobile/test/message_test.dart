// Message: what a screen reader gets is ONE node per message (sender, text,
// time, status) — and what a Persian reader sees is the OTHER person on the
// right. Both are asserted here, under fa-IR and en-US.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

Finder message(String text) => find.byWidgetPredicate((w) => w is LumoMessage && w.text == text);

void main() {
  testWidgets('Message fa-IR: incoming hugs the reading start = RIGHT, outgoing the reading end = LEFT; the tail corner mirrors with it', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const Column(mainAxisSize: MainAxisSize.min, children: [
      LumoMessage(side: LumoMessageSide.incoming, senderLabel: 'سارا محمدی', text: 'سلام! فایل را دیدی؟', timeLabel: '۱۴:۰۵'),
      LumoMessage(side: LumoMessageSide.outgoing, text: 'بله، همین الان.', timeLabel: '۱۴:۰۷', status: LumoMessageStatus.read, statusLabel: 'خوانده شد'),
    ])));
    expect(Directionality.of(tester.element(find.text('سلام! فایل را دیدی؟'))), TextDirection.rtl);

    final row = tester.getRect(message('سلام! فایل را دیدی؟'));
    expect(tester.getCenter(find.text('سلام! فایل را دیدی؟')).dx, greaterThan(row.center.dx),
        reason: 'incoming sits at the reading START = right under fa-IR');
    expect(tester.getCenter(find.text('سارا محمدی')).dx, greaterThan(row.center.dx), reason: 'the sender line follows its bubble');
    expect(tester.getCenter(find.text('بله، همین الان.')).dx, lessThan(row.center.dx),
        reason: 'outgoing sits at the reading END = left under fa-IR');
    expect(tester.getCenter(find.text('۱۴:۰۷')).dx, lessThan(row.center.dx));

    // The tail is a DIRECTIONAL corner on the bubble's own side; resolved under
    // RTL, the incoming tail lands bottom-RIGHT and the outgoing one bottom-LEFT.
    BorderRadius radius(String text) => ((tester.widget<Container>(find.ancestor(of: find.text(text), matching: find.byType(Container)).first).decoration! as BoxDecoration).borderRadius as BorderRadiusDirectional).resolve(TextDirection.rtl);
    expect(radius('سلام! فایل را دیدی؟').bottomRight, Radius.circular(LumoRadius.md));
    expect(radius('سلام! فایل را دیدی؟').bottomLeft, Radius.circular(LumoRadius.xxl));
    expect(radius('بله، همین الان.').bottomLeft, Radius.circular(LumoRadius.md));
    expect(radius('بله، همین الان.').bottomRight, Radius.circular(LumoRadius.xxl));
    semantics.dispose();
  });

  testWidgets('Message: ONE node per message — sender, text, time, status, each string exactly once', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const Column(mainAxisSize: MainAxisSize.min, children: [
      LumoMessage(side: LumoMessageSide.incoming, senderLabel: 'سارا محمدی', text: 'سلام! فایل را دیدی؟', timeLabel: '۱۴:۰۵', avatar: LumoAvatar(label: 'سارا محمدی')),
      LumoMessage(side: LumoMessageSide.outgoing, text: 'بله، همین الان.', timeLabel: '۱۴:۰۷', status: LumoMessageStatus.read, statusLabel: 'خوانده شد'),
    ])));
    expect(tester.getSemantics(message('سلام! فایل را دیدی؟')).getSemanticsData().label, 'سارا محمدی\nسلام! فایل را دیدی؟\n۱۴:۰۵');
    expect(tester.getSemantics(message('بله، همین الان.')).getSemanticsData().label, 'بله، همین الان.\n۱۴:۰۷\nخوانده شد');
    // The avatar beside a named sender is decorative: the name is heard once, not twice.
    expect(find.bySemanticsLabel(RegExp('سارا محمدی')), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp('خوانده شد')), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('Message en-US: incoming at the LEFT, outgoing at the RIGHT — the same widget, mirrored by the locale', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', const Column(mainAxisSize: MainAxisSize.min, children: [
      LumoMessage(side: LumoMessageSide.incoming, senderLabel: 'Sara', text: 'Did you see the file?', timeLabel: '2:05 PM'),
      LumoMessage(side: LumoMessageSide.outgoing, text: 'Just now.', timeLabel: '2:07 PM', status: LumoMessageStatus.sending, statusLabel: 'Sending'),
    ])));
    expect(Directionality.of(tester.element(find.text('Just now.'))), TextDirection.ltr);
    final row = tester.getRect(message('Did you see the file?'));
    expect(tester.getCenter(find.text('Did you see the file?')).dx, lessThan(row.center.dx));
    expect(tester.getCenter(find.text('Just now.')).dx, greaterThan(row.center.dx));
    expect(tester.getSemantics(message('Just now.')).getSemanticsData().label, 'Just now.\n2:07 PM\nSending');
    semantics.dispose();
  });

  testWidgets('Message: colours come from the scope; the system notice is centred, unnamed by a sender, and one node', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const Column(mainAxisSize: MainAxisSize.min, children: [
      LumoMessage(side: LumoMessageSide.incoming, senderLabel: 'سارا', text: 'دریافتی'),
      LumoMessage(side: LumoMessageSide.outgoing, text: 'ارسالی'),
      LumoMessage(side: LumoMessageSide.incoming, isSystem: true, text: 'این گفت‌وگو رمزنگاری شده است.'),
    ])));
    final c = LumoScope.of(tester.element(find.text('دریافتی'))).colours;
    Color fill(String t) => (tester.widget<Container>(find.ancestor(of: find.text(t), matching: find.byType(Container)).first).decoration! as BoxDecoration).color!;
    expect(fill('ارسالی'), c.accent);
    expect(fill('دریافتی'), c.surfaceSunken);
    expect(fill('این گفت‌وگو رمزنگاری شده است.'), c.surfaceSunken);
    final screen = tester.getRect(find.byType(MaterialApp));
    expect(tester.getCenter(find.text('این گفت‌وگو رمزنگاری شده است.')).dx, moreOrLessEquals(screen.center.dx, epsilon: 1));
    expect(tester.getSemantics(message('این گفت‌وگو رمزنگاری شده است.')).getSemanticsData().label, 'این گفت‌وگو رمزنگاری شده است.');
    semantics.dispose();
  });

  testWidgets('MessageGroup: the day separator is a header, announced once, above its messages', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoMessageGroup(
      dateLabel: '۲۶ مرداد ۱۴۰۵',
      children: [
        LumoMessage(side: LumoMessageSide.incoming, senderLabel: 'سارا', text: 'صبح بخیر'),
        LumoMessage(side: LumoMessageSide.outgoing, text: 'صبح به خیر'),
      ],
    )));
    expect(tester.getSemantics(find.text('۲۶ مرداد ۱۴۰۵')), containsSemantics(label: '۲۶ مرداد ۱۴۰۵', isHeader: true));
    expect(find.bySemanticsLabel('۲۶ مرداد ۱۴۰۵'), findsOneWidget);
    expect(tester.getCenter(find.text('۲۶ مرداد ۱۴۰۵')).dy, lessThan(tester.getCenter(message('صبح بخیر')).dy));
    semantics.dispose();
  });

  testWidgets('Message: the required-string rules are refused at construction', (tester) async {
    // An incoming message with no sender: a transcript of anonymous bubbles.
    expect(() => LumoMessage(side: LumoMessageSide.incoming, text: 'سلام'), throwsAssertionError);
    // A status with no words: a tick that means nothing to a reader.
    expect(() => LumoMessage(side: LumoMessageSide.outgoing, text: 'سلام', status: LumoMessageStatus.sent), throwsAssertionError);
    // Neither text nor child.
    expect(() => LumoMessage(side: LumoMessageSide.outgoing), throwsAssertionError);
  });
}
