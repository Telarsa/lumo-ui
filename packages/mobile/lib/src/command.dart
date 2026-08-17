import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;

import 'button.dart';
import 'combobox.dart' show lumoFoldForSearch;
import 'item.dart';
import 'scope.dart';
import 'sheet.dart';
import 'text_field.dart';
import 'tokens.g.dart';

/// One row of a [LumoCommand]: `id` is what the palette reports, `label` the
/// announced and displayed text — the web's `CommandItem`.
@immutable
class LumoCommandItem {
  const LumoCommandItem({required this.id, required this.label, this.description, this.icon, this.keywords = const [], this.isDisabled = false});

  /// A stable identity for this item — used for selection and equality, never shown or announced.
  final String id;
  /// The name this control is announced by, and painted where the family shows one.
  final String label;

  /// A second line — where the row leads, what it will do.
  final String? description;

  /// A leading glyph. DECORATIVE: the label says what the icon says.
  final Widget? icon;

  /// Extra words the query may match that are not shown — an English synonym
  /// for a Persian command, an old name a reader still types.
  final List<String> keywords;

  /// Whether the control is disabled.
  final bool isDisabled;
}

/// A titled run of rows — the web's `CommandGroup`.
@immutable
class LumoCommandGroup {
  const LumoCommandGroup({required this.label, required this.items});

  /// The group's visible title, announced once as a header. REQUIRED.
  final String label;
  /// The items to show, in reading order.
  final List<LumoCommandItem> items;
}

/// The search-everything surface: a search box over grouped results, with the
/// recent choices offered before anything is typed — the web `Command`
/// (`command.tsx`) and the palette half of `power-search.tsx`.
///
/// **On a phone it is a full-height sheet, not a floating palette.** The web
/// centres a dialog at 20vh because a pointer and a physical keyboard are
/// given; here the keyboard covers the bottom half of the screen the moment
/// the field takes focus, so the surface takes the whole height and the list
/// scrolls under a PINNED search box — [showLumoCommand] opens exactly that.
/// The height is fixed rather than fitted to the results, because a sheet that
/// shrinks with every keystroke moves the row a thumb was about to hit.
///
/// **`emptyLabel` is announced, not just drawn.** The web relies on Base UI's
/// `Autocomplete.Empty`, which mounts a `role="status"`; here it is a live
/// region carrying its own words, so "nothing matched" reaches a reader who is
/// still in the search field. Nothing else in this file is a live region: the
/// results are a list the reader browses.
///
/// **Matching is Persian-aware.** The query and every candidate go through
/// `lumoFoldForSearch` (`combobox.dart`, imported rather than reimplemented —
/// the web imports `foldPersian` from `autocomplete.tsx` for the same reason),
/// so «کيف» finds «کیف», tashkeel and ZWNJ are ignored, and «۱۲» finds «12».
/// Labels, descriptions and `keywords` are all searched.
///
/// **The rows are `LumoItem`s.** A row in a palette and a row in a settings
/// list are the same object to a reader; two implementations is how they stop
/// being. Each is ONE button node named by its label, with its description as
/// a child node.
///
/// Web props not carried: `filter`/`itemToString` (items are a declared shape
/// here, and `keywords` covers what a custom `itemToString` was for),
/// `CommandShortcut` (a phone has no modifier keys to show), `href` rows
/// (navigation is `onSelected` plus the app's router), and the separate
/// `CommandDialog`/`Command`/`CommandInput`/`CommandList` parts — a phone
/// palette is configured, not composed out of six components at every call site.
///
/// It must be given a BOUNDED height (it fills what it is given, and the list
/// scrolls inside). [showLumoCommand] does that.
class LumoCommand extends StatefulWidget {
  const LumoCommand({
    super.key,
    required this.label,
    required this.searchLabel,
    required this.emptyLabel,
    required this.closeLabel,
    required this.groups,
    this.recent = const [],
    this.recentLabel,
    this.onSelected,
    this.onQueryChanged,
    this.placeholder,
  });

  /// Names the surface, and the ROUTE when it is opened as a sheet. REQUIRED.
  final String label;

  /// Names the search box (and stands in as its placeholder unless
  /// `placeholder` is given). REQUIRED.
  final String searchLabel;

  /// What the reader is TOLD when the query matches nothing. REQUIRED.
  final String emptyLabel;

  /// Names the ✕ and, through the route, its scrim. REQUIRED.
  final String closeLabel;

  /// The results, grouped. Groups whose items all filter out are not drawn.
  final List<LumoCommandGroup> groups;

  /// What the reader chose last time — offered while the query is empty.
  final List<LumoCommandItem> recent;

  /// Names the recent group. REQUIRED when [recent] is not empty (asserted).
  final String? recentLabel;

  /// Called with the chosen item's id.
  final ValueChanged<String>? onSelected;

  /// Called as the query changes — for a palette whose results come from a
  /// server. The widget still filters what it was given.
  final ValueChanged<String>? onQueryChanged;

  /// Shown in the empty search box. Defaults to [searchLabel].
  final String? placeholder;

  @override
  State<LumoCommand> createState() => _LumoCommandState();
}

class _LumoCommandState extends State<LumoCommand> {
  String _query = '';

  bool _matches(LumoCommandItem item, String folded) {
    if (folded.isEmpty) return true;
    if (lumoFoldForSearch(item.label).contains(folded)) return true;
    if (item.description != null && lumoFoldForSearch(item.description!).contains(folded)) return true;
    for (final keyword in item.keywords) {
      if (lumoFoldForSearch(keyword).contains(folded)) return true;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    // Checked here, not in the const constructor: a `length` assert there is a
    // COMPILE error at every const call site (`segmented_control.dart` first).
    assert(widget.recent.isEmpty || widget.recentLabel != null, 'A palette that offers recent items must name that group — recentLabel.');
    final c = LumoScope.of(context).colours;
    final folded = lumoFoldForSearch(_query.trim());
    final groups = <LumoCommandGroup>[
      // Recent is offered only before the reader has said what they want.
      if (folded.isEmpty && widget.recent.isNotEmpty) LumoCommandGroup(label: widget.recentLabel!, items: widget.recent),
      for (final group in widget.groups)
        if (group.items.any((item) => _matches(item, folded))) LumoCommandGroup(label: group.label, items: [for (final item in group.items) if (_matches(item, folded)) item]),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsetsDirectional.only(start: 20, end: 12, top: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ONE node names the route AND is the header — as `sheet.dart` does.
              Expanded(
                child: Semantics(
                  namesRoute: true,
                  header: true,
                  child: Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(widget.label, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, height: 1.4, color: c.fg)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              LumoIconButton(
                label: widget.closeLabel,
                size: LumoButtonSize.sm,
                onPressed: () => Navigator.of(context).pop(),
                child: Icon(Icons.close, size: 16, color: c.fgMuted),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsetsDirectional.only(start: 20, end: 20, top: 8, bottom: 8),
          child: LumoTextField(
            label: widget.searchLabel,
            // The name never leaves; the visible row does, because the sheet's
            // own title is right above it.
            showLabel: false,
            placeholder: widget.placeholder ?? widget.searchLabel,
            autofocus: true,
            textInputAction: TextInputAction.search,
            prefix: Icon(Icons.search, size: 16, color: c.fgSubtle),
            onChanged: (value) {
              setState(() => _query = value);
              widget.onQueryChanged?.call(value);
            },
          ),
        ),
        ExcludeSemantics(child: SizedBox(height: 1, child: ColoredBox(color: c.border))),
        Expanded(
          child: groups.isEmpty
              ? Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
                  // Its own node, its own words, flagged live — a live region
                  // with nothing to say announces nothing.
                  child: Semantics(
                    liveRegion: true,
                    child: Text(widget.emptyLabel, textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: c.fgMuted)),
                  ),
                )
              : ListView(
                  padding: const EdgeInsetsDirectional.only(start: 12, end: 12, top: 8, bottom: 16),
                  children: [
                    for (final group in groups) ...[
                      Padding(
                        padding: const EdgeInsetsDirectional.only(start: 8, top: 8, bottom: 4),
                        child: Semantics(
                          header: true,
                          child: Text(group.label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c.fgSubtle)),
                        ),
                      ),
                      // A run of rows IS a list to a reader; it carries no name
                      // of its own, because the header above it already has one.
                      Semantics(
                        container: true,
                        explicitChildNodes: true,
                        role: SemanticsRole.list,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            for (final item in group.items)
                              LumoItem(
                                title: item.label,
                                description: item.description,
                                leading: item.icon,
                                size: LumoItemSize.sm,
                                isDisabled: item.isDisabled,
                                onTap: () => widget.onSelected?.call(item.id),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
        ),
      ],
    );
  }
}

/// Open a [LumoCommand] as a full-height sheet, and answer with the id the
/// reader chose (or `null` when it was dismissed).
///
/// A `showLumoSheetRoute`, not `showLumoSheet`: the palette brings its own
/// header, and its list must scroll INSIDE the sheet rather than inside the
/// scroll view `showLumoSheet` wraps a body in — the same case `LumoDateField`
/// makes for the calendar. Never Material's `showModalBottomSheet`, whose route
/// names itself «Dialog» and its barrier «Dismiss» in English on Android.
Future<String?> showLumoCommand(
  BuildContext context, {
  required String label,
  required String searchLabel,
  required String emptyLabel,
  required String closeLabel,
  required List<LumoCommandGroup> groups,
  List<LumoCommandItem> recent = const [],
  String? recentLabel,
  String? placeholder,
  ValueChanged<String>? onQueryChanged,
}) {
  final scope = LumoScope.of(context);
  final c = scope.colours;
  return showLumoSheetRoute<String>(
    context,
    closeLabel: closeLabel,
    builder: (ctx) => Align(
      alignment: Alignment.bottomCenter,
      child: FractionallySizedBox(
        // Full height, less the strip that keeps the scrim visible and tappable.
        heightFactor: 0.92,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 640),
          // `shadow-modal`: the command palette covers the page like a sheet.
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(LumoRadius.lg)),
              boxShadow: LumoShadow.modal(scope.brightness),
            ),
            child:   Material(
              color: c.surface,
              clipBehavior: Clip.antiAlias,
              shape: RoundedRectangleBorder(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(LumoRadius.lg)),
                side: BorderSide(color: c.border),
              ),
              child: SafeArea(
                top: false,
                child: LumoCommand(
                  label: label,
                  searchLabel: searchLabel,
                  emptyLabel: emptyLabel,
                  closeLabel: closeLabel,
                  groups: groups,
                  recent: recent,
                  recentLabel: recentLabel,
                  placeholder: placeholder,
                  onQueryChanged: onQueryChanged,
                  onSelected: (id) => Navigator.of(ctx).pop(id),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
