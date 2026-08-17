import 'package:flutter/material.dart';
import 'scope.dart';

/// One section of a `LumoAccordion`: `id` is the collection key the open set is
/// written in (a key, never a rendered string), `title` is REQUIRED — the
/// trigger's visible text AND its announced name, in one string, so seen and
/// announced cannot drift.
class LumoDisclosureItem {
  const LumoDisclosureItem({required this.id, required this.title, required this.child, this.isDisabled = false});
  /// A stable identity for this item — used for selection and equality, never shown or announced.
  final String id;
  /// The visible title.
  final String title;
  /// The widget this one wraps.
  final Widget child;
  /// Whether the control is disabled.
  final bool isDisabled;
}

/// A collapsible section — the web `Disclosure` + `DisclosureTrigger` +
/// `DisclosurePanel` as ONE widget (Flutter has no compound-children idiom that
/// buys anything here; the parts carried no props of their own that a caller
/// sets). Controlled with `isOpen` + `onOpenChange`, uncontrolled with
/// `defaultOpen`, exactly as the web has both.
///
/// The chevron rotates HALF A TURN on the block axis — a rotation, not a flip,
/// so there is nothing to mirror; it sits at the inline END (`ms-auto` on the
/// web, a `Row` here). The panel animates open with `AnimatedSize`, and the
/// duration collapses to zero under `MediaQuery.disableAnimationsOf` (the
/// platform's «reduce motion» — the web's `motion-reduce:transition-none`).
///
/// A closed panel is NOT BUILT: it is out of the widget tree and out of the
/// semantics tree, which is Base UI's default too (`keepMounted` is opt-in
/// there; on mobile there is no find-in-page and no first-byte HTML to put it
/// in, so the flag has no mobile counterpart and is not declared).
///
/// Semantics: the trigger is ONE node — a `button`, `hasExpandedState` +
/// `isExpanded` (Flutter's `expanded:`, the counterpart of `aria-expanded`),
/// `enabled`, named by `title`. The visible title is inside `ExcludeSemantics`
/// so the string is announced exactly ONCE; the chevron is decoration. The
/// panel is a plain group, NOT a `SemanticsRole.region`: Flutter's region role
/// requires a label of its own, and the only honest label is the title — which
/// would put the same string in the tree twice, where the web can point
/// `aria-labelledby` at the existing trigger node and pay nothing.
class LumoDisclosure extends StatefulWidget {
  const LumoDisclosure({super.key, required this.title, required this.child, this.isOpen, this.defaultOpen = false, this.onOpenChange, this.isDisabled = false});

  /// The section's name — visible and announced. Required.
  final String title;
  /// The widget this one wraps.
  final Widget child;

  /// Open state (controlled).
  final bool? isOpen;

  /// Open state at first build (uncontrolled).
  final bool defaultOpen;
  /// Called when the surface opens or closes, with the new state.
  final ValueChanged<bool>? onOpenChange;
  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  State<LumoDisclosure> createState() => _LumoDisclosureState();
}

class _LumoDisclosureState extends State<LumoDisclosure> {
  late bool _open = widget.defaultOpen;

  bool get _isOpen => widget.isOpen ?? _open;

  void _toggle() {
    final next = !_isOpen;
    if (widget.isOpen == null) setState(() => _open = next);
    widget.onOpenChange?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    // A lone disclosure has no frame of its own — `disclosureVariants` on the
    // web is `w-full` and nothing else; the rules belong to the group.
    return _DisclosureRow(
      title: widget.title,
      isOpen: _isOpen,
      isDisabled: widget.isDisabled,
      onTap: _toggle,
      dividerBelow: false,
      child: widget.child,
    );
  }
}

/// Several disclosures as one control — the web `DisclosureGroup`. `value` /
/// `defaultValue` are the OPEN IDS (controlled / uncontrolled), `onChanged`
/// reports the whole set; with `allowsMultiple` false (the default, as on the
/// web) opening one closes the other.
///
/// Prop names: the web wrapper renames these to `expandedKeys` /
/// `defaultExpandedKeys` / `onExpandedChange` over Base UI's own `value` /
/// `defaultValue` / `onValueChange`; the mobile names are the engine's, which
/// is what the rest of this package uses (`LumoTabs`, `LumoSegmentedControl`).
/// `allowsMultipleExpanded` is `allowsMultiple` for the same reason.
///
/// The frame is the web's: a hairline above the first section and below every
/// one of them (`border-y` + `divide-y`).
class LumoAccordion extends StatefulWidget {
  const LumoAccordion({super.key, required this.items, this.allowsMultiple = false, this.value, this.defaultValue, this.onChanged, this.isDisabled = false});

  /// The items to show, in reading order.
  final List<LumoDisclosureItem> items;

  /// Whether more than one section may be open at a time.
  final bool allowsMultiple;

  /// The open section ids (controlled).
  final Set<String>? value;

  /// The open section ids at first build (uncontrolled).
  final Set<String>? defaultValue;
  /// Called with the new value when the user changes it. Omitting it makes the control read-only.
  final ValueChanged<Set<String>>? onChanged;

  /// Disables every section.
  final bool isDisabled;

  @override
  State<LumoAccordion> createState() => _LumoAccordionState();
}

class _LumoAccordionState extends State<LumoAccordion> {
  late Set<String> _open = {...?widget.defaultValue};

  Set<String> get _current => widget.value ?? _open;

  void _toggle(String id) {
    final open = _current.contains(id);
    final next = open
        ? ({..._current}..remove(id))
        : (widget.allowsMultiple ? ({..._current}..add(id)) : {id});
    if (widget.value == null) setState(() => _open = next);
    widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final open = _current;
    return DecoratedBox(
      decoration: BoxDecoration(border: Border(top: BorderSide(color: c.border))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final item in widget.items)
            _DisclosureRow(
              title: item.title,
              isOpen: open.contains(item.id),
              isDisabled: widget.isDisabled || item.isDisabled,
              onTap: () => _toggle(item.id),
              dividerBelow: true,
              child: item.child,
            ),
        ],
      ),
    );
  }
}

/// The trigger + panel pair both public widgets render.
class _DisclosureRow extends StatelessWidget {
  const _DisclosureRow({required this.title, required this.child, required this.isOpen, required this.isDisabled, required this.onTap, required this.dividerBelow});
  final String title;
  final Widget child;
  final bool isOpen;
  final bool isDisabled;
  final VoidCallback onTap;
  final bool dividerBelow;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    // «Reduce motion» is the platform's answer, not a parameter of ours: under
    // it the animated wrappers are not built at all (an `AnimatedSize` of zero
    // duration re-dirties itself inside its own layout — the widget is simply
    // the wrong tool when there is no animation to run).
    final motion = !MediaQuery.disableAnimationsOf(context);
    const duration = Duration(milliseconds: 200);
    final chevron = Icon(Icons.keyboard_arrow_down, size: 16, color: c.fgMuted);
    final panel = isOpen
        ? Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: DefaultTextStyle.merge(style: TextStyle(fontSize: 14, height: 1.7, color: c.fgMuted), child: child),
          )
        : const SizedBox(width: double.infinity);
    return DecoratedBox(
      decoration: BoxDecoration(border: dividerBelow ? Border(bottom: BorderSide(color: c.border)) : null),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Semantics(
            button: true,
            expanded: isOpen,
            enabled: !isDisabled,
            label: title,
            child: Opacity(
              opacity: isDisabled ? 0.5 : 1,
              child: InkWell(
                onTap: isDisabled ? null : onTap,
                canRequestFocus: !isDisabled,
                // The name is announced from the Semantics above; the visible text is excluded so it is heard ONCE.
                child: ExcludeSemantics(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Row(
                      children: [
                        // The title wraps rather than truncating: it is the section's meaning, and the chevron is 16px of decoration beside it.
                        Expanded(child: Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, height: 1.4, color: isOpen ? c.accent : c.fg))),
                        const SizedBox(width: 12),
                        // Half a turn on the block axis — a rotation mirrors nothing.
                        if (motion)
                          AnimatedRotation(turns: isOpen ? 0.5 : 0, duration: duration, curve: Curves.easeOut, child: chevron)
                        else
                          RotatedBox(quarterTurns: isOpen ? 2 : 0, child: chevron),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          if (motion) AnimatedSize(duration: duration, curve: Curves.easeOut, alignment: Alignment.topCenter, child: panel) else panel,
        ],
      ),
    );
  }
}
