// Icon tile: decorative unless named, and REMOVED from the tree when it is not
// — the mobile counterpart of the web's `aria-hidden`. Icon stack: one fact,
// one name, Persian digits, and an overlap that leans the reader's way.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: SizedBox(width: 360, child: child)))),
    );

void main() {
  testWidgets('IconTile: decorative by default — a tile beside its own label adds no node and repeats no name', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const Row(children: [
      // A name on the GLYPH is swallowed too: an unnamed tile is gone from the tree, not a nameless node in it.
      LumoIconTile(icon: Icon(Icons.verified_user, semanticLabel: 'سپر')),
      Text('احراز هویت'),
    ])));
    expect(find.bySemanticsLabel('سپر'), findsNothing);
    // The row announces «احراز هویت» and stops.
    expect(find.bySemanticsLabel(RegExp('احراز هویت')), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('IconTile: named ONLY when it carries the meaning alone — then it is an image with that name, once', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoIconTile(icon: Icon(Icons.lock), accessibilityLabel: 'رمزنگاری‌شده', tone: LumoIconTileTone.positive)));
    expect(tester.getSemantics(find.byType(LumoIconTile)), containsSemantics(label: 'رمزنگاری‌شده', isImage: true));
    expect(find.bySemanticsLabel('رمزنگاری‌شده'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('IconTile: tone x variant take the scope colours; size sets the box and the glyph at half of it; shape switches the corner', (tester) async {
    await tester.pumpWidget(app('en-US', const Column(mainAxisSize: MainAxisSize.min, children: [
      LumoIconTile(icon: Icon(Icons.star, key: ValueKey('a')), tone: LumoIconTileTone.accent, variant: LumoIconTileVariant.solid, size: LumoIconTileSize.lg),
      LumoIconTile(icon: Icon(Icons.star, key: ValueKey('b')), tone: LumoIconTileTone.critical),
      LumoIconTile(icon: Icon(Icons.star, key: ValueKey('c')), size: LumoIconTileSize.sm, shape: LumoIconTileShape.circle),
    ])));
    final c = LumoScope.of(tester.element(find.byType(LumoIconTile).first)).colours;
    BoxDecoration box(String key) => tester.widget<Container>(find.ancestor(of: find.byKey(ValueKey(key)), matching: find.byType(Container)).first).decoration! as BoxDecoration;
    expect(box('a').color, c.accent);
    expect(tester.widget<Icon>(find.byKey(const ValueKey('a'))).color ?? IconTheme.of(tester.element(find.byKey(const ValueKey('a')))).color, c.accentFg);
    expect(box('b').color, c.critical.withValues(alpha: 0.10));
    expect(IconTheme.of(tester.element(find.byKey(const ValueKey('b')))).color, c.critical);
    expect(box('c').color, c.surfaceSunken);
    expect(box('c').shape, BoxShape.circle);
    // lg = 48, glyph 24; sm = 32, glyph 16 — the web's `size-1/2`.
    expect(tester.getSize(find.ancestor(of: find.byKey(const ValueKey('a')), matching: find.byType(Container)).first), const Size(48, 48));
    expect(IconTheme.of(tester.element(find.byKey(const ValueKey('a')))).size, 24);
    expect(IconTheme.of(tester.element(find.byKey(const ValueKey('c')))).size, 16);
  });

  testWidgets('IconStack fa-IR: ONE named node, «+۲» in Persian digits, and the first member at the reading start = RIGHT', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', LumoIconStack(
      label: '۶ عضو',
      overflowLabel: (n) => '${formatNumber(n, 'fa-IR')} نفر دیگر',
      items: const [
        LumoAvatar(label: 'سارا محمدی', key: ValueKey('a')),
        LumoAvatar(label: 'رضا کریمی', key: ValueKey('b')),
        LumoAvatar(label: 'مینا رستمی', key: ValueKey('c')),
        LumoAvatar(label: 'علی نوری', key: ValueKey('d')),
        LumoAvatar(label: 'زهرا احمدی', key: ValueKey('e')),
        LumoAvatar(label: 'حسن قاسمی', key: ValueKey('f')),
      ],
    )));
    // One fact, one name: the members are silent beneath it.
    expect(tester.getSemantics(find.byType(LumoIconStack)).getSemanticsData().label, '۶ عضو\n۲ نفر دیگر');
    expect(find.bySemanticsLabel(RegExp('سارا محمدی')), findsNothing);
    expect(find.text('+۲'), findsOneWidget);
    // `max: 4` — four members and the count, nothing more.
    expect(find.byKey(const ValueKey('e')), findsNothing);
    expect(tester.getCenter(find.byKey(const ValueKey('a'))).dx, greaterThan(tester.getCenter(find.byKey(const ValueKey('d'))).dx),
        reason: 'the first member is at the reading start = right under fa-IR');
    expect(tester.getCenter(find.text('+۲')).dx, lessThan(tester.getCenter(find.byKey(const ValueKey('d'))).dx),
        reason: 'the count closes the run at the reading end');
    semantics.dispose();
  });

  testWidgets('IconStack en-US: the same stack mirrored — first member LEFT, Latin digits, no overflow chip under the max', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('en-US', const LumoIconStack(
      label: '6 members',
      size: LumoIconStackSize.sm,
      items: [
        LumoAvatar(label: 'Sara M', key: ValueKey('a')),
        LumoAvatar(label: 'Reza K', key: ValueKey('b')),
        LumoAvatar(label: 'Mina R', key: ValueKey('c')),
        LumoAvatar(label: 'Ali N', key: ValueKey('d')),
        LumoAvatar(label: 'Zahra A', key: ValueKey('e')),
      ],
    )));
    expect(tester.getCenter(find.byKey(const ValueKey('a'))).dx, lessThan(tester.getCenter(find.byKey(const ValueKey('d'))).dx));
    expect(find.text('+1'), findsOneWidget);
    // No `overflowLabel`: the stack's one name stands alone.
    expect(tester.getSemantics(find.byType(LumoIconStack)).getSemanticsData().label, '6 members');
    await tester.pumpWidget(app('en-US', const LumoIconStack(label: '2 members', items: [LumoAvatar(label: 'Sara M'), LumoAvatar(label: 'Reza K')])));
    expect(find.textContaining('+'), findsNothing);
    semantics.dispose();
  });
}
