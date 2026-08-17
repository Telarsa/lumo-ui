import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'scope.dart';

/// One crumb of a trail: `label` REQUIRED (a crumb IS its text — the web's
/// `children`), `onTap` optional. A crumb with `onTap` is a LINK; a crumb
/// without one is a step you cannot go back to, and the LAST crumb is never a
/// link whatever it was given, because it is the page you are already on.
class LumoCrumb {
  const LumoCrumb({required this.label, this.onTap});
  final String label;

  /// Where this crumb goes. Flutter has no router here, so this is the seam.
  final VoidCallback? onTap;
}

/// A breadcrumb trail — the web `Breadcrumbs`/`Breadcrumb`/`BreadcrumbEllipsis`
/// as one widget. `label` is REQUIRED for the same reason it is on the web:
/// React Aria defaulted the trail's name to the English "Breadcrumbs", and an
/// unnamed trail is anonymous, which is worse because no gate can see it.
///
/// **The separator flips.** The web leans on `›` (U+203A) carrying the Unicode
/// `Bidi_Mirrored` property; Flutter's counterpart is an IconData with
/// `matchTextDirection`, which `Icons.chevron_right` has — so the chevron points
/// at the reading END and becomes a left chevron under fa-IR with no `dir` flag
/// and no `if (rtl)`. The Khroos app hand-rolled the trail with a hard-coded
/// `chevron-left`, which is the same glyph pointing the WRONG way the moment
/// the app is read in English.
///
/// **The last crumb is the current page**: announced as text, never as a link
/// (no `link` flag, no tap action, even when the caller gave it an `onTap`),
/// and drawn in `fg` at `w500` — the web's `data-current` treatment. Flutter's
/// semantics have no counterpart to `aria-current`, so the word itself is the
/// only honest way to say it: pass `currentLabel` («صفحهٔ فعلی») and it is
/// appended to the last crumb's announced name. Optional, not required,
/// because unlike a nameless control an unannounced current crumb still reads
/// correctly — it is simply the last thing in the trail.
///
/// **Collapsing**: with `maxVisible` set and more crumbs than that, the middle
/// ones fold behind a named button — `overflowLabel` is REQUIRED with
/// `maxVisible` (the constructor asserts it), because a «…» has no name of its
/// own. The web's `BreadcrumbEllipsis` is deliberately INERT punctuation (it
/// keeps that file server-only); here it is a real button that expands the
/// trail in place, since a phone has no room to show the trail another way and
/// a menu route for three words is worse than the words.
class LumoBreadcrumbs extends StatefulWidget {
  const LumoBreadcrumbs({super.key, required this.label, required this.items, this.maxVisible, this.overflowLabel, this.currentLabel})
      : assert(maxVisible == null || overflowLabel != null, 'A collapsing trail needs an overflowLabel — name what the «…» stands for, e.g. «خرده‌های میانی».'),
        assert(maxVisible == null || maxVisible >= 2, 'maxVisible counts the crumbs still shown: the first plus at least one more.');

  /// Announced name of the trail, e.g. «مسیر صفحه». Required.
  final String label;
  final List<LumoCrumb> items;

  /// How many crumbs stay visible before the middle ones fold away.
  final int? maxVisible;

  /// Announced name of the button the folded crumbs hide behind. REQUIRED with `maxVisible`.
  final String? overflowLabel;

  /// Appended to the last crumb's announced name, e.g. «صفحهٔ فعلی».
  final String? currentLabel;

  @override
  State<LumoBreadcrumbs> createState() => _LumoBreadcrumbsState();
}

class _LumoBreadcrumbsState extends State<LumoBreadcrumbs> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    // In build, not the constructor: `List.length` is not constant-evaluable.
    assert(widget.items.isNotEmpty, 'A trail needs at least one crumb.');
    final c = LumoScope.of(context).colours;
    final last = widget.items.length - 1;
    final max = widget.maxVisible;
    final collapsing = !_expanded && max != null && widget.items.length > max;
    // First crumb, the button, then the tail — the run in the MIDDLE is what folds.
    final hiddenFrom = 1;
    final hiddenTo = collapsing ? widget.items.length - (max - 1) : 1;

    final separator = ExcludeSemantics(
      child: Padding(
        // `px-1` on the web's separator.
        padding: const EdgeInsetsDirectional.symmetric(horizontal: 4),
        child: Icon(Icons.chevron_right, size: 14, color: c.fgSubtle),
      ),
    );

    final children = <Widget>[];
    void addSeparator() {
      if (children.isNotEmpty) children.add(separator);
    }

    for (var i = 0; i < widget.items.length; i++) {
      if (collapsing && i >= hiddenFrom && i < hiddenTo) {
        if (i == hiddenFrom) {
          addSeparator();
          children.add(_Overflow(label: widget.overflowLabel!, colour: c.fgSubtle, onTap: () => setState(() => _expanded = true)));
        }
        continue;
      }
      addSeparator();
      children.add(_Crumb(
        crumb: widget.items[i],
        isCurrent: i == last,
        currentLabel: i == last ? widget.currentLabel : null,
      ));
    }

    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label,
      role: SemanticsRole.list,
      child: Wrap(crossAxisAlignment: WrapCrossAlignment.center, runSpacing: 4, children: children),
    );
  }
}

/// One crumb's node. A link when it can be followed and is not the current
/// page; plain text otherwise. The drawn text is excluded so the name — which
/// may carry `currentLabel` after it — is announced ONCE.
class _Crumb extends StatelessWidget {
  const _Crumb({required this.crumb, required this.isCurrent, required this.currentLabel});
  final LumoCrumb crumb;
  final bool isCurrent;
  final String? currentLabel;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    // Concatenated in reading order, exactly as the web appends its `sr-only`
    // text after the visible label — an accessible name is joined in tree
    // order, which bidi never reorders.
    final name = currentLabel == null ? crumb.label : '${crumb.label} $currentLabel';
    final text = ExcludeSemantics(
      child: Text(
        crumb.label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 14,
          // `data-current:font-medium data-current:text-fg` against the trail's `text-fg-muted`.
          fontWeight: isCurrent ? FontWeight.w500 : FontWeight.w400,
          color: isCurrent ? c.fg : c.fgMuted,
        ),
      ),
    );
    final followable = !isCurrent && crumb.onTap != null;
    return Semantics(
      container: true,
      role: SemanticsRole.listItem,
      link: followable,
      label: name,
      onTap: followable ? crumb.onTap : null,
      child: followable
          ? GestureDetector(
              behavior: HitTestBehavior.opaque,
              // The tap is on the node above; the detector's own would form a second, nameless one.
              excludeFromSemantics: true,
              onTap: crumb.onTap,
              child: text,
            )
          : text,
    );
  }
}

/// The folded crumbs' button. The glyph is decoration; `label` is the name.
class _Overflow extends StatelessWidget {
  const _Overflow({required this.label, required this.colour, required this.onTap});
  final String label;
  final Color colour;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      role: SemanticsRole.listItem,
      button: true,
      label: label,
      onTap: onTap,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        excludeFromSemantics: true,
        onTap: onTap,
        // `…` is symmetric: nothing to mirror.
        child: ExcludeSemantics(child: Text('…', style: TextStyle(fontSize: 14, height: 1, color: colour))),
      ),
    );
  }
}
