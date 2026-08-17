import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

void main() {
  test('initials: first letters of the first two words, ZWNJ-joined so Persian letters stay isolated; Latin unchanged; no upper-casing', () {
    expect(lumoInitials('سارا محمدی'), 'س‌م');
    expect(lumoInitials('کامیاب نظری'), 'ک‌ن');
    expect(lumoInitials('Kamyab Nazari'), 'K‌N');
    expect(lumoInitials('  Telarsa  '), 'T');
    expect(lumoInitials('علی رضا حسینی'), 'ع‌ر');
  });

  testWidgets('Avatar: one image node named by the label, initials from a Persian name, status word after the name; dot at the inline end (LEFT under fa-IR)', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoAvatar(label: 'سارا محمدی', size: LumoAvatarSize.lg, status: LumoAvatarStatus.online, statusLabel: 'آنلاین')));
    expect(Directionality.of(tester.element(find.byType(LumoAvatar))), TextDirection.rtl);
    expect(find.text('س‌م'), findsOneWidget);
    final node = tester.getSemantics(find.byType(LumoAvatar));
    expect(node, matchesSemantics(label: 'سارا محمدی\nآنلاین', isImage: true));
    // The name and the state word each appear once in the tree.
    expect(find.bySemanticsLabel(RegExp('سارا محمدی')), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp('آنلاین')), findsOneWidget);
    final avatar = tester.getRect(find.byType(LumoAvatar));
    final dot = tester.getRect(find.byType(PositionedDirectional));
    expect(dot.center.dx < avatar.center.dx, isTrue, reason: 'inline end = left under fa-IR');
    expect(dot.center.dy > avatar.center.dy, isTrue, reason: 'bottom corner');
    expect(avatar.width, 40);
    semantics.dispose();
  });

  testWidgets('Avatar: en-US dot at the RIGHT; no status = name only; image behind the initials; rounded shape', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', Row(mainAxisSize: MainAxisSize.min, spacing: 8, children: [
      const LumoAvatar(label: 'Kamyab Nazari', status: LumoAvatarStatus.busy, statusLabel: 'Busy'),
      LumoAvatar(label: 'Telarsa Ltd', shape: LumoAvatarShape.rounded, image: MemoryImage(kTransparentImage)),
    ])));
    final first = tester.getRect(find.byType(LumoAvatar).first);
    final dot = tester.getRect(find.byType(PositionedDirectional));
    expect(dot.center.dx > first.center.dx, isTrue, reason: 'inline end = right under en-US');
    expect(tester.getSemantics(find.byType(LumoAvatar).first), matchesSemantics(label: 'Kamyab Nazari\nBusy', isImage: true));
    expect(tester.getSemantics(find.byType(LumoAvatar).last), matchesSemantics(label: 'Telarsa Ltd', isImage: true));
    expect(find.byType(Image), findsOneWidget);
    expect(find.text('T‌L'), findsOneWidget);
    // A status without its word is refused at construction.
    expect(() => LumoAvatar(label: 'x', status: LumoAvatarStatus.online), throwsAssertionError);
    semantics.dispose();
  });
}

/// A 1×1 transparent GIF, so the image branch renders without I/O.
final kTransparentImage = Uint8List.fromList(const <int>[0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3B]);
