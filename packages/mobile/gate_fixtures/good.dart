// The clean counterpart: everything the rules look for, done right.
//
// Announced strings are required parameters, no Latin literal reaches a person,
// geometry is logical. The self-test requires this file to stay clean — a gate
// that flags correct code is a gate people learn to route around.
import 'package:flutter/material.dart';

class Clean extends StatelessWidget {
  const Clean({super.key, required this.label, required this.closeLabel, required this.child});

  final String label;
  final String closeLabel;
  final Widget child;

  @override
  Widget build(BuildContext context) => Semantics(
        label: label,
        child: Padding(
          padding: const EdgeInsetsDirectional.only(start: 12),
          child: Align(
            alignment: AlignmentDirectional.centerStart,
            child: Tooltip(message: closeLabel, child: child),
          ),
        ),
      );
}
