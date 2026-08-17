import 'dart:js_interop';
import 'dart:js_interop_unsafe';

/// The one piece of JS interop in the gallery, given the exact shape the docs
/// page listens for:
///
///     window.parent.postMessage(
///       {type: 'lumo-demo-height', demo: '<id>', height: <px>}, '*')
///
/// `'*'` as the target origin is deliberate: the page embedding this frame may
/// be served from localhost, from the static export, or from a preview host,
/// and the message carries no secret — only a number and the id already in the
/// URL. The page is expected to check `event.data.type` before believing it.
///
/// NO `isA<JSObject>()` GUARD on the parent, and that is load-bearing. In an
/// iframe `window.parent` belongs to a DIFFERENT JavaScript realm, so
/// `isA<JSObject>()` compiles to an `instanceof` against THIS realm's `Object`
/// and answers false — which is exactly the case this function exists for. The
/// first version of this file had that guard and silently posted nothing from
/// inside every iframe on the docs site; the browser check is what found it.
/// A null check is the only check a cross-realm reference can honestly carry.
void postDemoHeight(String demoId, double height) {
  final parent = globalContext['parent'] as JSObject?;
  if (parent == null) return;
  final message = JSObject()
    ..['type'] = 'lumo-demo-height'.toJS
    ..['demo'] = demoId.toJS
    ..['height'] = height.toJS;
  parent.callMethod('postMessage'.toJS, message, '*'.toJS);
}
