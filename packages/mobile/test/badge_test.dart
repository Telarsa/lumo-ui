// Semantics-tree tests for LumoBadge: a plain named text node (no button, no
// live region), the label announced ONCE, the dot form taking an already
// formatted count, tones and variants building without hard-coded colours.
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

Widget app(String locale, Widget child, {Brightness brightness = Brightness.light}) => MaterialApp(
      theme: lumoThemeData(brightness: brightness),
      home: LumoScope(locale: locale, brightness: brightness, child: Scaffold(body: Center(child: child))),
    );

/// WCAG 2.x relative luminance and contrast ratio, on the colours the widget
/// actually resolved — not on the token names.
double _channel(double c) => c <= 0.03928 ? c / 12.92 : math.pow((c + 0.055) / 1.055, 2.4).toDouble();
double _luminance(Color c) => 0.2126 * _channel(c.r) + 0.7152 * _channel(c.g) + 0.0722 * _channel(c.b);

/// A translucent tint composited over the ground it is painted on.
Color _over(Color tint, Color ground) => Color.from(
      alpha: 1,
      red: tint.r * tint.a + ground.r * (1 - tint.a),
      green: tint.g * tint.a + ground.g * (1 - tint.a),
      blue: tint.b * tint.a + ground.b * (1 - tint.a),
    );

double _contrast(Color a, Color b) {
  final la = _luminance(a), lb = _luminance(b);
  return (math.max(la, lb) + 0.05) / (math.min(la, lb) + 0.05);
}

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

  testWidgets('Badge: a long label in a narrow box SHEDS THE ICON before it touches the words, and never overflows', (tester) async {
    final semantics = tester.ensureSemantics();
    const long = 'گزارش عملکرد سه‌ماههٔ چهارم شرکت';
    Widget boxed(double width) => MaterialApp(
          theme: lumoThemeData(brightness: Brightness.light),
          home: LumoScope(
            locale: 'fa-IR',
            brightness: Brightness.light,
            child: Scaffold(body: Center(child: SizedBox(width: width, child: const Row(children: [Flexible(child: LumoBadge(label: long, icon: Icon(Icons.star)))])))),
          ),
        );
    // 320 dp and 240 dp both used to blow the inner Row out by 82 and 162 px.
    for (final width in [320.0, 240.0]) {
      await tester.pumpWidget(boxed(width));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull, reason: 'a RenderFlex overflow at $width dp is a real bug');
      expect(tester.getSize(find.byType(LumoBadge)).width, lessThanOrEqualTo(width));
      // Decoration goes first — the icon is gone, the words are still drawn.
      expect(find.byIcon(Icons.star), findsNothing);
      expect(find.text(long), findsOneWidget);
      // Nothing is LOST: the announced name carries the whole string even where
      // the drawing ellipsizes.
      expect(find.bySemanticsLabel(long), findsOneWidget);
      expect(tester.getSemantics(find.bySemanticsLabel(long)).getSemanticsData().label, long);
    }
    semantics.dispose();
  });

  testWidgets('Badge: given room, the icon stays and the pill still shrink-wraps — the web `w-fit`', (tester) async {
    await tester.pumpWidget(MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: const LumoScope(
        locale: 'fa-IR',
        brightness: Brightness.light,
        // A Row with no Flexible: the badge's constraints are UNBOUNDED, which
        // is the ordinary case and must not become a flex-under-infinity error.
        child: Scaffold(body: Row(children: [LumoBadge(label: 'موجود', icon: Icon(Icons.star))])),
      ),
    ));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.byIcon(Icons.star), findsOneWidget);
    // Shrink-wrapped, not stretched to the row.
    expect(tester.getSize(find.byType(LumoBadge)).width, lessThan(200));
    expect(tester.getSize(find.byType(LumoBadge)).height, 22);
  });

  testWidgets('Badge in Brightness.dark: the resolved tint pairs come from the DARK scheme and every one still clears 4.5:1', (tester) async {
    // The tint vocabulary lives here and `alert.dart` / `icon_tile.dart` lift it
    // verbatim, so this covers the three families that paint status colours on
    // tinted surfaces. The status tokens SWAP LIGHTNESS between schemes, which
    // is exactly how a `subtle` pair that reads on light goes illegible on dark.
    for (final brightness in Brightness.values) {
      await tester.pumpWidget(app('fa-IR', const LumoBadge(label: 'موجود'), brightness: brightness));
      final c = LumoScope.of(tester.element(find.byType(LumoBadge))).colours;
      expect(c.bg, brightness == Brightness.dark ? darkColours().bg : lightColours().bg, reason: 'the scope resolved the wrong scheme');

      for (final tone in LumoBadgeTone.values) {
        final toneColour = switch (tone) {
          LumoBadgeTone.neutral => c.fgMuted,
          LumoBadgeTone.accent => c.accent,
          LumoBadgeTone.positive => c.positive,
          LumoBadgeTone.critical => c.critical,
          LumoBadgeTone.caution => c.caution,
        };
        final where = '${tone.name} on ${brightness.name}';

        // SOLID: the fill is the tone, the text is `bg` (or `accentFg`) — never
        // white, because `bg` swaps lightness with the status tokens.
        final solidFg = tone == LumoBadgeTone.accent ? c.accentFg : c.bg;
        expect(_contrast(solidFg, toneColour), greaterThanOrEqualTo(4.5), reason: 'solid $where');

        // SUBTLE: the token at full strength on its own /10 tint. The tint is
        // TRANSLUCENT, so it is measured composited over the surfaces a badge
        // actually rides on — the page and a card.
        for (final ground in [c.bg, c.surface, c.surfaceSunken]) {
          final tinted = tone == LumoBadgeTone.neutral ? c.surfaceSunken : _over(toneColour.withValues(alpha: 0.10), ground);
          final fg = tone == LumoBadgeTone.neutral ? c.fgMuted : toneColour;
          expect(_contrast(fg, tinted), greaterThanOrEqualTo(4.5), reason: 'subtle $where over $ground');
        }

        // OUTLINE (the mobile addition): no fill at all, so the tone sits
        // straight on whatever is behind it.
        for (final ground in [c.bg, c.surface, c.surfaceSunken]) {
          expect(_contrast(toneColour, ground), greaterThanOrEqualTo(4.5), reason: 'outline $where over $ground');
        }
      }
    }
  });
}
