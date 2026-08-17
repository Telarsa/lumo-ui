import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

enum LumoChipSize { sm, md }

/// A chip — a filter, a keyword, a selected value — the web `Tag`: `label`
/// REQUIRED (a chip IS its text; the web's `children`), optionally selectable
/// (`isSelected` + `onChanged` — a toggle button announced with its selected
/// state; the web keeps selection for `ListBox`, mobile filter chips are the
/// idiom) and optionally removable: `onRemove` + `removeLabel` are ONE decision
/// — the constructor asserts `removeLabel` whenever `onRemove` is set (the web
/// makes it a discriminated union), because an ✕ has no name of its own and a
/// convention has already failed on this project. The ✕ sits at the inline END
/// (left in Persian) — `EdgeInsetsDirectional`, so the trimmed cap follows it.
///
/// **The touch band.** The chip PAINTS the web's box exactly — 24/28 tall by
/// size, the ✕ glyph the web's `size-5` — but a tappable chip LAYS OUT
/// `LumoControl.lg` (44) tall, the painted body centred in transparent space,
/// and the ✕'s hit surface is a 44x44 band over the chip's inline end. Measured
/// before: the ✕ node was 20x20 and a selectable chip 28 tall. Flutter hit-tests
/// nothing outside a widget's own box (`RenderBox.hitTest` rejects a position
/// its `size` does not contain), so unlike the web's `after:-inset-2.5` — which
/// grows the same target to 40x40 with a pseudo-element — the band has to be
/// real layout. Nothing painted moves; a Wrap of chips gets taller rows.
/// The band wins the ambiguous pixel: on a chip that is BOTH selectable and
/// removable the ✕ owns the last 44 px, as the web's overhanging pseudo-element
/// already does. A static chip (no `onChanged`, no `onRemove`) is not a target
/// and keeps its 24/28 box.
class LumoChip extends StatelessWidget {
  const LumoChip({super.key, required this.label, this.icon, this.isSelected = false, this.onChanged, this.onRemove, this.removeLabel, this.size = LumoChipSize.md, this.isDisabled = false})
      : assert(onRemove == null || removeLabel != null, 'A removable chip needs a removeLabel — name the thing being removed, e.g. «حذف تهران».');
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// A leading icon (drawn at the inline start; decorative).
  final Widget? icon;
  /// Whether this one is selected.
  final bool isSelected;
  /// Makes the chip a toggle: called with the next selected state.
  final ValueChanged<bool>? onChanged;
  /// Called when the remove control is activated.
  final VoidCallback? onRemove;
  /// Announced name of the remove control. REQUIRED when `onRemove` is set.
  final String? removeLabel;
  /// The size step, from the shared control scale.
  final LumoChipSize size;
  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final sm = size == LumoChipSize.sm;
    final removable = onRemove != null;
    final selectable = onChanged != null;
    final fg = isSelected ? c.accentFg : c.fg;
    // `isFocused` thickens the border to `c.focus` at `LumoFocus.width` INSIDE a
    // box whose height never changes — the focus treatment `input_group.dart`
    // already uses, so a keyboard or switch reader sees where it is.
    Container body({required bool isFocused}) => Container(
      height: sm ? 24 : 28,
      // `ps`/`pe`, not symmetric: the removable form trims the inline END for the ✕.
      padding: EdgeInsetsDirectional.only(start: sm ? 8 : 10, end: removable ? 4 : (sm ? 8 : 10)),
      decoration: BoxDecoration(
        color: isSelected ? c.accent : c.surfaceSunken,
        border: Border.all(color: isFocused ? c.focus : (isSelected ? c.accent : c.border), width: isFocused ? LumoFocus.width : 1),
        borderRadius: BorderRadius.circular(LumoRadius.md),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        spacing: sm ? 4 : 6,
        children: [
          if (icon != null) ExcludeSemantics(child: IconTheme(data: IconThemeData(size: sm ? 12 : 14, color: fg), child: icon!)),
          // Selectable: the outer button node carries the name, so the text is excluded (announced ONCE).
          Flexible(child: ExcludeSemantics(excluding: selectable, child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: sm ? 12 : 14, color: fg)))),
          // The ✕'s SPACE, reserved in the row. The glyph itself is painted by the
          // 44x44 band laid over the chip's inline end below, at exactly this offset.
          if (removable) const SizedBox(width: 20, height: 20),
        ],
      ),
    );
    Widget chip({required bool isFocused}) => Opacity(opacity: isDisabled ? 0.5 : 1, child: body(isFocused: isFocused));
    if (!selectable && !removable) {
      // Nothing to tap: no band, and the label is announced as plain text.
      return Semantics(container: true, explicitChildNodes: true, child: chip(isFocused: false));
    }
    // `widthFactor: 1` so the band takes the chip's width, never the row's.
    Widget band(Widget child) => SizedBox(height: LumoControl.lg, child: Center(widthFactor: 1, child: child));
    final Widget banded = selectable
        ? Semantics(
            container: true,
            button: true,
            selected: isSelected,
            enabled: !isDisabled,
            label: label,
            onTap: isDisabled ? null : () => onChanged!(!isSelected),
            // The BAND is the target, so the node measures 44 tall; the
            // `GestureDetector` makes its transparent part hit-test. The
            // `InkWell` stays wrapped round the painted body alone, so the
            // press ripple keeps the chip's shape instead of the band's — and is
            // `ExcludeSemantics`d, because the node above already says all of it.
            child: _TapBand(
              onTap: isDisabled ? null : () => onChanged!(!isSelected),
              builder: (context, isFocused) => band(ExcludeSemantics(
                child: InkWell(
                  // The band above is the one tab stop, and the node above is
                  // the one announcement; this InkWell exists for the theme's
                  // press tint, which must keep the CHIP's shape, not the band's.
                  canRequestFocus: false,
                  onTap: isDisabled ? null : () => onChanged!(!isSelected),
                  borderRadius: BorderRadius.circular(LumoRadius.md),
                  child: chip(isFocused: isFocused),
                ),
              )),
            ),
          )
        // Static: the label is announced as text; only the ✕ is a control.
        : Semantics(container: true, explicitChildNodes: true, child: band(chip(isFocused: false)));
    if (!removable) return banded;
    return Stack(
      children: [
        banded,
        // The ✕'s hit area: a `LumoControl.lg` square at the inline end, over the
        // painted glyph — which is why the row above reserves the space but
        // paints nothing. `container`, so this node never merges into a
        // selectable chip's button node; on a chip that is both, the ✕ wins the
        // inline-end band, as the web's overhanging pseudo-element already does.
        PositionedDirectional(
          end: 0,
          top: 0,
          bottom: 0,
          width: LumoControl.lg,
          child: Semantics(
            container: true,
            button: true,
            enabled: !isDisabled,
            label: removeLabel,
            onTap: isDisabled ? null : onRemove,
            child: Tooltip(
              message: removeLabel!,
              excludeFromSemantics: true,
              child: _TapBand(
                onTap: isDisabled ? null : onRemove,
                // The glyph, painted at the same 4 px inset from the chip's
                // inline end it had while it WAS the button. The InkWell keeps
                // the theme's press tint on the 20x20 box; the transparent rest
                // of the band is the part that only hit-tests.
                builder: (context, isFocused) => Align(
                  alignment: AlignmentDirectional.centerEnd,
                  child: Padding(
                    padding: const EdgeInsetsDirectional.only(end: 4),
                    child: ExcludeSemantics(
                      child: InkWell(
                        canRequestFocus: false,
                        onTap: isDisabled ? null : onRemove,
                        borderRadius: BorderRadius.circular(LumoRadius.sm),
                        child: Container(
                          width: 20,
                          height: 20,
                          // The ring paints INSIDE the 20 px box: the glyph's box never changes size.
                          decoration: isFocused
                              ? BoxDecoration(border: Border.all(color: c.focus, width: LumoFocus.width), borderRadius: BorderRadius.circular(LumoRadius.sm))
                              : null,
                          child: Icon(Icons.close, size: 12, color: isSelected ? c.accentFg : c.fgMuted),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// One tag of a `LumoTagGroup`: `id` handed back to `onRemove`, `textValue`
/// REQUIRED (the plain text — nothing derives it, so it cannot be empty by
/// accident; also the argument handed to `removeLabel`).
class LumoTagItem {
  const LumoTagItem({required this.id, required this.textValue, this.icon});
  /// A stable identity for this item — used for selection and equality, never shown or announced.
  final String id;
  /// The text this item is matched and announced by.
  final String textValue;
  /// A leading icon. Decorative — it is not announced, so it never carries meaning on its own.
  final Widget? icon;
}

/// A group of tags — the web `TagGroup`: `label` REQUIRED (names the
/// collection). Removable when told how — `onRemove` and `removeLabel` are one
/// decision (asserted, as the web's union), `removeLabel` a FUNCTION of the
/// tag's own text because Persian word order is not English with the words
/// swapped: `(tag) => 'حذف $tag'`. Static: a plain named list; the reader gets
/// the label once and each tag as text.
class LumoTagGroup extends StatelessWidget {
  const LumoTagGroup({super.key, required this.label, required this.items, this.onRemove, this.removeLabel, this.size = LumoChipSize.md, this.isDisabled = false})
      : assert((onRemove == null) == (removeLabel == null), 'onRemove and removeLabel are one decision: both or neither.');
  /// The name this control is announced by, and painted where the family shows one.
  final String label;
  /// The items to show, in reading order.
  final List<LumoTagItem> items;
  /// Called with the id of the tag to drop.
  final ValueChanged<String>? onRemove;
  /// Builds the announced name of each tag's remove control from that tag's `textValue`.
  final String Function(String textValue)? removeLabel;
  /// The size step, from the shared control scale.
  final LumoChipSize size;
  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: label,
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final t in items)
            LumoChip(
              label: t.textValue,
              icon: t.icon,
              size: size,
              isDisabled: isDisabled,
              onRemove: onRemove == null ? null : () => onRemove!(t.id),
              removeLabel: removeLabel?.call(t.textValue),
            ),
        ],
      ),
    );
  }
}

/// The 44 px touch band under a chip's controls: it owns the focus node — one
/// tab stop, and the `focus` semantics action the ✕ has always carried — hit
/// tests its whole (mostly transparent) area, and hands `isFocused` back so the
/// PAINTED control can wear the state. A `Focus` alone cannot do the last part:
/// it rebuilds its own subtree, not the child element the caller passed it.
class _TapBand extends StatefulWidget {
  const _TapBand({required this.onTap, required this.builder});

  /// Null disables the band: no tap, and nothing to focus.
  final VoidCallback? onTap;
  final Widget Function(BuildContext context, bool isFocused) builder;

  @override
  State<_TapBand> createState() => _TapBandState();
}

class _TapBandState extends State<_TapBand> {
  late final FocusNode _node = FocusNode()..addListener(_onFocus);

  void _onFocus() => setState(() {});

  @override
  void dispose() {
    _node.removeListener(_onFocus);
    _node.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Focus(
        focusNode: _node,
        canRequestFocus: widget.onTap != null,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          // The tap is on the semantics node above; the detector's own would
          // form a second, nameless one.
          excludeFromSemantics: true,
          onTap: widget.onTap,
          child: widget.builder(context, _node.hasFocus),
        ),
      );
}
