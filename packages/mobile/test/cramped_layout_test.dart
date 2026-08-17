import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

/// **Defect class guarded: `RenderFlex overflowed` on a narrow phone.**
///
/// A `Row` with no `Flexible`/`Expanded` around its text lays out at the label's
/// full intrinsic width and paints the yellow-and-black overflow bar off the edge
/// of the screen. It never shows up on a 390 dp test device with a three-word
/// English label, and it always shows up on a 320 dp phone with a real Persian one —
/// which is why the floor here is **320 dp**, the narrowest phone the library
/// supports (iPhone SE 1st gen / small Android), with a long Persian label.
///
/// The house rule this enforces is contract §7: **a cramped widget sheds decoration
/// before it truncates words** — see `segmented_control.dart` `_fit()`. This test does
/// not assert HOW a family gives ground (drop the icon, wrap, scroll, ellipsize as a
/// last resort); it asserts only that it never overflows, which is the one outcome
/// that is always a bug.
///
/// Three real overflows were found and fixed by the pass that added this test:
/// `LumoSteps` (152 px @320), `LumoBadge` (82 px @320) and `LumoRating` (40 px @240).
///
/// 240 dp is measured too, as the "impossible" width that catches a family which
/// merely happens to fit at 320. Failures at 240 are reported but only 320 is
/// enforced — see [_enforcedWidth].
const double _enforcedWidth = 320;
const double _stressWidth = 240;

/// A realistic long Persian label — the worst case a narrow phone actually meets.
const _long = 'گزارش عملکرد سه‌ماههٔ چهارم شرکت';

/// Render [child] at [width] and return the overflow exception, if any.
Future<Object?> _overflowAt(WidgetTester tester, double width, Widget child, {Brightness brightness = Brightness.light}) async {
  await tester.pumpWidget(MaterialApp(
    theme: lumoThemeData(brightness: brightness),
    home: LumoScope(
      locale: 'fa-IR',
      brightness: brightness,
      child: Scaffold(body: Center(child: SizedBox(width: width, child: child))),
    ),
  ));
  await tester.pumpAndSettle();
  return tester.takeException();
}

/// Every family that lays a label out in a row it could overflow. Built lazily so
/// one entry's construction cost is not paid by the others.
Map<String, Widget Function()> _families() => {
      'LumoChip (removable, long label)': () => LumoChip(label: _long, onRemove: () {}, removeLabel: 'حذف'),
      'LumoTagGroup': () => LumoTagGroup(
            label: 'برچسب‌ها',
            onRemove: (_) {},
            removeLabel: (t) => 'حذف $t',
            items: const [LumoTagItem(id: 'a', textValue: _long), LumoTagItem(id: 'b', textValue: _long)],
          ),
      'LumoBreadcrumbs': () => LumoBreadcrumbs(
            label: 'مسیر',
            currentLabel: 'فعلی',
            items: [LumoCrumb(label: _long, onTap: () {}), LumoCrumb(label: _long, onTap: () {}), const LumoCrumb(label: _long)],
          ),
      'LumoSegmentedControl (icon + long label)': () => LumoSegmentedControl(
            label: 'نما',
            onChanged: (_) {},
            segments: const [
              LumoSegment(id: 'a', label: _long, icon: Icon(Icons.map)),
              LumoSegment(id: 'b', label: _long, icon: Icon(Icons.list)),
            ],
          ),
      'LumoTabs (icon + long label)': () => LumoTabs(
            label: 'بخش‌ها',
            onChanged: (_) {},
            tabs: const [
              LumoTab(id: 'a', label: _long, icon: Icon(Icons.map)),
              LumoTab(id: 'b', label: _long, icon: Icon(Icons.list)),
            ],
          ),
      'LumoToggleGroup': () => LumoToggleGroup(
            label: 'قالب',
            onChanged: (_) {},
            items: const [
              LumoToggleItem(id: 'a', label: _long, icon: Icon(Icons.format_bold)),
              LumoToggleItem(id: 'b', label: _long, icon: Icon(Icons.format_italic)),
            ],
          ),
      'LumoItem (leading + trailing + long title)': () => LumoItem(
            title: _long,
            description: _long,
            onTap: () {},
            leading: const Icon(Icons.folder),
            trailing: const Icon(Icons.chevron_right),
          ),
      'LumoSteps (horizontal)': () => const LumoSteps(
            label: 'مراحل',
            current: 1,
            completedLabel: 'انجام',
            currentLabel: 'فعلی',
            upcomingLabel: 'بعدی',
            steps: [LumoStep(title: _long, description: _long), LumoStep(title: _long), LumoStep(title: _long)],
          ),
      'LumoTimeline': () => const LumoTimeline(
            label: 'رویدادها',
            doneLabel: 'انجام',
            currentLabel: 'فعلی',
            upcomingLabel: 'بعدی',
            items: [LumoTimelineItem(title: _long, description: _long, meta: _long), LumoTimelineItem(title: _long)],
          ),
      'LumoAlert (icon + dismiss + action)': () => LumoAlert(
            title: _long,
            description: _long,
            onDismiss: () {},
            dismissLabel: 'بستن',
            icon: const Icon(Icons.info),
            actions: [LumoButton(onPressed: () {}, child: const Text(_long))],
          ),
      'LumoCardHeader (title + action)': () => LumoCard(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              LumoCardHeader(
                title: _long,
                description: _long,
                action: LumoIconButton(label: 'گزینه', onPressed: () {}, child: const Icon(Icons.more_horiz)),
              ),
            ]),
          ),
      'LumoCardFooter (two long buttons)': () => LumoCard(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              LumoCardFooter(children: [
                LumoButton(onPressed: () {}, child: const Text(_long)),
                LumoButton(onPressed: () {}, child: const Text(_long)),
              ]),
            ]),
          ),
      'LumoDescriptionList': () => const LumoDescriptionList(
            label: 'مشخصات',
            entries: [LumoDescription(term: _long, value: _long), LumoDescription(term: _long, value: _long)],
          ),
      'LumoEmptyState': () => LumoEmptyState(
            title: _long,
            description: _long,
            icon: const Icon(Icons.inbox),
            actions: [LumoButton(onPressed: () {}, child: const Text(_long))],
          ),
      'LumoMessage': () => const LumoMessage(side: LumoMessageSide.incoming, senderLabel: _long, text: _long, timeLabel: '۱۰:۳۰'),
      'LumoFileUpload': () => LumoFileUpload(
            label: _long,
            browseLabel: _long,
            onBrowse: () {},
            onRemove: (_) {},
            removeLabel: (n) => 'حذف $n',
            files: const [LumoAttachment(name: 'گزارش-عملکرد-سه-ماهه.pdf', sizeLabel: '۲ مگابایت')],
          ),
      'LumoNumberField': () => LumoNumberField(
            label: _long,
            incrementLabel: 'افزودن',
            decrementLabel: 'کاستن',
            defaultValue: 1,
            description: _long,
            onChanged: (_) {},
          ),
      'LumoSearchField': () => LumoSearchField(label: _long, clearLabel: 'پاک', defaultValue: _long, description: _long, onChanged: (_) {}),
      'LumoMultiSelect': () => LumoMultiSelect(
            label: _long,
            closeLabel: 'بستن',
            confirmLabel: 'تایید',
            clearAllLabel: 'پاک',
            countLabel: (n) => 'تعداد',
            removeLabel: (t) => 'حذف $t',
            values: const ['a', 'b'],
            onChanged: (_) {},
            options: const [LumoMultiSelectOption(id: 'a', label: _long), LumoMultiSelectOption(id: 'b', label: _long)],
          ),
      'LumoListBox': () => LumoListBox(
            label: 'گزینه‌ها',
            emptyLabel: 'خالی',
            onChanged: (_) {},
            items: const [LumoListBoxItem(id: 'a', title: _long, description: _long, leading: Icon(Icons.person), trailing: Icon(Icons.check))],
          ),
      'LumoRating (10 stars, lg)': () => LumoRating(
            label: _long,
            valueLabel: '۴ از ۵',
            defaultValue: 4,
            size: LumoRatingSize.lg,
            max: 10,
            onChanged: (_) {},
            starLabel: (n) => '$n ستاره',
          ),
      'LumoIconStack (overflowing)': () => LumoIconStack(
            label: 'اعضا',
            overflowLabel: (n) => 'بیشتر',
            items: const [Icon(Icons.person), Icon(Icons.person), Icon(Icons.person), Icon(Icons.person), Icon(Icons.person), Icon(Icons.person)],
          ),
      'LumoBadge (icon + long label)': () => const LumoBadge(label: _long, icon: Icon(Icons.star)),
      'LumoAvatar (long label + status)': () => const LumoAvatar(label: _long, status: LumoAvatarStatus.online, statusLabel: 'آنلاین'),
      'LumoDisclosure (open)': () => const LumoDisclosure(title: _long, defaultOpen: true, child: Text(_long)),
      'LumoPhoneInput': () => LumoPhoneInput(label: _long, countryLabel: 'کشور', closeLabel: 'بستن', searchLabel: 'جستجو', onChanged: (_) {}),
    };

void main() {
  final families = _families();

  group('no family overflows at $_enforcedWidth dp with a long Persian label', () {
    families.forEach((name, build) {
      testWidgets(name, (tester) async {
        tester.view.physicalSize = const Size(1200, 2400);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.reset);
        final ex = await _overflowAt(tester, _enforcedWidth, build());
        expect(ex, isNull, reason: '$name overflowed at $_enforcedWidth dp: $ex');
      });
    });
  });

  // The same families in the dark scheme: a family that swaps in a border or a
  // tinted chip only on dark would change its own intrinsic width.
  group('no family overflows at $_enforcedWidth dp in the dark scheme', () {
    families.forEach((name, build) {
      testWidgets(name, (tester) async {
        tester.view.physicalSize = const Size(1200, 2400);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.reset);
        final ex = await _overflowAt(tester, _enforcedWidth, build(), brightness: Brightness.dark);
        expect(ex, isNull, reason: '$name overflowed at $_enforcedWidth dp (dark): $ex');
      });
    });
  });

  testWidgets('$_stressWidth dp stress width is reported, not enforced', (tester) async {
    tester.view.physicalSize = const Size(1200, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    final failures = <String>[];
    for (final e in families.entries) {
      final ex = await _overflowAt(tester, _stressWidth, e.value());
      if (ex != null) failures.add(e.key);
    }
    // Deliberately not an assertion: 240 dp is narrower than any phone the library
    // targets. It is printed so a regression at 320 has an early-warning signal.
    if (failures.isNotEmpty) {
      debugPrint('NOTE — families that overflow at the $_stressWidth dp stress width: ${failures.join(', ')}');
    }
  });
}
