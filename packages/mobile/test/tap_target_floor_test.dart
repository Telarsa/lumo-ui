import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

/// **Defect class guarded: a control that is too small to hit with a thumb.**
///
/// In Flutter a widget's SIZE IS ITS HIT AREA. There is no CSS-like way to give a
/// control a bigger target than it paints, and `MaterialTapTargetSize.shrinkWrap`
/// — which this library sets on its buttons to hold the web's control scale —
/// removes the 48 dp padded target Material would otherwise add. So an ✕ drawn at
/// 12 dp inside a 20 dp box is a 20 dp TARGET, and nothing in the type system says so.
///
/// The floor is **44 × 44 logical px** (Apple HIG; Android's Material floor is 48 dp,
/// and WCAG 2.5.5 Target Size (Enhanced) asks for 44 CSS px). It is measured on the
/// SEMANTICS NODE — the thing that actually receives the tap — not on a `SizedBox`
/// somewhere in the widget tree, because those are routinely different numbers.
///
/// ## The allow-list is the point of this test
///
/// A blanket 44 dp rule would be wrong here, and inflating everything to satisfy it
/// would be exactly the "cosmetic sweep" this library forbids. Two classes of control
/// are legitimately shorter, and both are declared per case in [_exceptions] with the
/// reason spelled out:
///
///  1. **The shared control scale.** `--lumo-ref-control-*` is sm 29 / md 36 / lg 44,
///     GENERATED from the web theme, and `packages/ui/src/button.variants.ts` says in
///     as many words that only `lg` "meets the 44px touch-target floor". Mobile holds
///     that scale on purpose so the two platforms are one product. A full-width
///     360 × 36 button is not hard to hit.
///  2. **Inline text.** A link inside a paragraph cannot be 44 dp tall without
///     tearing a hole in the line box.
///
/// An exception is NOT a blank cheque: an allow-listed node must still clear
/// [_minorAxisFloor] on its short axis AND [_floor] on its long axis — i.e. it has to
/// be genuinely WIDE-and-short, not small in both directions. A control that is small
/// in both axes fails no matter what the allow-list says. That is what makes a NEW
/// undersized control fail while the known exceptions stay documented decisions.
const double _floor = 44;

/// The short axis of an allow-listed wide-and-short control. `LumoControl.sm` = 29 is
/// the smallest the shared scale goes, so that is the floor an exception may not cross.
const double _minorAxisFloor = 29;

/// One family under test, with the exceptions it is allowed.
class _Case {
  const _Case(this.name, this.build, {this.exceptions = const {}, this.minorAxisWaived = const {}});
  final String name;
  final Widget Function() build;

  /// Announced label -> WHY that node may sit below the 44 dp floor.
  /// Every entry is a decision someone made and can be argued with; none is an oversight.
  final Map<String, String> exceptions;

  /// Labels whose SHORT axis may ALSO go under [_minorAxisFloor]. This is the
  /// strongest waiver in the file and is only ever granted where the short axis
  /// is not a number anyone is free to choose. Each one is argued at its case.
  final Set<String> minorAxisWaived;
}

/// A node with a tap action, and the size it actually offers a thumb.
typedef _Target = ({String label, Size size});

List<_Target> _tapTargets(WidgetTester tester) {
  final out = <_Target>[];
  // A control often produces NESTED tap nodes — `LumoIconButton` is a named
  // Semantics wrapper over a Material button that carries its own tap action.
  // Those are ONE affordance, not two, and the outer node is the one a finger
  // meets. So an UNNAMED tap node inside another tap node is skipped: it is the
  // same control seen twice. An unnamed tap node at the TOP is still measured —
  // that would be a genuinely anonymous control, which is its own defect.
  void visit(SemanticsNode node, {required bool insideTap}) {
    final d = node.getSemanticsData();
    final isTap = d.hasAction(SemanticsAction.tap);
    if (isTap && !(insideTap && d.label.isEmpty)) {
      out.add((label: d.label, size: node.rect.size));
    }
    node.visitChildren((c) {
      visit(c, insideTap: insideTap || isTap);
      return true;
    });
  }
  // Walk from the app's own node rather than the binding's root: reaching the
  // root SemanticsOwner through the pipeline owner is deprecated.
  visit(tester.getSemantics(find.byType(MaterialApp)), insideTap: false);
  return out;
}

List<_Case> _cases() => [
      // ─── the small affordances: no exceptions, these must all clear 44 ───
      _Case('LumoChip remove ✕', () => LumoChip(label: 'تهران', onRemove: () {}, removeLabel: 'حذف تهران')),
      _Case('LumoChip remove ✕ (sm)', () => LumoChip(label: 'تهران', size: LumoChipSize.sm, onRemove: () {}, removeLabel: 'حذف تهران')),
      _Case('LumoAttachmentTile remove', () => LumoAttachmentTile(file: const LumoAttachment(name: 'گزارش.pdf'), onRemove: () {}, removeLabel: 'حذف گزارش')),
      _Case('LumoRating stars', () => LumoRating(label: 'امتیاز', valueLabel: '۴ از ۵', defaultValue: 4, onChanged: (_) {}, starLabel: (n) => '$n ستاره')),
      _Case('LumoRating stars (lg)', () => LumoRating(label: 'امتیاز', valueLabel: '۴ از ۵', defaultValue: 4, size: LumoRatingSize.lg, onChanged: (_) {}, starLabel: (n) => '$n ستاره')),
      // KNOWN LIMITATION, deliberately recorded rather than hidden. The steppers
      // were 24×14 before this pass and are 44×18 now — the inline axis was
      // widened to the floor, the block axis cannot be. Two steppers STACKED
      // inside one `LumoControl.md` (36 dp) control are 18 dp each by
      // arithmetic, and the only real fixes are to stop stacking them (side-by-side
      // −/+ flanking the field, the forui/shadcn_flutter idiom) or to make the
      // control taller than the shared scale. Both are design changes beyond a
      // polish pass, so this is filed as an argued exception, not a silent pass.
      _Case('LumoNumberField steppers', () => LumoNumberField(label: 'تعداد', incrementLabel: 'افزودن', decrementLabel: 'کاستن', defaultValue: 1, onChanged: (_) {}),
          exceptions: {
            'تعداد': 'the text field itself is the shared control scale, not a thumb target',
            'افزودن': 'stacked stepper: 44 dp on the inline axis, 18 on the block axis — see the note above',
            'کاستن': 'stacked stepper: 44 dp on the inline axis, 18 on the block axis — see the note above',
          },
          minorAxisWaived: {'افزودن', 'کاستن'}),
      _Case('LumoBreadcrumbs crumbs and «…»', () => LumoBreadcrumbs(
            label: 'مسیر',
            currentLabel: 'صفحهٔ فعلی',
            maxVisible: 2,
            overflowLabel: 'میانی',
            items: [LumoCrumb(label: 'خانه', onTap: () {}), LumoCrumb(label: 'دسته', onTap: () {}), LumoCrumb(label: 'زیر', onTap: () {}), const LumoCrumb(label: 'فعلی')],
          )),
      _Case('LumoAlert dismiss ✕', () => LumoAlert(title: 'هشدار', description: 'متن', onDismiss: () {}, dismissLabel: 'بستن هشدار')),
      _Case('LumoSearchField clear ✕', () => LumoSearchField(label: 'جستجو', clearLabel: 'پاک کردن', defaultValue: 'تهران', onChanged: (_) {}),
          exceptions: {'جستجو': 'the text field itself is the shared control scale, not a thumb target'}),
      _Case('LumoFileUpload remove', () => LumoFileUpload(
            label: 'پیوست',
            browseLabel: 'انتخاب',
            onBrowse: () {},
            onRemove: (_) {},
            removeLabel: (n) => 'حذف $n',
            files: const [LumoAttachment(name: 'گزارش.pdf', sizeLabel: '۲ مگابایت')],
          ), exceptions: {'انتخاب': 'a LumoButton on the shared control scale (sm 29 / md 36)'}),
      _Case('LumoIconButton', () => LumoIconButton(label: 'گزینه‌ها', onPressed: () {}, child: const Icon(Icons.more_horiz))),
      _Case('LumoIconButton (sm)', () => LumoIconButton(label: 'گزینه‌ها', size: LumoButtonSize.sm, onPressed: () {}, child: const Icon(Icons.more_horiz))),

      // ─── the shared control scale: wide-and-short by design ───
      _Case('LumoButton (md)', () => LumoButton(onPressed: () {}, child: const Text('ذخیره')),
          exceptions: {'ذخیره': 'LumoControl.md = 36, the web control scale; the button is full-width'}),
      _Case('LumoButton (sm)', () => LumoButton(size: LumoButtonSize.sm, onPressed: () {}, child: const Text('ذخیره')),
          exceptions: {'ذخیره': 'LumoControl.sm = 29, the web control scale; the button is full-width'}),
      _Case('LumoCheckbox', () => LumoCheckbox(label: 'قبول دارم', isSelected: true, onChanged: (_) {}),
          exceptions: {'قبول دارم': 'row height is the control scale; the whole row is the target, not just the box'}),
      _Case('LumoSwitch', () => LumoSwitch(label: 'اعلان‌ها', isSelected: true, onChanged: (_) {})),
      _Case('LumoTabs', () => LumoTabs(label: 'بخش‌ها', onChanged: (_) {}, tabs: const [LumoTab(id: 'a', label: 'یک'), LumoTab(id: 'b', label: 'دو')]),
          exceptions: {'یک': 'tab strip height follows the web tab scale', 'دو': 'tab strip height follows the web tab scale'}),
      _Case('LumoSegmentedControl', () => LumoSegmentedControl(label: 'نما', onChanged: (_) {}, segments: const [LumoSegment(id: 'a', label: 'نقشه'), LumoSegment(id: 'b', label: 'فهرست')]),
          exceptions: {'نقشه': 'segment height is the 32 dp track minus its 4 dp inset — the web control', 'فهرست': 'segment height is the 32 dp track minus its 4 dp inset — the web control'}),

      // ─── inline text: cannot be 44 tall without breaking the line box ───
      _Case('LumoLink (inline)', () => LumoLink(label: 'راهنما', onTap: () {}),
          exceptions: {'راهنما': 'an inline text link sits in a line box; a 44 dp target would tear a hole in the paragraph'},
          // Measured 21 dp tall — the line box of a 14 dp face. The height of
          // inline text is not a number anyone chose, so the minor-axis floor
          // cannot apply to it. WCAG 2.5.5 exempts inline links for this reason.
          minorAxisWaived: {'راهنما'}),
    ];

void main() {
  for (final c in _cases()) {
    testWidgets('${c.name}: every tappable node meets the ${_floor.toInt()} dp floor', (tester) async {
      tester.view.physicalSize = const Size(1200, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(MaterialApp(
        theme: lumoThemeData(brightness: Brightness.light),
        home: LumoScope(
          locale: 'fa-IR',
          brightness: Brightness.light,
          child: Scaffold(body: Center(child: SizedBox(width: 360, child: c.build()))),
        ),
      ));
      await tester.pumpAndSettle();

      final targets = _tapTargets(tester);
      expect(targets, isNotEmpty, reason: '${c.name} declared no tappable node — the probe is measuring nothing');

      for (final t in targets) {
        final small = t.size.width < _floor || t.size.height < _floor;
        if (!small) continue;

        final reason = c.exceptions[t.label];
        expect(reason, isNotNull,
            reason: '${c.name}: «${t.label}» offers only ${t.size.width.toStringAsFixed(1)}×${t.size.height.toStringAsFixed(1)} dp. '
                'Grow the HIT AREA (not the drawn glyph) to ${_floor.toInt()}×${_floor.toInt()}, '
                'or add it to this case\'s exceptions with the reason.');

        // An allow-listed control still has to be genuinely wide-and-short.
        final major = t.size.longestSide, minor = t.size.shortestSide;
        expect(major, greaterThanOrEqualTo(_floor),
            reason: '${c.name}: «${t.label}» is allow-listed ($reason) but is small on BOTH axes '
                '(${t.size.width.toStringAsFixed(1)}×${t.size.height.toStringAsFixed(1)}). An exception covers wide-and-short, never small-and-small.');
        if (!c.minorAxisWaived.contains(t.label)) {
          expect(minor, greaterThanOrEqualTo(_minorAxisFloor),
              reason: '${c.name}: «${t.label}» is allow-listed ($reason) but its short axis '
                  '(${minor.toStringAsFixed(1)}) is under LumoControl.sm = $_minorAxisFloor, the smallest the shared scale goes.');
        }
      }
      semantics.dispose();
    });
  }

  testWidgets('a deliberately undersized control FAILS the floor (the guard has teeth)', (tester) async {
    // The poison fixture: without it, a probe that silently found no nodes would pass.
    tester.view.physicalSize = const Size(1200, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(MaterialApp(
      theme: lumoThemeData(brightness: Brightness.light),
      home: LumoScope(
        locale: 'fa-IR',
        brightness: Brightness.light,
        child: Scaffold(
          body: Center(
            child: Semantics(
              container: true,
              button: true,
              label: 'خیلی کوچک',
              // The node must carry the ACTION, not just the role: `_tapTargets`
              // measures nodes with a `SemanticsAction.tap`, and the detector
              // below is excluded from semantics.
              onTap: () {},
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                excludeFromSemantics: true,
                onTap: () {},
                child: const SizedBox(width: 20, height: 20),
              ),
            ),
          ),
        ),
      ),
    ));
    await tester.pumpAndSettle();

    final tiny = _tapTargets(tester).where((t) => t.label == 'خیلی کوچک').single;
    expect(tiny.size.width, lessThan(_floor));
    expect(tiny.size.height, lessThan(_floor));
    expect(tiny.size.shortestSide, lessThan(_minorAxisFloor),
        reason: 'a 20×20 target is exactly what this file exists to catch');
    semantics.dispose();
  });
}
