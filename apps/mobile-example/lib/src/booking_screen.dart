// The consumer screen. MATERIAL widgets throughout — `FilledButton`,
// `OutlinedButton`, `TextField`, `Switch`, `Card`, `SegmentedButton`,
// `SnackBar`. Lumo supplies none of them and is not trying to.
//
// What Lumo supplies is the four things Material cannot:
//
//   1. `LumoScope(locale:)` derives `Directionality`, so the layout mirrors
//      from the language rather than from a flag someone remembered to flip.
//   2. `lumoThemeData` binds Lumo's tokens into Material's `ColorScheme`, so
//      these Material widgets already wear the same palette as the web.
//   3. `formatNumber` writes ۰–۹ under `fa`.
//   4. `formatLumoDate` writes «۹ شهریور ۱۴۰۵». Flutter's `intl` is
//      Gregorian-only; this is the gap the package exists for.
//
// `test/semantics_test.dart` grades what this screen announces, in both
// languages, with the same grader a consuming app runs.
import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

import 'strings.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({
    super.key,
    required this.locale,
    required this.onLocaleChanged,
    this.today,
  });

  final String locale;
  final ValueChanged<String> onLocaleChanged;

  /// Fixed by the tests so a grading run is reproducible; null means now.
  final DateTime? today;

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  late DateTime _day = widget.today ?? DateTime.now();
  int _minutes = 30;
  bool _remind = true;
  final _height = TextEditingController(text: '178');

  @override
  void dispose() {
    _height.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = Strings.of(widget.locale);
    final theme = Theme.of(context);
    String n(num v) => formatNumber(v, widget.locale);

    return Scaffold(
      appBar: AppBar(
        title: Text(s.title),
        actions: [
          // A locale switch, because half of what this app demonstrates is only
          // visible when the language changes: direction, digits, calendar.
          PopupMenuButton<String>(
            tooltip: s.language,
            initialValue: widget.locale,
            onSelected: widget.onLocaleChanged,
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'fa', child: Text('فارسی')),
              PopupMenuItem(value: 'en', child: Text('English')),
            ],
            icon: const Icon(Icons.translate),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(s.subtitle, style: theme.textTheme.bodyMedium),
          const SizedBox(height: 20),

          // ── the date ────────────────────────────────────────────────────
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.appointmentOn, style: theme.textTheme.labelLarge),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      IconButton(
                        tooltip: s.earlier,
                        onPressed: () => setState(
                            () => _day = _day.subtract(const Duration(days: 1))),
                        // `chevron_left` would point the wrong way in Persian.
                        // The direction comes from `LumoScope`, and Material's
                        // directional icons follow it.
                        icon: const Icon(Icons.chevron_left),
                      ),
                      Expanded(
                        child: Text(
                          // The Jalali gap-filler. Under `fa` this is
                          // «دوشنبه ۹ شهریور ۱۴۰۵»; under `en`, «Monday,
                          // August 31, 2026». One call, both calendars.
                          formatLumoDate(_day, widget.locale,
                              style: LumoDateStyle.long),
                          textAlign: TextAlign.center,
                          style: theme.textTheme.titleMedium,
                        ),
                      ),
                      IconButton(
                        tooltip: s.later,
                        onPressed: () => setState(
                            () => _day = _day.add(const Duration(days: 1))),
                        icon: const Icon(Icons.chevron_right),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // ── the duration ────────────────────────────────────────────────
          Text(s.durationLabel, style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          SegmentedButton<int>(
            segments: [
              for (final m in const [15, 30, 60])
                ButtonSegment(
                  value: m,
                  // `${m} minutes` would announce «30 دقیقه» — Persian words
                  // around a Latin number, which is the defect `persian-digits`
                  // exists to catch.
                  label: Text('${n(m)} ${s.durationUnit}'),
                ),
            ],
            selected: {_minutes},
            onSelectionChanged: (v) => setState(() => _minutes = v.first),
          ),
          const SizedBox(height: 20),

          // ── the numeric entry ───────────────────────────────────────────
          Semantics(
            // The one place ASCII digits are correct: the keypad produces
            // ASCII and `double.tryParse` cannot read «۱۷۸». Declaring it is
            // what stops the grader reporting a field that is working.
            identifier: kLumoLatnIsland,
            child: TextField(
              controller: _height,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              textDirection: TextDirection.ltr,
              decoration: InputDecoration(
                labelText: s.heightLabel,
                border: const OutlineInputBorder(),
                // Announced, so it is a string this app owns. A hard-coded
                // 'cm' reads out as an English word on a Persian screen — the
                // grader's own corpus had it for exactly one run.
                suffixText: s.heightUnit,
              ),
            ),
          ),
          const SizedBox(height: 20),

          // ── the switch ──────────────────────────────────────────────────
          SwitchListTile(
            title: Text(s.remindMe),
            // A `Switch` announces its state as a checked flag, which a reader
            // hears as "on"/"off" in ITS language, not the app's. The subtitle
            // says it in the app's language too.
            subtitle: Text(_remind ? s.remindMeOn : s.remindMeOff),
            value: _remind,
            onChanged: (v) => setState(() => _remind = v),
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: 8),

          // ── the history ─────────────────────────────────────────────────
          Text(s.history, style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          for (final visit in const [(days: 34, price: 480000), (days: 96, price: 350000)])
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.event_available),
              title: Text(formatLumoDate(
                _day.subtract(Duration(days: visit.days)),
                widget.locale,
                style: LumoDateStyle.medium,
              )),
              subtitle: Text('${s.priceLabel}: ${n(visit.price)} ${s.currency}'),
            ),
          const SizedBox(height: 24),

          // ── the actions ─────────────────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  onPressed: () => ScaffoldMessenger.of(context)
                    ..clearSnackBars()
                    ..showSnackBar(SnackBar(
                      content: Text(s.confirmed),
                      // Material would label this «Close» in English on a
                      // Persian screen if the app did not say otherwise.
                      action: SnackBarAction(
                        label: s.dismiss,
                        onPressed: () {},
                      ),
                    )),
                  child: Text(s.confirm),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() {
                    _minutes = 30;
                    _remind = true;
                  }),
                  child: Text(s.cancel),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
