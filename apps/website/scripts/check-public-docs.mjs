import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

// Builds validate the self-contained snapshot. They never read the adjacent
// git history or any source beyond this app.
const app = resolve(import.meta.dirname, "..");
const snapshot = JSON.parse(readFileSync(resolve(app, "docs/public-docs-snapshot.json"), "utf8"));
if (snapshot.licence !== "MIT" || snapshot.sourcePackageVersion !== "1.0.0") throw new Error("Unexpected documentation provenance.");
if (snapshot.locales.join(",") !== "en,de,fa" || snapshot.routes.length !== 7 || snapshot.files.length !== 14) throw new Error("Documentation corpus is incomplete.");
for (const file of snapshot.files) {
  const path = resolve(app, file.destination);
  if (!existsSync(path)) throw new Error(`Missing retained source: ${file.destination}`);
  const digest = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (digest !== file.adaptedSha256) throw new Error(`Documentation snapshot changed without recording provenance: ${file.destination}`);
}
console.log(`Licensed public docs snapshot: ${snapshot.routes.length * snapshot.locales.length} localized routes; source ${snapshot.sourceCommit.slice(0, 12)}.`);
