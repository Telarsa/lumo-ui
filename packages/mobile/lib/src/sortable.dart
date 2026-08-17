import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show CustomSemanticsAction;
import 'scope.dart';
import 'tokens.g.dart';

/// One entry of a [LumoSortable].
///
/// Three required strings, and the third and fourth are the point of the whole
/// family: **a drag is not available to a screen-reader user**, so an item that
/// can only be dragged cannot be reordered by them at all. [moveUpLabel] and
/// [moveDownLabel] become named `CustomSemanticsAction`s on the item's node —
/// the rotor entry / TalkBack action that IS the keyboard route `sortable.tsx`
/// spells with Space-and-arrows. They are per ITEM, not per list, so the caller
/// can write «انتقال «فاکتور مرداد» به بالا» instead of a bare «به بالا» that
/// says nothing about which row moved.
class LumoSortableItem {
  const LumoSortableItem({
    required this.id,
    required this.label,
    required this.moveUpLabel,
    required this.moveDownLabel,
    this.description,
    this.leading,
    this.trailing,
    this.child,
  });

  /// Stable identity across reorders. Not announced.
  final String id;

  /// The item's announced name, and — unless [child] is given — its drawn
  /// first line. REQUIRED.
  final String label;

  /// Names the "move one place earlier" action, e.g. «انتقال به بالا». REQUIRED.
  final String moveUpLabel;

  /// Names the "move one place later" action, e.g. «انتقال به پایین». REQUIRED.
  final String moveDownLabel;

  /// A second drawn line. Announced after the name, as `LumoItem` does.
  final String? description;

  /// Decoration at the inline start, after the grip. Excluded from semantics.
  final Widget? leading;

  /// Drawn at the inline end — a badge, a count.
  final Widget? trailing;

  /// Replaces the drawn `label`/`description` block entirely. The name is still
  /// announced from the item's own node, so a `child` that repeats [label] in a
  /// `Text` is announced twice — the same rule `LumoCard` states for its
  /// content.
  final Widget? child;
}

/// A list the reader can reorder — the web `Sortable`.
///
/// **The keyboard route, translated.** `sortable.tsx` says its keyboard model
/// IS the component and the pointer drag is the enhancement. A phone has no
/// keyboard, so the same sentence lands differently: the ASSISTIVE route is the
/// component. Every item carries two named semantic actions
/// ([LumoSortableItem.moveUpLabel] / [LumoSortableItem.moveDownLabel]) and both
/// routes — action and drag — go through the one [onReorder]. This is the part
/// forui, shadcn_flutter and Flutter's own `ReorderableListView` all get wrong
/// in the same way: `ReorderableListView` DOES emit move actions, and it names
/// them `MaterialLocalizations.reorderItemUp` — English, from a table no
/// parameter of ours reaches (see `reorderable_list.dart` line 420,
/// `assert(debugCheckHasMaterialLocalizations(context))`). That is why this
/// file does not build on it.
///
/// **The drag** is a plain vertical drag on the grip, hit-testing the items'
/// LIVE rects on every update rather than integrating a delta — rows move under
/// the finger, so a cached geometry is wrong one frame after the first swap.
/// It is the same decision `sortable.tsx` records for its pointer route, and
/// for the same reason it needs no direction branch. The drag is SILENT: a
/// `pointermove` is a sample of one gesture, and announcing each sample queues
/// a sentence per pixel.
///
/// **Not carried from the web:** `orientation: "horizontal"`. It exists there
/// to reinterpret ArrowLeft/ArrowRight against the locale; there are no arrow
/// keys here, and «بالا»/«پایین» would be the wrong words for a row of chips.
/// A horizontal reorder wants its own strings and its own widget.
class LumoSortable extends StatefulWidget {
  const LumoSortable({
    super.key,
    required this.label,
    required this.items,
    required this.onReorder,
    this.isDisabled = false,
  });

  /// Announced name of the list, e.g. «ترتیب مراحل». REQUIRED.
  final String label;

  /// The items, in their current order.
  final List<LumoSortableItem> items;

  /// Called with the item's index BEFORE the move and the index it should end
  /// up at — the plain reading of both, unlike `ReorderableListView`, whose
  /// `newIndex` counts slots in a list that still contains the dragged row.
  /// [reorder] applies exactly this convention to a list.
  final void Function(int from, int to) onReorder;

  final bool isDisabled;

  /// Moves one entry, returning a NEW list — the web's exported `moveItem`,
  /// same semantics: `to` is the final index and is clamped, and the caller's
  /// list is never mutated.
  static List<T> reorder<T>(List<T> items, int from, int to) {
    final next = List<T>.of(items);
    if (from < 0 || from >= next.length) return next;
    final moved = next.removeAt(from);
    next.insert(to.clamp(0, next.length), moved);
    return next;
  }

  @override
  State<LumoSortable> createState() => _LumoSortableState();
}

class _LumoSortableState extends State<LumoSortable> {
  /// The id under the finger, by drag only — the assistive route commits
  /// immediately and holds nothing.
  String? _heldId;

  /// One key per item id, so a rect can be read from the live tree.
  final Map<String, GlobalKey> _keys = {};

  GlobalKey _keyFor(String id) => _keys.putIfAbsent(id, GlobalKey.new);

  int _indexOf(String id) => widget.items.indexWhere((i) => i.id == id);

  /// Which slot the point currently sits in, from the rects as they are now.
  int? _slotAt(Offset globalPoint) {
    for (var i = 0; i < widget.items.length; i++) {
      final box = _keys[widget.items[i].id]?.currentContext?.findRenderObject() as RenderBox?;
      if (box == null || !box.hasSize) continue;
      final top = box.localToGlobal(Offset.zero).dy;
      if (globalPoint.dy >= top && globalPoint.dy <= top + box.size.height) return i;
    }
    return null;
  }

  void _onDragUpdate(String id, Offset globalPoint) {
    final from = _indexOf(id);
    final to = _slotAt(globalPoint);
    if (from < 0 || to == null || to == from) return;
    widget.onReorder(from, to);
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final n = widget.items.length;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label,
      enabled: !widget.isDisabled,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 8,
        children: [
          for (var index = 0; index < n; index++)
            _Row(
              // Keyed by id, so the element (and the live drag recogniser
              // inside it) travels with the item when the order changes.
              key: ValueKey<String>(widget.items[index].id),
              measureKey: _keyFor(widget.items[index].id),
              item: widget.items[index],
              index: index,
              total: n,
              held: _heldId == widget.items[index].id,
              disabled: widget.isDisabled,
              colours: c,
              onMove: widget.onReorder,
              onDragStart: () => setState(() => _heldId = widget.items[index].id),
              onDragUpdate: (point) => _onDragUpdate(widget.items[index].id, point),
              onDragEnd: () => setState(() => _heldId = null),
            ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({
    super.key,
    required this.measureKey,
    required this.item,
    required this.index,
    required this.total,
    required this.held,
    required this.disabled,
    required this.colours,
    required this.onMove,
    required this.onDragStart,
    required this.onDragUpdate,
    required this.onDragEnd,
  });

  final GlobalKey measureKey;
  final LumoSortableItem item;
  final int index;
  final int total;
  final bool held;
  final bool disabled;
  final LumoSchemeColours colours;
  final void Function(int from, int to) onMove;
  final VoidCallback onDragStart;
  final ValueChanged<Offset> onDragUpdate;
  final VoidCallback onDragEnd;

  @override
  Widget build(BuildContext context) {
    final c = colours;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: item.label,
      enabled: !disabled,
      // The assistive route. An action is offered only where it can go: the
      // first item has no "up", the last no "down", so the reader is never
      // handed an action that does nothing.
      customSemanticsActions: disabled
          ? null
          : {
              if (index > 0) CustomSemanticsAction(label: item.moveUpLabel): () => onMove(index, index - 1),
              if (index < total - 1) CustomSemanticsAction(label: item.moveDownLabel): () => onMove(index, index + 1),
            },
      child: Opacity(
        opacity: disabled ? 0.5 : 1,
        child: Container(
          key: measureKey,
          padding: const EdgeInsetsDirectional.fromSTEB(4, 10, 12, 10),
          decoration: BoxDecoration(
            color: held ? c.surfaceHover : c.surface,
            border: Border.all(color: held ? c.accent : c.border),
            borderRadius: BorderRadius.circular(LumoRadius.md),
          ),
          child: Row(
            spacing: 8,
            children: [
              // The grip. Decoration for the reader — the move actions on the
              // row above are the accessible route, so a second name here would
              // only be noise. `SemanticsRole.dragHandle` is deliberately NOT
              // set: Flutter 3.35 grades that role as unimplemented and throws.
              ExcludeSemantics(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onVerticalDragStart: disabled ? null : (_) => onDragStart(),
                  onVerticalDragUpdate: disabled ? null : (d) => onDragUpdate(d.globalPosition),
                  onVerticalDragEnd: disabled ? null : (_) => onDragEnd(),
                  onVerticalDragCancel: disabled ? null : onDragEnd,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                    child: Icon(Icons.drag_indicator, size: 18, color: held ? c.accent : c.fgSubtle),
                  ),
                ),
              ),
              if (item.leading != null) ExcludeSemantics(child: item.leading!),
              Expanded(
                child: item.child ??
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // The name is announced from the row's own node, so
                        // the drawn copy is silent — heard exactly once. The
                        // description is NOT excluded: it stays a child node
                        // and is read after the name, as `LumoItem` does.
                        ExcludeSemantics(child: Text(item.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg))),
                        if (item.description != null)
                          Text(item.description!, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: c.fgMuted)),
                      ],
                    ),
              ),
              if (item.trailing != null) item.trailing!,
            ],
          ),
        ),
      ),
    );
  }
}
