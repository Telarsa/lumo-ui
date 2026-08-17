// The gallery's own guard rails. The COMPONENTS are proved in
// `packages/mobile/test/` by semantics-tree tests; what is proved here is the
// gallery contract itself: ids are well formed, every registered demo has
// localized copy in every served locale, and an unknown id is a visible box
// rather than a blank canvas.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_mobile_gallery/demos/all.dart';
import 'package:lumo_mobile_gallery/main.dart';

void main() {
  test('every demo id is <slug>-<n>', () {
    final shape = RegExp(r'^[a-z0-9]+(-[a-z0-9]+)*-[1-9][0-9]*$');
    for (final id in lumoDemos.keys) {
      expect(shape.hasMatch(id), isTrue, reason: '"$id" is not <slug>-<n>');
    }
  });

  test('every demo has a title and a description in every served locale', () {
    for (final id in lumoDemos.keys) {
      final meta = lumoDemoMeta[id];
      expect(meta, isNotNull, reason: '"$id" has no demoMeta entry');
      for (final field in const ['title', 'description']) {
        for (final locale in kGalleryLocales) {
          final value = meta![field]?[locale];
          expect(
            value != null && value.trim().isNotEmpty,
            isTrue,
            reason: '"$id" is missing $field for $locale',
          );
        }
      }
    }
  });

  test('demoMeta describes nothing that is not registered', () {
    for (final id in lumoDemoMeta.keys) {
      expect(lumoDemos.containsKey(id), isTrue, reason: '"$id" is not built');
    }
  });

  test('lang falls back to fa-IR, never to English', () {
    expect(normaliseGalleryLocale(null), 'fa-IR');
    expect(normaliseGalleryLocale('xx-YY'), 'fa-IR');
    expect(normaliseGalleryLocale('fa'), 'fa-IR');
    expect(normaliseGalleryLocale('en'), 'en-US');
    expect(normaliseGalleryLocale('en_US'), 'en-US');
  });

  testWidgets('an unknown demo names the id it was asked for', (tester) async {
    await tester.pumpWidget(
      const LumoGalleryApp(
        demoId: 'no-such-demo-9',
        locale: 'fa-IR',
        brightness: Brightness.light,
      ),
    );
    await tester.pump();
    expect(find.textContaining('no-such-demo-9'), findsOneWidget);
  });
}
