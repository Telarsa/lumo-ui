import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'progress.dart';
import 'scope.dart';

/// A long list that builds only what is on screen — the web `VirtualList`.
///
/// **What is and is not being re-invented.** `virtual-list.tsx` owns arithmetic
/// (`virtualizer.ts`) because the DOM has no windowing: a `<div>` with ten
/// thousand children IS ten thousand elements. Flutter's sliver protocol is
/// already lazy, so there is nothing to compute here and this file makes no
/// attempt to. What it carries across is the CONTRACT the web file states in
/// its own docblock — a named list, a total, a per-item position, one required
/// empty message — plus the three `ListView` settings that people get wrong:
///
///  - **Keys, and the half of them everyone forgets.** Without [itemKey] a
///    row's `Element` is identified by its SLOT, so inserting at the top makes
///    every row inherit the state of the row below it (a half-typed field, an
///    open expander, a switch mid-animation). [itemKey] alone fixes the wrong
///    half of that: a `KeyedSubtree` whose key changed cannot be updated in
///    place, so the row is rebuilt and its state is DISCARDED — correct, but
///    lost. A sliver does not move elements by key the way a `Row` or `Column`
///    does; it needs [findItemIndex], which is what lets it relocate the
///    existing element to its new slot and carry the state with it. Two props,
///    three behaviours, and `virtual_list_test.dart` pins all three.
///  - **Extent.** [estimatedItemExtent] mirrors the web's `estimateSize`, but
///    say plainly what it becomes: Flutter's `itemExtent`, which is a CONTRACT,
///    not a hint — every row is laid out at exactly that height. Pass it when
///    the rows really are uniform (the Khroos bench's 2,000 rows are 64 px) and
///    scroll-offset arithmetic becomes O(1); omit it for variable rows, because
///    a wrong number clips content rather than estimating it.
///  - **Keep-alives.** `addAutomaticKeepAlives` is FALSE by default here where
///    `ListView` defaults it true: a keep-alive holds every row that ever asked
///    for one for the life of the list, which on a feed is the whole corpus and
///    defeats the point. Turn it on ([keepAlive]) only for rows that own real
///    state — a playing video, a map.
///
/// **Position in a set.** The web emits `aria-setsize`/`aria-posinset` on every
/// row. Flutter's `Semantics` widget has no such properties; its counterpart is
/// the SLIVER's own semantic index — `SliverChildBuilderDelegate` stamps each
/// child with an index and reports [itemCount] as the scrollable's
/// `scrollChildCount`, which is what the platforms map to Android's
/// `CollectionInfo`/`CollectionItemInfo` and to iOS's ordinal announcements. So
/// the total is carried on the SCROLLABLE's node, not on each row, and it is a
/// raw integer — a Persian digit in a set size is not a value, it is a crash
/// waiting for a parser. `virtual_list_test.dart` pins both.
///
/// **The list role.** `SemanticsRole.list` names the container. Rows do NOT get
/// `SemanticsRole.listItem`: Flutter asserts that a `listItem`'s DIRECT parent
/// carries `list`, and the `Scrollable`'s own node always sits between them, so
/// the role would turn every scrolling list in the app into a crash. The role
/// is on the container, the position comes from the sliver, and nothing lies.
class LumoVirtualList extends StatelessWidget {
  const LumoVirtualList({
    super.key,
    required this.label,
    required this.itemCount,
    required this.itemBuilder,
    required this.emptyLabel,
    this.itemKey,
    this.findItemIndex,
    this.estimatedItemExtent,
    this.padding,
    this.controller,
    this.physics,
    this.scrollDirection = Axis.vertical,
    this.keepAlive = false,
    this.shrinkWrap = false,
    this.separatorBuilder,
  });

  /// Announced name of the list, e.g. «فهرست سفارش‌ها». REQUIRED.
  final String label;

  /// How many rows exist in the corpus, not how many are built.
  final int itemCount;

  /// Builds one row. Called with the row's TRUE index.
  final Widget Function(BuildContext context, int index) itemBuilder;

  /// Shown and announced when [itemCount] is zero. REQUIRED — "nothing here"
  /// is a sentence in the reader's language, never an empty box.
  final String emptyLabel;

  /// A stable identity per row, so a row's state follows its datum.
  final Object Function(int index)? itemKey;

  /// The inverse of [itemKey], when the caller can answer it in O(1). Wired to
  /// `findChildIndexCallback`, which is the ONLY thing that lets a sliver re-use
  /// an existing element for a row that MOVED rather than rebuilding it — see
  /// the docblock. Not derived from [itemKey]: deriving it would mean walking
  /// the corpus, which is the one thing a lazy list must not do.
  final int? Function(Object key)? findItemIndex;

  /// The exact extent of every row along the scroll axis. See the docblock:
  /// on Flutter this is not an estimate.
  final double? estimatedItemExtent;

  final EdgeInsetsGeometry? padding;
  final ScrollController? controller;
  final ScrollPhysics? physics;
  final Axis scrollDirection;

  /// Keep rows alive when scrolled off. Off by default; see the docblock.
  final bool keepAlive;

  final bool shrinkWrap;

  /// Drawn between rows. Separators are NOT counted in [itemCount] and carry no
  /// semantic index — a hairline is not an item of the set.
  final Widget Function(BuildContext context, int index)? separatorBuilder;

  @override
  Widget build(BuildContext context) => _LumoListShell(
        label: label,
        itemCount: itemCount,
        emptyLabel: emptyLabel,
        child: itemCount == 0
            ? null
            : _buildList(
                context: context,
                itemCount: itemCount,
                itemBuilder: itemBuilder,
                itemKey: itemKey,
                findItemIndex: findItemIndex,
                extent: estimatedItemExtent,
                padding: padding,
                controller: controller,
                physics: physics,
                scrollDirection: scrollDirection,
                keepAlive: keepAlive,
                shrinkWrap: shrinkWrap,
                separatorBuilder: separatorBuilder,
                footer: null,
              ),
      );
}

/// The named container both lists share: `SemanticsRole.list`, the name, and
/// the empty message when there is nothing to name.
class _LumoListShell extends StatelessWidget {
  const _LumoListShell({required this.label, required this.itemCount, required this.emptyLabel, required this.child});
  final String label;
  final int itemCount;
  final String emptyLabel;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.list,
      label: label,
      child: child ??
          Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(emptyLabel, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: c.fgMuted)),
            ),
          ),
    );
  }
}

/// One `ListView.custom`, built the same way for both lists. `footer` is an
/// extra trailing child OUTSIDE the counted set — see `semanticIndexCallback`.
Widget _buildList({
  required BuildContext context,
  required int itemCount,
  required Widget Function(BuildContext, int) itemBuilder,
  required Object Function(int)? itemKey,
  required int? Function(Object)? findItemIndex,
  required double? extent,
  required EdgeInsetsGeometry? padding,
  required ScrollController? controller,
  required ScrollPhysics? physics,
  required Axis scrollDirection,
  required bool keepAlive,
  required bool shrinkWrap,
  required Widget Function(BuildContext, int)? separatorBuilder,
  required Widget? footer,
}) {
  final separated = separatorBuilder != null;
  // With separators the sliver holds 2n−1 children; the odd slots are hairlines.
  final bodyCount = separated ? (itemCount == 0 ? 0 : itemCount * 2 - 1) : itemCount;
  final childCount = bodyCount + (footer == null ? 0 : 1);

  Widget build(BuildContext context, int slot) {
    if (footer != null && slot == bodyCount) return footer;
    if (separated && slot.isOdd) return separatorBuilder(context, slot ~/ 2);
    final index = separated ? slot ~/ 2 : slot;
    final row = itemBuilder(context, index);
    return itemKey == null ? row : KeyedSubtree(key: ValueKey<Object>(itemKey(index)), child: row);
  }

  return ListView.custom(
    // The SET SIZE. `ListView.builder` fills this in from `itemCount`;
    // `ListView.custom` does not, and without it the scrollable reports a
    // position with no total — «۱۲» of nothing. It is the corpus, so the
    // footer and the separators are excluded from it.
    semanticChildCount: itemCount,
    controller: controller,
    physics: physics,
    padding: padding,
    scrollDirection: scrollDirection,
    shrinkWrap: shrinkWrap,
    // Only legal when every child is that tall — a separator or a footer is
    // not, so the extent is dropped the moment either exists rather than
    // silently clipping them.
    itemExtent: separated || footer != null ? null : extent,
    childrenDelegate: SliverChildBuilderDelegate(
      build,
      childCount: childCount,
      addAutomaticKeepAlives: keepAlive,
      // `null` = not a member of the set: a hairline and a "loading more" row
      // must not inflate the total a reader is told.
      semanticIndexCallback: (widget, slot) {
        if (footer != null && slot == bodyCount) return null;
        if (separated && slot.isOdd) return null;
        return separated ? slot ~/ 2 : slot;
      },
      findChildIndexCallback: findItemIndex == null
          ? null
          : (key) {
              final value = key is ValueKey<Object> ? key.value : null;
              if (value == null) return null;
              final index = findItemIndex(value);
              if (index == null) return null;
              return separated ? index * 2 : index;
            },
    ),
  );
}

/// A [LumoVirtualList] that asks for another page when the reader nears the end
/// — the web's `onEndReached`/`endReachedThreshold`/`asyncStatus` trio, which
/// every real feed needs and no Flutter list ships.
///
/// [loadingLabel] is REQUIRED and is both drawn beside the spinner and announced
/// from a live region while [isLoadingMore] is true, because "more is coming" is
/// the one thing a reader cannot see from a list that has stopped growing.
///
/// [onEndReached] fires AT MOST ONCE per [itemCount]: the guard is the count
/// itself, exactly as `virtual-list.tsx` does it with `requestedAtCount`. Any
/// other guard (a bool, a timer) either fires twice for one page or stops
/// firing when a page comes back empty.
class LumoInfiniteList extends StatefulWidget {
  const LumoInfiniteList({
    super.key,
    required this.label,
    required this.itemCount,
    required this.itemBuilder,
    required this.emptyLabel,
    required this.loadingLabel,
    this.onEndReached,
    this.isLoadingMore = false,
    this.endReachedThreshold = 3,
    this.itemKey,
    this.findItemIndex,
    this.padding,
    this.controller,
    this.physics,
    this.scrollDirection = Axis.vertical,
    this.keepAlive = false,
    this.separatorBuilder,
  });

  /// Announced name of the list. REQUIRED.
  final String label;

  /// Rows loaded SO FAR. The "loading more" row is not one of them.
  final int itemCount;

  final Widget Function(BuildContext context, int index) itemBuilder;

  /// Shown and announced when nothing has loaded. REQUIRED.
  final String emptyLabel;

  /// Announced (live) and drawn while another page is on the way. REQUIRED.
  final String loadingLabel;

  /// Asked for another page. Fires once per [itemCount].
  final VoidCallback? onEndReached;

  /// The caller's answer: a page is in flight. Drives the footer and the
  /// live announcement.
  final bool isLoadingMore;

  /// How many rows before the end count as "near the end".
  final int endReachedThreshold;

  final Object Function(int index)? itemKey;
  final int? Function(Object key)? findItemIndex;
  final EdgeInsetsGeometry? padding;
  final ScrollController? controller;
  final ScrollPhysics? physics;
  final Axis scrollDirection;
  final bool keepAlive;
  final Widget Function(BuildContext context, int index)? separatorBuilder;

  @override
  State<LumoInfiniteList> createState() => _LumoInfiniteListState();
}

class _LumoInfiniteListState extends State<LumoInfiniteList> {
  /// The corpus size at which a page was last asked for. `null` = never.
  int? _requestedAtCount;

  @override
  void didUpdateWidget(LumoInfiniteList old) {
    super.didUpdateWidget(old);
    // A page arrived: the guard is spent and the next end is a new question.
    if (old.itemCount != widget.itemCount) _requestedAtCount = null;
  }

  void _maybeRequest(int index) {
    final onEndReached = widget.onEndReached;
    if (onEndReached == null || widget.itemCount == 0) return;
    final threshold = widget.endReachedThreshold < 0 ? 0 : widget.endReachedThreshold;
    if (index < widget.itemCount - 1 - threshold) return;
    if (_requestedAtCount == widget.itemCount) return;
    _requestedAtCount = widget.itemCount;
    // After the frame: a builder is running inside layout, and a caller's
    // `setState` from here would be a rebuild during a build.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) onEndReached();
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return _LumoListShell(
      label: widget.label,
      itemCount: widget.itemCount,
      emptyLabel: widget.emptyLabel,
      child: widget.itemCount == 0
          ? null
          : _buildList(
              context: context,
              itemCount: widget.itemCount,
              itemBuilder: (context, index) {
                _maybeRequest(index);
                return widget.itemBuilder(context, index);
              },
              itemKey: widget.itemKey,
              findItemIndex: widget.findItemIndex,
              extent: null,
              padding: widget.padding,
              controller: widget.controller,
              physics: widget.physics,
              scrollDirection: widget.scrollDirection,
              keepAlive: widget.keepAlive,
              shrinkWrap: false,
              separatorBuilder: widget.separatorBuilder,
              footer: widget.isLoadingMore
                  ? Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Center(
                        child: DefaultTextStyle.merge(
                          style: TextStyle(color: c.fgMuted),
                          // `showLabel` draws the words beside the ring AND
                          // `LumoSpinner` announces them from a live region, so
                          // the string is heard once and read once.
                          child: LumoSpinner(label: widget.loadingLabel, showLabel: true, size: LumoSpinnerSize.sm, color: LumoSpinnerColor.muted),
                        ),
                      ),
                    )
                  : null,
            ),
    );
  }
}
