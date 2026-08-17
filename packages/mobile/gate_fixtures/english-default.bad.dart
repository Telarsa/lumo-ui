// Poison: an announced string with an English default.
//
// This is the defect the library exists to argue against. It compiles, it
// analyses, and every Persian consumer who forgets the parameter ships a
// button that a screen reader calls "Close".
import 'package:flutter/material.dart';

class PoisonDefault extends StatelessWidget {
  const PoisonDefault({super.key, this.closeLabel = 'Close', required this.child});

  /// WRONG: a default makes the announced string optional.
  final String closeLabel;
  final Widget child;

  @override
  Widget build(BuildContext context) => Semantics(label: closeLabel, child: child);
}
