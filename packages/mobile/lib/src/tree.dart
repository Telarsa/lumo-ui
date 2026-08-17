import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;

import 'button.dart';
import 'checkbox.dart';
import 'format.dart';
import 'scope.dart';
import 'sheet.dart';
import 'tokens.g.dart';

/// One node of a `LumoTree` — the web `TreeItem`'s `id` + `textValue`/`title`,
/// as data rather than a child element, because on a phone a hierarchy is
/// fetched and configured, not written out by hand a hundred rows deep.
class LumoTreeNode {
  const LumoTreeNode({required this.id, required this.label, this.children = const <LumoTreeNode>[], this.icon, this.isDisabled = false});

  /// The stable key reported through `onExpandedChanged` / `onSelectionChanged`.
  /// A key, never a rendered string.
  final String id;

  /// The row's visible text AND its announced name, in one string, so seen and
  /// announced cannot drift (the `LumoDisclosureItem.title` rule). REQUIRED.
  final String label;
  final List<LumoTreeNode> children;

  /// Decoration beside the name. Excluded from semantics — an icon is not a name.
  final Widget? icon;
  final bool isDisabled;
}

/// Where one row sits in the tree, with **every number already formatted** for
/// the reader's locale (`formatNumber`) — so the sentence the app builds from
/// it is Persian digits in a Persian app, and Lumo never guesses the wording.
@immutable
class LumoTreeItemPosition {
  const LumoTreeItemPosition({
    required this.label,
    required this.level,
    required this.position,
    required this.setSize,
    required this.hasChildren,
    required this.isExpanded,
  });

  /// The node's own text.
  final String label;

  /// Depth, 1-based and formatted — the counterpart of `aria-level`.
  final String level;

  /// Place among its siblings, 1-based and formatted — `aria-posinset`.
  final String position;

  /// How many siblings there are, formatted — `aria-setsize`.
  final String setSize;

  /// Whether this row has children at all (a branch, not a leaf).
  final bool hasChildren;

  /// Whether the branch is open. The expanded STATE is also on the node
  /// (`hasExpandedState`/`isExpanded`); this is here so an app that wants the
  /// word in the sentence can put it there.
  final bool isExpanded;
}

/// Builds what one row announces from its text and its place in the tree.
///
/// REQUIRED on `LumoTree`, and a FUNCTION rather than a string, because
/// «سطح ۲، مورد ۳ از ۵» is not English with the words swapped: the order, the
/// separators and the words themselves belong to the language. The same shape
/// as `LumoMultiSelect.countLabel`.
typedef LumoTreeItemLabel = String Function(LumoTreeItemPosition position);

/// How many rows a `LumoTree` may have selected, and how selection is drawn.
enum LumoTreeSelectionMode {
  /// Rows announce no selection state at all — an outline, not a picker.
  none,

  /// One row at a time; the row is announced as selected.
  single,

  /// Any number of rows; each row is announced as selected.
  multiple,

  /// Any number of rows, drawn as checkboxes, and **selecting a branch selects
  /// its whole subtree**; a branch with some of its leaves chosen is announced
  /// as MIXED. The web `TreeSelect`'s `"checkbox"` mode.
  checkbox,
}

/// The quarter turn the expand marker takes when its row opens, as a signed
/// number of turns for `AnimatedRotation` / `RotationTransition`.
///
/// The counterpart of the web's `treeChevronTurn`: the glyph itself
/// (`Icons.chevron_right`) carries `matchTextDirection`, so a CLOSED marker
/// already points at the reading end (left under fa-IR) with nothing to
/// mirror; the open state is a rotation, and a rotation has a SIGN — clockwise
/// under LTR, anticlockwise under RTL, or the mirrored glyph turns up instead
/// of down. Exported so a test, or a consumer drawing its own marker, reads the
/// value rather than re-deriving it.
double lumoTreeChevronTurns(TextDirection direction) => direction == TextDirection.rtl ? -0.25 : 0.25;

/// Whether a node is fully, partly or not selected, once a checkbox selection
/// is cascaded to its descendants.
enum LumoTreeCheckState { unchecked, mixed, checked }

/// The web's `treeSelectionState`, in Dart: a LEAF is checked when its own id
/// is selected; a BRANCH is checked when every leaf under it is, mixed when
/// some are. Public because a caller driving `LumoTreeSelect` from its own
/// state needs the same answer the widget draws.
LumoTreeCheckState lumoTreeSelectionState(LumoTreeNode node, Set<String> selected) {
  final leaves = <String>[];
  void walk(LumoTreeNode n) {
    if (n.children.isEmpty) {
      leaves.add(n.id);
      return;
    }
    for (final child in n.children) {
      walk(child);
    }
  }

  walk(node);
  final count = leaves.where(selected.contains).length;
  if (count == 0) return LumoTreeCheckState.unchecked;
  return count == leaves.length ? LumoTreeCheckState.checked : LumoTreeCheckState.mixed;
}

/// Every id in a node's subtree, including its own.
List<String> lumoTreeDescendantIds(LumoTreeNode node) => [node.id, ...node.children.expand(lumoTreeDescendantIds)];

/// One visible row of the flattened tree.
class _FlatRow {
  const _FlatRow({required this.node, required this.level, required this.position, required this.setSize});
  final LumoTreeNode node;
  final int level;
  final int position;
  final int setSize;
}

List<_FlatRow> _flatten(List<LumoTreeNode> nodes, Set<String> expanded, int level, List<_FlatRow> out) {
  for (var i = 0; i < nodes.length; i++) {
    final node = nodes[i];
    out.add(_FlatRow(node: node, level: level, position: i + 1, setSize: nodes.length));
    if (node.children.isNotEmpty && expanded.contains(node.id)) {
      _flatten(node.children, expanded, level + 1, out);
    }
  }
  return out;
}

/// A nested outline — the web `Tree` (`packages/ui/src/tree.tsx`).
///
///     LumoTree(
///       label: 'محدودهٔ جغرافیایی',
///       nodes: provinces,
///       defaultExpandedIds: const {'thr'},
///       itemLabel: (p) => '${p.label}، سطح ${p.level}، ${p.position} از ${p.setSize}',
///       expandLabel: (name) => 'باز کردن $name',
///       collapseLabel: (name) => 'بستن $name',
///     )
///
/// **Shape.** The web tree is a `role="treegrid"` with a roving tab stop, arrow
/// keys and typeahead — a keyboard model. A phone has no arrow keys and no
/// typeahead buffer, so what carries over is the STRUCTURE, not the keyboard:
/// rows in a flat reading order, each announcing its own depth and place, a
/// branch that opens and closes, and a marker that points the right way. The
/// interaction is the mobile one (Material's `ExpansionTile`, forui's
/// accordion): the whole row is the target, with the marker as a second,
/// smaller one for a tree that also selects. Lost from the web on purpose:
/// arrow-key navigation, typeahead, `disallowEmptySelection`, async status —
/// each of them a keyboard or a desktop-loading concern with no phone form.
///
/// **The children of a collapsed branch are not built** — out of the widget
/// tree and out of the semantics tree, as Base UI's tree does by default.
///
/// **Semantics.** Flutter 3.35 has no `tree`/`treeItem` role (and the roles it
/// does declare for tabular structures are `_unimplemented` and throw from
/// their own debug validator), so the tree is a named `SemanticsRole.list` of
/// `listItem` rows — the structure a reader is actually offered. Each row is
/// ONE node: a button, `hasExpandedState` + `isExpanded` when it is a branch
/// (Flutter's `expanded:`, the counterpart of `aria-expanded`), its selection
/// or checked state, enabled, and named by `itemLabel` — which is where LEVEL
/// and POSITION-IN-SET are announced, because Flutter's semantics has no
/// `aria-level`/`aria-posinset` field of its own. The visible label is inside
/// `ExcludeSemantics` so the name is heard ONCE; the marker is a child node
/// with its own name (`expandLabel`/`collapseLabel`), which is what lets a
/// reader open a branch without selecting it.
///
/// Expansion is controlled with `expandedIds` + `onExpandedChanged` and
/// uncontrolled with `defaultExpandedIds`; selection the same way — both pairs
/// exactly as the web has both.
class LumoTree extends StatefulWidget {
  const LumoTree({
    super.key,
    required this.label,
    required this.nodes,
    required this.itemLabel,
    required this.expandLabel,
    required this.collapseLabel,
    this.emptyLabel,
    this.expandedIds,
    this.defaultExpandedIds,
    this.onExpandedChanged,
    this.selectionMode = LumoTreeSelectionMode.none,
    this.selectedIds,
    this.defaultSelectedIds,
    this.onSelectionChanged,
    this.onActivate,
    this.isDisabled = false,
  });

  /// The tree's announced name. REQUIRED — a list names nothing by itself.
  final String label;
  final List<LumoTreeNode> nodes;

  /// What each row announces, built from its place in the tree. REQUIRED.
  final LumoTreeItemLabel itemLabel;

  /// Name of the marker that OPENS a branch, built from that branch's own text
  /// («باز کردن تهران»). REQUIRED — a chevron is not a name.
  final String Function(String nodeLabel) expandLabel;

  /// Name of the marker that CLOSES a branch. REQUIRED.
  final String Function(String nodeLabel) collapseLabel;

  /// What a reader is told when there is nothing in the tree. Announced as the
  /// tree node's value and drawn in its place; omit it and an empty tree draws
  /// nothing at all.
  final String? emptyLabel;

  /// The open branch ids (controlled).
  final Set<String>? expandedIds;

  /// The open branch ids at first build (uncontrolled).
  final Set<String>? defaultExpandedIds;
  final ValueChanged<Set<String>>? onExpandedChanged;
  final LumoTreeSelectionMode selectionMode;

  /// The selected row ids (controlled).
  final Set<String>? selectedIds;

  /// The selected row ids at first build (uncontrolled).
  final Set<String>? defaultSelectedIds;
  final ValueChanged<Set<String>>? onSelectionChanged;

  /// A row was activated — the web's `onAction`. Only reached when the tree
  /// does not select and the row is a leaf, so an activation is never also a
  /// selection or an expansion.
  final ValueChanged<String>? onActivate;
  final bool isDisabled;

  @override
  State<LumoTree> createState() => _LumoTreeState();
}

class _LumoTreeState extends State<LumoTree> {
  late Set<String> _expanded = {...?widget.defaultExpandedIds};
  late Set<String> _selected = {...?widget.defaultSelectedIds};

  Set<String> get _openIds => widget.expandedIds ?? _expanded;
  Set<String> get _chosenIds => widget.selectedIds ?? _selected;

  void _toggleExpanded(String id) {
    final next = _openIds.contains(id) ? ({..._openIds}..remove(id)) : ({..._openIds}..add(id));
    if (widget.expandedIds == null) setState(() => _expanded = next);
    widget.onExpandedChanged?.call(next);
  }

  void _select(LumoTreeNode node) {
    final current = _chosenIds;
    late final Set<String> next;
    switch (widget.selectionMode) {
      case LumoTreeSelectionMode.none:
        return;
      case LumoTreeSelectionMode.single:
        next = current.contains(node.id) ? <String>{} : {node.id};
      case LumoTreeSelectionMode.multiple:
        next = current.contains(node.id) ? ({...current}..remove(node.id)) : ({...current}..add(node.id));
      case LumoTreeSelectionMode.checkbox:
        // A branch carries its subtree with it — the web's cascading mode.
        final affected = lumoTreeDescendantIds(node);
        final on = lumoTreeSelectionState(node, current) != LumoTreeCheckState.checked;
        next = {...current};
        for (final id in affected) {
          if (on) {
            next.add(id);
          } else {
            next.remove(id);
          }
        }
    }
    if (widget.selectedIds == null) setState(() => _selected = next);
    widget.onSelectionChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final rows = _flatten(widget.nodes, _openIds, 1, <_FlatRow>[]);
    final empty = rows.isEmpty;

    return Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.list,
      label: widget.label,
      value: empty ? widget.emptyLabel : null,
      child: empty
          ? (widget.emptyLabel == null
              ? const SizedBox(width: double.infinity)
              // Announced by the node above; the drawn copy is excluded so it is heard once.
              : ExcludeSemantics(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: Text(widget.emptyLabel!, textAlign: TextAlign.center, style: TextStyle(fontSize: 13, height: 1.6, color: c.fgMuted)),
                  ),
                ))
          : Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final row in rows)
                  _TreeRow(
                    row: row,
                    isExpanded: _openIds.contains(row.node.id),
                    isSelected: _chosenIds.contains(row.node.id),
                    checkState: widget.selectionMode == LumoTreeSelectionMode.checkbox ? lumoTreeSelectionState(row.node, _chosenIds) : null,
                    selectionMode: widget.selectionMode,
                    isDisabled: widget.isDisabled || row.node.isDisabled,
                    itemLabel: widget.itemLabel,
                    expandLabel: widget.expandLabel,
                    collapseLabel: widget.collapseLabel,
                    onToggleExpanded: () => _toggleExpanded(row.node.id),
                    onSelect: () => _select(row.node),
                    onActivate: widget.onActivate == null ? null : () => widget.onActivate!(row.node.id),
                  ),
              ],
            ),
    );
  }
}

/// One row: the marker, the optional checkbox, the icon and the name.
class _TreeRow extends StatelessWidget {
  const _TreeRow({
    required this.row,
    required this.isExpanded,
    required this.isSelected,
    required this.checkState,
    required this.selectionMode,
    required this.isDisabled,
    required this.itemLabel,
    required this.expandLabel,
    required this.collapseLabel,
    required this.onToggleExpanded,
    required this.onSelect,
    required this.onActivate,
  });

  final _FlatRow row;
  final bool isExpanded;
  final bool isSelected;
  final LumoTreeCheckState? checkState;
  final LumoTreeSelectionMode selectionMode;
  final bool isDisabled;
  final LumoTreeItemLabel itemLabel;
  final String Function(String) expandLabel;
  final String Function(String) collapseLabel;
  final VoidCallback onToggleExpanded;
  final VoidCallback onSelect;
  final VoidCallback? onActivate;

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final node = row.node;
    final branch = node.children.isNotEmpty;
    final selects = selectionMode != LumoTreeSelectionMode.none;
    final checked = checkState == LumoTreeCheckState.checked;
    final mixed = checkState == LumoTreeCheckState.mixed;
    final marked = selectionMode == LumoTreeSelectionMode.checkbox ? checked : isSelected;

    final name = itemLabel(LumoTreeItemPosition(
      label: node.label,
      // Every number in the sentence is formatted for the reader's locale
      // before the app ever sees it — Persian digits in a Persian app.
      level: formatNumber(row.level, scope.locale, grouping: false),
      position: formatNumber(row.position, scope.locale, grouping: false),
      setSize: formatNumber(row.setSize, scope.locale, grouping: false),
      hasChildren: branch,
      isExpanded: isExpanded,
    ));

    // A tap on the ROW: selects where the tree selects, otherwise opens a
    // branch (the phone idiom — a row is the target, not a 20px chevron) and
    // activates a leaf.
    final VoidCallback? onRowTap = isDisabled
        ? null
        : selects
            ? onSelect
            : branch
                ? onToggleExpanded
                : onActivate;

    final motion = !MediaQuery.disableAnimationsOf(context);
    final turns = isExpanded ? lumoTreeChevronTurns(scope.direction) : 0.0;
    // `Icons.chevron_right` carries `matchTextDirection`: the CLOSED marker
    // already points at the reading end (left under fa-IR) with no flag here.
    final chevron = Icon(Icons.chevron_right, size: 18, color: c.fgMuted);

    final marker = branch
        ? Semantics(
            container: true,
            button: true,
            enabled: !isDisabled,
            label: isExpanded ? collapseLabel(node.label) : expandLabel(node.label),
            onTap: isDisabled ? null : onToggleExpanded,
            child: ExcludeSemantics(
              child: InkWell(
                onTap: isDisabled ? null : onToggleExpanded,
                canRequestFocus: !isDisabled,
                borderRadius: BorderRadius.circular(LumoRadius.sm),
                child: SizedBox(
                  width: 28,
                  height: 28,
                  child: Center(
                    child: motion
                        ? AnimatedRotation(turns: turns, duration: const Duration(milliseconds: 150), curve: Curves.easeOut, child: chevron)
                        : Transform.rotate(angle: turns * 2 * 3.1415926535897932, child: chevron),
                  ),
                ),
              ),
            ),
          )
        // A leaf gets the marker's footprint so the names line up down the column.
        : const SizedBox(width: 28, height: 28);

    return Semantics(
      container: true,
      explicitChildNodes: true,
      button: onRowTap != null,
      enabled: !isDisabled,
      // The counterpart of `aria-expanded`, and only where there is something
      // to expand: a leaf that announced a collapsed state would be a lie.
      expanded: branch ? isExpanded : null,
      selected: selects && selectionMode != LumoTreeSelectionMode.checkbox ? isSelected : null,
      checked: selectionMode == LumoTreeSelectionMode.checkbox ? checked : null,
      mixed: selectionMode == LumoTreeSelectionMode.checkbox ? mixed : null,
      label: name,
      onTap: onRowTap,
      role: SemanticsRole.listItem,
      child: Opacity(
        opacity: isDisabled ? 0.5 : 1,
        child: InkWell(
          onTap: onRowTap,
          canRequestFocus: !isDisabled,
          borderRadius: BorderRadius.circular(LumoRadius.sm),
          child: Padding(
            // The indent is a single LOGICAL inset: it grows from the reading
            // start, so the outline steps right-to-left under fa-IR.
            padding: EdgeInsetsDirectional.only(start: (row.level - 1) * 20),
            child: Row(
              children: [
                marker,
                if (selectionMode == LumoTreeSelectionMode.checkbox)
                  Padding(
                    padding: const EdgeInsetsDirectional.only(end: 8),
                    // The library's own box, drawn only: the row node already
                    // carries checked/mixed, so a second node here would
                    // announce the same state twice.
                    child: IgnorePointer(
                      child: ExcludeSemantics(
                        child: LumoCheckbox(accessibilityLabel: node.label, isSelected: checked, isIndeterminate: mixed, isDisabled: isDisabled),
                      ),
                    ),
                  ),
                if (node.icon != null)
                  Padding(
                    padding: const EdgeInsetsDirectional.only(end: 8),
                    child: ExcludeSemantics(child: IconTheme.merge(data: IconThemeData(size: 16, color: c.fgMuted), child: node.icon!)),
                  ),
                Expanded(
                  // Announced by the row node above — heard exactly once.
                  child: ExcludeSemantics(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text(
                        node.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 14, height: 1.4, fontWeight: marked ? FontWeight.w700 : FontWeight.w500, color: marked && selectionMode != LumoTreeSelectionMode.checkbox ? c.accent : c.fg),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// A field whose value is picked from a tree — the web `TreeSelect`
/// (`packages/ui/src/tree-select.tsx`).
///
///     LumoTreeSelect(
///       label: 'محدودهٔ جغرافیایی',
///       nodes: provinces,
///       mode: LumoTreeSelectMode.checkbox,
///       values: picked,
///       onChanged: (v) => setState(() => picked = v),
///       placeholder: 'انتخاب کنید',
///       itemLabel: (p) => '${p.label}، سطح ${p.level}، ${p.position} از ${p.setSize}',
///       expandLabel: (n) => 'باز کردن $n',
///       collapseLabel: (n) => 'بستن $n',
///       closeLabel: 'بستن',
///       confirmLabel: 'تأیید',
///     )
///
/// The web anchors the tree in a popover under the trigger. A phone has no room
/// beside a control, so the tree lives in a **`showLumoSheet` route** — never
/// Material's `showModalBottomSheet`, whose route and barrier name themselves
/// «Dialog»/«Dismiss» from `MaterialLocalizations` in English. The same
/// decision `LumoMultiSelect` and `LumoSelect` reached, for the same reason.
///
/// This is the control the Khroos coverage screen (`CoverageScreen`, FR-04)
/// hand-rolled as four stacked rows of chips — province › county › city ›
/// area — because there was no tree to call: four separate pickers whose
/// relationship the reader had to infer from the heading text, and whose depth
/// was never announced at all.
///
/// Announced strings, all REQUIRED: `label` (the field's name and the sheet's),
/// `itemLabel`/`expandLabel`/`collapseLabel` (the tree's, see `LumoTree`),
/// `closeLabel` (the sheet's ✕ and its scrim) and `confirmLabel` (the footer's
/// primary — it closes the sheet; selection applies as it happens, so
/// confirming is a dismissal, not a commit, exactly as in `LumoMultiSelect`).
///
/// Selection is CONTROLLED (`values` + `onChanged`, the web's `value` +
/// `onValueChange`); the widget mirrors it optimistically so the sheet answers
/// a tap before the caller's `setState` lands.
enum LumoTreeSelectMode {
  /// One row; choosing it closes the sheet.
  single,

  /// Any number of rows, each chosen on its own.
  multiple,

  /// Any number of rows, with a branch carrying its subtree.
  checkbox,
}

/// See [LumoTreeSelectMode] for the field's documentation.
class LumoTreeSelect extends StatefulWidget {
  const LumoTreeSelect({
    super.key,
    required this.label,
    required this.treeLabel,
    required this.nodes,
    required this.itemLabel,
    required this.expandLabel,
    required this.collapseLabel,
    required this.closeLabel,
    required this.confirmLabel,
    required this.values,
    this.onChanged,
    this.mode = LumoTreeSelectMode.single,
    this.placeholder,
    this.description,
    this.errorMessage,
    this.emptyLabel,
    this.defaultExpandedIds,
    this.isDisabled = false,
  });

  /// Announced and displayed name of the field, and the sheet's title. REQUIRED.
  final String label;

  /// Announced name of the TREE inside the sheet — the web's `treeLabel`.
  /// REQUIRED and separate from `label`: `label` names the field a reader is
  /// standing on, this names the outline they have just been handed, and one
  /// string doing both jobs puts the same name on two different things.
  final String treeLabel;
  final List<LumoTreeNode> nodes;

  /// What each row of the tree announces. REQUIRED — see `LumoTree`.
  final LumoTreeItemLabel itemLabel;

  /// Name of the marker that opens a branch. REQUIRED.
  final String Function(String nodeLabel) expandLabel;

  /// Name of the marker that closes a branch. REQUIRED.
  final String Function(String nodeLabel) collapseLabel;

  /// Name of the sheet's ✕ and of its scrim. REQUIRED.
  final String closeLabel;

  /// Name of the footer's primary button, which closes the sheet. REQUIRED.
  final String confirmLabel;

  /// The chosen ids. Controlled, as the web's `value`.
  final List<String> values;

  /// Called with the full id list after every change.
  final ValueChanged<List<String>>? onChanged;
  final LumoTreeSelectMode mode;

  /// Shown in the trigger while nothing is chosen.
  final String? placeholder;
  final String? description;

  /// Shown under the field and announced. Supplying one marks it invalid.
  final String? errorMessage;

  /// What a reader is told when the tree has nothing in it.
  final String? emptyLabel;

  /// The branches open when the sheet is first shown.
  final Set<String>? defaultExpandedIds;
  final bool isDisabled;

  @override
  State<LumoTreeSelect> createState() => _LumoTreeSelectState();
}

class _LumoTreeSelectState extends State<LumoTreeSelect> {
  /// The optimistic mirror of `values`. The sheet is a ROUTE built above this
  /// widget, so it listens to this rather than to a `widget` it cannot see change.
  late final ValueNotifier<List<String>> _shown = ValueNotifier<List<String>>(List<String>.of(widget.values));

  @override
  void didUpdateWidget(LumoTreeSelect old) {
    super.didUpdateWidget(old);
    if (!identical(old.values, widget.values) && _shown.value.join(' ') != widget.values.join(' ')) {
      _shown.value = List<String>.of(widget.values);
    }
  }

  @override
  void dispose() {
    _shown.dispose();
    super.dispose();
  }

  List<LumoTreeNode> get _flatNodes {
    final out = <LumoTreeNode>[];
    void walk(List<LumoTreeNode> nodes) {
      for (final n in nodes) {
        out.add(n);
        walk(n.children);
      }
    }

    walk(widget.nodes);
    return out;
  }

  LumoTreeSelectionMode get _treeMode => switch (widget.mode) {
        LumoTreeSelectMode.single => LumoTreeSelectionMode.single,
        LumoTreeSelectMode.multiple => LumoTreeSelectionMode.multiple,
        LumoTreeSelectMode.checkbox => LumoTreeSelectionMode.checkbox,
      };

  Future<void> _open() => showLumoSheet<void>(
        context,
        label: widget.label,
        closeLabel: widget.closeLabel,
        body: (ctx) => ValueListenableBuilder<List<String>>(
          valueListenable: _shown,
          builder: (ctx, values, _) => LumoTree(
            label: widget.treeLabel,
            nodes: widget.nodes,
            emptyLabel: widget.emptyLabel,
            itemLabel: widget.itemLabel,
            expandLabel: widget.expandLabel,
            collapseLabel: widget.collapseLabel,
            defaultExpandedIds: widget.defaultExpandedIds,
            selectionMode: _treeMode,
            selectedIds: values.toSet(),
            onSelectionChanged: (next) {
              _shown.value = next.toList();
              widget.onChanged?.call(_shown.value);
              // Single is a pick, not a session: the sheet closes on it, the
              // way `LumoSelect` does.
              if (widget.mode == LumoTreeSelectMode.single && next.isNotEmpty) Navigator.of(ctx).pop();
            },
          ),
        ),
        // An `OverflowBar` (the sheet's own footer), so the button is bare:
        // an `Expanded` there is a parent-data error, not a layout.
        actions: (ctx) => [LumoButton(onPressed: () => Navigator.of(ctx).pop(), child: Text(widget.confirmLabel))],
      );

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final invalid = widget.errorMessage != null;
    return ValueListenableBuilder<List<String>>(
      valueListenable: _shown,
      builder: (context, values, _) {
        final chosen = _flatNodes.where((n) => values.contains(n.id)).map((n) => n.label).toList();
        // The names, in the tree's own order; the separator is punctuation, not
        // a word, so it reads the same in every language.
        final summary = chosen.isEmpty ? widget.placeholder : chosen.join('، ');
        return Opacity(
          opacity: widget.isDisabled ? 0.5 : 1,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Excluded: the name lives on the trigger node, heard ONCE.
              ExcludeSemantics(child: Text(widget.label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg))),
              const SizedBox(height: 6),
              Semantics(
                label: widget.label,
                value: summary,
                button: true,
                enabled: !widget.isDisabled,
                hint: [if (widget.description != null) widget.description!, if (widget.errorMessage != null) widget.errorMessage!].join('. '),
                onTap: widget.isDisabled ? null : _open,
                child: InkWell(
                  onTap: widget.isDisabled ? null : _open,
                  borderRadius: BorderRadius.circular(LumoRadius.md),
                  child: Container(
                    constraints: const BoxConstraints(minHeight: LumoControl.md),
                    padding: const EdgeInsetsDirectional.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(color: c.surface, border: Border.all(color: invalid ? c.critical : c.borderControl), borderRadius: BorderRadius.circular(LumoRadius.md)),
                    child: Row(
                      children: [
                        Expanded(
                          child: ExcludeSemantics(
                            child: Text(summary ?? '', style: TextStyle(fontSize: 14, color: chosen.isEmpty ? c.fgSubtle : c.fg), maxLines: 1, overflow: TextOverflow.ellipsis),
                          ),
                        ),
                        ExcludeSemantics(child: Icon(Icons.expand_more, size: 18, color: c.fgMuted)),
                      ],
                    ),
                  ),
                ),
              ),
              if (widget.description != null)
                Padding(padding: const EdgeInsets.only(top: 6), child: ExcludeSemantics(child: Text(widget.description!, style: TextStyle(fontSize: 12, color: c.fgMuted)))),
              if (invalid)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Semantics(liveRegion: true, child: Text(widget.errorMessage!, style: TextStyle(fontSize: 12, color: c.critical))),
                ),
            ],
          ),
        );
      },
    );
  }
}
