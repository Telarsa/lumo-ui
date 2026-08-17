// Poison: physical geometry where the inline axis was meant.
//
// The silent RTL defect: it renders, it screenshots, it passes a test written
// in English — and in Persian the padding, the alignment and the text are all
// on the wrong side. Valid, analysable Dart; only the contract objects.
import 'package:flutter/material.dart';

class PoisonDirection extends StatelessWidget {
  const PoisonDirection({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) => Padding(
        // WRONG: `left` is not `start`.
        padding: const EdgeInsets.only(left: 12),
        child: Align(
          // WRONG: physical corner.
          alignment: Alignment.centerLeft,
          // WRONG: physical text alignment.
          child: Text(label, textAlign: TextAlign.left),
        ),
      );
}
