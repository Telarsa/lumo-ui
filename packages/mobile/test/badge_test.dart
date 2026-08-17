// Semantics-tree tests for LumoBadge: a plain named text node (no button, no
// live region), the label announced ONCE, the dot form taking an already
// formatted count, tones and variants building without hard-coded colours.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child) => MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(locale: locale, brightness: Brightness.light, child: Scaffold(body: Center(child: child))),
    );

void main() {
  testWidgets('Badge: named by its label ONCE; not a button, not a live region; RTL from the locale', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', const LumoBadge(label: 'موجود', tone: LumoBadgeTone.positive)));
    expect(find.text('موجود'), findsOneWidget);
    expect(find.bySemanticsLabel('موجود'), findsOneWidget);
    final data = tester.getSemantics(find.bySemanticsLabel('موجود')).getSemanticsData();
    expect(data.label, 'موجود');
    expect(data.flagsCollection.isButton, isFalse);
    expect(data.flagsCollection.isLiveRegion, isFalse);
    expect(Directionality.of(tester.element(find.byType(LumoBadge))), TextDirection.rtl);
    semantics.dispose();
  });

  testWidgets('Badge.dot: the count is a formatted String from formatNumber — Persian digits under fa-IR, Latin under en-US', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', Builder(builder: (context) => LumoBadge.dot(label: formatNumber(3, LumoScope.of(context).locale)))));
    expect(find.text('۳'), findsOneWidget);
    expect(find.bySemanticsLabel('۳'), findsOneWidget);
    await tester.pumpWidget(app('en-US', Builder(builder: (context) => LumoBadge.dot(label: formatNumber(1234, LumoScope.of(context).locale)))));
    expect(find.text('1,234'), findsOneWidget);
    expect(Directionality.of(tester.element(find.byType(LumoBadge))), TextDirection.ltr);
    semantics.dispose();
  });

  testWidgets('Badge: every tone × variant × size builds; the icon is decorative (name announced once)', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(app('fa-IR', Wrap(children: [
      for (final tone in LumoBadgeTone.values)
        for (final variant in LumoBadgeVariant.values)
          for (final size in LumoBadgeSize.values)
            LumoBadge(label: '${tone.name}-${variant.name}-${size.name}', tone: tone, variant: variant, size: size),
      const LumoBadge(label: 'پیش‌نویس', icon: Icon(Icons.edit), variant: LumoBadgeVariant.outline, tone: LumoBadgeTone.caution),
    ])));
    expect(find.byType(LumoBadge), findsNWidgets(LumoBadgeTone.values.length * LumoBadgeVariant.values.length * LumoBadgeSize.values.length + 1));
    expect(find.bySemanticsLabel('پیش‌نویس'), findsOneWidget);
    expect(find.text('critical-solid-sm'), findsOneWidget);
    semantics.dispose();
  });
}
