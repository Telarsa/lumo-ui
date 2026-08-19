#!/usr/bin/env node
/**
 * gate:flutter — `flutter analyze` + `flutter test` for packages/mobile (Lumo
 * UI Mobile, decision §30) AND for apps/mobile-gallery. The semantics-tree tests
 * in the library are the mobile counterpart of the served-HTML gate; the
 * gallery's render floors are the counterpart of looking at the page.
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
 * The gallery is graded too, and not as an afterthought: it is the one place
 * every family is instantiated with real required arguments and real Persian
 * copy, so `test/render_floors_test.dart` can sweep all 105 demos for the two
 * defect classes only a rendered frame shows — a stage that stopped centring,
 * and a string that stopped inheriting the app's font. Both shipped undetected
 * on 17 Aug 2026 (decision §33).
 */
const GALLERY = join(ROOT, "apps", "mobile-gallery");
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

const runGallery = flutterRunner(sdk, GALLERY);
if (runGallery(["pub", "get"]) !== 0) process.exit(1);
if (runGallery(["analyze", "--no-pub"]) !== 0) { console.error("  flutter: gallery analyze failed"); process.exit(1); }
if (runGallery(["test", "--no-pub", "--reporter", "compact"]) !== 0) { console.error("  flutter: gallery tests failed (render floors, demo contract)"); process.exit(1); }
console.log("  flutter: apps/mobile-gallery analysed and tested (render floors, semantics rules, and the composition/stress sweep over every demo)");
