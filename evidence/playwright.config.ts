import { defineConfig, devices } from "@playwright/test";

/**
 * Real-browser evidence over the built site (`apps/website/out`), served the
 * way a host serves it. What each project proves is written in
 * `docs/evidence/README.md`; nothing here is a screen-reader run.
 *
 *   chromium  — everything: axe over every route, popup ARIA snapshots, RTL layout
 *   webkit    — the @cross subset (popups + RTL layout)
 *   firefox   — the @cross subset
 */
export default defineConfig({
  testDir: "./tests",
  outputDir: "../.evidence/results",
  fullyParallel: false,
  workers: process.env["CI"] ? 2 : 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env["CI"]
    ? [["list"], ["html", { open: "never", outputFolder: "../.evidence/report" }]]
    : [["list"]],
  webServer: {
    command: "node scripts/serve-static.mjs apps/website/out 4173",
    url: "http://127.0.0.1:4173/fa/",
    cwd: "..",
    reuseExistingServer: true,
    timeout: 30_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    locale: "fa-IR",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] }, grep: /@cross/ },
    { name: "firefox", use: { ...devices["Desktop Firefox"] }, grep: /@cross/ },
  ],
});
