#!/usr/bin/env node
/**
 * The APG keyboard matrix behind docs/apg.md: for each family, the keys handled
 * in its own source and the keys any DIRECT test presses. Run from repo root:
 *   node scripts/apg-matrix.mjs > /tmp/m.json && node scripts/apg-doc.mjs /tmp/m.json docs/apg.md
 */
import fs from "node:fs";
process.chdir(new URL("../packages/ui/src/", import.meta.url).pathname);
const files=fs.readdirSync(".");
const tests=files.filter(f=>f.endsWith(".test.tsx"));
const KEYS=["Home","End","PageUp","PageDown","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Escape","Enter","Delete","Backspace","Tab","Space"];
/** @param {string} f */
const importsOf=(f)=>Array.from(fs.readFileSync(f,"utf8").matchAll(/from "\.\/([a-z0-9-]+)\.tsx"/g)).map(m=>m[1]);
/** @param {string} src */
const keysIn=(src)=>{const s=new Set();for(const k of KEYS){const lit=k==="Space"?" ":k;const re=new RegExp(`key:\\s*["']${lit}["']|\\{${k}\\}|press\\(["']${k}["']`);if(re.test(src))s.add(k);}return s;};
const fam=["menu","select","combobox","multi-select","autocomplete","list-box","tabs","tree","tree-select","cascader","table","data-grid","slider","range-slider","dialog","alert-dialog","drawer","popover","tooltip","disclosure","toolbar","toggle-group","radio-group","checkbox","switch","menubar","navigation-menu","context-menu","tag-group","tags-input","carousel","kanban","sortable","resizable","date-input","date-field","date-picker","calendar","range-calendar","event-calendar","gantt","virtual-list","transfer-list","number-field","segmented-control","steps","pagination","breadcrumbs","command","search-field","input-otp","file-upload","rating"];
const rows=[];
for(const f of fam){
  const direct=tests.filter(t=>importsOf(t).includes(f));
  const keys=new Set(); for(const t of direct) for(const k of keysIn(fs.readFileSync(t,"utf8"))) keys.add(k);
  const src=fs.existsSync(f+".tsx")?fs.readFileSync(f+".tsx","utf8"):"";
  const own=new Set(); for(const k of KEYS){ const lit=k==="Space"?" ":k; if(new RegExp(`["']${lit}["']`).test(src)) own.add(k);}
  rows.push({f,own:[...own],tested:[...keys],n:direct.length});
}
console.log(JSON.stringify(rows));
