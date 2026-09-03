import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart';

/// **Defect class guarded: a token pair that reads on one scheme and not the other.**
///
/// The palette in `tokens.g.dart` is GENERATED from `packages/theme/src/tokens.css`,
/// so a regenerate can move a ramp's lightness and quietly push a foreground under
/// the legibility floor on ONE scheme only — the failure a light-mode developer
/// never sees. This test pins the floors for every pair the library actually paints,
/// in BOTH schemes, so the generator cannot regress them silently.
///
/// The floors (WCAG 2.1):
///  - **4.5:1** for any foreground carrying words (1.4.3 Contrast (Minimum), normal text).
///  - **3:1** for a CONTROL BOUNDARY — `borderControl` (1.4.11 Non-text Contrast).
///  - `border` is exempt and asserted only to be present: it is a decorative rule
///    (a divider, a card edge), not a control boundary, and 1.4.11 does not reach it.
///    It measures 1.21 light / 2.00 dark BY DESIGN — a hairline, not an outline.
///
/// Measured floors at the time of writing (the worst pair in each class):
///  - light: `fgSubtle on surfaceSunken` = 4.61 · dark: `fgSubtle on surface` = 5.76
///  - light: `borderControl on surface` = 3.36 · dark: 3.78
double _lin(double c) => c <= 0.03928 ? c / 12.92 : math.pow((c + 0.055) / 1.055, 2.4).toDouble();

double _luminance(Color c) => 0.2126 * _lin(c.r) + 0.7152 * _lin(c.g) + 0.0722 * _lin(c.b);

/// WCAG 2.1 contrast ratio between two opaque colours.
double contrastRatio(Color a, Color b) {
  final la = _luminance(a), lb = _luminance(b);
  return (math.max(la, lb) + 0.05) / (math.min(la, lb) + 0.05);
}

void main() {
  for (final scheme in {'light': lightColours(), 'dark': darkColours()}.entries) {
    final name = scheme.key;
    final c = scheme.value;

    test('$name scheme: every foreground carrying words clears AA 4.5:1', () {
      // Every (foreground, background) pair the library actually paints text with.
      final textPairs = <String, List<Color>>{
        'fg on bg': [c.fg, c.bg],
        'fg on surface': [c.fg, c.surface],
        'fg on surfaceSunken': [c.fg, c.surfaceSunken],
        'fgMuted on bg': [c.fgMuted, c.bg],
        'fgMuted on surface': [c.fgMuted, c.surface],
        'fgMuted on surfaceSunken': [c.fgMuted, c.surfaceSunken],
        'fgSubtle on bg': [c.fgSubtle, c.bg],
        'fgSubtle on surface': [c.fgSubtle, c.surface],
        'fgSubtle on surfaceSunken': [c.fgSubtle, c.surfaceSunken],
        // The filled accent (solid button, selected chip).
        'accentFg on accent': [c.accentFg, c.accent],
        'fgOnAccent on accent': [c.fgOnAccent, c.accent],
        // Status text ON a neutral surface (alert, badge subtle, field error message).
        'critical on bg': [c.critical, c.bg],
        'critical on surface': [c.critical, c.surface],
        'positive on bg': [c.positive, c.bg],
        'positive on surface': [c.positive, c.surface],
        'caution on bg': [c.caution, c.bg],
        'caution on surface': [c.caution, c.surface],
        // Text ON a filled status colour — `c.bg`, the web's `text-bg`, because the
        // status tokens swap lightness between schemes and `bg` swaps with them.
        'bg on critical': [c.bg, c.critical],
        'bg on positive': [c.bg, c.positive],
        'bg on caution': [c.bg, c.caution],
        // The accent as a foreground (link, focused label).
        'accent on bg': [c.accent, c.bg],
        'accent on surface': [c.accent, c.surface],
      };
      textPairs.forEach((pair, v) {
        expect(contrastRatio(v[0], v[1]), greaterThanOrEqualTo(4.5),
            reason: '$name: «$pair» carries words and must clear WCAG AA 4.5:1');
      });
    });

    test('$name scheme: a control boundary clears the 3:1 non-text floor', () {
      // 1.4.11: the visual boundary of a control must be distinguishable.
      expect(contrastRatio(c.borderControl, c.surface), greaterThanOrEqualTo(3.0),
          reason: '$name: borderControl outlines inputs, checkboxes and outline buttons');
      expect(contrastRatio(c.borderControl, c.bg), greaterThanOrEqualTo(3.0));
      // The focus ring is the strongest signal in the scheme and must never be subtle.
      expect(contrastRatio(c.focus, c.bg), greaterThanOrEqualTo(3.0),
          reason: '$name: the focus ring is how a switch-access user knows where they are');
      expect(contrastRatio(c.focus, c.surface), greaterThanOrEqualTo(3.0));
    });

    test('$name scheme: the decorative rule is a hairline, deliberately below 3:1', () {
      // Pinned as a DECISION, not an oversight: `border` is a divider, never a
      // control edge. If a future palette makes it a strong line, that is a visual
      // change big enough to be reviewed, so this test should fail and be updated.
      final r = contrastRatio(c.border, c.bg);
      expect(r, lessThan(3.0), reason: '$name: `border` is decorative; a control uses `borderControl`');
      expect(r, greaterThan(1.0));
    });
  }

  test('the two schemes are genuinely distinct (a scheme swap is not a no-op)', () {
    final l = lightColours(), d = darkColours();
    expect(l.bg, isNot(d.bg));
    expect(l.fg, isNot(d.fg));
    expect(l.accent, isNot(d.accent));
    // Light foreground on dark ground and vice versa — the schemes are inverted, not tinted.
    expect(_luminance(l.bg), greaterThan(_luminance(l.fg)));
    expect(_luminance(d.bg), lessThan(_luminance(d.fg)));
  });
}
