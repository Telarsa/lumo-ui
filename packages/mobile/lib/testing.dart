/// Lumo UI Mobile — the testing surface.
///
/// A SEPARATE entry point from `lumo_ui_mobile.dart` on purpose: importing it
/// pulls in `flutter_test`, which belongs in a test binary and not in an app's
/// release build. A consumer writes:
///
/// ```dart
/// import 'package:lumo_ui_mobile/testing.dart';
/// ```
///
/// …in `test/`, and grades its own screens with the same rules and the same
/// code that grades Lumo's gallery — which is the whole point of it living here
/// rather than in the gallery (decision §53).
library;

export 'src/latn.dart' show kLumoLatnIsland;
export 'src/testing/semantics.dart';
