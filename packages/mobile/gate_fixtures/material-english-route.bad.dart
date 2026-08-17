// Poison: a Material route helper.
//
// Every announced string in this widget is a required parameter — and the
// route it opens still calls itself «Dialog» and its barrier «Dismiss», in
// English, from MaterialLocalizations. No parameter of ours reaches those,
// which is why Lumo ships its own routes.
import 'package:flutter/material.dart';

class PoisonMaterialRoute extends StatelessWidget {
  const PoisonMaterialRoute({super.key, required this.label, required this.closeLabel});

  final String label;
  final String closeLabel;

  Future<void> open(BuildContext context) async {
    // WRONG: Material names this route, not us.
    await showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => Semantics(label: label, child: Text(closeLabel)),
    );
  }

  @override
  Widget build(BuildContext context) => TextButton(onPressed: () => open(context), child: Text(label));
}
