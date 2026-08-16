---
name: lumo-ui
description: Find, add, customise and upgrade Lumo UI components (Persian-first, RTL-honest React 19 on Base UI) in a consuming project. Trigger on any request to add UI, forms, tables, dialogs, dates or navigation in a Telarsa React app, or when the user mentions Lumo.
---

# Lumo UI — consumer skill

Read `docs/agent-consumer.md` in the Lumo checkout once per session; then:

1. **Find** — `lumo search <words>` → `lumo info <name>` (read "Do not use when" — it names the right alternative). Prefer a block (`lumo list --tier block`) when the request is a whole screen.
2. **Get** — `lumo add <name> --dir src/components` (project root = cwd or `--to`); run the exact `pnpm add name@version` line it prints; contract packages come from the git dependency pinned to the same tag. Then read the wiring checklist in `docs/agent-consumer.md` §0.1 (tsconfig, CSS import order, `script.css` only for a greenfield app, fonts, dark mode, `LumoHtml`/`LumoProvider` placement) — and §0.2 when embedding Lumo in an existing non-Tailwind site.
3. **Use** — every announced string is a REQUIRED prop: write it in the page's language, never English by default. No `dir` prop; `<LumoProvider locale>` at the root; `formatNumber` for numbers; `data-lumo-latn` for genuinely Latin runs.
4. **Customise** — variants file / `className` / theme tokens first; fork the copy only when a variant cannot express it.
5. **Prove** — `lumo gate <static-export> [floors]` on the served HTML; the first byte is the oracle (`renderToStaticMarkup` under fa-IR in tests).
6. **Upgrade** — `lumo doctor` → `lumo diff` → `lumo upgrade` (3-way merge keeps your edits; resolve `<<<<<<<` markers) → bump the git tag → gate again.

Never: add an English default, pass `dir`, print a raw number in Persian text, wrap Persian prose in `data-lumo-latn`, or "fix" a Lumo defect silently in the copy — report it with the served markup.
