import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'progress.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// Where a file is in its transfer — the web's `FileUploadLifecycle.status`
/// (`queued`/`uploading`/`success`/`error`) under the names the web
/// `Attachment` uses for the same four states.
enum LumoAttachmentStatus { pending, uploading, done, failed }

/// One file in a list — the web `Attachment` / `FileUploadItem` as DATA, not a
/// widget tree, because a Flutter consumer holds a `List` in state and rebuilds
/// from it.
///
/// `sizeLabel` is PRE-FORMATTED: the web's `formatFileSize(bytes, locale)`
/// needs `Intl.NumberFormat`'s `style: "unit"`, which Dart's `intl` does not
/// carry — so the app formats («۱٫۲ مگابایت») and this library never renders a
/// raw number. `statusLabel` is REQUIRED for every state except `done`: the
/// state must be in WORDS, since a spinner and a red border say nothing to a
/// reader (WCAG 1.4.1). `progress` is the fraction 0..1 (null while uploading =
/// indeterminate) and `progressLabel` is that fraction as the app formatted it
/// («۴۵٪»).
class LumoAttachment {
  const LumoAttachment({
    required this.name,
    this.sizeLabel,
    this.status = LumoAttachmentStatus.done,
    this.statusLabel,
    this.progress,
    this.progressLabel,
    this.errorMessage,
  })  : assert(status == LumoAttachmentStatus.done || statusLabel != null,
            'Every state but `done` needs a `statusLabel` — the state in words, e.g. «در حال بارگذاری».'),
        assert(progress == null || (progress >= 0 && progress <= 1), '`progress` is a fraction 0..1, or null.');

  /// The file's own name, exactly as the picker reported it.
  final String name;

  /// The size, ALREADY formatted, e.g. «۱٫۲ مگابایت».
  final String? sizeLabel;

  /// Where this file is in the upload lifecycle.
  final LumoAttachmentStatus status;

  /// What `status` MEANS. REQUIRED unless `status` is `done`.
  final String? statusLabel;

  /// Fraction complete, 0..1. `null` while `uploading` = indeterminate.
  final double? progress;

  /// `progress` as the app formatted it, e.g. «۴۵٪». Announced with the name.
  final String? progressLabel;

  /// Why it failed, in words. Shown and announced when `status` is `failed`.
  final String? errorMessage;
}

/// One file's row — the web `FileUploadItem` / `Attachment` (`row` variant).
/// Usable on its own: an attachment on a sent message is not inside a picker.
///
/// Semantics: the row is ONE named node — name, size, state, value, error, in
/// that order — with every visible copy excluded, plus the ✕ as its own node
/// underneath (`explicitChildNodes`). The progress bar is DECORATION here
/// (`ExcludeSemantics`): the row's own name already carries the state and the
/// value, and a second announcing node per row makes a five-file list
/// unlistenable. `onRemove` and `removeLabel` are ONE decision (asserted) — an
/// ✕ has no name of its own.
class LumoAttachmentTile extends StatelessWidget {
  const LumoAttachmentTile({super.key, required this.file, this.onRemove, this.removeLabel, this.isDisabled = false})
      : assert(onRemove == null || removeLabel != null,
            'A removable attachment needs a `removeLabel` — name the file in the phrase, e.g. «حذف گزارش.pdf».');

  /// The attachment this tile shows.
  final LumoAttachment file;

  /// Drop this file.
  final VoidCallback? onRemove;

  /// Announced name of the ✕. REQUIRED when `onRemove` is set.
  final String? removeLabel;

  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    final failed = file.status == LumoAttachmentStatus.failed;
    final announced = <String>[
      file.name,
      if (file.sizeLabel != null) file.sizeLabel!,
      if (file.statusLabel != null) file.statusLabel!,
      if (file.progressLabel != null) file.progressLabel!,
      if (file.errorMessage != null) file.errorMessage!,
    ].join('\n');

    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: announced,
      child: Opacity(
        opacity: isDisabled ? 0.5 : 1,
        child: Container(
          // `ps-3 pe-1`: room for the name at the reading edge, tight against the ✕. Both swap under RTL.
          //
          // The VERTICAL padding is not here but on the two content children:
          // the ✕ needs 44 logical px of hit area (it draws 28, as `size-7` on
          // the web) and it takes them out of this padding rather than adding
          // to the row — measured, the tile is the same 46 px tall with the ✕
          // and the same 38 without it as when the ✕ was a 28-px box inside
          // 8 px of padding. Same for the inline end: the ✕'s own transparent
          // inset replaces the `pe-1`, so the name keeps its width to the mm.
          padding: EdgeInsetsDirectional.only(start: 12, end: onRemove == null ? 4 : 0),
          decoration: BoxDecoration(
            color: c.surface,
            border: Border.all(color: failed ? c.critical.withValues(alpha: 0.4) : c.border),
            borderRadius: BorderRadius.circular(LumoRadius.md),
          ),
          child: LayoutBuilder(builder: (context, constraints) {
            final fit = _fit(context, constraints.maxWidth);
            return Row(
            children: [
              if (fit.showIcon) ...[
                ExcludeSemantics(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Icon(
                      failed ? Icons.error_outline : Icons.attach_file,
                      size: 16,
                      color: failed ? c.critical : c.fgMuted,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: ExcludeSemantics(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        spacing: 12,
                        children: [
                          Expanded(
                            child: Text(
                              file.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              // A file name is the classic mixed-script run; first-strong is the only rule that gets both right.
                              textDirection: _firstStrong(file.name),
                              style: TextStyle(fontSize: 14, color: c.fg),
                            ),
                          ),
                          if (fit.showSize)
                            Text(file.sizeLabel!, style: TextStyle(fontSize: 12, color: c.fgMuted)),
                        ],
                      ),
                      if (file.status == LumoAttachmentStatus.uploading)
                        Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: LumoProgress(
                            label: file.statusLabel!,
                            value: file.progress,
                            valueLabel: file.progressLabel,
                            size: LumoProgressSize.sm,
                          ),
                        ),
                      if (file.statusLabel != null && file.status != LumoAttachmentStatus.uploading)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            file.statusLabel!,
                            style: TextStyle(fontSize: 12, color: failed ? c.critical : c.fgMuted),
                          ),
                        ),
                      if (file.errorMessage != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(file.errorMessage!, style: TextStyle(fontSize: 12, color: c.critical)),
                        ),
                    ],
                  ),
                ),
                ),
              ),
              if (onRemove != null)
                Semantics(
                  container: true,
                  button: true,
                  enabled: !isDisabled,
                  label: removeLabel,
                  child: Tooltip(
                    message: removeLabel!,
                    excludeFromSemantics: true,
                    child: InkWell(
                      onTap: isDisabled ? null : onRemove,
                      borderRadius: BorderRadius.circular(LumoRadius.sm),
                      // `LumoControl.lg` of HIT AREA around the web's own ✕:
                      // the web draws `IconButton size="sm"` — `LumoControl.sm`
                      // square with a 16-px glyph — and that is what is painted
                      // here (it was a 28-px box with a 14-px glyph, off the
                      // reference on both numbers). The 44 is the touch target,
                      // and its extra px come out of the row's own padding (see
                      // the Container above), so the tile does not grow.
                      child: SizedBox(
                        width: LumoControl.lg,
                        height: LumoControl.lg,
                        child: Center(
                          child: SizedBox(
                            width: LumoControl.sm,
                            height: LumoControl.sm,
                            child: ExcludeSemantics(child: Icon(Icons.close, size: 16, color: c.fgMuted)),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          );
          }),
        ),
      ),
    );
  }

  /// What survives this width. The paperclip goes first — it survives only
  /// while the name still fits whole beside it; the size goes next — it
  /// survives only while it leaves the name half the row. Everything shows when
  /// the width is unbounded: there is nothing to fit into.
  ({bool showIcon, bool showSize}) _fit(BuildContext context, double maxWidth) {
    final hasSize = file.sizeLabel != null;
    if (!maxWidth.isFinite) return (showIcon: true, showSize: hasSize);
    final base = DefaultTextStyle.of(context).style;
    double measure(String text, double size) => (TextPainter(
          text: TextSpan(text: text, style: base.copyWith(fontSize: size)),
          textDirection: Directionality.of(context),
          maxLines: 1,
        )..layout())
        .width;
    // The row's own fixed furniture: `ps-3` plus either the `pe-1` (no ✕) or
    // the ✕'s 44-px tap box, which absorbs that padding and the gap — 56 either
    // way, exactly what the 28-px ✕ + gap + `pe-1` came to before.
    final free = maxWidth - 16 - (onRemove == null ? 0 : 40);
    final name = measure(file.name, 14);
    final size = hasSize ? measure(file.sizeLabel!, 12) + 12 : 0.0;
    return (
      showIcon: name + size + 28 <= free,
      showSize: hasSize && size <= free / 2,
    );
  }
}

/// A file picker and the list of what was chosen — the web `FileUpload` plus
/// `FileUploadList`.
///
/// **There is no drop zone, and no plugin.** A phone has nothing to drag from,
/// so the web's four drag handlers, its clipboard path and its hidden
/// `<input type="file">` have no counterpart: what is left is a NAMED GROUP
/// (`label`), one NAMED BUTTON (`browseLabel`) and the list. And this library
/// takes no picker dependency — `image_picker`, `file_picker` and the platform
/// channels are the APP's choice, not a component library's, so `onBrowse` is
/// REQUIRED and the app opens whatever picker it owns, then hands the results
/// back as `files`. The dashed frame is kept because it is what an upload slot
/// looks like, not because anything can be dropped on it.
///
/// `onRemove` takes the INDEX (a Flutter consumer holds a `List` and calls
/// `removeAt`); `removeLabel` builds each ✕'s name from that file's own name,
/// as on the web — a function, because Persian word order is not English with
/// the words swapped. The two are one decision (asserted).
class LumoFileUpload extends StatelessWidget {
  const LumoFileUpload({
    super.key,
    required this.label,
    required this.browseLabel,
    required this.onBrowse,
    this.description,
    this.files = const <LumoAttachment>[],
    this.onRemove,
    this.removeLabel,
    this.maxFilesLabel,
    this.isDisabled = false,
  }) : assert((onRemove == null) == (removeLabel == null),
            'onRemove and removeLabel are one decision: both or neither.');

  /// Announced name of the upload group AND its visible title, e.g. «تصویر کارت ملی». REQUIRED.
  final String label;

  /// The hint under the title — accepted formats, a size limit.
  final String? description;

  /// Visible and announced text of the button that opens the app's picker. REQUIRED.
  final String browseLabel;

  /// Open the picker. REQUIRED — the app owns it; this library ships no plugin.
  final VoidCallback onBrowse;

  /// What has been chosen so far.
  final List<LumoAttachment> files;

  /// Drop the file at this index.
  final void Function(int index)? onRemove;

  /// Builds each ✕'s announced name from that file's name. REQUIRED with `onRemove`.
  final String Function(String name)? removeLabel;

  /// A PRE-FORMATTED count line, e.g. «حداکثر ۵ پرونده».
  final String? maxFilesLabel;

  /// Whether the control is disabled.
  final bool isDisabled;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Semantics(
          container: true,
          // The group carries the name; the button and the hint stay their own nodes under it.
          explicitChildNodes: true,
          label: label,
          child: Opacity(
            opacity: isDisabled ? 0.5 : 1,
            child: CustomPaint(
              painter: _DashedFrame(colour: c.borderControl, radius: LumoRadius.lg),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(LumoRadius.lg)),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  spacing: 10,
                  children: [
                    ExcludeSemantics(child: Icon(Icons.cloud_upload_outlined, size: 28, color: c.fgMuted)),
                    // Excluded: the group's node above already announces it.
                    ExcludeSemantics(
                      child: Text(
                        label,
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg),
                      ),
                    ),
                    if (description != null)
                      Text(
                        description!,
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, height: 1.6, color: c.fgMuted),
                      ),
                    _BrowseButton(label: browseLabel, isDisabled: isDisabled, onPressed: onBrowse),
                  ],
                ),
              ),
            ),
          ),
        ),
        for (var i = 0; i < files.length; i++)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: LumoAttachmentTile(
              file: files[i],
              isDisabled: isDisabled,
              onRemove: onRemove == null ? null : () => onRemove!(i),
              removeLabel: removeLabel?.call(files[i].name),
            ),
          ),
        if (maxFilesLabel != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(maxFilesLabel!, style: TextStyle(fontSize: 11, color: c.fgSubtle)),
          ),
      ],
    );
  }
}

/// The picker trigger. Its own widget rather than `LumoButton` so the group's
/// `explicitChildNodes` sees one named button node and nothing nested.
///
/// It DRAWS the web's small pill (`LumoControl.sm`, the `size="sm"` button of
/// the web `FileUpload`) but it HITS `LumoControl.lg`: a stated mobile
/// deviation, not an accident — this is the only control of the upload slot and
/// a 29-px-tall target is under every touch guideline. The pill's own geometry
/// is untouched; the extra height is transparent, so the panel is 15 px taller
/// and nothing inside it moved.
class _BrowseButton extends StatelessWidget {
  const _BrowseButton({required this.label, required this.isDisabled, required this.onPressed});
  final String label;
  final bool isDisabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final c = LumoScope.of(context).colours;
    return Semantics(
      container: true,
      button: true,
      enabled: !isDisabled,
      label: label,
      child: InkWell(
        onTap: isDisabled ? null : onPressed,
        borderRadius: BorderRadius.circular(LumoRadius.md),
        child: SizedBox(
          height: LumoControl.lg,
          child: Center(
            child: Container(
              height: LumoControl.sm,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: c.surface,
                border: Border.all(color: c.borderControl),
                borderRadius: BorderRadius.circular(LumoRadius.md),
              ),
              child: ExcludeSemantics(
                child: Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.fg)),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The web's `border-2 border-dashed`. Flutter's `Border` has no dash pattern,
/// so the frame is painted: nothing here is directional (a dashed rounded rect
/// is symmetric under mirroring), so the locale does not reach it.
class _DashedFrame extends CustomPainter {
  const _DashedFrame({required this.colour, required this.radius});
  final Color colour;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()..addRRect(RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius)));
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = colour;
    const dash = 6.0;
    const gap = 4.0;
    for (final metric in path.computeMetrics()) {
      var start = 0.0;
      while (start < metric.length) {
        canvas.drawPath(metric.extractPath(start, math.min(start + dash, metric.length)), paint);
        start += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(_DashedFrame old) => old.colour != colour || old.radius != radius;
}

/// First-strong direction of a string — the `dir="auto"` the web `AttachmentName`
/// relies on. `null` when the run has no strong character either way, which lets
/// the inherited direction stand.
TextDirection? _firstStrong(String value) {
  for (final rune in value.runes) {
    // Hebrew, Arabic, Syriac, Thaana, N'Ko, Samaritan, Arabic Supplement/Extended and their presentation forms.
    if ((rune >= 0x0590 && rune <= 0x08FF) || (rune >= 0xFB1D && rune <= 0xFDFF) || (rune >= 0xFE70 && rune <= 0xFEFF)) {
      return TextDirection.rtl;
    }
    if ((rune >= 0x0041 && rune <= 0x005A) || (rune >= 0x0061 && rune <= 0x007A) || (rune >= 0x00C0 && rune <= 0x02B8)) {
      return TextDirection.ltr;
    }
  }
  return null;
}
