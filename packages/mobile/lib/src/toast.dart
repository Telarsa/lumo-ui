import 'dart:async';
import 'package:flutter/material.dart';
import 'button.dart';
import 'scope.dart';
import 'tokens.g.dart';

/// The notification's semantic colour — the tone stripe on the reader's leading
/// edge, as `alert.tsx` and the web toast. DECORATION (WCAG 1.4.1): put the word
/// in the message.
enum LumoToastTone { neutral, positive, critical, caution }

/// A handle on one shown toast: `close()` dismisses it early (an Undo that
/// succeeded, a retry that started).
class LumoToastHandle {
  LumoToastHandle._(this._close);
  final VoidCallback _close;
  bool _closed = false;
  bool get isClosed => _closed;
  void close() {
    if (_closed) return;
    _closed = true;
    _close();
  }
}

/// A transient notification: `message` and `closeLabel` REQUIRED (an ✕ is not
/// a name); optional `actionLabel` + `onAction` (Undo, Retry); the message node
/// is a LIVE REGION so the reader announces it on arrival; auto-dismissed
/// after `duration` (`Duration.zero` = stays until closed — the web's
/// `timeout: 0`); the ✕ at the inline END.
///
/// **The default `duration` deviates from the web on purpose.** `toast.tsx`
/// defaults `timeout: addOptions?.timeout ?? 0` — never auto-dismiss, citing
/// WCAG 2.2.1 — because a browser toast sits beside a pointer and a keyboard.
/// Here it is four seconds, the platform's own convention for a transient
/// notification on a phone, where nothing else acknowledges the action. The
/// trade is the CALLER's to make: a toast carrying an `actionLabel` a reader
/// must reach should be passed `Duration.zero` and closed through its
/// `LumoToastHandle`, which is what the criterion asks for. The default is a
/// default, not the contract.
///
/// The ✕ carries `LumoIconButton`'s own 44×44 hit ring (measured). The ACTION,
/// a short `LumoButton`, is 29 logical px tall and is NOT rescued here — a
/// per-widget ring is exactly the duplication `button.dart` centralised.
///
/// One `OverlayEntry` per root `Overlay` (no `LumoToastHost` to mount: the
/// `MaterialApp`'s navigator overlay is the host, found from `context`), holding
/// every live toast in a column at the bottom-END of the safe area (the
/// bottom-LEFT corner on a Persian screen — `AlignmentDirectional`). STACKING:
/// newest nearest the edge, older ones above it; at most three visible, the
/// oldest beyond three closes. Nothing here blocks pointer events outside the
/// toasts themselves. A toast is built above the caller's `LumoScope`, so the
/// scope is captured at the call and re-provided in the entry.
LumoToastHandle showLumoToast(BuildContext context, {required String message, required String closeLabel, LumoToastTone tone = LumoToastTone.neutral, Duration duration = const Duration(seconds: 4), String? actionLabel, VoidCallback? onAction}) {
  assert(actionLabel != null || onAction == null, 'An action needs its announced label — pass actionLabel with onAction.');
  final scope = LumoScope.of(context);
  final overlay = Overlay.of(context, rootOverlay: true);
  final host = _LumoToastHost.of(overlay);
  final toast = _LumoToast(scope: scope, message: message, closeLabel: closeLabel, tone: tone, actionLabel: actionLabel, onAction: onAction);
  return host.add(toast, duration);
}

class _LumoToast {
  _LumoToast({required this.scope, required this.message, required this.closeLabel, required this.tone, required this.actionLabel, required this.onAction});
  final LumoScopeData scope;
  final String message;
  final String closeLabel;
  final LumoToastTone tone;
  final String? actionLabel;
  final VoidCallback? onAction;
  Timer? timer;
  late final LumoToastHandle handle;
}

/// The per-overlay stack. Keyed weakly by the OverlayState — no global mutable
/// registry outlives the app's overlay.
class _LumoToastHost {
  _LumoToastHost(this.overlay);
  static final _hosts = Expando<_LumoToastHost>();
  static _LumoToastHost of(OverlayState overlay) => _hosts[overlay] ??= _LumoToastHost(overlay);
  static const _maxVisible = 3;

  final OverlayState overlay;
  final List<_LumoToast> toasts = [];
  OverlayEntry? entry;

  LumoToastHandle add(_LumoToast toast, Duration duration) {
    toast.handle = LumoToastHandle._(() => remove(toast));
    toasts.add(toast);
    while (toasts.length > _maxVisible) {
      toasts.first.handle.close();
    }
    if (duration > Duration.zero) toast.timer = Timer(duration, toast.handle.close);
    if (entry == null) {
      entry = OverlayEntry(builder: _build);
      overlay.insert(entry!);
    } else {
      entry!.markNeedsBuild();
    }
    return toast.handle;
  }

  void remove(_LumoToast toast) {
    toast.timer?.cancel();
    if (!toasts.remove(toast)) return;
    if (toasts.isEmpty) {
      entry?.remove();
      entry?.dispose();
      entry = null;
    } else {
      entry?.markNeedsBuild();
    }
  }

  Widget _build(BuildContext context) {
    // The entry is above every LumoScope: the newest toast's scope sets the direction for the stack.
    return toasts.last.scope.wrap(
      SafeArea(
        child: Align(
          alignment: AlignmentDirectional.bottomEnd,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 384),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 8,
                // Oldest first = furthest from the edge; the newest is the last child, nearest the edge.
                children: [for (final t in toasts) t.scope.wrap(_LumoToastTile(toast: t))],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LumoToastTile extends StatelessWidget {
  const _LumoToastTile({required this.toast});
  final _LumoToast toast;

  @override
  Widget build(BuildContext context) {
    final scope = LumoScope.of(context);
    final c = scope.colours;
    final stripe = switch (toast.tone) {
      LumoToastTone.neutral => c.borderStrong,
      LumoToastTone.positive => c.positive,
      LumoToastTone.critical => c.critical,
      LumoToastTone.caution => c.caution,
    };
    // `LumoShadow.overlay`, not a hand-picked `elevation: 4` over `c.scrim`:
    // `scrim` is the MODAL BACKDROP's role, and one shadow spelled once was the
    // same in BOTH schemes — on a dark page a black shadow at the light
    // scheme's alpha is close to painting nothing. The web says
    // `shadow-overlay` on the toast.
    return DecoratedBox(
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(LumoRadius.md), boxShadow: LumoShadow.overlay(scope.brightness)),
      child: Material(
      color: c.surface,
      surfaceTintColor: Colors.transparent,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(LumoRadius.md),
        side: BorderSide(color: c.border),
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // The tone stripe: first in the Row = the reader's leading edge (`border-s-4`).
            ExcludeSemantics(child: Container(width: 4, color: stripe)),
            Expanded(
              child: Padding(
                padding: const EdgeInsetsDirectional.only(start: 12, top: 12, bottom: 12, end: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // The live region IS the message node — announced once, on arrival.
                    Expanded(
                      child: Semantics(
                        liveRegion: true,
                        container: true,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          child: Text(
                            toast.message,
                            // `font-semibold` — the web toast title's weight.
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: c.fg),
                          ),
                        ),
                      ),
                    ),
                    if (toast.actionLabel != null) ...[
                      const SizedBox(width: 4),
                      LumoButton(
                        variant: LumoButtonVariant.ghost,
                        size: LumoButtonSize.sm,
                        onPressed: () {
                          toast.onAction?.call();
                          toast.handle.close();
                        },
                        child: Text(toast.actionLabel!, style: TextStyle(color: c.accent)),
                      ),
                    ],
                    const SizedBox(width: 4),
                    LumoIconButton(
                      label: toast.closeLabel,
                      size: LumoButtonSize.sm,
                      onPressed: toast.handle.close,
                      child: Icon(Icons.close, size: 16, color: c.fgMuted),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }
}
