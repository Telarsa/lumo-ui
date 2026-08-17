import 'package:flutter/material.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// Which side of the CONVERSATION a message belongs to — never a side of the
/// screen. The web's `sent`/`received`, renamed to the pair that cannot be read
/// as a screen edge: `incoming` sits at the reading START, `outgoing` at the
/// reading END. In Persian that puts the OTHER person on the right and you on
/// the left, which is what a Persian chat app looks like.
enum LumoMessageSide { incoming, outgoing }

/// Delivery state of a message. Colour and glyph are never the only carrier
/// (WCAG 1.4.1): `statusLabel` says it in words and is what gets announced.
enum LumoMessageStatus { sending, sent, read }

/// One message in a transcript — the web `Message` + `Bubble` composed into a
/// single widget, because the parts only ever appear together and every
/// compositional seam on the web (`MessageBody`, `MessageHeader`,
/// `MessageTime`) is a chance to put the bubble on the wrong side.
///
/// * `text` is the usual case; `child` is the escape hatch for rich content
///   (a photo, a quoted card). One of the two is REQUIRED (asserted).
/// * `senderLabel` is REQUIRED for an incoming message: a reader hearing a
///   transcript needs to know who is speaking, and «he said»/«she said» is not
///   derivable from a bubble's colour. An outgoing message is the reader's own,
///   so it needs no name.
/// * `timeLabel` is a PRE-FORMATTED string — the app ran `formatLumoDate` /
///   `formatNumber` and chose Jalali or Gregorian; this widget never sees a
///   `DateTime` (the web's `MessageTime` takes a string for the same reason).
/// * `status` needs a `statusLabel` (asserted): «در حال ارسال»، «ارسال شد»،
///   «خوانده شد».
/// * `avatar` is DECORATIVE here — `senderLabel` already names the speaker, so
///   the avatar's own name would be announced twice; it is excluded.
/// * `isSystem` is the centred notice («این گفت‌وگو رمزنگاری شده است») — it
///   ignores `side` and takes no sender.
///
/// Geometry: the row is a `Row` whose children are REVERSED for an outgoing
/// message (the web's `flex-row-reverse` — flow order, not physical order), the
/// body column aligns to `CrossAxisAlignment.start`/`.end` (which resolve
/// against `Directionality`), and the tail is a `BorderRadiusDirectional`
/// corner at the bubble's own block-end side. Every one of those mirrors with
/// the locale; nothing here knows the words "left" or "right".
///
/// Semantics: the whole message is ONE node (`MergeSemantics`) whose name is
/// sender, then text, then time, then status — so a screen reader walking the
/// transcript gets a conversation, not four fragments per line. That also means
/// `child` must be CONTENT, not controls: a button inside would be absorbed
/// into the message's node.
class LumoMessage extends StatelessWidget {
  const LumoMessage({
    super.key,
    required this.side,
    this.text,
    this.child,
    this.senderLabel,
    this.timeLabel,
    this.status,
    this.statusLabel,
    this.avatar,
    this.isSystem = false,
  })  : assert(text != null || child != null, 'A message needs `text`, or a `child` for rich content.'),
        assert(isSystem || side == LumoMessageSide.outgoing || senderLabel != null,
            'An incoming message needs a `senderLabel` — who said it, announced before the text.'),
        assert(status == null || statusLabel != null,
            'A `status` needs a `statusLabel` — the delivery state in words, e.g. «خوانده شد».');

  /// Whose message this is. REQUIRED, for the reason the web's `variant` is.
  final LumoMessageSide side;

  /// The message text. Required unless `child` is given.
  final String? text;

  /// Rich content instead of `text`. Content only — see the class docblock.
  final Widget? child;

  /// Who said it. REQUIRED for an incoming message.
  final String? senderLabel;

  /// The timestamp AS THE APP FORMATTED IT, e.g. «۱۴:۰۵». Never a `DateTime`.
  final String? timeLabel;

  /// Delivery state of the message.
  final LumoMessageStatus? status;

  /// What `status` MEANS, in words. REQUIRED when `status` is set.
  final String? statusLabel;

  /// The sender's picture. Decorative — `senderLabel` is the name.
  final Widget? avatar;

  /// A centred notice rather than a bubble; `side` and `senderLabel` do not apply.
  final bool isSystem;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    if (isSystem) {
      return MergeSemantics(
        child: Semantics(
          container: true,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Center(
              child: Container(
                constraints: const BoxConstraints(maxWidth: 320),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(color: c.surfaceSunken, borderRadius: BorderRadius.circular(LumoRadius.full)),
                child: child ??
                    Text(text!, textAlign: TextAlign.center, style: TextStyle(fontSize: 12, height: 1.5, color: c.fgMuted)),
              ),
            ),
          ),
        ),
      );
    }

    final outgoing = side == LumoMessageSide.outgoing;
    final fg = outgoing ? c.accentFg : c.fg;
    // `rounded-2xl` on the web, and now a token on both platforms: the web was
    // getting 1rem from Tailwind's default because nothing mapped `--radius-2xl`,
    // so this file carried the number by hand. The joined corner is the web's
    // `rounded-*-md` on the bubble's OWN side — `ee` for sent, `es` for received
    // — which is 8, not the 4 this line used to hard-code against its own
    // comment: the grouped corner was half as round as the web's.
    const big = Radius.circular(LumoRadius.xxl);
    const tail = Radius.circular(LumoRadius.md);

    final body = LayoutBuilder(builder: (context, constraints) {
      // `max-w-[85%]` — a bubble never fills the row, so the side it hugs stays legible.
      final maxWidth = constraints.maxWidth.isFinite ? constraints.maxWidth * 0.85 : double.infinity;
      return Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: outgoing ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          if (senderLabel != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(senderLabel!, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: c.fgMuted)),
            ),
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: maxWidth),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: outgoing ? c.accent : c.surfaceSunken,
                  borderRadius: BorderRadiusDirectional.only(
                    topStart: big,
                    topEnd: big,
                    bottomStart: outgoing ? big : tail,
                    bottomEnd: outgoing ? tail : big,
                  ),
                ),
                child: DefaultTextStyle.merge(
                  style: TextStyle(fontSize: 14, height: 1.625, color: fg),
                  // `TextAlign.start`: the text reads from the reading edge whichever side the bubble hugs.
                  textAlign: TextAlign.start,
                  child: child ?? Text(text!),
                ),
              ),
            ),
          ),
          if (timeLabel != null || status != null)
            Padding(
              padding: const EdgeInsetsDirectional.only(top: 2, start: 4, end: 4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                spacing: 4,
                children: [
                  if (timeLabel != null) Text(timeLabel!, style: TextStyle(fontSize: 11, color: c.fgSubtle)),
                  if (status != null)
                    // Named, so the tick is never the only carrier of "read".
                    Semantics(
                      label: statusLabel,
                      child: Icon(
                        switch (status!) {
                          LumoMessageStatus.sending => Icons.schedule,
                          LumoMessageStatus.sent => Icons.check,
                          LumoMessageStatus.read => Icons.done_all,
                        },
                        size: 13,
                        color: status == LumoMessageStatus.read ? c.accent : c.fgSubtle,
                      ),
                    ),
                ],
              ),
            ),
        ],
      );
    });

    final children = <Widget>[
      // Excluded: `senderLabel` already names the speaker, and an avatar carries its own.
      if (avatar != null) ExcludeSemantics(child: avatar!),
      Expanded(child: body),
    ];

    return MergeSemantics(
      child: Semantics(
        container: true,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          spacing: 8,
          // Flow order, not physical order — the web's `flex-row-reverse`.
          children: outgoing ? children.reversed.toList() : children,
        ),
      ),
    );
  }
}

/// A day's worth of messages under a separator — the web `MessageGroup` (the
/// `gap-4` column) plus the date chip mobile transcripts always have and the
/// web leaves to the app. `dateLabel` is REQUIRED and PRE-FORMATTED: only the
/// app knows whether «۲۶ مرداد» or «Today» is right, and `formatLumoDate`
/// already picks the calendar from the locale.
///
/// The separator is a header node, so a reader can jump between days; the group
/// itself adds no node of its own — an unnamed container would be one more
/// thing to walk past, and every child is already its own message node.
class LumoMessageGroup extends StatelessWidget {
  const LumoMessageGroup({super.key, required this.dateLabel, required this.children});

  /// The day, as the app formatted it. Announced as a heading.
  final String dateLabel;

  /// The messages of that day.
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Center(
            child: Semantics(
              header: true,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: c.surfaceSunken, borderRadius: BorderRadius.circular(LumoRadius.full)),
                child: Text(dateLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: c.fgMuted)),
              ),
            ),
          ),
        ),
        for (var i = 0; i < children.length; i++)
          Padding(padding: EdgeInsets.only(top: i == 0 ? 0 : 16), child: children[i]),
      ],
    );
  }
}
