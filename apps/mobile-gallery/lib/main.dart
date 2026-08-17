// The Lumo UI Mobile gallery: ONE Flutter web app that serves EVERY demo on the
// docs site, so the ~2 MB engine is downloaded once and cached across component
// pages.
//
//   /mobile-preview/index.html?demo=<demoId>&lang=<fa-IR|en-US>&theme=<light|dark>
//
// It renders exactly one demo, on a transparent background, with no chrome of
// its own — the docs page draws the phone frame around the iframe — and posts
// its measured height to the parent frame so the page can size that iframe.
//
// An unknown `demo` is never a blank canvas: it renders a visible box that
// names the id it was asked for.
library;

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import 'demos/all.dart';
import 'src/height_channel.dart';

/// The locales this gallery serves. Persian first — it is the library's first
/// language, and the fallback for anything unrecognised.
const kGalleryLocales = <String>['fa-IR', 'en-US'];

/// Widest the demo is ever laid out at: a phone, because that is what the
/// iframe is framed as. Wider and a `LumoTabs` row stops looking like the
/// thing being documented.
const kDemoMaxWidth = 360.0;

const _pad = EdgeInsets.symmetric(horizontal: 16, vertical: 20);

void main() {
  final query = Uri.base.queryParameters;
  runApp(
    LumoGalleryApp(
      demoId: query['demo'] ?? '',
      locale: normaliseGalleryLocale(query['lang']),
      brightness: query['theme'] == 'dark' ? Brightness.dark : Brightness.light,
    ),
  );
}

/// `lang` is a BCP-47 tag. Anything this gallery does not serve falls back to
/// `fa-IR` — stated in the URL contract, and the same rule the web docs follow.
String normaliseGalleryLocale(String? tag) {
  if (tag == null) return 'fa-IR';
  final normalised = tag.replaceAll('_', '-');
  for (final served in kGalleryLocales) {
    if (normalised.toLowerCase() == served.toLowerCase()) return served;
  }
  final primary = normalised.split('-').first.toLowerCase();
  for (final served in kGalleryLocales) {
    if (served.split('-').first.toLowerCase() == primary) return served;
  }
  return 'fa-IR';
}

Locale _materialLocale(String tag) {
  final parts = tag.split('-');
  return Locale(parts.first, parts.length > 1 ? parts[1] : null);
}

class LumoGalleryApp extends StatelessWidget {
  const LumoGalleryApp({
    super.key,
    required this.demoId,
    required this.locale,
    required this.brightness,
  });

  final String demoId;
  final String locale;
  final Brightness brightness;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      // Material's own widgets (its scrollbars, its text-selection menu) have
      // to speak the page's language too. Without these delegates they fall
      // back to English, which is the exact defect this library exists to
      // prevent.
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      supportedLocales: kGalleryLocales.map(_materialLocale),
      locale: _materialLocale(locale),
      theme: lumoThemeData(brightness: brightness),
      // Above the Navigator, so a pushed Lumo route (dialog, sheet, popover,
      // menu) is inside the scope too — the placement `packages/mobile`'s
      // README prescribes.
      builder: (context, child) => LumoScope(
        locale: locale,
        brightness: brightness,
        child: child ?? const SizedBox.shrink(),
      ),
      home: DemoStage(demoId: demoId, locale: locale),
    );
  }
}

/// The stage: transparent, centred, one demo, nothing else. No `AppBar`, no
/// title, no padding a phone frame would double.
class DemoStage extends StatelessWidget {
  const DemoStage({super.key, required this.demoId, required this.locale});

  final String demoId;
  final String locale;

  @override
  Widget build(BuildContext context) {
    final builder = lumoDemos[demoId];
    final demo = builder == null
        ? UnknownDemo(demoId: demoId, locale: locale)
        : builder(context);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, box) => SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: box.maxHeight),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: kDemoMaxWidth),
                  child: Padding(
                    padding: _pad,
                    child: DemoHeightReporter(
                      demoId: demoId,
                      extraHeight: _pad.vertical,
                      // CENTRED, like the web's preview stage
                      // (`grid place-items-center` › `flex items-center` in
                      // `example-card.tsx`). This was `stretch`, on the argument
                      // that a widget should be laid out at the full phone width
                      // — but stretch does not centre a demo, it makes every demo
                      // full-width, and a demo with nothing to fill that width
                      // then sits hard against the READING START. Under fa-IR
                      // that is the right-hand edge, which is what the owner saw:
                      // measured over the 105 demos, 21 had their content pinned
                      // to one edge with the far side empty; centring leaves 6,
                      // and those 6 are widgets that DO fill the width and are
                      // start-aligned inside themselves, which is correct.
                      //
                      // Greedy widgets (a text field, a tab bar, an item group)
                      // still fill: loose constraints do not shrink them. What
                      // changes is the intrinsically-sized demos — a button, a
                      // card, a menu trigger — which now take their natural width
                      // and centre, exactly as the same demo does on the Web tab.
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [demo],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Never a blank canvas. A demo id that is not registered says so, in the
/// language it was asked in, and prints the id it was asked for.
class UnknownDemo extends StatelessWidget {
  const UnknownDemo({super.key, required this.demoId, required this.locale});

  final String demoId;
  final String locale;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final persian = locale.startsWith('fa');
    final shown = demoId.isEmpty ? '—' : demoId;
    return LumoAlert(
      title: persian ? 'دموی ناشناخته' : 'Unknown demo',
      description: persian
          ? 'این گالری دمویی با شناسهٔ «$shown» ندارد.'
          : 'This gallery has no demo with the id "$shown".',
      tone: LumoAlertTone.critical,
      variant: LumoAlertVariant.outline,
      icon: Icon(Icons.help_outline, color: c.critical),
    );
  }
}

/// Measures the demo after every frame and posts the height to the parent
/// frame, per the gallery URL contract:
///
///     window.parent.postMessage(
///       {type: 'lumo-demo-height', demo: '<id>', height: <px>}, '*')
///
/// Posted after first paint and again whenever the measurement changes (a
/// resize, a disclosure opening, an alert being dismissed). The page is told
/// never to assume it is honoured — a canvas that fails to measure must still
/// be framed by a page that picked a sane default.
class DemoHeightReporter extends StatefulWidget {
  const DemoHeightReporter({
    super.key,
    required this.demoId,
    required this.child,
    this.extraHeight = 0,
  });

  final String demoId;
  final Widget child;

  /// Padding the stage adds around the demo, counted into the posted height so
  /// the iframe does not clip it.
  final double extraHeight;

  @override
  State<DemoHeightReporter> createState() => _DemoHeightReporterState();
}

class _DemoHeightReporterState extends State<DemoHeightReporter> {
  final _key = GlobalKey();
  double? _last;

  @override
  void initState() {
    super.initState();
    _scheduleMeasure();
  }

  void _scheduleMeasure() {
    WidgetsBinding.instance.addPostFrameCallback((_) => _measure());
  }

  void _measure() {
    if (!mounted) return;
    final size = _key.currentContext?.size;
    if (size == null) {
      _scheduleMeasure();
      return;
    }
    final height = size.height + widget.extraHeight;
    if (_last == null || (height - _last!).abs() >= 0.5) {
      _last = height;
      postDemoHeight(widget.demoId, height);
    }
    // Keep watching: a demo that opens a disclosure or dismisses an alert
    // changes height without this widget rebuilding.
    _scheduleMeasure();
  }

  @override
  Widget build(BuildContext context) =>
      KeyedSubtree(key: _key, child: widget.child);
}

