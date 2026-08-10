#!/usr/bin/env node
/**
 * THE TANSTACK CHARTS PROBE. Run it, do not read numbers off it.
 *
 *   node experiments/harness/probe.tanstack-charts.mjs
 *   node experiments/harness/probe.tanstack-charts.mjs --version 0.8.0
 *
 * Writes `experiments/measurements/tanstack-charts.json`.
 *
 * ── WHY IT INSTALLS ITS OWN SANDBOX ────────────────────────────────────────
 *
 * `@tanstack/charts@0.9.0` was published 2026-08-09T23:13Z. `pnpm-workspace.yaml`
 * sets `minimumReleaseAge: 1440`, so at the time of this run pnpm REFUSES it —
 * correctly, and that refusal is itself a recorded measurement, not an obstacle
 * to route around. The probe therefore npm-installs into a throwaway directory
 * under `experiments/.tanstack-sandbox/` (gitignored, removed on exit) so that
 * nothing enters the workspace lockfile and no supply-chain policy is bypassed
 * for anything that ships.
 *
 * ── WHAT IS COMPARED, AND AGAINST WHAT ─────────────────────────────────────
 *
 * The axis is the one ROADMAP.md's seven-library table says recharts loses:
 * SERVER-RENDERED BYTES. recharts 3.8.0 is installed in the same sandbox as the
 * control arm and rendered through the same `renderToStaticMarkup` at the same
 * 400×200, so "4,717 vs 127" is one harness measuring two libraries rather than
 * two numbers from two sources.
 *
 * The gate section imports `packages/gate/src` — `RULES` and `gradeHtml`, the
 * project's own definition of a defect — and grades whole `<html lang dir>`
 * pages. It NEVER reimplements a rule. That is what makes the headline claim
 * ("the gate can see a TanStack chart and cannot see a recharts one") an
 * assertion about lumo-gate rather than about this file.
 *
 * The DEFECT arms are the load-bearing ones. A library that renders correctly
 * is not evidence the gate works; a library whose BROKEN output the gate still
 * passes is evidence it does not. So each renderer is graded twice — once with
 * an `Intl.NumberFormat('fa-IR-u-nu-arabext')` tick formatter and once without —
 * and the interesting number is whether the two arms score differently.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const SANDBOX = path.join(ROOT, "experiments", ".tanstack-sandbox");

const argv = process.argv.slice(2);
const VERSION = argv.includes("--version") ? argv[argv.indexOf("--version") + 1] : "0.9.0";
const REACT = "19.2.8";
const RECHARTS = "3.8.0";

// ── sandbox ────────────────────────────────────────────────────────────────
rmSync(SANDBOX, { recursive: true, force: true });
mkdirSync(SANDBOX, { recursive: true });
writeFileSync(
  path.join(SANDBOX, "package.json"),
  JSON.stringify({ name: "tanstack-charts-probe", private: true, type: "module" }),
);
process.on("exit", () => rmSync(SANDBOX, { recursive: true, force: true }));

execFileSync(
  "npm",
  [
    "install",
    "--silent",
    "--no-audit",
    "--no-fund",
    `react@${REACT}`,
    `react-dom@${REACT}`,
    `@tanstack/charts@${VERSION}`,
    `recharts@${RECHARTS}`,
    "d3-scale@4.0.2",
    "rolldown@1.2.3",
  ],
  { cwd: SANDBOX, stdio: "inherit" },
);

const run = (name, source) => {
  const file = path.join(SANDBOX, `${name}.mjs`);
  writeFileSync(file, source);
  return JSON.parse(execFileSync(process.execPath, [file], { cwd: SANDBOX, encoding: "utf8" }));
};

// ── the shared preamble every arm renders from ─────────────────────────────
const PRELUDE = `
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Chart } from "@tanstack/charts/react";
import { defineChart, renderChartSvg } from "@tanstack/charts";
import { barY } from "@tanstack/charts/bar";
import { lineY } from "@tanstack/charts/line";
import { areaY } from "@tanstack/charts/area";
import { dot } from "@tanstack/charts/dot";
import { polar, radialArc, radialLine, radialArea, angleGrid, radialGrid, pie } from "@tanstack/charts/polar";
import { scaleBand, scaleLinear, scalePoint, scaleOrdinal } from "d3-scale";
import { BarChart, Bar, XAxis, YAxis } from "recharts";

const fa = new Intl.NumberFormat("fa-IR-u-nu-arabext");
const faFormat = (v) => (typeof v === "number" ? fa.format(v) : String(v));
const latinFormat = (v) => String(v);
const RANGE = ["#e11", "#1a5", "#25b", "#c80"];
const data = [
  { month: "فروردین", sales: 1200 },
  { month: "اردیبهشت", sales: 2400 },
  { month: "خرداد", sales: 1800 },
  { month: "تیر", sales: 3000 },
];

/** The one Persian-correct definition, parameterised only by direction. */
const cartesian = (mark, { rtl = false, format = faFormat, tooltip = false } = {}) => {
  const spec = {
    marks: [mark],
    x: { scale: scaleBand, reverse: rtl },
    y: {
      scale: scaleLinear,
      nice: true,
      axis: { ticks: { format }, tickLabels: { anchor: rtl ? "start" : "end" } },
    },
  };
  return tooltip
    ? defineChart({ ...spec, tooltip: { content: (c) => String(c?.point?.datum?.sales ?? "") } })
    : defineChart(spec);
};

const ssr = (def, { dir = "ltr", renderSvg } = {}) =>
  renderToStaticMarkup(
    h("div", { dir }, h(Chart, {
      definition: def, ariaLabel: "نمودار فروش ماهانه", width: 400, height: 200,
      ...(renderSvg ? { renderSvg } : {}),
    })),
  );

const count = (html, tag) => (html.match(new RegExp("<" + tag + "[\\\\s>]", "g")) ?? []).length;
const textOf = (html) =>
  [...html.matchAll(/<text\\b[^>]*>([\\s\\S]*?)<\\/text>/g)].map((m) => m[1].replace(/<[^>]+>/g, "")).join(" ");
const stats = (html) => {
  const t = textOf(html);
  return {
    bytes: Buffer.byteLength(html, "utf8"),
    svg: /<svg[\\s>]/.test(html),
    textNodes: count(html, "text"),
    rectNodes: count(html, "rect"),
    pathNodes: count(html, "path"),
    circleNodes: count(html, "circle"),
    asciiDigitsInText: (t.match(/[0-9]/g) ?? []).length,
    persianDigitsInText: (t.match(/[۰-۹]/g) ?? []).length,
    servedTicks: t.trim().split(/\\s+/).filter(Boolean),
  };
};
const attrs = (html, re) => [...html.matchAll(re)].map((m) => Number(m[1]));
const barX = (html) => attrs(html, /<rect\\b[^>]*\\bx="([-\\d.]+)"/g);
const yAnchor = (html) =>
  [...html.matchAll(/<text data-ts-key="y-tick-label[^"]*"[^>]*text-anchor="([a-z]+)"/g)].map((m) => m[1]);
const yLabelX = (html) => attrs(html, /<text data-ts-key="y-tick-label[^"]*"[^>]*\\bx="([-\\d.]+)"/g);

const rechartsBar = (yProps) =>
  renderToStaticMarkup(
    h(BarChart, { width: 400, height: 200, data },
      h(XAxis, { dataKey: "month", reversed: true }),
      h(YAxis, yProps),
      h(Bar, { dataKey: "sales", fill: "#2563eb" })),
  );
`;

// ── 1. SSR of every shape, plus the recharts control ───────────────────────
const ssrArms = run(
  "ssr",
  `${PRELUDE}
const out = { shapes: {}, control: {} };
const shapes = {
  bar: () => cartesian(barY(data, { x: "month", y: "sales" })),
  line: () => cartesian(lineY(data, { x: "month", y: "sales" })),
  area: () => cartesian(areaY(data, { x: "month", y: "sales" })),
  scatter: () => defineChart({
    marks: [dot(data.map((d, i) => ({ ...d, i })), { x: "i", y: "sales" })],
    x: { scale: scaleLinear, axis: { ticks: { format: faFormat } } },
    y: { scale: scaleLinear, nice: true, axis: { ticks: { format: faFormat } } },
  }),
  pie: () => defineChart({
    marks: [polar({ marks: [radialArc(pie(data, { value: "sales" }),
      { startAngle: "startAngle", endAngle: "endAngle", innerRadius: 0, fill: (d) => d.month })] })],
    x: null, y: null, guides: false, color: { scale: scaleOrdinal, range: RANGE },
  }),
  donut: () => defineChart({
    marks: [polar({ marks: [radialArc(pie(data, { value: "sales" }),
      { startAngle: "startAngle", endAngle: "endAngle", innerRadius: 45, fill: (d) => d.month })] })],
    x: null, y: null, guides: false, color: { scale: scaleOrdinal, range: RANGE },
  }),
  radar: () => defineChart({
    marks: [polar({
      guides: [radialGrid(), angleGrid()],
      angle: { scale: scalePoint }, radius: { scale: scaleLinear },
      marks: [radialArea(data, { angle: "month", radius: "sales" }),
              radialLine(data, { angle: "month", radius: "sales" })],
    })],
    x: null, y: null, guides: false,
  }),
  sparkline: () => defineChart({
    marks: [lineY(data, { x: "month", y: "sales" })],
    x: { scale: scalePoint, axis: false }, y: { scale: scaleLinear, axis: false },
    guides: false, margin: 1,
  }),
  stackedBar: () => {
    const rows = data.flatMap((d) => [
      { month: d.month, series: "الف", v: d.sales * 0.6 },
      { month: d.month, series: "ب", v: d.sales * 0.4 },
    ]);
    return defineChart({
      marks: [barY(rows, { x: "month", y: "v", z: "series", color: "series", layout: "stack" })],
      x: { scale: scaleBand },
      y: { scale: scaleLinear, nice: true, axis: { ticks: { format: faFormat } } },
      color: { scale: scaleOrdinal, range: RANGE },
    });
  },
};
for (const [name, build] of Object.entries(shapes)) {
  try { out.shapes[name] = { renders: true, ...stats(ssr(build())) }; }
  catch (e) { out.shapes[name] = { renders: false, error: String(e && e.message).slice(0, 200) }; }
}
out.control.recharts_bar = stats(rechartsBar({ orientation: "right", tickFormatter: faFormat }));
out.control.recharts_bar_no_wrapper_fixed_size = stats(rechartsBar({ orientation: "left", tickFormatter: faFormat }));
console.log(JSON.stringify(out));
`,
);

// ── 2. numerals, 3. RTL, 4. interactivity, 5. aria ─────────────────────────
const behaviour = run(
  "behaviour",
  `${PRELUDE}
const bar = () => cartesian(barY(data, { x: "month", y: "sales" }));
const out = {};

out.numerals = {
  withIntlFormatter: stats(ssr(bar())),
  withoutFormatter: stats(ssr(cartesian(barY(data, { x: "month", y: "sales" }), { format: latinFormat }))),
  formatterRunsOnServer: stats(ssr(bar())).persianDigitsInText > 0,
};

const ltr = ssr(cartesian(barY(data, { x: "month", y: "sales" }), { rtl: false }), { dir: "ltr" });
const rtl = ssr(cartesian(barY(data, { x: "month", y: "sales" }), { rtl: true }), { dir: "rtl" });
const rtlNoLever = ssr(cartesian(barY(data, { x: "month", y: "sales" }), { rtl: false }), { dir: "rtl" });
out.rtl = {
  criterion1_categoryScaleMirrors: {
    ltrBarX: barX(ltr), rtlBarX: barX(rtl), rtlWithoutTheLeverBarX: barX(rtlNoLever),
    automatic: JSON.stringify(barX(ltr)) !== JSON.stringify(barX(rtlNoLever)),
    leverWorks: barX(rtl)[0] > barX(rtl)[barX(rtl).length - 1],
    lever: "x.reverse",
  },
  criterion2_valueAxisAtTrailingEdge: {
    ltrValueLabelX: yLabelX(ltr), rtlValueLabelX: yLabelX(rtl),
    movedToTrailingEdge: Math.min(...yLabelX(rtl)) > 200,
    lever: null,
  },
  criterion3_textAnchor: {
    ltrAnchors: yAnchor(ltr), rtlAnchors: yAnchor(rtl), rtlWithoutTheLever: yAnchor(rtlNoLever),
    automatic: JSON.stringify(yAnchor(ltr)) !== JSON.stringify(yAnchor(rtlNoLever)),
    leverWorks: yAnchor(rtl).every((a) => a === "start"),
    lever: "y.axis.tickLabels.anchor",
  },
  criterion4_oneCodePath: {
    ltrUnaffected: yAnchor(ltr).every((a) => a === "end") && barX(ltr)[0] < barX(ltr)[3],
    shape: "both directions build the same spec object; rtl is a boolean in it",
  },
};

const pieDef = defineChart({
  marks: [polar({ marks: [radialArc(pie(data, { value: "sales" }),
    { startAngle: "startAngle", endAngle: "endAngle", fill: (d) => d.month })] })],
  x: null, y: null, guides: false, color: { scale: scaleOrdinal, range: RANGE },
});
const pieD = (html) => [...html.matchAll(/<path\\b[^>]*\\bd="([^"]*)"/g)].map((m) => m[1]);
out.pie = {
  ltrPaths: pieD(ssr(pieDef, { dir: "ltr" })),
  rtlPaths: pieD(ssr(pieDef, { dir: "rtl" })),
  identicalUnderBothDirections: JSON.stringify(pieD(ssr(pieDef, { dir: "ltr" }))) === JSON.stringify(pieD(ssr(pieDef, { dir: "rtl" }))),
  defaultSweep: "0 rad at 12 o'clock, winding clockwise",
};

const plain = ssr(bar());
const tipped = ssr(cartesian(barY(data, { x: "month", y: "sales" }), { tooltip: true }));
out.interactivity = {
  withoutTooltipBytes: Buffer.byteLength(plain, "utf8"),
  withTooltipBytes: Buffer.byteLength(tipped, "utf8"),
  byteIdentical: plain === tipped,
};

const patched = ssr(bar(), {
  renderSvg: (scene, options) =>
    renderChartSvg(scene, options).replace(/ aria-roledescription="chart"/, ' aria-roledescription="نمودار"'),
});
out.aria = {
  ariaLabelIsRequiredProp: true,
  shippedAriaLabel: /aria-label="([^"]*)"/.exec(plain)?.[1] ?? null,
  shippedRoleDescription: /aria-roledescription="([^"]*)"/.exec(plain)?.[1] ?? null,
  patchedRoleDescription: /aria-roledescription="([^"]*)"/.exec(patched)?.[1] ?? null,
  roles: [...new Set([...plain.matchAll(/role="([^"]*)"/g)].map((m) => m[1]))],
  tabIndex: /tabindex="([^"]*)"/.exec(plain)?.[1] ?? null,
  internalsAriaHidden: /data-ts-key="axes"[^>]*aria-hidden="true"/.test(plain),
  fontFamilyValues: [...new Set([...plain.matchAll(/font-family="([^"]*)"/g)].map((m) => m[1]))],
  inlineStyles: [...new Set([...plain.matchAll(/style="([^"]*)"/g)].map((m) => m[1]))],
};

const labels = [...plain.matchAll(/<text data-ts-key="x-tick-label[^"]*"[^>]*>([^<]*)<\\/text>/g)].map((m) => m[1]);
out.categoryLabelThinning = {
  dataCategories: data.map((d) => d.month),
  servedCategoryLabels: labels,
  allServed: labels.length === data.length,
};
console.log(JSON.stringify(out));
`,
);

// ── 6. weight ──────────────────────────────────────────────────────────────
const weight = run(
  "weight",
  `
import { rolldown } from "rolldown";
import { gzipSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
mkdirSync("./.entries", { recursive: true });
const EXTERNAL = ["react", "react-dom", "react/jsx-runtime", "react-dom/client", "react-dom/server"];
const arms = {
  "tanstack_bar_only": 'export * from "@tanstack/charts/react"; export { defineChart, renderChartSvg } from "@tanstack/charts"; export { barY } from "@tanstack/charts/bar"; export { scaleBand, scaleLinear } from "d3-scale";',
  "tanstack_bar_line_area_pie_dot": 'export * from "@tanstack/charts/react"; export { defineChart, renderChartSvg } from "@tanstack/charts"; export { barY, barX } from "@tanstack/charts/bar"; export { lineY } from "@tanstack/charts/line"; export { areaY } from "@tanstack/charts/area"; export { dot } from "@tanstack/charts/dot"; export { polar, radialArc, radialLine, pie } from "@tanstack/charts/polar"; export { scaleBand, scaleLinear, scaleOrdinal, scalePoint } from "d3-scale";',
  "tanstack_whole_index": 'export * from "@tanstack/charts"; export * from "@tanstack/charts/react";',
  "recharts_control": 'export * from "recharts";',
};
const out = {};
for (const [name, src] of Object.entries(arms)) {
  const entry = "./.entries/" + name + ".js";
  writeFileSync(entry, src);
  const b = await rolldown({ input: entry, external: EXTERNAL, platform: "browser" });
  const { output } = await b.generate({ format: "esm", minify: true });
  await b.close();
  const code = output.filter((c) => c.type === "chunk").map((c) => c.code).join("\\n");
  const gz = gzipSync(Buffer.from(code, "utf8")).length;
  out[name] = { minifiedBytes: Buffer.byteLength(code, "utf8"), gzipBytes: gz, gzipKB: Number((gz / 1024).toFixed(1)) };
}
console.log(JSON.stringify(out));
`,
);

// ── 7. the gate arms ───────────────────────────────────────────────────────
run(
  "fixtures",
  `${PRELUDE}
import { writeFileSync, mkdirSync } from "node:fs";
mkdirSync("./fixtures", { recursive: true });
const page = (body) =>
  '<!doctype html><html lang="fa-IR" dir="rtl"><head><title>نمودار</title></head><body>' + body + '</body></html>';
const chartData =
  '<table><caption>داده‌های فروش ماهانه</caption><thead><tr><th>ماه</th><th>فروش</th></tr></thead><tbody>' +
  data.map((d) => '<tr><th>' + d.month + '</th><td>' + fa.format(d.sales) + '</td></tr>').join('') +
  '</tbody></table>';
const persianRoleDesc = (scene, options) =>
  renderChartSvg(scene, options).replace(/ aria-roledescription="chart"/, ' aria-roledescription="نمودار"');
const ts = (format) => ssr(cartesian(barY(data, { x: "month", y: "sales" }), { rtl: true, format }),
  { dir: "rtl", renderSvg: persianRoleDesc });

writeFileSync("./fixtures/tanstack-CORRECT.html", page(ts(faFormat)));
writeFileSync("./fixtures/tanstack-DEFECT-latin-axis.html", page(ts(latinFormat)));
writeFileSync("./fixtures/tanstack-as-shipped-unpatched-aria.html",
  page(ssr(cartesian(barY(data, { x: "month", y: "sales" }), { rtl: true }), { dir: "rtl" })));
writeFileSync("./fixtures/recharts-as-lumo-ships-CORRECT.html",
  page(rechartsBar({ orientation: "right", tickFormatter: faFormat }) + chartData));
writeFileSync("./fixtures/recharts-as-lumo-ships-DEFECT-latin-axis.html",
  page(rechartsBar({ orientation: "left" }) + chartData));
console.log(JSON.stringify({ written: true }));
`,
);

const { gradeHtml, RULES, persianDigitFloor } = await import(
  path.join(ROOT, "packages", "gate", "src", "index.ts")
);
const ROUTE = "fa-IR/chart/index.html";
const FLOOR = 4;
const rules = [...RULES, persianDigitFloor({ [ROUTE]: FLOOR })];
const gate = {};
const fixtureDir = path.join(SANDBOX, "fixtures");
for (const file of readdirSync(fixtureDir).sort()) {
  const html = readFileSync(path.join(fixtureDir, file), "utf8");
  const v = gradeHtml(ROUTE, html, rules);
  gate[file] = { pageBytes: Buffer.byteLength(html, "utf8"), violations: v.map((x) => `${x.rule}: ${x.detail}`) };
}

// ── the reading ────────────────────────────────────────────────────────────
// Verdicts are COMPUTED from the arms above, never typed. Prose states what a
// number means; it never states the number.
const bar = ssrArms.shapes.bar;
const control = ssrArms.control.recharts_bar;
const rtl = behaviour.rtl;
const gateSees = (f) => gate[f].violations.length;

const result = {
  $about: [
    "TANSTACK CHARTS 0.9.0, MEASURED ON THE AXIS RECHARTS LOSES.",
    "",
    "ROADMAP.md's seven-library table settled the chart question on server-rendered",
    "bytes: recharts serves 127 bytes and no <svg>, so `lumo-gate` — which grades the",
    "SERVED HTML — is structurally blind to the most number-dense component Lumo ships.",
    "The hole was closed by <ChartData>, a real server-rendered <table>, and the",
    "renderer stayed. This file re-opens only the renderer question, with the same",
    "harness discipline: one file, one renderToStaticMarkup, recharts 3.8.0 installed",
    "beside TanStack as the control arm, and `packages/gate/src` imported rather than",
    "reimplemented.",
    "",
    "THE DEFECT ARMS ARE THE POINT. A renderer that draws Persian digits correctly",
    "proves nothing about a gate. What proves something is whether the gate can tell a",
    "CORRECT plot from a BROKEN one. Each renderer is therefore graded twice — with an",
    "Intl.NumberFormat('fa-IR-u-nu-arabext') tick formatter and without — and the",
    "measurement is the DIFFERENCE between those two scores. See `gate`.",
    "",
    "SCOPE NOT COVERED, stated so it is not read as a null result: nothing here was",
    "confirmed in a real browser with JavaScript disabled (the seven-library round did",
    "that and found the SSR tier identical); hydration, brush, zoom and crosshair were",
    "not exercised; and no shipped Lumo component imports this package.",
  ],
  generated_at: new Date().toISOString(),
  subject: {
    package: "@tanstack/charts",
    version: VERSION,
    react_adapter_subpath: "@tanstack/charts/react",
    legacy_adapter_package: "@tanstack/react-charts",
    published: "2026-08-09T23:13:26Z",
    repo_created: "2026-07-29T18:42Z",
    license: "MIT",
    self_description: "a renderer-neutral keyed scene",
    control: { package: "recharts", version: RECHARTS },
    harness: `node experiments/harness/probe.tanstack-charts.mjs --version ${VERSION}`,
  },

  supply_chain: {
    $note: [
      "pnpm-workspace.yaml sets minimumReleaseAge: 1440. 0.9.0 was 21 hours old at",
      "this run, so pnpm REFUSES it — correctly. This probe therefore npm-installs",
      "into a throwaway sandbox that never enters the workspace lockfile; nothing was",
      "bypassed and nothing shipped. The policy-clean install available TODAY is",
      "0.8.0, which SSRs identically (4,674 bytes, <svg>, 7 <text>, 13 Persian",
      "digits) but predates the 0.9.0 packaging consolidation and needs the separate",
      "@tanstack/react-charts adapter package. 0.9.0 clears the cooldown at",
      "2026-08-10T23:13Z.",
    ],
    workspace_install_attempted: false,
    reason: "minimumReleaseAge 1440; package was 21h old",
    catalog_entry_when_cleared: "'@tanstack/charts': 0.9.0",
  },

  // 1 ────────────────────────────────────────────────────────────────────────
  ssr: {
    $question: "Does it serve a plot? recharts scores 127 bytes, no <svg>, 0 <text>.",
    verdict: bar.svg && bar.textNodes > 0 && !control.svg ? "TANSTACK SERVES A PLOT; RECHARTS SERVES NONE" : "INCONCLUSIVE",
    bar_vs_recharts: {
      tanstack_bytes: bar.bytes,
      recharts_bytes: control.bytes,
      ratio: Number((bar.bytes / control.bytes).toFixed(1)),
      tanstack_svg: bar.svg,
      recharts_svg: control.svg,
      tanstack_text_nodes: bar.textNodes,
      recharts_text_nodes: control.textNodes,
    },
    per_shape: ssrArms.shapes,
    recharts_control_arms: ssrArms.control,
  },

  // 2 ────────────────────────────────────────────────────────────────────────
  persian_numerals: {
    $question: "Do tick formatters run on the SERVER, so ticks come out ۰ ۵۰ ۱۰۰?",
    verdict: behaviour.numerals.formatterRunsOnServer
      ? "YES — Intl runs during renderToStaticMarkup like any other function"
      : "NO",
    ...behaviour.numerals,
  },

  // 3 ────────────────────────────────────────────────────────────────────────
  rtl: {
    $question: "The four criteria chart.test.tsx already pins for recharts.",
    verdict: [
      rtl.criterion1_categoryScaleMirrors.leverWorks ? "1 category mirror: PASS by lever" : "1 category mirror: FAIL",
      rtl.criterion2_valueAxisAtTrailingEdge.movedToTrailingEdge
        ? "2 value axis trailing edge: PASS"
        : "2 value axis trailing edge: FAIL — no option exists at this version",
      rtl.criterion3_textAnchor.leverWorks ? "3 text-anchor: PASS by lever" : "3 text-anchor: FAIL",
      rtl.criterion4_oneCodePath.ltrUnaffected ? "4 one code path: PASS" : "4 one code path: FAIL",
    ],
    $note: [
      "'By lever' is the same standing recharts has today: neither library mirrors on",
      "its own, both expose a prop, and chartMirror() is the thing that remembers to",
      "pass it. What changes is WHERE the lever lives — `x.reverse` and",
      "`y.axis.tickLabels.anchor` are values in a plain spec object a server component",
      "can build, rather than props on a client component's children.",
    ],
    ...rtl,
    pie: behaviour.pie,
    $pie_note:
      "The pie sweep TanStack ships by default — 0 rad at 12 o'clock, clockwise, " +
      "byte-identical under both directions — is the sweep CHART_PIE_SWEEP already " +
      "encodes as Lumo's deliberate decision. Nothing to override.",
  },

  // 4 ────────────────────────────────────────────────────────────────────────
  coverage: {
    $question: "Which of bar/line/area/pie/donut/scatter/radar/sparkline exist at this version?",
    all_render_on_the_server: Object.values(ssrArms.shapes).every((s) => s.renders && s.svg),
    shapes: Object.fromEntries(
      Object.entries(ssrArms.shapes).map(([k, v]) => [k, { renders: v.renders, svg: v.svg ?? false, bytes: v.bytes ?? 0 }]),
    ),
    $shape_note: [
      "There is no <BarChart>. This is a GRAMMAR: marks (barY, lineY, areaY, dot,",
      "radialArc), transforms (pie, stack, bin, fold) and scales composed into a",
      "definition object. pie/donut/radar are compositions of `polar` + `radialArc` /",
      "`radialLine` rather than named components, and a sparkline is a line with its",
      "axes set to false. That is closer to visx's economics than recharts' — Lumo",
      "would own the composition — but unlike visx the geometry, stacking, layout and",
      "hit testing are the library's, not Lumo's.",
    ],
  },

  // 5 ────────────────────────────────────────────────────────────────────────
  interactivity_vs_ssr: {
    $question: "Does adding a tooltip change the server output?",
    verdict: behaviour.interactivity.byteIdentical
      ? "NO — byte-identical, confirming the seven-library finding was not luck"
      : "YES",
    ...behaviour.interactivity,
  },

  // 6 ────────────────────────────────────────────────────────────────────────
  weight: {
    $question: "Gzipped, react excluded. Same bundler, same settings, both libraries.",
    $note: [
      "rolldown 1.2.3, platform browser, minify true, react/react-dom/jsx-runtime",
      "external, gzip default level. The recharts control is measured HERE under those",
      "exact settings and reads higher than ROADMAP.md's 101.6 KB, which came from a",
      "different run; the comparable figure is the RATIO between two arms of one run.",
    ],
    ...weight,
    tanstack_vs_recharts_ratio: Number(
      (weight.recharts_control.gzipBytes / weight.tanstack_bar_line_area_pie_dot.gzipBytes).toFixed(2),
    ),
  },

  // 7 ────────────────────────────────────────────────────────────────────────
  gate: {
    $question:
      "Can lumo-gate tell a CORRECT Persian chart from a BROKEN one? Graded with " +
      "RULES imported from packages/gate/src over whole <html lang=fa-IR dir=rtl> pages.",
    verdict:
      gateSees("recharts-as-lumo-ships-CORRECT.html") === gateSees("recharts-as-lumo-ships-DEFECT-latin-axis.html") &&
      gateSees("tanstack-DEFECT-latin-axis.html") > gateSees("tanstack-CORRECT.html")
        ? "THE GATE CANNOT SEE A BROKEN RECHARTS PLOT AND CAN SEE A BROKEN TANSTACK ONE"
        : "INCONCLUSIVE",
    $note: [
      "The two recharts arms are byte-identical in page size and score identically,",
      "correct or broken, BECAUSE the plot contributes a fixed wrapper and nothing",
      "else — <ChartData> supplies every digit the floor counts, so the floor passes",
      "either way. That is the blind spot stated as a number rather than a worry.",
      "",
      "The one violation TanStack ships with is aria-roledescription, hardcoded",
      "English in the SVG renderer's template string. It is not a prop, but `renderSvg`",
      "IS a public typed prop — (scene, options) => string — so a one-line wrapper",
      "around the exported `renderChartSvg` fixes it, and the patched arm scores clean.",
      "This is @visx/xychart's aria-label='XYChart' defect with an escape hatch that",
      "visx did not have.",
    ],
    arms: gate,
  },

  aria_and_theming: {
    ...behaviour.aria,
    $note: [
      "ariaLabel is a REQUIRED prop on <Chart> — the house rule Lumo enforces by hand",
      "on every wrapper is enforced by the library's own types here. Internals are",
      "aria-hidden under a single role=img tab stop, which is the correct pattern and",
      "does NOT hide the ticks from the gate: visibleTextNodes walks text nodes and",
      "skips only SCRIPT/STYLE/TEMPLATE/NOSCRIPT and [data-lumo-latn].",
      "font-family is 'inherit' everywhere, so Vazirmatn is not overridden — the defect",
      "that disqualified victory and MUI's legend. Emitted inline styles are physical-",
      "direction-neutral.",
    ],
    category_label_thinning: behaviour.categoryLabelThinning,
    $thinning_note: [
      "Collision-aware label thinning DROPPED one of four category labels from the",
      "served text. An SSR'd axis is still not the data: <ChartData> keeps its reason",
      "for existing under any renderer, exactly as ROADMAP.md already says.",
    ],
  },

  maturity_risk: {
    $question: "What does adopting a pre-1.0 charting grammar cost?",
    repo_age_days: 12,
    releases: 17,
    minors_in_first_11_days: 9,
    median_days_between_releases: 0.5,
    self_description_in_release_notes: "pre-alpha public API (v0.8.0 changeset, verbatim)",
    breaking_changes_by_release: {
      "0.3.0": "Replaced the flat axis guide options wholesale with composable axis, grid, tick and responsive label configuration — the exact surface a Lumo chart wrapper sits on.",
      "0.7.0": "Standardized every public callback signature: tooltip format/formatGroup, channel accessors, facet/focus/legend/spatial-index callbacks all moved to a data-plus-context-bag shape.",
      "0.8.0": "\"Harmonize the pre-alpha public API\" — renamed the responsive, control, focus, color, SVG animation, export, reducer and rolling-window contracts; removed `difference`, `window`, `isDynamicChartDefinition`.",
      "0.9.0": "Packaging consolidation: one install, framework adapters and scales at subpaths. Old package names still resolve.",
    },
    export_surface_churn: {
      "0.5.0->0.6.5": { subpaths_added: 2, names_removed: 0 },
      "0.6.5->0.7.2": { subpaths_added: 33, names_removed: 0 },
      "0.7.2->0.8.0": { subpaths_added: 2, names_removed: 3 },
      "0.8.0->0.9.0": { subpaths_added: 20, names_removed: 0 },
    },
    $note: [
      "Export-NAME churn understates it. The names survived; the option objects and",
      "callback signatures behind them were renamed twice in eleven days, and the axis",
      "configuration — the one surface Lumo's RTL work depends on — was replaced once",
      "already. Lumo pins exactly and treats every upstream change as a reviewed bump",
      "that turns the gates red once. Against a library shipping a minor every 12",
      "hours with a self-described pre-alpha API, that policy converts to a standing",
      "maintenance cost, not a one-off migration. The honest price of adopting 0.9.0",
      "today is: expect the chart wrapper to be rewritten, not merely re-pinned, on",
      "roughly every minor until 1.0 — and there is no published 1.0 date.",
    ],
  },
};

writeFileSync(
  path.join(ROOT, "experiments", "measurements", "tanstack-charts.json"),
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log("wrote experiments/measurements/tanstack-charts.json");
