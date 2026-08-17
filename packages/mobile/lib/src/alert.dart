import 'package:flutter/material.dart';
import 'button.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// The message's semantic colour — the web `alertVariants` tones, neutral-first,
/// the same five names as `LumoBadgeTone`. Colour is NEVER the sole carrier
/// (WCAG 1.4.1): the words are in `title`/`description`, the tone only tints.
enum LumoAlertTone { neutral, accent, positive, critical, caution }

/// `subtle` is the web's single look (a /10 tint behind a /25 edge, the tone at
/// full strength on the reader's leading edge). `outline` is the MOBILE
/// ADDITION — the web `Alert` has no `variant` axis at all: on a phone an
/// alert often sits on an already-tinted card or a photo, where a second fill
/// muddies both, so the outline form drops the fill and keeps the edges. The
/// same addition, for the same reason, that `LumoBadgeVariant.outline` is.
enum LumoAlertVariant { subtle, outline }

/// An inline status message — the web `Alert`, and NOT a toast: it sits in the
/// layout where the thing it talks about is, stays until the app removes it,
/// and does not float above the page (that is `showLumoToast`). `title` is
/// REQUIRED here (optional on the web, where an alert may be body-only): an
/// unnamed message on a phone is a coloured rectangle. `description` is the
/// body, `actions` the controls under it.
///
/// **The live-region rule.** `isLive` is FALSE by default, and that default is
/// the contract, not an oversight: an alert that is already in the tree at the
/// first frame would be announced at load, out of context, ahead of the screen
/// the reader asked for — the same argument the web file makes for defaulting
/// `live="off"`. Set `isLive: true` ONLY when the alert APPEARS in response to
/// something that just happened (a submit that failed, a code that was
/// accepted) — i.e. when the widget is inserted, or its text replaced, by a
/// state change the reader caused. Flutter's `liveRegion` is a per-NODE flag
/// announcing that node's own label, so it is set on the title node and on the
/// description node — one announcement each, in reading order — not on a
/// wrapper (a wrapper has no label of its own to announce).
/// `SemanticsRole.alert`/`.status` are NOT used: the framework's role check
/// forbids a node from carrying the role and `liveRegion` at once, and the flag
/// is the half TalkBack and VoiceOver act on today (`toast.dart` made the same
/// call).
///
/// Semantics: the title is a HEADER (a divergence, stated: the web renders it
/// as a `<p>` so a transient message stays out of the document outline —
/// mobile has no such outline, and `header` is how the heading rotor finds the
/// message's summary line), the description its own node after it, the icon and
/// the tint decoration (`ExcludeSemantics`), the ✕ a named button at the inline
/// END. Nothing here truncates: the title and the description wrap, and the
/// actions are a `Wrap`, so a narrow screen grows the alert instead of eating
/// its words.
///
/// **The ✕'s hit area.** The web draws AND hits the dismiss at
/// `h-control-sm w-control-sm` — 29 logical px (`LumoControl.sm`), fine for a
/// pointer and half a finger on a phone. The DRAWN box stays 29, matching the
/// web exactly, so nothing about the resting or pressed look moves; the 44×44
/// minimum is a transparent tap surface CENTRED on it that OVERHANGS into the
/// alert's own 16px padding. That is why the ✕ is a `PositionedDirectional`
/// child of a `Stack` over the frame rather than a cell in the content row:
/// growing the target inflates neither the alert's height nor the text
/// column's width (the row keeps a same-width empty slot where the ✕ used to
/// sit, so wrapping is unchanged). The 44 box carries the name, the button
/// role and the tap, so explore-by-touch gets the whole target; the drawn
/// button inside is `ExcludeSemantics`'d and keeps the theme's press feedback.
///
/// Web props not carried: `live` as a three-value `"off" | "polite" |
/// "assertive"` (Flutter's semantics has ONE live flag — a polite/assertive
/// parameter would reach nothing, so it is a `bool`), and `className`.
/// `actions` is the addition the web deliberately does not have (there, an
/// action is CONTENT inside `children`; Dart has no `children` slot of
/// arbitrary markup here, so the slot is explicit).
class LumoAlert extends StatelessWidget {
  const LumoAlert({
    super.key,
    required this.title,
    this.description,
    this.tone = LumoAlertTone.accent,
    this.variant = LumoAlertVariant.subtle,
    this.icon,
    this.actions,
    this.onDismiss,
    this.dismissLabel,
    this.isLive = false,
  })  : assert(onDismiss == null || dismissLabel != null, 'A dismissible alert needs `dismissLabel` — an ✕ is not a name.'),
        assert(dismissLabel == null || onDismiss != null, '`dismissLabel` names a control that does not exist without `onDismiss`.');

  /// The summary line. REQUIRED, and announced as the alert's heading.
  final String title;

  /// The body of the message.
  final String? description;

  /// The tone default is `accent`, as on the web.
  final LumoAlertTone tone;
  final LumoAlertVariant variant;

  /// A leading glyph. DECORATIVE — the title says what the icon says.
  final Widget? icon;

  /// Controls under the body, usually `LumoButton`s — slots, not labels plus handlers.
  final List<Widget>? actions;

  /// Called when the reader dismisses the alert. Removing it is the caller's.
  final VoidCallback? onDismiss;

  /// Announced name of the ✕, e.g. «بستن». REQUIRED whenever `onDismiss` is set.
  final String? dismissLabel;

  /// Announce this message on arrival. See the docblock: true only for an alert
  /// that APPEARS in response to an action.
  final bool isLive;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final toneColour = switch (tone) {
      LumoAlertTone.neutral => c.fgMuted,
      LumoAlertTone.accent => c.accent,
      LumoAlertTone.positive => c.positive,
      LumoAlertTone.critical => c.critical,
      LumoAlertTone.caution => c.caution,
    };
    // `border-s-border-strong bg-surface-sunken` for neutral; the tone at /10
    // behind /25 for the rest — the tint vocabulary `badge.dart` uses.
    final neutral = tone == LumoAlertTone.neutral;
    final (Color fill, Color edge) = switch (variant) {
      LumoAlertVariant.subtle => neutral ? (c.surfaceSunken, c.border) : (toneColour.withValues(alpha: 0.10), toneColour.withValues(alpha: 0.25)),
      LumoAlertVariant.outline => (Colors.transparent, neutral ? c.borderStrong : toneColour),
    };
    // `border-s-4`: the tone at full strength on the reader's LEADING edge. Not
    // a `BorderDirectional.start` — a `BoxDecoration` refuses a border radius
    // when the sides differ — but the stripe `toast.dart` uses: the FIRST child
    // of a `Row`, which is the right-hand edge under fa-IR and the left-hand
    // one under en-US, with no side named anywhere.
    final lead = neutral ? c.borderStrong : toneColour;
    // The drawn ✕ is 29 (`LumoControl.sm` = the web's `h-control-sm`); the tap
    // surface is 44, so it overhangs by half the difference on every side.
    const drawn = LumoControl.sm;
    const target = 44.0;
    const overhang = (target - drawn) / 2;
    // What the ✕ used to occupy in the content row: its start gap plus its
    // drawn box. Held as an empty slot so the text column does not move.
    const slot = 12 + drawn;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      child: Stack(children: [
      Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: fill,
          borderRadius: BorderRadius.circular(LumoRadius.md),
          border: Border.all(color: edge),
        ),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ExcludeSemantics(child: Container(width: 4, color: lead)),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (icon != null)
                        ExcludeSemantics(
                          child: Padding(
                            padding: const EdgeInsetsDirectional.only(end: 12, top: 2),
                            child: IconTheme(data: IconThemeData(size: 20, color: neutral ? c.fgMuted : toneColour), child: icon!),
                          ),
                        ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Semantics(
                              header: true,
                              liveRegion: isLive,
                              child: Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, height: 1.5, color: c.fg)),
                            ),
                            if (description != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Semantics(
                                  liveRegion: isLive,
                                  child: Text(description!, style: TextStyle(fontSize: 14, height: 1.6, color: c.fgMuted)),
                                ),
                              ),
                            if (actions != null && actions!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 12),
                                child: Wrap(spacing: 8, runSpacing: 8, children: actions!),
                              ),
                          ],
                        ),
                      ),
                      // The ✕ itself is the Stack child below, so its 44×44
                      // target can overhang the padding; this holds the width
                      // it used to take so the text column does not move.
                      if (onDismiss != null) const SizedBox(width: slot),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      if (onDismiss != null)
        PositionedDirectional(
          // 1 for the border plus 16 of padding is where the drawn box began;
          // back off by the overhang so it still lands exactly there.
          top: 1 + 16 - overhang,
          end: 1 + 16 - overhang,
          child: Semantics(
            label: dismissLabel!,
            button: true,
            onTap: onDismiss,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              excludeFromSemantics: true,
              onTap: onDismiss,
              child: SizedBox(
                width: target,
                height: target,
                child: Center(
                  // Silent: the name is on the 44 node above, announced ONCE.
                  child: ExcludeSemantics(
                    child: LumoIconButton(
                      label: dismissLabel!,
                      size: LumoButtonSize.sm,
                      onPressed: onDismiss,
                      child: Icon(Icons.close, size: 16, color: c.fgMuted),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ]),
    );
  }
}
