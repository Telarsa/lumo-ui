import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'scope.dart';
import 'styles.dart';
import 'tokens.g.dart';

/// The frame treatment of one row — the web `itemVariants`' `variant`.
enum LumoItemVariant { plain, outlined, muted }

/// The row-density step shared by every arm of the web item union.
enum LumoItemSize { sm, md }

/// How many options a `LumoListBox` may hold at once — the web's
/// `selectionMode`. The web's third value, `"none"`, is absent: a list with
/// nothing selectable is a `LumoItemGroup` of rows, and this widget would
/// announce a selection state that does not exist.
enum LumoListBoxSelectionMode { single, multiple }

// The web's `size` steps, in logical pixels: `sm` = gap-2.5 px-3 py-2.5,
// `md` = gap-3.5 px-4 py-3.5.
const _gap = {LumoItemSize.sm: 10.0, LumoItemSize.md: 14.0};
const _padX = {LumoItemSize.sm: 12.0, LumoItemSize.md: 16.0};
const _padY = {LumoItemSize.sm: 10.0, LumoItemSize.md: 14.0};

/// The generic list row: leading media, title and description, trailing
/// control — the web `Item` with `ItemMedia`/`ItemContent`/`ItemTitle`/
/// `ItemDescription`/`ItemActions` folded into ONE widget, because on a phone a
/// row is not composed per call site a hundred times, it is configured.
///
/// `title` is REQUIRED: it is the row's visible first line AND, when the row is
/// tappable, its announced name. The leading slot sits at the inline START and
/// the trailing slot at the inline END — a `Row`, which mirrors itself, so
/// nothing here is positioned by a physical offset. With `onTap` and no
/// `trailing`, the row draws the "go" chevron itself: `Icons.chevron_right`
/// carries `matchTextDirection`, so the glyph points at the reading END (left
/// under fa-IR) with no direction flag. The Khroos app hand-rolled this as
/// `KRow` and hard-coded `chevron-left`, which points the wrong way the moment
/// the app is read in English.
///
/// Semantics: the row is ONE node named by `title` — a `button` when `onTap` is
/// given, plain text otherwise. `explicitChildNodes` keeps a nested NAMED
/// control (a `LumoIconButton` in `trailing`, a `LumoSwitch`) reachable as its
/// own node UNDER the row, exactly as `LumoCard` does; the visible title is
/// excluded so the name is heard ONCE, while the description stays a child node
/// and is read after it. `leading` is decoration and is excluded — an icon is
/// not a name.
///
/// `isSelected` is `bool?` on purpose, mirroring `list-box.tsx`, which omits
/// `aria-selected` entirely when nothing is selectable: `null` (the default)
/// means "this row is not part of a selection" and announces no state; `true`
/// and `false` both announce one. `LumoListBox` passes it; a standalone row
/// leaves it alone.
class LumoItem extends StatefulWidget {
  const LumoItem({
    super.key,
    required this.title,
    this.description,
    this.leading,
    this.trailing,
    this.onTap,
    this.isSelected,
    this.isDisabled = false,
    this.variant = LumoItemVariant.plain,
    this.size = LumoItemSize.md,
    this.hasDivider = false,
    this.style,
  }) : assert(!hasDivider || variant != LumoItemVariant.outlined, 'An outlined row already draws its own frame; a divider under it is a second rule.');

  /// The row's first line: shown, and announced as the row's name. Required.
  final String title;

  /// The second line — the web `ItemDescription`. Announced after the name.
  final String? description;

  /// Decoration at the inline start (an icon, an avatar). Excluded from semantics.
  final Widget? leading;

  /// The inline-end slot: a control (keeps its own node) or a glyph. With
  /// `onTap` and no `trailing`, the row draws a direction-matching chevron.
  final Widget? trailing;

  /// Makes the whole row ONE button named by `title`.
  final VoidCallback? onTap;

  /// `null` = not part of a selection (no state announced). See the docblock.
  final bool? isSelected;

  /// Whether the control is disabled.
  final bool isDisabled;
  /// The visual variant.
  final LumoItemVariant variant;
  /// The size step, from the shared control scale.
  final LumoItemSize size;

  /// A hairline at the block end — the web `ItemSeparator`, for a run of rows
  /// inside one card. Refused on `outlined`, which already has a frame.
  final bool hasDivider;

  /// Appearance overrides for THIS row, merged over `LumoStyles.item`.
  /// APPEARANCE ONLY — nothing here reaches the announced `title`, the button
  /// role, the selected state, or the chevron's direction-matching glyph.
  final LumoItemStyle? style;

  @override
  State<LumoItem> createState() => _LumoItemState();
}

class _LumoItemState extends State<LumoItem> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    // Theme first, call site second — a null field leaves the library's own value.
    final s = LumoStyles.of(context).item.merge(widget.style);
    final enabled = !widget.isDisabled;
    final tappable = widget.onTap != null && enabled;
    final selected = widget.isSelected ?? false;
    // `data-selected:bg-surface-sunken data-selected:font-medium` — the web's
    // selected option, which is the same fill as the `muted` variant.
    // Every geometry/colour reads `s.x ?? <the literal that was already
    // there>` — the LumoStyles contract. The blind review of 18 Aug proved ten
    // of these fields were DECLARED and silently ignored; each now has exactly
    // one delivery site here.
    final variantFill = s.background?[widget.variant];
    final fill = _pressed
        ? (s.pressedBackground ?? c.surfaceHover)
        : selected
            ? (s.selectedBackground ?? c.surfaceSunken)
            : widget.variant == LumoItemVariant.muted
                ? (variantFill ?? c.surfaceSunken)
                : widget.variant == LumoItemVariant.outlined
                    ? (variantFill ?? c.surface)
                    : (variantFill ?? Colors.transparent);
    // A floor can only GROW a row: the larger of the style's ask and the
    // platform floor, so no theme shrinks a touch target.
    final asked = s.minHeight ?? 0;
    final minH = asked > LumoTouch.floor ? asked : LumoTouch.floor;
    final row = Container(
      constraints: BoxConstraints(minHeight: minH),
      padding: EdgeInsetsDirectional.symmetric(
        horizontal: s.inlinePadding?[widget.size] ?? _padX[widget.size]!,
        vertical: s.blockPadding?[widget.size] ?? _padY[widget.size]!,
      ),
      decoration: BoxDecoration(
        color: fill,
        borderRadius: s.borderRadius ?? BorderRadius.circular(LumoRadius.md),
        border: widget.variant == LumoItemVariant.outlined
            ? Border.all(color: s.borderColour ?? c.border, width: s.borderWidth ?? 1)
            : null,
      ),
      child: Row(
        // `self-start` on the web whenever a description is present: the media
        // lines up with the title, not with the middle of two lines.
        crossAxisAlignment: widget.description == null ? CrossAxisAlignment.center : CrossAxisAlignment.start,
        spacing: s.gap?[widget.size] ?? _gap[widget.size]!,
        children: [
          if (widget.leading != null)
            ExcludeSemantics(
              child: IconTheme(data: IconThemeData(size: 16, color: c.fgMuted), child: widget.leading!),
            ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              spacing: s.textGap ?? 2,
              children: [
                // The name is on the row's own node above; the drawn copy is excluded so it is heard ONCE.
                ExcludeSemantics(
                  child: Text(
                    widget.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    // `font-medium` on the web's `ItemTitle`; the selected
                    // option's `data-selected:font-medium` is the same weight,
                    // so selection is carried by the FILL and by semantics.
                    style: TextStyle(fontSize: 14, height: 1.375, fontWeight: FontWeight.w500, color: c.fg).merge(s.titleTextStyle),
                  ),
                ),
                if (widget.description != null)
                  Text(
                    widget.description!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 14, height: 1.5, color: c.fgMuted).merge(s.descriptionTextStyle),
                  ),
              ],
            ),
          ),
          if (widget.trailing != null)
            IconTheme(data: IconThemeData(size: 16, color: c.fgMuted).merge(s.iconTheme), child: widget.trailing!)
          else if (widget.onTap != null)
            // `matchTextDirection` is baked into this IconData: the chevron
            // points at the reading end without anyone naming a side. The GLYPH
            // is therefore not a style field — `IconData` is refused by the
            // generator by name, for this exact reason. Its colour and size are.
            ExcludeSemantics(child: Icon(Icons.chevron_right, size: s.chevronSize ?? 16, color: s.chevronColour ?? c.fgSubtle)),
        ],
      ),
    );
    final body = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Opacity(opacity: enabled ? 1 : (s.disabledOpacity ?? 0.5), child: row),
        if (widget.hasDivider) ExcludeSemantics(child: SizedBox(height: s.dividerThickness ?? 1, child: ColoredBox(color: s.dividerColour ?? c.border))),
      ],
    );
    return Semantics(
      container: true,
      // The description and any nested named control stay their own nodes under this one.
      explicitChildNodes: true,
      button: widget.onTap != null,
      enabled: widget.onTap == null ? null : enabled,
      selected: widget.isSelected,
      label: widget.title,
      onTap: tappable ? widget.onTap : null,
      child: widget.onTap == null
          ? body
          : GestureDetector(
              behavior: HitTestBehavior.opaque,
              // The tap lives on the row's node above; the detector's own would form a second, nameless one.
              excludeFromSemantics: true,
              onTap: tappable ? widget.onTap : null,
              onTapDown: tappable ? (_) => setState(() => _pressed = true) : null,
              onTapUp: (_) => setState(() => _pressed = false),
              onTapCancel: () => setState(() => _pressed = false),
              child: body,
            ),
    );
  }
}

/// A titled run of rows — the web `ItemGroup` plus a name. The web's group is
/// deliberately role-less and nameless ("a page that wants list semantics owns
/// a `<ul>`"); on a phone there is no surrounding page markup to own it, so
/// `label` is REQUIRED and is DRAWN as a section header (the Settings-screen
/// idiom the Khroos app hand-rolled as `_Lbl`). It is announced ONCE, as a
/// header the reader lands on before the rows — not also as a container name.
///
/// `hasDividers` puts a hairline between the rows (never after the last) and
/// closes the gap, which is how a run of rows inside one card reads; without it
/// the group keeps the web's `gap-2`.
class LumoItemGroup extends StatelessWidget {
  const LumoItemGroup({super.key, required this.label, required this.children, this.hasDividers = false, this.style});

  /// The section's name — drawn as a header and announced. Required.
  final String label;
  /// The children, in reading order.
  final List<Widget> children;

  /// A hairline between rows instead of a gap.
  final bool hasDividers;

  /// Appearance overrides for this group, merged over `LumoStyles.item`.
  final LumoItemStyle? style;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final s = LumoStyles.of(context).item.merge(style);
    final rule = ExcludeSemantics(child: SizedBox(height: s.dividerThickness ?? 1, child: ColoredBox(color: s.dividerColour ?? c.border)));
    return Semantics(
      container: true,
      explicitChildNodes: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: EdgeInsetsDirectional.only(bottom: s.groupLabelGap ?? 8),
            child: Semantics(
              header: true,
              child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: c.fgSubtle).merge(s.groupLabelTextStyle)),
            ),
          ),
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) hasDividers ? rule : SizedBox(height: s.groupGap ?? 8),
            children[i],
          ],
        ],
      ),
    );
  }
}

/// One option of a `LumoListBox`: `id` is the key the list reports, `title`
/// REQUIRED (the option's visible text and its announced name — the web reads
/// an option's name out of its own contents, which cannot be empty here by
/// construction).
class LumoListBoxItem {
  const LumoListBoxItem({required this.id, required this.title, this.description, this.leading, this.trailing, this.isDisabled = false});
  /// A stable identity for this item — used for selection and equality, never shown or announced.
  final String id;
  /// The visible title.
  final String title;
  /// A description for the field, shown under the control and announced as its hint.
  final String? description;
  /// What sits at the reading start of the row.
  final Widget? leading;
  /// What sits at the reading end of the row.
  final Widget? trailing;
  /// Whether the control is disabled.
  final bool isDisabled;
}

/// A standalone selectable list — the web `ListBox`: no popover, no trigger
/// (that is `LumoSelect`). `label` is REQUIRED — an unnamed list announces as
/// "list" and nothing else — and `emptyLabel` is REQUIRED too, because an empty
/// list that says nothing is indistinguishable from a broken one and the web's
/// empty text is a caller string as well (`asyncState.emptyText`; React Aria's
/// `renderEmptyState` is gone from the web type).
///
/// Controlled (`value`) and uncontrolled (`defaultValue`) like the web's
/// `selectedKeys`/`defaultSelectedKeys`; both are a `Set<String>` in single
/// mode too, which is the web's shape — single mode simply never holds more
/// than one key. `onChanged` is handed the whole next selection (the web's
/// `onSelectionChange`).
///
/// Semantics: a `list` named by `label`; every row a button carrying its
/// `selected` state, so colour is never the sole carrier (WCAG 1.4.1) and the
/// check glyph at the inline END is decoration on top of it. Rows are
/// `LumoItem`s at `sm`: the web's option has its own denser metrics because it
/// is a pointer target inside a scroll pane, whereas on a phone the row IS the
/// touch target and must stay one.
///
/// Not carried from the web: keyboard navigation and typeahead (a roving tab
/// stop, `shouldFocusWrap`, `orientation`, Home/End/PageUp/PageDown, the
/// Persian-folding typeahead) — Flutter's focus traversal owns arrow keys and
/// there is no on-screen keyboard behind a list of rows; `onAction` (a row
/// either selects or navigates, and a navigating row is a `LumoItem`);
/// `asyncState` (loading/error/load-more belongs to the screen).
class LumoListBox extends StatefulWidget {
  const LumoListBox({
    super.key,
    required this.label,
    required this.items,
    required this.emptyLabel,
    this.value,
    this.defaultValue,
    this.onChanged,
    this.selectionMode = LumoListBoxSelectionMode.single,
    this.disallowEmptySelection = false,
    this.isDisabled = false,
    this.size = LumoItemSize.sm,
    this.style,
  });

  /// Announced name of the list. Required.
  final String label;
  /// The items to show, in reading order.
  final List<LumoListBoxItem> items;

  /// What is said when `items` is empty, e.g. «هیچ پرونده‌ای نیست». Required.
  final String emptyLabel;

  /// The selected keys (controlled); `null` leaves the state to the widget.
  final Set<String>? value;

  /// The selected keys (uncontrolled).
  final Set<String>? defaultValue;

  /// Called with the whole next selection.
  final ValueChanged<Set<String>>? onChanged;

  /// Whether one item may be selected, or many.
  final LumoListBoxSelectionMode selectionMode;

  /// Refuse to end up with nothing selected — the web prop of the same name.
  final bool disallowEmptySelection;

  /// Whether the control is disabled.
  final bool isDisabled;
  /// The size step, from the shared control scale.
  final LumoItemSize size;

  /// Appearance overrides for this list and the rows it builds, merged over
  /// `LumoStyles.item`. It cannot reach `label`, `emptyLabel`, the list role or
  /// the announced `selected` state of a row.
  final LumoItemStyle? style;

  @override
  State<LumoListBox> createState() => _LumoListBoxState();
}

class _LumoListBoxState extends State<LumoListBox> {
  late Set<String> _uncontrolled = {...?widget.defaultValue};

  Set<String> get _selection => widget.value ?? _uncontrolled;

  void _toggle(String id) {
    final current = _selection;
    final Set<String> next;
    if (widget.selectionMode == LumoListBoxSelectionMode.single) {
      next = current.contains(id) && !widget.disallowEmptySelection ? <String>{} : <String>{id};
    } else {
      next = {...current};
      if (next.contains(id)) {
        if (next.length > 1 || !widget.disallowEmptySelection) next.remove(id);
      } else {
        next.add(id);
      }
    }
    if (widget.value == null) setState(() => _uncontrolled = next);
    widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final s = LumoStyles.of(context).item.merge(widget.style);
    final selection = _selection;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label,
      role: SemanticsRole.list,
      enabled: widget.isDisabled ? false : null,
      child: Opacity(
        opacity: widget.isDisabled ? (s.disabledOpacity ?? 0.5) : 1,
        child: Padding(
          // The web's `p-1` around the options.
          padding: s.listPadding ?? const EdgeInsets.all(4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            // The web's `gap-0.5`.
            spacing: s.listGap ?? 2,
            children: widget.items.isEmpty
                ? [
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(widget.emptyLabel, style: TextStyle(fontSize: 14, color: c.fgMuted).merge(s.emptyTextStyle)),
                    ),
                  ]
                : [
                    for (final item in widget.items)
                      LumoItem(
                        title: item.title,
                        description: item.description,
                        leading: item.leading,
                        size: widget.size,
                        style: widget.style,
                        isDisabled: widget.isDisabled || item.isDisabled,
                        isSelected: selection.contains(item.id),
                        onTap: () => _toggle(item.id),
                        // The check is DECORATION on top of the announced
                        // `selected` state — rendered because colour alone does
                        // not distinguish, `ExcludeSemantics` because the state
                        // already says it. It replaces the row's own chevron:
                        // this row selects, it does not go anywhere.
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          spacing: 8,
                          children: [
                            if (item.trailing != null) item.trailing!,
                            ExcludeSemantics(
                              child: Icon(Icons.check, size: 16, color: selection.contains(item.id) ? (s.selectedIconColour ?? c.accent) : Colors.transparent),
                            ),
                          ],
                        ),
                      ),
                  ],
          ),
        ),
      ),
    );
  }
}
