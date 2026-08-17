// Poison: a user-facing string hard-coded in Latin letters.
//
// No parameter reaches it, so no locale can. The widget looks localised —
// every announced string IS a parameter — while one name is welded shut.
import 'package:flutter/material.dart';

class PoisonLiteral extends StatelessWidget {
  const PoisonLiteral({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Semantics(label: label, child: const SizedBox.shrink()),
          // WRONG: welded shut.
          const Text('No results found'),
          Tooltip(message: 'Remove this item', child: const SizedBox.shrink()),
        ],
      );
}
