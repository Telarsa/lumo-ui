/// Lumo UI for Flutter — the same contract as the web and React Native
/// packages, on Material 3's widgets: every announced string is a REQUIRED
/// parameter (a Dart named `required`, checked at compile time), direction
/// derives from the locale (`Directionality` from `LumoScope`), numbers go
/// through `formatNumber`, colours/radii/heights come from the same tokens as
/// the web theme (`tokens.g.dart` is generated from tokens.css).
library;

export 'src/tokens.g.dart';
export 'src/scope.dart';
export 'src/format.dart';
export 'src/button.dart';
export 'src/switch.dart';
export 'src/text_field.dart';
export 'src/select.dart';
export 'src/dialog.dart';
