#!/usr/bin/env node
/**
 * gate:flutter — `flutter analyze` + `flutter test` for flutter/lumo_ui_mobile,
 * Lumo UI Mobile (decision §30). The semantics-tree tests there are the mobile
 * counterpart of the served-HTML gate.
 *
 * Flutter is found on PATH or at Homebrew's cask location. A machine without
 * Flutter FAILS this gate unless LUMO_SKIP_FLUTTER=1 is set explicitly — a
 * skipped gate must be a visible decision, never a silent default.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const PKG = join(ROOT, "flutter", "lumo_ui_mobile");
const candidates = ["flutter", "/opt/homebrew/share/flutter/bin/flutter", "/usr/local/share/flutter/bin/flutter"];
const flutter = candidates.find((c) => c === "flutter" ? spawnSync("sh", ["-c", "command -v flutter"], { stdio: "ignore" }).status === 0 : existsSync(c));
if (!flutter) {
  if (process.env.LUMO_SKIP_FLUTTER === "1") { console.log("  flutter: SKIPPED (LUMO_SKIP_FLUTTER=1) — flutter/lumo_ui_mobile was NOT analysed or tested on this machine"); process.exit(0); }
  console.error("  flutter: no Flutter SDK found (PATH, /opt/homebrew/share/flutter). Install it, or set LUMO_SKIP_FLUTTER=1 and say so in the PR.");
  process.exit(1);
}
const run = (args) => spawnSync(flutter, args, { cwd: PKG, stdio: "inherit", env: { ...process.env, PATH: `${process.env.PATH ?? ""}:/opt/homebrew/share/flutter/bin` } }).status ?? 1;
if (run(["pub", "get"]) !== 0) process.exit(1);
if (run(["analyze", "--no-pub"]) !== 0) { console.error("  flutter: analyze failed"); process.exit(1); }
if (run(["test", "--no-pub", "--reporter", "compact"]) !== 0) { console.error("  flutter: tests failed"); process.exit(1); }
console.log("  flutter: flutter/lumo_ui_mobile analysed and tested");
