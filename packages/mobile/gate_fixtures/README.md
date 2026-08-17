# Poison fixtures for `gate:flutter-contract`

One file per rule, each a *valid* Dart widget that a compiler, `flutter analyze`
and a hand-written test would all wave through — and that the contract forbids.
`node scripts/flutter-contract-gate.mjs --self-test` requires each to be
rejected by the rule its name carries, and requires `good.dart` to stay clean.

A rule that quietly stops detecting is worse than a missing rule, because it is
trusted. These files are how we find that out.

They are deliberately NOT under `lib/` (they would ship) and not under `test/`
(they are not tests). `flutter analyze` still reads them, so they must remain
valid, analysable Dart.
