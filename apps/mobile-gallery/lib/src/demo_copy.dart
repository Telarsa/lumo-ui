/// The copy table for one demo file, resolved to the locale the gallery was
/// asked for.
///
/// It exists so that ONE table serves both readings of a demo string:
///
///   * at RUNTIME `t['save']` is a lookup, so `?lang=en-US` renders English and
///     `?lang=fa-IR` renders Persian — the same promise the web examples make
///     with their own `t.save` copy tables;
///   * at BUILD TIME `scripts/build-mobile-demos.mjs` substitutes `t['save']`
///     with that locale's literal, so the snippet printed beside the demo is
///     plain, copy-pasteable Dart that never mentions this class.
///
/// Inside a string interpolation the substitution is raw, so
/// `'${t['removeTag']} $name'` prints as `'Remove $name'` rather than as a
/// literal nested in a literal.
///
/// A missing key throws rather than rendering a blank: a demo that silently
/// loses its label is the defect this library exists to prevent. A missing
/// locale falls back to `fa-IR`, the same rule `?lang=` follows — and the build
/// gate makes sure that fallback never actually fires, by failing the build
/// when any locale is missing.
class LumoDemoCopy {
  const LumoDemoCopy(this._table, this._locale);

  final Map<String, Map<String, String>> _table;
  final String _locale;

  String operator [](String key) {
    final entry = _table[key];
    if (entry == null) {
      throw ArgumentError.value(key, 'key', 'this demo file has no copy for it');
    }
    return entry[_locale] ?? entry['fa-IR']!;
  }
}
