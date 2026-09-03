/**
 * Finding the Flutter SDK, in ONE place.
 *
 * Three scripts need it — `gate:flutter`, the gallery build, and the
 * ensure-wrapper in front of the gallery build — and all three had grown their
 * own copy of the same twelve lines. Copies drift, and these had: each one
 * accepted `/usr/local/share/flutter/bin/flutter` as a candidate, and each one
 * then hard-coded `/opt/homebrew/share/flutter/bin` as the directory to append
 * to the child's PATH. On a machine whose Flutter is NOT the Homebrew cask
 * (an Intel Mac, a manual install, a CI runner that unpacks the SDK elsewhere),
 * the binary was found and invoked with a PATH that did not contain it — so
 * anything the toolchain shells out to by name was resolved against the wrong
 * directory or not at all.
 *
 * Here the PATH entry is DERIVED from where the binary was actually found,
 * which is the only way the two can never disagree again.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Where a Flutter SDK is looked for, in order. `flutter` first: an explicit
 * PATH entry (a `flutter-action` runner, asdf, fvm, a manual export) is always
 * the machine's own answer and outranks a guess.
 * @type {readonly string[]}
 */
const CANDIDATES = ["flutter", "/opt/homebrew/share/flutter/bin/flutter", "/usr/local/share/flutter/bin/flutter"];

/** Human-readable list of the places searched, for the "not found" message. */
export const SEARCHED = "PATH, /opt/homebrew/share/flutter, /usr/local/share/flutter";

/**
 * The Flutter SDK on this machine, or `null`.
 *
 * @returns {{ bin: string; binDir: string | null } | null} `bin` is what to
 *   spawn. `binDir` is the directory to add to a child's PATH, or `null` when
 *   Flutter came from PATH already and there is nothing to add.
 */
export function findFlutter() {
  for (const candidate of CANDIDATES) {
    if (candidate === "flutter") {
      if (spawnSync("sh", ["-c", "command -v flutter"], { stdio: "ignore" }).status === 0) {
        return { bin: "flutter", binDir: null };
      }
      continue;
    }
    if (existsSync(candidate)) return { bin: candidate, binDir: dirname(candidate) };
  }
  return null;
}

/**
 * `process.env` with the SDK's own bin directory on PATH — the toolchain shells
 * out to `dart` by name, so it has to be able to find it.
 *
 * @param {string | null} binDir
 * @returns {NodeJS.ProcessEnv}
 */
export function flutterEnv(binDir) {
  if (binDir === null) return process.env;
  return { ...process.env, PATH: `${process.env.PATH ?? ""}:${binDir}` };
}

/**
 * A `flutter <args>` runner bound to one working directory, inheriting stdio so
 * the toolchain's own progress and errors reach the caller unfiltered.
 *
 * @param {{ bin: string; binDir: string | null }} sdk
 * @param {string} cwd
 * @returns {(args: string[]) => number} the exit status (1 if it did not run)
 */
export function flutterRunner(sdk, cwd) {
  const env = flutterEnv(sdk.binDir);
  return (/** @type {string[]} */ args) => spawnSync(sdk.bin, args, { cwd, stdio: "inherit", env }).status ?? 1;
}
