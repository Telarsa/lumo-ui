import 'package:flutter/material.dart';
import 'package:lumo_ui_mobile/lumo_ui_mobile.dart' as lumo;

/// Inter owns Latin glyphs; IRANSansX supplies Persian without replacing digits.
ThemeData telarsaThemeData({
  required Brightness brightness,
  lumo.LumoSchemeColours? colours,
  String? fontFamily,
}) {
  final theme = lumo.lumoThemeData(
    brightness: brightness,
    colours: colours,
    fontFamily: 'Inter',
  );
  return theme.copyWith(
    textTheme: theme.textTheme.apply(fontFamily: 'Inter', fontFamilyFallback: const ['IRANSansX']),
    primaryTextTheme: theme.primaryTextTheme.apply(fontFamily: 'Inter', fontFamilyFallback: const ['IRANSansX']),
  );
}
