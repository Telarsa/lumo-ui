#!/usr/bin/env node
/**
 * gate:flutter — `flutter analyze` + `flutter test` for packages/mobile (Lumo
 * UI Mobile) AND for apps/mobile-example, its consumer.
 *
 * Flutter is found by `scripts/lib/flutter.mjs`. A machine without
 * Flutter FAILS this gate unless LUMO_SKIP_FLUTTER=1 is set explicitly — a
 * skipped gate must be a visible decision, never a silent default.
 */
import { join } from "node:path";

import { SEARCHED, findFlutter, flutterRunner } from "./lib/flutter.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const PKG = join(ROOT, "packages", "mobile");
/**
 * The example is graded too, and it is the more important half.
 *
 * This used to be `apps/mobile-gallery`: 120 demos of the widgets Lumo shipped,
 * graded by rules written beside those same widgets. That made the gate
 * circular — a defect class neither the rules nor the demos had thought of was
 * invisible to both, which is exactly what happened, and it took pointing the
 * grader at a real consumer app to find four grader bugs in an afternoon.
 *
 * `apps/mobile-example` is a MATERIAL app that consumes this package, the way
 * `apps/website` is a shadcn app that consumes the web packages. The rules now
 * grade something none of their authors wrote.
 */
const EXAMPLE = join(ROOT, "apps", "mobile-example");
const sdk = findFlutter();
if (!sdk) {
  if (process.env.LUMO_SKIP_FLUTTER === "1") { console.log("  flutter: SKIPPED (LUMO_SKIP_FLUTTER=1) — packages/mobile was NOT analysed or tested on this machine"); process.exit(0); }
  console.error(`  flutter: no Flutter SDK found (${SEARCHED}). Install it, or set LUMO_SKIP_FLUTTER=1 and say so in the PR.`);
  process.exit(1);
}
const run = flutterRunner(sdk, PKG);
if (run(["pub", "get"]) !== 0) process.exit(1);
if (run(["analyze", "--no-pub"]) !== 0) { console.error("  flutter: analyze failed"); process.exit(1); }
if (run(["test", "--no-pub", "--reporter", "compact"]) !== 0) { console.error("  flutter: tests failed"); process.exit(1); }
console.log("  flutter: packages/mobile analysed and tested");

const runExample = flutterRunner(sdk, EXAMPLE);
if (runExample(["pub", "get"]) !== 0) process.exit(1);
if (runExample(["analyze", "--no-pub"]) !== 0) { console.error("  flutter: example analyze failed"); process.exit(1); }
if (runExample(["test", "--no-pub", "--reporter", "compact"]) !== 0) { console.error("  flutter: example tests failed (semantics grading, direction, native digits)"); process.exit(1); }
console.log("  flutter: apps/mobile-example analysed and graded (a Material consumer, in fa and en)");
