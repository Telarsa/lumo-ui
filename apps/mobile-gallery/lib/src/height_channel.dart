// The seam between the gallery and the page that frames it.
//
// The implementation is `dart:js_interop`, which exists only on web. A Flutter
// test runs on the VM, so the stub is what the tests get: the same signature,
// doing nothing. Without this split, `flutter test` cannot compile the app at
// all — and a gallery whose contract cannot be tested is a gallery nobody can
// trust.
export 'height_channel_stub.dart'
    if (dart.library.js_interop) 'height_channel_web.dart';
