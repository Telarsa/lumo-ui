import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// Where the link sits. The web's `variant` is a COLOUR scale
/// (`accent`/`subtle`/`quiet`) because a web page has prose, dense secondary
/// navigation and card-wrapping links; on a phone the second and third of
/// those are a `LumoItem` row and a tappable `LumoCard`, so what is left to
/// choose is PLACEMENT: inside a sentence, or standing on its own line.
enum LumoLinkVariant {
  /// In a run of text: the web's `accent` — coloured AND underlined, because
  /// colour alone does not distinguish a link (WCAG 1.4.1).
  ///
  /// **This one is NOT grown to the 44 px touch floor, on purpose.** Measured
  /// in a 360 dp column an inline link is 360×21 — one line box. Padding it to
  /// 44 would either open a 23 px hole in the paragraph it sits in or overlap
  /// the lines above and below and steal their taps; a link inside a sentence
  /// is a WORD, and its size is the type's. WCAG 2.5.8 exempts exactly this
  /// case ("the target is in a sentence or block of text"). When a link needs
  /// to be a target, it is not inline — that is what [standalone] is for.
  inline,

  /// On its own line, as a control: the accent colour, no resting underline,
  /// and a real touch target — [LumoControl.lg], the 44 px floor. It was
  /// [LumoControl.md] (36) and measured 36 tall, which is the text-button
  /// scale; but a standalone link has no fill to aim at and often only two or
  /// three words to hit, so it takes the floor the docblock already promised.
  standalone,
}

/// A navigational link — the web `Link`. Semantics: `link: true`, which is the
/// role a reader needs to know that activating this moves them somewhere; it is
/// NOT a button and must not be announced as one.
///
/// Flutter has no router in this package (the web `Link` takes an `href` and
/// can be handed the app's own link component), so **`onTap` is the seam**: the
/// app navigates, the widget names and announces.
///
/// **An external link SAYS it is external.** The web makes `newTab` +
/// `newTabLabel` a typed pair — `target`/`rel` are removed from the prop type
/// entirely — and renders the label as `sr-only` text APPENDED after the
/// visible words, so it lands in the accessible name in reading order (WCAG
/// 3.2.5). Here the same: `isExternal` requires `externalLabel` (the
/// constructor asserts it) and the announced name is «label externalLabel»,
/// concatenated in reading order. There is no default, because a default would
/// be English. No glyph is invented either: the web's warning is the WORDS, and
/// an ↗ that nobody named would be the defect this library exists to prevent —
/// pass `icon` yourself if the design wants one.
///
/// `underline-offset-4` on the web is here a 3px underline offset for the same
/// reason: Arabic-script tails (ی ج ح ع ژ) sit exactly where a default
/// underline cuts through them.
class LumoLink extends StatefulWidget {
  const LumoLink({
    super.key,
    required this.label,
    required this.onTap,
    this.variant = LumoLinkVariant.inline,
    this.icon,
    this.isExternal = false,
    this.externalLabel,
    this.isDisabled = false,
  }) : assert(!isExternal || externalLabel != null, 'An external link must say so: pass externalLabel, e.g. «در برگهٔ جدید باز می‌شود».');

  /// The link's visible text and its announced name. Required.
  final String label;

  /// What following the link does. Flutter has no router here — this is the seam.
  final VoidCallback onTap;

  /// The visual variant.
  final LumoLinkVariant variant;

  /// A glyph at the inline END, after the words. Decorative — excluded from semantics.
  final Widget? icon;

  /// Whether following this link leaves the app.
  final bool isExternal;

  /// The announced warning appended to the name. REQUIRED when `isExternal`.
  final String? externalLabel;

  /// A link that cannot be followed: still announced as a link (the web renders
  /// `<span role="link" aria-disabled>`, because a nameless generic is worse),
  /// but not enabled and with no tap action.
  final bool isDisabled;

  @override
  State<LumoLink> createState() => _LumoLinkState();
}

class _LumoLinkState extends State<LumoLink> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final enabled = !widget.isDisabled;
    final inline = widget.variant == LumoLinkVariant.inline;
    // Appended AFTER the words, in reading order — see the docblock.
    final name = widget.isExternal ? '${widget.label} ${widget.externalLabel}' : widget.label;
    final content = ExcludeSemantics(
      child: IconTheme(
        data: IconThemeData(size: 16, color: c.accent),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          // The web's `gap-1`.
          spacing: 4,
          children: [
            Flexible(
              child: Text(
                widget.label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: inline ? FontWeight.w400 : FontWeight.w500,
                  color: c.accent,
                  // Underlined at rest in prose; on press for the standalone form.
                  decoration: inline || _pressed ? TextDecoration.underline : TextDecoration.none,
                  // Arabic-script descenders sit where a flush underline cuts.
                  decorationThickness: 1,
                  decorationColor: c.accent,
                  height: 1.5,
                ),
              ),
            ),
            // The icon follows the words at the inline END; a `Row` mirrors itself.
            if (widget.icon != null) widget.icon!,
          ],
        ),
      ),
    );
    return Semantics(
      container: true,
      link: true,
      enabled: enabled,
      label: name,
      onTap: enabled ? widget.onTap : null,
      child: Opacity(
        opacity: enabled ? 1 : 0.5,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          // The tap is on the node above; the detector's own would form a second, nameless one.
          excludeFromSemantics: true,
          onTap: enabled ? widget.onTap : null,
          onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
          onTapUp: (_) => setState(() => _pressed = false),
          onTapCancel: () => setState(() => _pressed = false),
          child: inline
              ? content
              : ConstrainedBox(
                  // A link that stands alone is a touch target, not a word.
                  constraints: const BoxConstraints(minHeight: LumoTouch.floor),
                  child: Align(alignment: AlignmentDirectional.centerStart, widthFactor: 1, child: content),
                ),
        ),
      ),
    );
  }
}
