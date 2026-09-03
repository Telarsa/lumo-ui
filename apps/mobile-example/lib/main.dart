// The mobile counterpart of `apps/website`.
//
// `apps/website` is a shadcn app that consumes `@lumo-ui/*` and is graded by
// `gate:html`. This is a MATERIAL app that consumes `lumo_ui_mobile` and is
// graded by the semantics grader. Neither is a component showcase. Both exist
// so the library has a consumer inside its own repository — the thing that
// makes a gate mean something, because a grader whose only corpus is the
// library's own demos can only ever agree with itself.
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import 'src/booking_screen.dart';

void main() => runApp(const ExampleApp());

class ExampleApp extends StatefulWidget {
  const ExampleApp({super.key, this.initialLocale = 'fa', this.today});

  final String initialLocale;

  /// Fixed by the tests so a grading run is reproducible.
  final DateTime? today;

  @override
  State<ExampleApp> createState() => _ExampleAppState();
}

class _ExampleAppState extends State<ExampleApp> {
  late String _locale = widget.initialLocale;

  @override
  Widget build(BuildContext context) {
    // ONE locale, read by both paths. `MaterialApp.locale` drives
    // `Localizations`; `LumoScope.locale` drives direction, digits and the
    // calendar. An app that sets only the first translates its strings and
    // leaves its numbers in Western digits, and the mistake is invisible until
    // someone reads the screen in Persian.
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      locale: Locale(_locale),
      supportedLocales: const [Locale('fa'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      // Lumo's tokens, bound into Material's own `ColorScheme`. Every Material
      // widget below is already the right colour without being wrapped.
      theme: lumoThemeData(brightness: Brightness.light),
      darkTheme: lumoThemeData(brightness: Brightness.dark),
      home: LumoScope(
        locale: _locale,
        child: BookingScreen(
          locale: _locale,
          today: widget.today,
          onLocaleChanged: (l) => setState(() => _locale = l),
        ),
      ),
    );
  }
}
